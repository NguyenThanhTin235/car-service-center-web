# Danh Mục Dịch Vụ AWS & Giải Pháp Tối Ưu Chi Phí (Theo Source Mới Nhất `develop`)

> **Tham chiếu codebase:** Nhánh `develop` (commit `36e6081` — `Merge pull request #31 from NguyenThanhTin235/feat/staff`).  
> **Region mục tiêu:** `ap-southeast-1` (Singapore).

---

## 1. Phân tích yêu cầu hạ tầng từ source `develop`

Qua rà soát `src/backend/package.json`, `src/backend/src/**/*.ts` và `src/frontend/apps/*`:

| Thành phần / Tích hợp trong code | Chi tiết kỹ thuật phát hiện | Yêu cầu hạ tầng AWS phát sinh |
| :--- | :--- | :--- |
| **Backend API (`src/backend`)** | Express 5, TypeScript, Prisma, Port `5000` | Node.js 20 container, health check `/health`, memory ≥ 512 MB |
| **Realtime (`socket.io`)** | Socket.IO v4.8.3 | Load Balancer / Reverse Proxy hỗ trợ WebSocket upgrade (`Upgrade: websocket`) & sticky session nếu > 1 instance |
| **Cron Jobs (`node-cron`)** | `src/backend/src/jobs/` | Cần chạy **1 instance** (hoặc dùng Redis lock nếu scale ≥ 2 tasks) để tránh chạy trùng job |
| **Payment (`sepay-pg-node`)** | `SEPAY_API_KEY`, `SEPAY_MERCHANT_ID`, `SEPAY_SECRET_KEY`, Webhook | **Bắt buộc có HTTPS domain public** để SePay gọi Webhook IPN |
| **Database & Cache** | MySQL (`@prisma/client` 5.22), Redis (`ioredis`, `redis`) | MySQL 8.x + Redis 7.x trong mạng nội bộ bảo mật |
| **Email (`nodemailer`)** | Hỗ trợ `EMAIL_HOST/PORT/USER/PASS` & `GMAIL_USER/APP_PASSWORD` | Dùng Amazon SES SMTP/SDK hoặc giữ Gmail App Password |
| **Media & AI** | `cloudinary` (`CLOUDINARY_*`), `@google/genai` (`GEMINI_API_KEYS`) | Giữ Cloudinary hoặc chuyển sang Amazon S3; lưu ~25 biến env/secret an toàn |
| **Logging (`winston`)** | `src/backend/src/loggers/` | Xuất log ra `stdout` (JSON) để đẩy tập trung về CloudWatch Logs |
| **Frontend (2 apps Next.js 16)** | `customer-web` (`3000`), `internal-web` (`3001`) | Build `output: 'standalone'` trong Docker để image nhẹ & khởi động nhanh |

---

## 2. Danh sách dịch vụ AWS cần dùng & Giải pháp tiết kiệm cho từng dịch vụ

### 2.1. Compute (Chạy 3 containers: `backend`, `customer-web`, `internal-web`)
- **Dịch vụ:** **Amazon ECS (Fargate)** *hoặc* **Amazon EC2**.
- **Giải pháp tối ưu chi phí:**
  - *Nếu chọn ECS Fargate:* Dùng kiến trúc **ARM64 (Graviton2)** trên Fargate (rẻ hơn ~20% so với x86_64). Đặt cấu hình vừa đủ (`backend`: 0.5 vCPU / 1 GB; 2 frontend apps: 0.25 vCPU / 0.5 GB). Với môi trường `staging`, dùng EventBridge Scheduler tự động **scale về 0 ngoài giờ làm việc** (giảm ~50% chi phí Fargate).
  - *Nếu chọn EC2:* Dùng **1 EC2 `t3.small` (~\$15/tháng) hoặc `t3.medium` (~\$30/tháng)** chạy cả 3 container qua Docker Compose + Nginx/Caddy. Tự động tắt instance staging vào ban đêm nếu không test.

