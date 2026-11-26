# Cấu trúc Thư mục Dự án - Car Service Center Web

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc thư mục của toàn bộ dự án. Mục tiêu là giúp các Lập trình viên và AI Agent (Antigravity/Claude/Cursor) có thể nhanh chóng định vị mã nguồn, tài liệu và quy chuẩn.

---

## 📂 Kiến trúc Tổng thể (Root Level)

```text
CAR SERVICE CENTER/
├── .agents/                # [AI Config] Cấu hình, roles, rules, scripts và skills cho AI Agents.
├── .github/workflows/      # [CI/CD] GitHub Actions pipelines (ci.yml, cd.yml, rollback.yml).
├── deploy/                 # [Runtime Deploy] Docker Compose AWS, Nginx SSL & scripts vận hành EC2.
├── diagrams/database/      # [Database Diagrams] Sơ đồ ERD & UML chuẩn đồng bộ với Prisma Schema.
├── docs/                   # [Documentation] Tài liệu nghiệp vụ, chatbot, CI/CD, database design & testing.
├── infra/                  # [IaC] AWS CDK v2 (6 stacks hạ tầng & unit tests).
├── scripts/                # [Automation] Master test runner (test_runner.py).
├── src/                    # [Source Code] Chứa mã nguồn thực thi chính của dự án.
├── .gitignore              # Danh sách các file/folder không đưa lên Git.
├── docker-compose.yml      # Khởi chạy full stack local (MySQL, Redis, Backend, Frontend).
├── DESIGN.md               # Hệ thống thiết kế chuẩn AutoCare Pro.
├── DirectoryStructure.md   # (Là file này) Cấu trúc thư mục dự án.
├── README.md               # Giới thiệu tổng quan, tech stack, API và hướng dẫn dự án.
└── SETUP_GUIDE.md          # Hướng dẫn cài đặt chi tiết, SePay Webhook & tài khoản demo.
```

---

## 📂 1. Tài liệu & Sơ đồ (`docs/` & `diagrams/`)

Chứa các tài liệu thiết kế, yêu cầu nghiệp vụ và cơ sở dữ liệu.

```text
diagrams/
└── database/                        # Sơ đồ ERD & UML phân hệ DB (01..04_*_ERD.md, Erd.md, UML/)

docs/
├── chatbot/                         # PRD, kiến trúc & QA cho Trợ lý AI tư vấn
├── cicd/                            # Kiến trúc AWS, chi phí, pipeline specs & handover
│   └── diagrams/                    # Sơ đồ kiến trúc AWS & CI/CD (.drawio)
├── database/
│   ├── DATA/                        # Dữ liệu CSV master (xe, phụ tùng, chẩn đoán)
│   └── design/
│       ├── DatabaseDesignPlan.md    # Các quyết định thiết kế CSDL và quy định schema.
│       ├── DataDictionary.md        # Từ điển dữ liệu chi tiết cho từng cột/bảng (SSOT).
│       └── schema.sql               # Snapshot SQL khởi tạo tham chiếu.
├── requirements/                    # Đặc tả yêu cầu (Requirement v2/v3, UseCase V2, references/)
└── testing/                         # Kế hoạch test, checklist, kịch bản manual & automated
```

---

## 📂 2. Backend API (`src/backend/`)

Xây dựng theo mô hình phân tầng `Routes -> Middlewares -> Controllers -> Services -> Repositories / Prisma` trên nền **Express.js (TypeScript)** và **Prisma ORM**.

