# KẾ HOẠCH TRIỂN KHAI CHI TIẾT TOÀN BỘ HỆ THỐNG CI/CD & AWS (MASTER DEPLOYMENT PLAN)

> **Dự án:** Car Service Center Management Platform  
> **Nhánh triển khai:** `feat/deploy-aws` (tách trực tiếp từ **`main` @ `8eefc3e` — Release `v1.0.0`**)  
> **Phiên bản triển khai đầu tiên:** **Release `v1.0.0`** trên nhánh `main` (chỉ bổ sung hạ tầng Deploy/CI-CD/AWS SDK, **không merge** các tính năng chưa release từ `develop`).  
> **Giải pháp hạ tầng đã chốt:** **Gói 1** — EC2 (`t3.small`/`t3.medium`) + Docker Compose + Nginx SSL + Cloudflare DNS + RDS MySQL (`db.t4g.micro`) + Amazon ECR + SSM Parameter Store + CloudWatch/SNS + AWS SDK (`S3`, `SES`) + AWS CDK (`infra/`).  
> **Sơ đồ kiến trúc tham chiếu:**
> - [aws-architecture-v1.drawio](diagrams/aws-architecture-v1.drawio)
> - [cicd-pipeline-v1.drawio](diagrams/cicd-pipeline-v1.drawio)

---

## Phần A: Kết Quả Rà Soát Hiện Trạng Codebase (`main` v1.0.0 @ `8eefc3e`)

Qua kiểm tra trực tiếp mã nguồn trên nhánh `feat/deploy-aws` (mốc Release `v1.0.0` của `main`), hệ thống hiện có **8 điểm cần xử lý** để sẵn sàng đóng gói và triển khai lên AWS:

| # | Phát hiện thực tế trong Codebase (`v1.0.0`) | Mức độ | Hành động xử lý |
| :-: | :--- | :---: | :--- |
| 1 | **Thiếu `app.set('trust proxy', true)`**: `src/backend/src/app.ts` trên `main` (`v1.0.0`) chưa bật `trust proxy` khi đứng sau Nginx HTTPS reverse proxy. | Cao | Bổ sung `app.set('trust proxy', true)` ở **Phase 1**. |
| 2 | **CORS chỉ hỗ trợ 1 `FRONTEND_URL`**: `src/backend/src/app.ts` chỉ whitelist `process.env.FRONTEND_URL` và `localhost:3000/3001`. Khi deploy 2 domain riêng (`app.*` và `admin.*`), frontend thứ 2 sẽ bị lỗi CORS. | Cao | Nâng cấp `app.ts` đọc danh sách `CORS_ORIGINS` (phân tách bằng dấu phẩy) ở **Phase 1**. |
| 3 | **Chưa có endpoint `/health` đúng chuẩn**: `app.ts` mới chỉ có `GET /` trả message tĩnh, chưa kiểm tra kết nối thật tới MySQL và Redis. | Cao | Thêm `GET /health` kiểm tra `prisma.$queryRaw` + Redis `PING` ở **Phase 1**. |
| 4 | **Backend thiếu script `lint` & cấu hình ESLint**: `src/backend/package.json` đã cài `eslint` và `prettier` trong `devDependencies` nhưng chưa có script `"lint"` và file config để chạy ở Chặng 2 Pipeline. | Trung bình | Bổ sung `eslint.config.mjs` + script `"lint"` trong `src/backend/package.json` ở **Phase 1**. |
| 5 | **Logging chưa chuẩn hóa JSON cho CloudWatch**: `winston` đã cài trong `package.json` nhưng `app.ts` vẫn dùng `morgan('dev')` và `server.ts` dùng `console.log`. | Trung bình | Cấu hình Winston structured JSON stdout + Morgan stream ở **Phase 1**. |
| 6 | **Next.js chưa bật `output: 'standalone'`**: Cả `customer-web/next.config.ts` và `internal-web/next.config.ts` đều đang rỗng `{}`. Ngoài ra `NEXT_PUBLIC_API_URL` là biến duy nhất được frontend đọc lúc build. | Cao | Thêm `output: 'standalone'` và truyền `NEXT_PUBLIC_API_URL` qua Docker `ARG/ENV` ở **Phase 1 & 3**. |
| 7 | **Kiểm soát Prisma Migration cho `v1.0.0`**: Trên `main` hiện có migration `20260909021150_init`. Cần đối chiếu `schema.prisma` khớp hoàn toàn trước khi chạy `prisma migrate deploy` trên RDS. | Cao | Kiểm tra `prisma migrate status`/`diff` ở **Phase 0**, tuyệt đối không dùng `--accept-data-loss` trong CD. |
| 8 | **Chưa có AWS SDK & IaC**: Chưa cài `@aws-sdk/*`, chưa có thư mục `infra/` (AWS CDK), chưa có `Dockerfile` / `docker-compose`. | Cao | Thực hiện ở **Phase 2, 3, 4**. |

