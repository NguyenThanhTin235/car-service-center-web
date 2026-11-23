# Kế Hoạch Tổng Quan CI/CD & Triển Khai AWS (Car Service Center)

> **Trạng thái:** Kế hoạch tổng quan (Overview Plan) — Bước tiếp theo sẽ bóc tách thành Kế hoạch triển khai chi tiết (Detailed Implementation Plan).  
> **Nhánh làm việc:** `feat/deploy-aws`  
> **Region mục tiêu đề xuất:** `ap-southeast-1` (Singapore — tối ưu độ trễ cho người dùng tại Việt Nam).

---

## 1. Thành phần hệ thống cần đóng gói & triển khai

Dựa trên cấu trúc monorepo hiện tại của dự án:

| Thành phần | Đường dẫn | Công nghệ | Port / Giao thức |
| :--- | :--- | :--- | :--- |
| **Backend API & Realtime** | `src/backend` | Node.js 20, Express 5, TypeScript, Prisma (MySQL), Redis (`ioredis`), Socket.IO, Winston | `5000` (HTTP + WebSocket) |
| **Customer Portal** | `src/frontend/apps/customer-web` | Next.js (App Router), React, Tailwind CSS, Redux Toolkit | `3000` (HTTP) |
| **Internal Portal** | `src/frontend/apps/internal-web` | Next.js (App Router), React, Tailwind CSS, Redux Toolkit | `3001` (HTTP) |
| **Cơ sở dữ liệu** | `src/backend/prisma/schema.prisma` | MySQL 8.x | `3306` |
| **Cache / Realtime PubSub** | `src/backend` | Redis 7.x | `6379` |

---

## 2. Đối chiếu các yêu cầu bắt buộc (Compliance Matrix)

| Yêu cầu bắt buộc | Giải pháp đáp ứng |
| :--- | :--- |
| **Pipeline ≥ 6 chặng** | Thiết kế pipeline **6 chặng tuần tự + song song**: `1. Build` → `2. Lint / Phân tích tĩnh` → `3. Test` → `4. Quét bảo mật / Phụ thuộc` → `5. Đóng gói Docker & Push ECR` → `6. Triển khai tự động & Verify`. |
| **Tỉ lệ build xanh ≥ 90%** | Chặn merge PR vào `develop`/`main` nếu CI fail; chạy lint/typecheck local trước khi push; cache `npm` và `.next/cache` để tránh lỗi flaky do timeout. |
| **≥ 10 lần triển khai tự động trong kỳ, trải đều** | Tự động deploy lên `staging` mỗi khi merge vào `develop`, và deploy `production` khi merge vào `main` hoặc gắn tag `v*.*.*`. |
| **Thời gian commit → staging ≤ 15 phút** | Chạy song song backend & frontend ở các chặng 1–4; dùng Docker Buildx layer caching + GitHub Actions cache; tách image nhỏ gọn (multi-stage build). |
| **Quản lý Secret, Versioning & Rollback** | - **Secrets:** GitHub OIDC (không lưu AWS Access Key dài hạn) + AWS SSM Parameter Store (`SecureString`) / AWS Secrets Manager.<br>- **Versioning:** Tag Docker image theo `<semver>-<git-sha-7>` và `staging`/`latest`.<br>- **Rollback:** Giữ lại các revision trước trên ECS Task Definition / ECR; rollback về phiên bản ổn định chỉ trong 1 thao tác (hoặc tự động rollback khi ALB/ECS health check fail). |
| **Giám sát sau triển khai** | - **Health check:** Endpoint `/health` trên Backend (kiểm tra DB + Redis) và HTTP health check trên 2 Next.js apps.<br>- **Log tập trung:** CloudWatch Logs (structured JSON từ Winston + container stdout/stderr).<br>- **Cảnh báo (Alert):** CloudWatch Alarms (5xx rate, CPU/Memory, Unhealthy hosts, Pipeline failure) → Amazon SNS → Email / Discord / Slack. |

---

## 3. Kiến trúc Pipeline CI/CD (6 Chặng)

```text
[Git Push / PR / Merge]
        │
        ▼
(1) Build & Compile ──► Backend (tsc + prisma generate) | Frontend (next build)
        │
        ▼
(2) Lint & Static Analysis ──► ESLint + TypeScript strict check (`tsc --noEmit`) + `prisma validate`
        │
        ▼
(3) Automated Test ──► Backend Vitest (`npm test`) | Frontend smoke/unit/e2e gate
        │
        ▼
(4) Security & Dependency Scan ──► `npm audit` + Trivy (FS/Image CVE) + Secret scan (Gitleaks)
        │                          [Chỉ chạy tiếp khi merge vào develop / main]
        ▼
(5) Package & Registry ──► Multi-stage Docker Build (backend, customer-web, internal-web)
        │                  → Tag (`sha-<short>`, `vX.Y.Z`) → Push Amazon ECR
        ▼
(6) Auto Deploy & Post-Deploy Check
        ├─► DB Migration (`prisma migrate deploy`)
        ├─► Deploy lên AWS (ECS Fargate rolling update / EC2 SSM)
        └─► Smoke Health Check (`/health`) + Thông báo kết quả qua SNS/Webhook
```