```text
src/backend/
├── prisma/
│   ├── migrations/                  # Lịch sử Prisma migrations (nguồn chuẩn schema DB).
│   ├── schema.prisma                # Định nghĩa các model Database cho Prisma (Single Source of Truth).
│   ├── seed.ts                      # Script nạp dữ liệu khởi tạo chuẩn.
│   └── seed-massive.ts              # Script nạp dữ liệu khối lượng lớn cho kiểm thử.
├── src/
│   ├── config/                      # Cấu hình dịch vụ ngoài (Cloudinary...).
│   ├── constants/                   # Hằng số domain & Redis cache keys dùng chung.
│   ├── controllers/                 # [Controller] Nhận HTTP Request, validate, gọi Service và trả Response.
│   ├── dtos/                        # Validation Schema (Joi) và DTO interfaces.
│   ├── jobs/                        # Cron background jobs (nhắc lịch hẹn...).
│   ├── loggers/                     # Cấu hình Winston logger.
│   ├── middlewares/                 # Request interceptors (Auth, Idempotency, Rate Limit, Upload).
│   ├── repositories/                # [Repository] Truy vấn phức tạp / aggregate transactions.
│   ├── routes/                      # [Router] Định tuyến URL và gắn RBAC guards tới Controllers.
│   ├── services/                    # [Service] Chứa Business Logic cốt lõi, AI RAG/Chat & tích hợp AWS/SePay.
│   ├── socket/                      # Socket.IO server & real-time notification rooms.
│   ├── utils/                       # Các hàm Helper thuần (prisma, redis, jwt, otp, pdf, sepay, cors...).
│   ├── app.ts                       # Khởi tạo Express, nạp middlewares và routes (Không listen port).
│   └── server.ts                    # Entry point: Nạp env, kết nối Redis, khởi chạy HTTP + Socket Server.
├── tests/                           # Unit tests & Integration tests (Vitest + Supertest).
├── .env.example                     # File mẫu biến môi trường.
├── Dockerfile                       # Multi-stage Docker build cho Backend.
├── package.json                     # Quản lý dependencies (express, prisma, typescript...).
└── tsconfig.json                    # Cấu hình biên dịch TypeScript.
```

---

## 📂 3. Frontend Web (`src/frontend/` - Monorepo)

Xây dựng theo chuẩn **Next.js 16 (App Router)** với **Tailwind CSS v4** và **Redux Toolkit**.  
Sử dụng cấu trúc **Monorepo (npm workspaces)** để tách biệt Web cho Khách hàng và Web Nội bộ, tái sử dụng UI & HTTP Client dùng chung qua `packages/shared/`.

```text
src/frontend/
├── apps/
│   ├── customer-web/                # [Port 3000] Web dành cho Khách hàng & Guest.
│   │   ├── src/app/(auth)/          # Đăng nhập, đăng ký, OTP, quên mật khẩu cho khách.
│   │   ├── src/app/(customer)/      # Hồ sơ, lịch hẹn, tiến độ sửa chữa, hóa đơn, bảo hành.
│   │   ├── src/app/(public)/        # Trang chủ & bảng giá dịch vụ công khai.
│   │   ├── tests/unit/              # Unit tests logic phía client.
│   │   └── package.json             # App-specific dependencies.
│   └── internal-web/                # [Port 3001] Web dành cho Nhân viên, Cố vấn, Quản lý, Admin.
│       ├── src/app/(admin)/         # Quản trị tài khoản, nhân sự, dịch vụ, danh mục.
│       ├── src/app/(advisor)/       # Hàng đợi tiếp nhận, quản lý Phiếu công việc (WO), KPI.
│       ├── src/app/(auth)/          # Đăng nhập & khôi phục mật khẩu nội bộ.
│       ├── src/app/(dashboard)/     # Lịch hẹn, tiếp nhận xe, khách hàng, thu ngân/hóa đơn.
│       ├── src/app/(manager)/       # Giám sát xưởng, tồn kho, danh mục phụ tùng, báo cáo.
│       ├── tests/unit/              # Unit tests logic cổng nội bộ.
│       └── package.json             # App-specific dependencies.
├── packages/shared/                 # Thư viện dùng chung giữa 2 apps.
│   ├── ui/                          # @car-service-center/ui (Icon, useDialogA11y, WebVitalsReporter).
│   └── lib/                         # @car-service-center/lib (createApiClient factory chuẩn hóa Axios/401 refresh).
├── e2e/                             # Kiểm thử E2E toàn trình bằng Playwright.
├── package.json                     # Root workspace cấu hình npm workspaces.
└── package-lock.json                # Lockfile duy nhất cho toàn bộ Monorepo.
```

---

## 📌 Hướng dẫn dành cho AI Agents
1. **Tra cứu Quy tắc (Rules):** Luôn kiểm tra `.agents/rules/` để hiểu quy ước thiết kế, format API (`API_CONVENTION.md`) và các nguyên tắc code.
2. **Nghiệp vụ cốt lõi:** Khi làm tính năng mới, bắt buộc đọc `docs/requirements/UseCase V2.md` để hiểu Flow trước khi tạo API hay Component.
3. **Database:** Cấu trúc DB source-of-truth nằm tại `src/backend/prisma/schema.prisma`.
4. **Vị trí viết code:**
   - Tuyệt đối không mix logic Database vào Controller (Backend). Phải thông qua Service/Repository.
   - Các components dùng riêng cho một route giữ cục bộ trong thư mục route đó; các components tái sử dụng đặt trong `src/components/` hoặc `packages/shared/ui/`.