*(Ghi chú thêm: Ở mốc `v1.0.0`, backend chưa bật `sepay-pg-node` và `socket.io` chưa gắn vào `server.ts`, nhưng hạ tầng Nginx SSL + WebSocket + Secret SSM vẫn được thiết kế sẵn để tương thích khi các bản `v1.1.0+` từ `develop` được merge lên sau này. `node-cron` chạy `startAppointmentReminderJob()` trong `server.ts` nên mỗi môi trường chỉ chạy 1 container backend.)*

---

## Phần B: Kế Hoạch Triển Khai Theo 7 Phases (`v1.0.0` First)

### Phase 0: Khóa Baseline `v1.0.0` & Chuẩn bị Tài nguyên Ngoài (Prerequisites)
**Mục tiêu:** Giữ nguyên phạm vi nghiệp vụ bản Release `v1.0.0` trên `feat/deploy-aws` (từ `main` `8eefc3e`) và chuẩn bị tài khoản nền tảng.
- **Công việc:**
  1. Xác nhận `feat/deploy-aws` đứng đúng trên base `main` (`8eefc3e`), **không merge `develop`** vào nhánh này để đảm bảo bản deploy đầu tiên sạch sẽ là `v1.0.0`.
  2. Kiểm tra `src/backend/prisma/schema.prisma` và migration `20260909021150_init` (nếu có sai lệch schema do trước đây dùng `db push`, tạo 1 baseline/sync migration sạch cho `v1.0.0`).
  3. Chuẩn bị tài nguyên ngoài code:
     - AWS Account (region `ap-southeast-1`), bật IAM / Billing Alert (\$10, \$25, \$40).
     - Tên miền riêng trỏ DNS qua Cloudflare (chuẩn bị các subdomain: `staging-api.<domain>`, `staging.<domain>`, `staging-admin.<domain>` cho Staging và `api.<domain>`, `<domain>`, `admin.<domain>` cho Production `v1.0.0`).
     - Chuẩn bị bộ biến môi trường `v1.0.0`: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GMAIL_*`, `CLOUDINARY_*`, `GEMINI_API_KEYS`.
- **Tiêu chí hoàn thành (Gate):** `cd src/backend && npm run build && npm test` và `cd src/frontend && npm run build` xanh trên nền `v1.0.0`.

---

### Phase 1: Chuẩn hóa Ứng dụng `v1.0.0` cho Production & Quality Gates
**Mục tiêu:** Đáp ứng đầy đủ Chặng 1–3 (Build, Lint, Test) và yêu cầu Proxy / Health Check / Log tập trung / CORS production.
- **Backend (`src/backend`):**
  1. Bật `app.set('trust proxy', true)` trong `src/backend/src/app.ts` để nhận đúng IP/protocol từ Nginx HTTPS.
  2. Tạo `GET /health` (và giữ `GET /`): kiểm tra `await prisma.$queryRaw\`SELECT 1\`` và `redisClient.ping()`, trả JSON `{ status: 'ok', version: '1.0.0', db: 'up', redis: 'up', uptime }` với HTTP `200` (hoặc `503` khi DB lỗi).
  3. Cập nhật `CORS` trong `src/backend/src/app.ts` hỗ trợ `process.env.CORS_ORIGINS` (danh sách domain cách nhau bởi dấu phẩy) bên cạnh `FRONTEND_URL`.
  4. Tạo `src/backend/src/loggers/logger.ts` bằng `winston` (xuất JSON ra `stdout` khi `NODE_ENV=production`, tích hợp stream với `morgan` bỏ qua route `/health` để giảm chi phí CloudWatch Logs).
  5. Bổ sung `src/backend/eslint.config.mjs` và script `"lint": "eslint src"` trong `src/backend/package.json`.
  6. Viết unit test cho `/health` endpoint.