### Dự toán thời gian Pipeline (Mục tiêu ≤ 15 phút)
- **Chặng 1–4 (CI):** ~3 – 5 phút (chạy song song 2 job Backend & Frontend với npm/Next.js cache).
- **Chặng 5 (Docker Build + Push ECR):** ~3 – 4 phút (Buildx cache + Alpine/Slim multi-stage image).
- **Chặng 6 (Deploy + Migration + Health Check):** ~2 – 4 phút.
- **Tổng thời gian dự kiến:** **~8 – 13 phút** (đạt KPI ≤ 15 phút).

---

## 4. Tích hợp AWS SDK trong ứng dụng (`src/backend`)

Để tận dụng hệ sinh thái AWS đồng bộ với hạ tầng CD, dự kiến tích hợp các module **AWS SDK v3** (`@aws-sdk/*` — chỉ cài đúng package cần dùng, không cài SDK v2 nguyên khối):

1. **`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`** *(tùy chọn thay thế/bổ sung Cloudinary)*: Lưu trữ ảnh kiểm tra xe (check-in/inspection) và file hóa đơn PDF (`pdfkit`) trên Amazon S3 (kết hợp presigned URL bảo mật).
2. **`@aws-sdk/client-secrets-manager` hoặc `@aws-sdk/client-ssm`**: Hỗ trợ nạp secret cấu hình tập trung hoặc inject trực tiếp từ AWS vào runtime environment của container.
3. **`@aws-sdk/client-ses`** *(hoặc SMTP qua Amazon SES)*: Gửi email xác thực/thông báo lịch hẹn ổn định trên môi trường production.
4. **IaC bằng AWS CDK (`aws-cdk-lib`)**: Định nghĩa toàn bộ hạ tầng (VPC, ECR, ECS/EC2, RDS, CloudWatch, SNS, IAM OIDC) bằng TypeScript để đồng bộ phiên bản hạ tầng cùng source code.

---

## 5. So sánh phương án dịch vụ AWS & Ước tính chi phí (`ap-southeast-1`)

> *Lưu ý: Giá ước tính theo bảng giá tham khảo On-Demand tại vùng Singapore (`ap-southeast-1`), chạy 24/7 (730 giờ/tháng). Nếu tài khoản còn trong **AWS Free Tier (12 tháng đầu)**, chi phí thực tế sẽ thấp hơn đáng kể.*

### Phương án A: ECS Fargate + ALB + ECR + RDS MySQL + ElastiCache *(Khuyên dùng cho Production chuẩn)*
- **Compute:** 3 ECS Fargate services (`backend`: 0.5 vCPU / 1 GB RAM; `customer-web` & `internal-web`: 0.25 vCPU / 0.5 GB RAM).
- **Routing & SSL:** Application Load Balancer (ALB) + ACM SSL (miễn phí).
- **Registry:** Amazon ECR (lưu trữ ~3–5 GB image).
- **Database & Cache:** Amazon RDS MySQL (`db.t4g.micro` Single-AZ) + ElastiCache Redis (`cache.t4g.micro`).
- **Secrets & Monitoring:** SSM Parameter Store (Standard: miễn phí) + Secrets Manager (2–3 secrets) + CloudWatch Logs/Alarms + SNS.

| Hạng mục | Cấu hình dự kiến | Chi phí ước tính / tháng (USD) |
| :--- | :--- | :---: |
| **ECS Fargate** | 3 tasks (tổng ~1 vCPU, 2 GB RAM, 24/7) | ~\$28 – \$35 |
| **Application Load Balancer** | 1 ALB + LCU mức thấp | ~\$18 – \$22 |
| **RDS MySQL** | `db.t4g.micro` + 20 GB gp3 (Single-AZ) | ~\$14 – \$16 *(Free Tier: ~\$0)* |
| **ElastiCache Redis** | `cache.t4g.micro` (1 node) | ~\$12 – \$14 *(Free Tier: ~\$0)* |
| **ECR + S3 + CloudWatch + Secrets** | ~5 GB storage, 5–10 GB logs, 3 secrets, alarms | ~\$4 – \$8 |
| **Tổng cộng (Chưa Free Tier)** | | **~\$76 – \$95 / tháng** |
| **Tổng cộng (Có Free Tier)** | | **~\$50 – \$65 / tháng** |

**Ưu điểm:** Zero-downtime rolling update, rollback tức thì theo Task Definition revision, không phải quản lý OS/server, chuẩn Production doanh nghiệp.

---

