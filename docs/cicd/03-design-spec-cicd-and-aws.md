# Đặc Tả Kỹ Thuật: Kiến Trúc AWS & Pipeline CI/CD 6 Chặng (`SPEC-CICD-AWS-v1`)

> **Trạng thái:** Đã chốt thiết kế (Ready for Implementation)  
> **Phiên bản kiến trúc:** `v1.0`  
> **Sơ đồ đính kèm:**
> - [aws-architecture-v1.drawio](diagrams/aws-architecture-v1.drawio)
> - [cicd-pipeline-v1.drawio](diagrams/cicd-pipeline-v1.drawio)

---

## 1. Bối cảnh & Các quyết định kiến trúc đã chốt

| Hạng mục | Quyết định đã chốt | Lý do kỹ thuật & Tối ưu chi phí |
| :--- | :--- | :--- |
| **Compute Host** | **1x Amazon EC2 (`t3.small` hoặc `t3.medium`)** chạy Docker Compose + Nginx | Đủ tải cho cả 3 app (`backend`, `customer-web`, `internal-web`) + Redis container; tách Staging & Production bằng subdomain/Docker Compose project trên cùng host hoặc tách sau khi cần. |
| **Database** | **Amazon RDS for MySQL (`db.t4g.micro`)** trong Private Subnet | Tách DB khỏi compute để an toàn dữ liệu, automated backup, tận dụng AWS Free Tier 12 tháng đầu (`$0`). |
| **Cache & PubSub** | **Redis 7 Alpine container** trên EC2 | Tránh chi phí ElastiCache (~\$12–\$14/tháng), độ trễ `localhost` cực thấp cho `ioredis` & Socket.IO. |
| **Domain, DNS & SSL** | **Tên miền riêng + Cloudflare DNS + Nginx / Certbot (Let's Encrypt)** | Đáp ứng bắt buộc HTTPS cho **SePay Webhook** & WebSocket upgrade cho **Socket.IO**, chi phí ALB = `\$0`. |
| **Network** | **1 VPC (`10.0.0.0/16`), Public Subnet (EC2) + Private Subnet (RDS), Không NAT Gateway** | Tiết kiệm ~\$35/tháng phí NAT Gateway; EC2 không mở SSH port 22 (chỉ mở 80/443), quản trị & deploy qua **AWS SSM**. |
| **Container Registry** | **Amazon ECR** + Lifecycle Policy (giữ 10 tag gần nhất) | Lưu trữ versioned Docker images theo `<env>-<git-sha-7>` và `vX.Y.Z` để rollback nhanh. |
| **Secret Management** | **AWS SSM Parameter Store (`SecureString` KMS)** | Miễn phí `\$0` cho ~25 biến nhạy cảm (`DATABASE_URL`, `JWT_SECRET`, `SEPAY_*`, `GEMINI_*`...). |
| **AWS SDK Integration** | **`@aws-sdk/client-s3` + `@aws-sdk/client-ses`** (AWS SDK v3) | Lưu hóa đơn PDF / DB backups lên S3; hỗ trợ gửi email qua Amazon SES. |
| **Observability & Alert** | **CloudWatch Logs (Retention 14d) + CloudWatch Alarms + Amazon SNS** | Thu thập log tập trung từ Docker/Winston, cảnh báo qua Email/Discord khi CPU cao, RDS lỗi, hoặc `/health` fail. |
| **IaC** | **AWS CDK (TypeScript)** trong `infra/` | Quản lý toàn bộ tài nguyên AWS bằng code, có thể audit/scan bảo mật trước khi `cdk deploy`. |

---

## 2. Thiết kế Pipeline CI/CD 6 Chặng (GitHub Actions)

### Luồng kích hoạt (Triggers & Environments)
- **Pull Request (`develop`, `main`):** Chạy Chặng 1 → 4 (Gate bắt buộc trước khi merge).
- **Push / Merge vào `develop`:** Chạy Chặng 1 → 6 → **Auto Deploy Staging** (`staging.api.<domain>`, `staging.<domain>`, `staging.admin.<domain>`).
- **Push / Merge vào `main` hoặc Tag `v*.*.*`:** Chạy Chặng 1 → 6 → **Deploy Production** (có GitHub Environment Manual Approval Gate nếu cần).

### Chi tiết 6 Chặng
1. **Chặng 1 — Build & Compile:**
   - Backend: `npx prisma generate && npm run build` (`tsc`).
   - Frontend: `npm run build` (build song song `customer-web` & `internal-web` với Next.js cache).
2. **Chặng 2 — Lint & Static Analysis:**
   - Backend: `npx prisma validate`, `npx tsc --noEmit`, ESLint.
   - Frontend: `npm run lint` + `tsc --noEmit` cho cả 2 workspace.
3. **Chặng 3 — Automated Test:**
   - Backend: `npm run test:unit` (Vitest) + `npm run test:integration` (khi có test DB service container MySQL/Redis).
   - Frontend: Smoke/Component unit test gate.
4. **Chặng 4 — Security & Dependency Scan:**
   - `npm audit --audit-level=high` (backend & frontend).
   - **Trivy FS Scan** (quét CVE trong dependencies/repo) + **Gitleaks** (chặn lộ secret/API key trong git diff).
5. **Chặng 5 — Docker Package & Push Amazon ECR:**
   - Đăng nhập AWS qua **IAM OIDC** (không dùng Access Key tĩnh).
   - Multi-stage Docker Build (`node:20-alpine`, Next.js `output: 'standalone'`) với `docker/build-push-action` + GHA layer cache.
   - Quét **Trivy Image Scan** (CRITICAL/HIGH) trước khi push.
   - Push 3 images (`car-service/backend`, `car-service/customer-web`, `car-service/internal-web`) với tag `<env>-<sha7>` và `<env>-latest`.
6. **Chặng 6 — Auto Deploy & Post-Deploy Verification:**
   - GitHub Actions gọi **AWS SSM Send-Command** xuống EC2 (không mở SSH).
   - Script trên EC2 thực thi:
     1. Kéo biến môi trường mới nhất từ **SSM Parameter Store** (`/car-service/<env>/*`) vào file `.env.runtime` (chỉ đọc bởi root/docker).
     2. Lưu lại tag đang chạy vào `.previous_tag` (phục vụ rollback).
     3. `docker compose pull` image tag mới → chạy `prisma migrate deploy` (1 lần) → `docker compose up -d --remove-orphans`.
     4. Chạy **Health Check Loop** kiểm tra `GET /health` (MySQL + Redis OK) và HTTP 200 cho 2 frontend apps.
     5. **Auto Rollback:** Nếu sau 60s health check vẫn fail → tự động `docker compose` quay lại `.previous_tag` và gửi cảnh báo qua SNS.

---

## 3. Thiết kế luồng dữ liệu & Bảo mật (Well-Architected)

### Luồng đồng bộ (Synchronous Flow)
- **Web Users / Staff:** `Browser` → `Cloudflare DNS (HTTPS)` → `EC2 Nginx (443, SSL + WebSocket Upgrade)` → `customer-web (3000)` / `internal-web (3001)` / `backend (5000)` → `RDS MySQL (3306)` & `Redis (6379)`.
- **SePay Payment Webhook:** `SePay Gateway` → `HTTPS POST https://api.<domain>/api/v1/payments/sepay-webhook` → `Nginx` → `Backend` → Xác thực chữ ký + Cập nhật `RDS MySQL` + Emit `Socket.IO`.

### Luồng bất đồng bộ & Vận hành (Async & Ops Flow)
- **Tích hợp AWS SDK (`src/backend`):**
  - Lưu trữ hóa đơn PDF & file đính kèm lên **Amazon S3** (`@aws-sdk/client-s3`), trả về Presigned URL có thời hạn.
  - Gửi email xác thực/hóa đơn qua **Amazon SES** (`@aws-sdk/client-ses`).
- **Logging & Alerting:**
  - Container driver `awslogs` (hoặc CloudWatch Agent) đẩy `stdout/stderr` JSON từ Winston & Nginx lên **CloudWatch Logs** (Retention 14 ngày).
  - **CloudWatch Alarms** theo dõi: EC2 `CPUUtilization > 80%`, `StatusCheckFailed`, RDS `FreeStorageSpace < 2GB`, Backend `5xx Error Count > 5/phút` → bắn thông báo qua **Amazon SNS**.

---

## 4. Phạm vi loại trừ (Out of Scope — Ponytail YAGNI)
- Không triển khai Multi-AZ RDS hoặc Auto Scaling Group / ECS Cluster (chỉ dùng 1 EC2 + 1 RDS Single-AZ theo Gói 1).
- Không tạo NAT Gateway để tránh phát sinh ~\$35/tháng.
- Không tích hợp Kubernetes (EKS) hay AWS CodePipeline (dùng GitHub Actions hiện có + SSM Run Command).