- **Frontend (`src/frontend`):**
  1. Cập nhật `next.config.ts` của `customer-web` và `internal-web` thêm `output: 'standalone'`.
  2. Đảm bảo `npm run lint` và `npx tsc --noEmit` chạy sạch trên cả 2 workspace (`customer-web` & `internal-web`), bổ sung minimal smoke/unit test gate nếu chưa có.
- **Tiêu chí hoàn thành (Gate):**
  - `cd src/backend && npm run lint && npx tsc --noEmit && npm run build && npm test` → Exit code `0`.
  - `cd src/frontend && npm run build` và `lint` cả 2 apps → Exit code `0`.

---

### Phase 2: Tích hợp AWS SDK v3 (`S3` & `SES`)
**Mục tiêu:** Ứng dụng sử dụng trực tiếp dịch vụ AWS qua AWS SDK v3 chính thức, có test kiểm chứng bằng mock.
- **Công việc:**
  1. Cài đặt trong `src/backend`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ses`.
  2. Tạo `src/backend/src/services/aws-s3.service.ts`:
     - Upload buffer/PDF hóa đơn hoặc ảnh lên S3 Bucket (`AWS_S3_BUCKET`).
     - Sinh Presigned URL tải xuống an toàn có thời hạn (không public bucket).
  3. Tạo `src/backend/src/services/aws-ses.service.ts` (hoặc tích hợp vào email service hiện có):
     - Hỗ trợ gửi email qua Amazon SES khi `EMAIL_PROVIDER=ses` (fallback về Nodemailer SMTP/Gmail hiện tại nếu chưa cấu hình SES production access).
  4. Cập nhật `.env.example` với các biến `AWS_REGION`, `AWS_S3_BUCKET`, `EMAIL_PROVIDER`, `SES_FROM_EMAIL`.
  5. Viết unit test bằng Vitest mock `@aws-sdk/client-s3` và `@aws-sdk/client-ses`.
- **Tiêu chí hoàn thành (Gate):** `cd src/backend && npm test` chạy toàn bộ unit tests (bao gồm S3/SES) đạt 100% pass.

---

### Phase 3: Đóng gói Docker & Cấu hình Reverse Proxy (Nginx + SSL)
**Mục tiêu:** Đóng gói gọn nhẹ 3 service (nhắm tới image ~150–250 MB) và chạy thử nghiệm full-stack đồng bộ trên local trước khi lên AWS.
- **Công việc:**
  1. Tạo `.dockerignore` tối ưu (loại bỏ `node_modules`, `.next`, `.env`, `test-results`, `.git`).
  2. Viết multi-stage `Dockerfile`:
     - `src/backend/Dockerfile` (`node:20-alpine` → build `tsc` + `prisma generate` → runtime stage chỉ copy `dist`, `prisma`, `node_modules` prod + `assets/fonts`).
     - `src/frontend/apps/customer-web/Dockerfile` (monorepo aware build với `ARG NEXT_PUBLIC_API_URL` → copy `.next/standalone`).
     - `src/frontend/apps/internal-web/Dockerfile` (tương tự `customer-web`, port `3001`).
  3. Tạo cấu hình Nginx (`deploy/nginx/conf.d/`):
     - Reverse proxy cho `api`, `customer-web`, `internal-web` (tách block Staging & Production).
     - Hỗ trợ HTTPS (Certbot Let's Encrypt), `X-Forwarded-For`/`X-Forwarded-Proto` (cho SePay & Express `trust proxy`), và `Upgrade: websocket` (cho Socket.IO khi bật).
  4. Tạo `docker-compose.yml` (local testing kèm MySQL + Redis) và `deploy/docker-compose.aws.yml` (dùng ECR images theo `${IMAGE_TAG}`, kết nối RDS MySQL bên ngoài, container Redis 7 Alpine, log driver `awslogs` / `json-file` rotate).
- **Tiêu chí hoàn thành (Gate):**
  - `docker compose build` thành công cả 3 images.
  - `docker compose up -d` → `curl http://localhost:5000/health` trả HTTP `200`, truy cập được cả `customer-web` (`3000`) và `internal-web` (`3001`).

---