### Phương án B: EC2 (Docker Compose + Nginx/Traefik) + ECR + RDS MySQL *(Khuyên dùng nếu ưu tiên tối ưu chi phí đồ án)*
- **Compute:** 1 EC2 `t3.small` (2 vCPU, 2 GB RAM) hoặc `t3.medium` (2 vCPU, 4 GB RAM) chạy 3 Docker containers + Redis container (hoặc dùng chung RDS MySQL).
- **Auto Deploy:** GitHub Actions push image lên **Amazon ECR** → gọi **AWS SSM Run Command** (qua OIDC, không mở SSH) để pull tag mới và `docker compose up -d` kèm cơ chế rollback tag cũ nếu health check fail.
- **Monitoring:** CloudWatch Agent thu thập container logs & metrics (CPU/RAM/Disk) → CloudWatch Alarms → SNS.

| Hạng mục | Cấu hình dự kiến | Chi phí ước tính / tháng (USD) |
| :--- | :--- | :---: |
| **EC2 Instance** | `t3.small` (~\$15) hoặc `t3.medium` (~\$30) + 20 GB EBS | ~\$17 – \$32 |
| **RDS MySQL (tùy chọn)** | `db.t4g.micro` (hoặc chạy MySQL container trên EC2) | ~\$0 – \$15 |
| **ECR + CloudWatch + SSM + S3** | Lưu image, log tập trung, SSM miễn phí | ~\$3 – \$6 |
| **Tổng cộng** | | **~\$20 – \$38 / tháng** *(chưa tính RDS nếu gộp chung)* |

**Ưu điểm:** Chi phí thấp nhất (~1/3 so với Fargate + ALB), vẫn đáp ứng đủ 6 chặng pipeline, Docker, ECR versioning, SSM secrets và CloudWatch logs/alarms.  
**Nhược điểm:** Chạy trên 1 node (Single Point of Failure), thời gian chuyển container khi deploy có thể gián đoạn vài giây nếu không cấu hình blue/green proxy.

---

### Phương án C: AWS App Runner + RDS MySQL + ECR *(PaaS tối giản)*
- App Runner tự kéo image từ ECR, tự cấp HTTPS và tự động rollback khi health check fail, bỏ được chi phí ALB cố định (~\$18/tháng).
- Tuy nhiên cần tạo **VPC Connector** để App Runner kết nối vào RDS/Redis private, và cần kiểm tra kỹ cấu hình sticky/WebSocket cho Socket.IO khi scale > 1 instance.
- **Tổng chi phí ước tính:** **~\$45 – \$65 / tháng** (chưa Free Tier).

---

## 6. Khuyến nghị lựa chọn & Lộ trình các giai đoạn tiếp theo

### Khuyến nghị
- Nếu ưu tiên **chuẩn Production / Demo kiến trúc Cloud bài bản**: Chọn **Phương án A (ECS Fargate + ALB + ECR + RDS + CloudWatch)** — có thể tắt/scale-to-0 môi trường `staging` ngoài giờ hành chính để giảm ~40–50% chi phí Fargate.
- Nếu ưu tiên **tiết kiệm ngân sách tối đa cho đồ án**: Chọn **Phương án B (EC2 `t3.medium` + Docker + ECR + SSM + CloudWatch)**, vẫn đảm bảo đầy đủ các tiêu chí kỹ thuật bắt buộc (Docker, ECR versioning, rollback, secret qua SSM, log tập trung & alert qua CloudWatch).

### Lộ trình triển khai (Sẽ chi tiết hóa ở bước sau)
1. **Giai đoạn 1 — Chuẩn hóa Docker & Health Check:** Viết `Dockerfile` (multi-stage) cho `backend`, `customer-web`, `internal-web`; bổ sung endpoint `/health` kiểm tra kết nối MySQL & Redis; tạo `docker-compose.yml` chạy thử nghiệm local.
2. **Giai đoạn 2 — Hạ tầng AWS (IaC với AWS CDK):** Khởi tạo module `infra/` (hoặc `cdk/`) định nghĩa VPC, ECR, Secrets/SSM, CloudWatch Log Groups + Alarms + SNS, GitHub OIDC Role, và Compute/DB theo phương án đã chốt.
3. **Giai đoạn 3 — Tích hợp AWS SDK vào Backend:** Bổ sung `@aws-sdk/*` (S3/SES/Secrets tùy phạm vi chốt) và cấu hình Winston JSON logging tương thích CloudWatch.
4. **Giai đoạn 4 — Xây dựng Pipeline CI/CD 6 chặng (`.github/workflows/`):** Nâng cấp CI hiện tại và bổ sung CD workflow cho `staging` (`develop`) và `production` (`main`), kèm cơ chế versioning & rollback.
5. **Giai đoạn 5 — Kiểm thử vận hành & Nghiệm thu KPI:** Đo thời gian commit → staging (≤ 15 phút), kiểm thử rollback, kiểm thử trigger CloudWatch Alert, và duy trì nhịp triển khai ≥ 10 lần trong kỳ với tỉ lệ build xanh ≥ 90%.
