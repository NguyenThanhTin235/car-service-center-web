# Kế Hoạch Triển Khai Chi Tiết (Vertical Tickets) — CI/CD & AWS Gói 1

> **Mục tiêu:** Triển khai hoàn chỉnh hạ tầng AWS (Gói 1) và Pipeline CI/CD 6 chặng trên nhánh `feat/deploy-aws`.  
> **Quy tắc:** Mỗi ticket là một lát cắt dọc có thể kiểm chứng độc lập bằng lệnh terminal.

---

## Thứ tự thực thi & Phụ thuộc

```text
[CICD-01: Sync develop & Health Endpoint]
        │
        ├──► [CICD-02: Dockerfiles & Local Compose]
        │           │
        │           └──► [CICD-04: AWS SDK (S3/SES) & Winston JSON]
        │
        └──► [CICD-03: AWS CDK Infra (VPC, EC2, RDS, ECR, SSM, CW, SNS)]
                    │
                    ▼
             [CICD-05: 6-Stage GitHub Actions CI/CD + Auto Rollback]
                    │
                    ▼
             [CICD-06: Staging Cutover, Alert Drill & KPI Verification]
```

---

## Danh sách Tickets

### `CICD-01`: Đồng bộ `develop` & Chuẩn hóa Endpoint `/health`
- **Blocked by:** None
- **Phạm vi:**
  - Merge `develop` (`36e6081`) vào `feat/deploy-aws` (nếu user đồng ý) để đồng bộ code SePay & bộ test mới nhất.
  - Bổ sung/chuẩn hóa endpoint `GET /health` trong `src/backend` kiểm tra thực tế kết nối Prisma MySQL (`SELECT 1`) và Redis (`PING`), trả HTTP `200` khi khỏe hoặc `503` khi lỗi.
- **Verification:**
  - `cd src/backend && npm run build && npm test` (Exit code 0).

### `CICD-02`: Multi-stage Dockerfiles & `docker-compose` (Local + Prod)
- **Blocked by:** `CICD-01`
- **Phạm vi:**
  - Bật `output: 'standalone'` trong `next.config.*` của `customer-web` và `internal-web`.
  - Tạo multi-stage `Dockerfile` tối ưu dung lượng (`node:20-alpine`) cho `src/backend`, `customer-web`, `internal-web` + `.dockerignore`.
  - Tạo `docker-compose.yml` (local dev/verify) và `docker-compose.aws.yml` (pull image từ ECR theo `IMAGE_TAG`, kèm Redis container, Nginx reverse proxy config hỗ trợ WebSocket & SSL).
- **Verification:**
  - `docker compose build` thành công cho cả 3 images; `docker compose up -d` và `curl http://localhost:5000/health` trả `200 OK`.

### `CICD-03`: Hạ tầng AWS bằng AWS CDK (`infra/`)
- **Blocked by:** `CICD-01`
- **Phạm vi:**
  - Khởi tạo project AWS CDK TypeScript trong `infra/` (áp dụng skill `aws-cdk-development` & `security-scan`).
  - Định nghĩa stacks:
    - **Network & DB:** VPC `10.0.0.0/16` (Public + Private Isolated Subnets, **không NAT Gateway**), Security Groups, RDS MySQL `db.t4g.micro`.
    - **Compute & Registry:** EC2 `t3.small`/`t3.medium` (cài sẵn Docker, CloudWatch Agent, SSM Agent), 3 ECR Repositories với Lifecycle Policy (giữ 10 images).
    - **IAM & Secrets:** GitHub Actions OIDC Provider + Deploy Role (least privilege), SSM Parameter Store namespace `/car-service/staging/*` và `/car-service/prod/*`.
    - **Observability:** CloudWatch Log Groups (14-day retention), CloudWatch Alarms (EC2 CPU, StatusCheck, RDS), SNS Topic + Email subscription.
- **Verification:**
  - `cd infra && npx tsc --noEmit && npx cdk synth` (sinh CloudFormation template không lỗi) + chạy kiểm tra bảo mật IaC.

### `CICD-04`: Tích hợp AWS SDK v3 (`S3`, `SES`) & Structured Logging
- **Blocked by:** `CICD-02`
- **Phạm vi:**
  - Cài `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ses` trong `src/backend`.
  - Viết adapter lưu trữ S3 (hóa đơn PDF/backup) & adapter gửi email SES (có fallback cấu hình cũ qua env).
  - Cấu hình Winston xuất JSON log chuẩn ra `stdout` trên `NODE_ENV=production` để CloudWatch Agent thu thập.
- **Verification:**
  - `cd src/backend && npm test` (unit test cho S3/SES service với mock SDK client, Exit code 0).

### `CICD-05`: Xây dựng Pipeline CI/CD 6 Chặng & Script Auto-Rollback
- **Blocked by:** `CICD-02`, `CICD-03`, `CICD-04`
- **Phạm vi:**
  - Nâng cấp `.github/workflows/ci.yml` và tạo `.github/workflows/cd.yml` đủ **6 chặng**:
    1. Build (`tsc`, `next build`)
    2. Lint & Typecheck (`eslint`, `tsc --noEmit`, `prisma validate`)
    3. Test (`vitest run`)
    4. Security Scan (`npm audit`, Trivy FS + Image, Gitleaks)
    5. Docker Buildx + Push Amazon ECR (tag `<env>-<sha7>`)
    6. SSM Run Command Deploy lên EC2 + `prisma migrate deploy` + Health Check Gate + Auto Rollback về `.previous_tag` nếu fail.
- **Verification:**
  - Push commit test lên nhánh `feat/deploy-aws` / `develop` → kiểm tra GitHub Actions chạy đủ 6 chặng xanh và tổng thời gian ≤ 15 phút.

### `CICD-06`: Nghiệm thu Vận hành, Test Rollback & Diễn tập Cảnh báo
- **Blocked by:** `CICD-05`
- **Phạm vi:**
  - Cấu hình DNS Cloudflare + Certbot SSL trên EC2; test thực tế SePay Webhook HTTPS & Socket.IO WSS.
  - Diễn tập **Rollback** về tag image trước đó và đo thời gian khôi phục.
  - Kích hoạt thử 1 **CloudWatch Alarm** để xác nhận nhận thông báo qua SNS.
  - Ghi nhận metrics vào báo cáo nghiệm thu (tỉ lệ build xanh ≥ 90%, thời gian commit → staging ≤ 15 phút, lịch trình ≥ 10 lần deploy trong kỳ).
- **Verification:**
  - Có bằng chứng log pipeline xanh, log CloudWatch tập trung, email/webhook cảnh báo SNS và xác nhận rollback thành công.