### 2.2. Networking, Load Balancing & HTTPS (Bắt buộc cho SePay Webhook & Socket.IO)
- **Dịch vụ:** **Amazon VPC**, **Application Load Balancer (ALB)**, **AWS Certificate Manager (ACM)**.
- **Giải pháp tối ưu chi phí (Tiết kiệm lớn nhất):**
  1. **Không dùng NAT Gateway:** Thay vì đặt ECS tasks trong Private Subnet đi qua NAT Gateway (**~\$32–\$35/tháng**), hãy đặt trong Public Subnet với `assignPublicIp: true` (hoặc trên EC2) và **khóa chặt Security Group** (chỉ mở port `80/443` từ ALB/Cloudflare). Tiết kiệm ngay **~\$35/tháng**.
  2. **Dùng chung 1 ALB duy nhất (Host-based Routing):** Điều hướng `api.<domain>` → backend (`5000`), `app.<domain>` → customer-web (`3000`), `admin.<domain>` → internal-web (`3001`). Không tạo 3 ALB riêng (tiết kiệm **~\$36–\$44/tháng**).
  3. **SSL & DNS miễn phí:** Dùng **ACM** (SSL miễn phí cho ALB) kết hợp **Cloudflare Free DNS** (thay cho Route 53 Hosted Zone \$0.50/domain + query fee). Nếu dùng EC2, dùng **Caddy/Nginx + Let's Encrypt** (miễn phí \$0 hoàn toàn, không cần ALB).

### 2.3. Container Registry (Lưu trữ Docker images & Versioning)
- **Dịch vụ:** **Amazon ECR**.
- **Giải pháp tối ưu chi phí:**
  - Thiết lập **ECR Lifecycle Policy** tự động giữ lại **5–10 image mới nhất** (đủ để rollback) và xóa các image untagged/cũ hơn.
  - Dùng multi-stage Dockerfile (`node:20-alpine` + Next.js `standalone`) để mỗi image chỉ ~150–250 MB → tổng dung lượng luôn dưới mức Free Tier (500 MB) hoặc chỉ tốn **< \$0.50/tháng**.

### 2.4. Cơ sở dữ liệu (MySQL 8.x)
- **Dịch vụ:** **Amazon RDS for MySQL**.
- **Giải pháp tối ưu chi phí:**
  - Chọn **`db.t4g.micro` (ARM/Graviton)** Single-AZ + 20 GB `gp3` (~\$14–\$16/tháng).
  - **Nếu tài khoản AWS còn Free Tier (12 tháng đầu):** RDS `db.t3.micro` / `db.t4g.micro` được miễn phí **750 giờ/tháng + 20 GB storage** (`$0`).
  - **Nếu hết Free Tier & muốn tiết kiệm tối đa:** Chạy MySQL 8 container trên EC2 (kèm EBS volume + cron backup `mysqldump` đẩy lên S3 hàng ngày) → **\$0 phí RDS**.

### 2.5. Cache & Realtime PubSub (Redis)
- **Dịch vụ:** **Amazon ElastiCache (Redis/Valkey)** *hoặc* **Redis Container**.
- **Giải pháp tối ưu chi phí:**
  - ElastiCache `cache.t4g.micro` tốn ~\$12–\$14/tháng (hoặc miễn phí nếu dùng ElastiCache Serverless/Free Tier trong hạn mức).
  - **Khuyên dùng tiết kiệm:** Với quy mô hiện tại, chạy **Redis 7 Alpine container** trực tiếp trên EC2 (hoặc sidecar container trong cùng ECS Task với backend) → **\$0 phí ElastiCache**, độ trễ `localhost` cực thấp.

### 2.6. Lưu trữ File & Hóa đơn PDF (AWS SDK `@aws-sdk/client-s3`)
- **Dịch vụ:** **Amazon S3**.
- **Giải pháp tối ưu chi phí:**
  - Free Tier 5 GB standard storage + 20.000 GET + 2.000 PUT. Với dự án trung tâm bảo dưỡng xe, chi phí thực tế chỉ **~\$0.50 – \$1/tháng**.
  - Có thể giữ **Cloudinary (Free plan)** cho ảnh kiểm tra xe hiện có, và dùng **S3** (`@aws-sdk/client-s3`) để lưu hóa đơn PDF (`pdfkit`), log archive và backup database.

### 2.7. Gửi Email (AWS SDK `@aws-sdk/client-ses`)
- **Dịch vụ:** **Amazon SES**.
- **Giải pháp tối ưu chi phí:**
  - Code hiện tại đã hỗ trợ `EMAIL_HOST` / `EMAIL_PORT` trong Nodemailer → chỉ cần trỏ sang Amazon SES SMTP hoặc gọi `@aws-sdk/client-ses`.
  - Chi phí: **\$0.10 / 1.000 emails** (miễn phí 3.000 emails đầu tiên/tháng khi gửi từ EC2/ECS trong Free Tier mới). Hoặc giữ nguyên cấu hình Gmail App Password hiện tại (**\$0**).