### Phase 4: Xây dựng Hạ tầng AWS bằng AWS CDK (`infra/`)
**Mục tiêu:** Toàn bộ hạ tầng Gói 1 được quản lý bằng code (IaC), có thể kiểm tra bảo mật & ước tính chi phí trước khi `cdk deploy`.
- **Công việc:**
  1. Khởi tạo AWS CDK TypeScript trong `infra/` (`cdk init app --language typescript`).
  2. Thiết kế & triển khai các CDK Stacks:
     - **`NetworkStack`**: VPC `10.0.0.0/16` (Public Subnets + Private Isolated Subnets, **0 NAT Gateway**), Security Groups (EC2 SG chỉ mở `80/443`; RDS SG chỉ mở `3306` từ EC2 SG).
     - **`DataStack`**: RDS MySQL `db.t4g.micro` (20GB gp3, backup retention 7 ngày), S3 Bucket (Block Public Access, Encryption S3-managed, Lifecycle rule cho backups).
     - **`RegistryAuthStack`**: 3 ECR Repositories (`car-service/backend`, `car-service/customer-web`, `car-service/internal-web`) với Lifecycle Policy giữ tối đa 10 images; GitHub OIDC Identity Provider + IAM Role cho GitHub Actions (chỉ được push ECR & gửi SSM Run Command tới EC2 có tag dự án).
     - **`ComputeStack`**: EC2 `t3.small`/`t3.medium` (Elastic IP, IAM Instance Profile quyền SSM + ECR Pull + S3 + SES + CloudWatch Agent), UserData tự động cài Docker, Compose plugin, AWS CLI, CloudWatch Agent, Nginx & Certbot.
     - **`ObservabilityStack`**: CloudWatch Log Groups (`/car-service/staging/*`, `/car-service/prod/*`, retention 14 ngày), CloudWatch Alarms (`EC2 CPU > 80%`, `StatusCheckFailed`, `RDS CPU > 80%`, `RDS FreeStorage < 2GB`), Amazon SNS Topic + Email subscription.
  3. Chạy kiểm tra tuân thủ skill `security-scan` (`npx cdk synth` + kiểm tra IAM least-privilege / không lộ secret).
  4. Chạy `npx cdk bootstrap` và `npx cdk deploy --all` lên AWS `ap-southeast-1`.
- **Tiêu chí hoàn thành (Gate):** `npx tsc --noEmit && npx cdk synth` không lỗi; các tài nguyên AWS (EC2, RDS, ECR, S3, SNS, OIDC Role) hoạt động trên AWS Console.

---

### Phase 5: Pipeline CI/CD 6 Chặng & Auto-Rollback (`.github/workflows/`)
**Mục tiêu:** Tự động hóa hoàn toàn 6 chặng, đạt SLA commit → staging ≤ 15 phút, hỗ trợ versioning & rollback tự động.
- **Công việc:**
  1. Nâng cấp `.github/workflows/ci.yml` (chạy trên mọi PR vào `develop` / `main`) và tạo `.github/workflows/cd.yml` (chạy khi push `develop` → Staging, push `main` hoặc tag `v*.*.*` → Production, kèm `workflow_dispatch` để rollback thủ công):
     - **Chặng 1 — Build:** Compile Backend (`tsc` + `prisma generate`) & Frontend (`next build`) song song với npm/Next.js cache.
     - **Chặng 2 — Lint & Static Analysis:** `npm run lint` (backend + 2 frontends), `tsc --noEmit`, `npx prisma validate`.
     - **Chặng 3 — Automated Test:** Backend Vitest (`npm test` trên `v1.0.0`, sau này tự chạy cả `test:unit` + `test:integration` khi merge `develop`) + Frontend smoke/test gate.
     - **Chặng 4 — Security & Dependency Scan:** `npm audit --audit-level=high`, **Trivy FS Scan**, và **Gitleaks** secret scan.
     - **Chặng 5 — Docker Package & Push ECR:** Đăng nhập AWS qua **OIDC**; build 3 Docker images bằng Buildx + GHA layer cache; quét **Trivy Image Scan**; đánh tag `<env>-<sha7>` + `<env>-latest` (hoặc `v1.0.0`, `vX.Y.Z`) và push lên ECR.
     - **Chặng 6 — Auto Deploy & Health Gate:** Gọi **AWS SSM `send-command`** thực thi `deploy/scripts/deploy.sh` trên EC2:
       1. Tải secrets từ **SSM Parameter Store** (`/car-service/<env>/*`) ra file env runtime.
       2. Ghi nhận tag cũ vào `/opt/car-service/<env>/.previous_tag`.
       3. `docker compose pull` → chạy `npx prisma migrate deploy` (qua one-off container) → `docker compose up -d --remove-orphans`.
       4. Vòng lặp kiểm tra `curl -f http://localhost:<port>/health` (trong 60s) và HTTP 200 cho 2 frontend apps.
       5. **Auto-Rollback:** Nếu health check thất bại → tự động kéo lại `.previous_tag`, chạy `docker compose up -d`, đánh dấu job fail và bắn thông báo lỗi qua SNS.
  2. Tạo `.github/workflows/rollback.yml` (`workflow_dispatch` nhập `environment` và `image_tag`) để rollback chủ động về bất kỳ phiên bản nào trên ECR trong < 2 phút.