### 2.8. Quản lý Secret (Bắt buộc theo yêu cầu nền tảng)
- **Dịch vụ:** **AWS Systems Manager (SSM) Parameter Store** vs **AWS Secrets Manager**.
- **Giải pháp tối ưu chi phí:**
  - Hệ thống có ~25 biến môi trường nhạy cảm (`DATABASE_URL`, `JWT_SECRET`, `SEPAY_*`, `GEMINI_*`, `CLOUDINARY_*`, `GMAIL_*`).
  - Nếu lưu hết vào Secrets Manager (\$0.40/secret/tháng) sẽ tốn **~\$10/tháng** nếu tách lẻ.
  - **Giải pháp tối ưu:** Dùng **SSM Parameter Store (Standard Tier)** với kiểu **`SecureString`** (mã hóa KMS) → **Miễn phí hoàn toàn (\$0)** cho tới 10.000 parameters! *(Chỉ dùng 1 secret duy nhất trên Secrets Manager nếu dùng RDS auto-rotation, tốn \$0.40/tháng).*

### 2.9. Giám sát, Log tập trung & Cảnh báo (Bắt buộc)
- **Dịch vụ:** **Amazon CloudWatch Logs**, **CloudWatch Alarms**, **Amazon SNS**.
- **Giải pháp tối ưu chi phí:**
  - **Đặt Log Retention = 7 hoặc 14 ngày** cho toàn bộ Log Groups (tránh để Never Expire làm phình chi phí lưu trữ).
  - Bỏ log noise (health check `/health` của ALB/Docker không ghi vào access log).
  - Trong hạn mức Free Tier (5 GB logs/tháng, 10 CloudWatch Alarms, 1.000 email SNS/tháng) → chi phí gần như **\$0 – \$2/tháng**.

### 2.10. Xác thực CI/CD & Hạ tầng dạng Code (IaC)
- **Dịch vụ:** **AWS IAM (OIDC Provider)** + **AWS CDK (TypeScript)**.
- **Chi phí:** **\$0** (miễn phí hoàn toàn; không cần tạo IAM User với Access Key tĩnh).

---

## 3. Bảng tổng hợp 2 gói giải pháp đề xuất (`ap-southeast-1`, 24/7)

| Thành phần | Gói 1: Tiết kiệm tối đa (EC2 + Docker) | Gói 2: Chuẩn Cloud-Native (ECS Fargate + RDS) |
| :--- | :--- | :--- |
| **Compute** | 1x EC2 `t3.small` (~\$15) hoặc `t3.medium` (~\$30) | ECS Fargate Graviton (3 tasks, ~1 vCPU / 2 GB): ~\$24–\$28 |
| **Load Balancer & SSL** | Nginx/Caddy + Let's Encrypt trên EC2 (**\$0**) | 1x ALB dùng chung Host-routing + ACM SSL (**~\$18–\$20**) |
| **VPC NAT Gateway** | Không dùng (**\$0**) | Không dùng — Public Subnet + SG chặt (**\$0**) |
| **Database (MySQL)** | RDS `db.t4g.micro` Free Tier (**\$0**) hoặc Container (**\$0**) | RDS `db.t4g.micro` (~\$15, hoặc **\$0** nếu còn Free Tier) |
| **Cache (Redis)** | Redis container trên EC2 (**\$0**) | Redis sidecar container (**\$0**) hoặc ElastiCache (~\$12) |
| **Registry (ECR)** | ECR + Lifecycle policy (**< \$0.50**) | ECR + Lifecycle policy (**< \$0.50**) |
| **Secrets** | SSM Parameter Store `SecureString` (**\$0**) | SSM Parameter Store `SecureString` (**\$0**) |
| **Storage & Email** | S3 + SES (**~\$0.50 – \$1**) | S3 + SES (**~\$0.50 – \$1**) |
| **Logs & Alerts** | CloudWatch Agent + Alarms + SNS (**~\$0 – \$2**) | CloudWatch Logs (14d) + Alarms + SNS (**~\$1 – \$3**) |
| **Tổng chi phí / tháng** | **~\$16 – \$33 / tháng** *(chưa gồm RDS nếu hết Free Tier)* | **~\$44 – \$65 / tháng** *(đã tối ưu giảm ~\$80 so với cấu hình mặc định)* |

> **Lưu ý:** Sau khi tham khảo xong nhánh `develop`, khi tiến hành cấu hình thực tế ở các bước tiếp theo, chúng ta sẽ quay lại nhánh `feat/deploy-aws` (và đồng bộ các cập nhật cần thiết từ `develop` nếu bạn muốn).