- **Tiêu chí hoàn thành (Gate):** Chạy thử nghiệm pipeline 6 chặng thành công trên `feat/deploy-aws` → Staging với thời gian **≤ 15 phút**.

---

### Phase 6: Cutover Release `v1.0.0`, Diễn tập & Vận hành KPI Trong Kỳ
**Mục tiêu:** Đưa bản **Release `v1.0.0`** lên Production/Staging ổn định đầu tiên, sau đó mở luồng auto-deploy cho các đợt cập nhật tiếp theo để đạt 100% KPI.
- **Công việc:**
  1. Nạp bộ biến secret của `v1.0.0` vào SSM Parameter Store (`/car-service/staging/*`, `/car-service/prod/*`).
  2. Trỏ DNS Cloudflare về Elastic IP của EC2, chạy Certbot cấp SSL HTTPS cho các subdomain.
  3. **Cutover Đợt 1 (Release `v1.0.0`):** Merge `feat/deploy-aws` vào `main` và gắn tag `v1.0.0` → Pipeline 6 chặng tự động deploy phiên bản **v1.0.0** lên Production (và đồng bộ cấu hình CI/CD về `develop` để không mất pipeline ở các PR sau).
  4. **Diễn tập Rollback:** Deploy thử bản test (hoặc dùng `rollback.yml`) quay lại tag trước đó và kiểm tra log khôi phục thành công.
  5. **Diễn tập Giám sát & Cảnh báo:** Kiểm tra log từ Winston + Nginx hiển thị trên CloudWatch Logs; kích hoạt thử 1 CloudWatch Alarm (`aws cloudwatch set-alarm-state`) để xác nhận nhận thông báo từ SNS.
  6. **Vận hành các đợt tiếp theo trong kỳ (`v1.0.1`, `v1.1.0`... từ `develop` → `main`):** Khi các tính năng mới (như SePay, Staff Portal...) được cập nhật dần, duy trì **≥ 10 lần triển khai tự động** trải đều theo tiến độ, đảm bảo **tỉ lệ build xanh ≥ 90%** và thời gian commit → staging **≤ 15 phút**.
- **Tiêu chí hoàn thành (Definition of Done):** Release `v1.0.0` chạy live HTTPS ổn định + đầy đủ bằng chứng rollback, CloudWatch Alert SNS, ≥ 10 deploys và ≥ 90% build xanh.

---

## Phần C: Bảng Tổng Hợp Checkpoint Kiểm Chứng Theo Phase

| Phase | Đầu ra chính (Artifacts / Code) | Lệnh / Bằng chứng kiểm chứng |
| :---: | :--- | :--- |
| **Phase 0** | Baseline `v1.0.0` trên `feat/deploy-aws` (từ `main` `8eefc3e`, **không merge `develop`**) | `npm run build && npm test` (Exit 0) |
| **Phase 1** | `trust proxy`, `/health`, CORS multi-origin, Winston JSON, `eslint`, `next standalone` | `npm run lint && npx tsc --noEmit && npm test` (Backend + FE) |
| **Phase 2** | `aws-s3.service.ts`, `aws-ses.service.ts` + unit tests | `npm test` (Vitest mock AWS SDK pass) |
| **Phase 3** | 3x `Dockerfile`, `nginx.conf`, `docker-compose*.yml` | `docker compose build && curl localhost:5000/health` (200 OK) |
| **Phase 4** | `infra/` (AWS CDK TypeScript Stacks) | `npx cdk synth` + `cdk deploy` thành công trên `ap-southeast-1` |
| **Phase 5** | `.github/workflows/ci.yml`, `cd.yml`, `rollback.yml`, `deploy.sh` | Pipeline 6 chặng xanh trên GitHub Actions, tổng thời gian ≤ 15 phút |
| **Phase 6** | Release `v1.0.0` live HTTPS + CloudWatch Alarms + Rollback drill + ≥ 10 deploys | Tag `v1.0.0` live, Email SNS Alarm, log rollback, ≥ 10 deploys & ≥ 90% green |
