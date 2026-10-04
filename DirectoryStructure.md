# Cấu trúc Thư mục Dự án - Car Service Center Web

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc thư mục của toàn bộ dự án. Mục tiêu là giúp các Lập trình viên và AI Agent (Antigravity/Claude/Cursor) có thể nhanh chóng định vị mã nguồn, tài liệu và quy chuẩn.

---

## 📂 Kiến trúc Tổng thể (Root Level)

```text
CAR SERVICE CENTER/
├── .agents/                # [AI Config] Cấu hình, roles, rules và skills cho AI Agents (Không push code runtime vào đây).
├── docs/                   # [Documentation] Toàn bộ tài liệu nghiệp vụ, database và kiến trúc.
├── src/                    # [Source Code] Chứa mã nguồn thực thi chính của dự án.
├── .gitignore              # Danh sách các file/folder không đưa lên Git.
├── README.md               # File giới thiệu tổng quan về dự án.
└── Tech.md                 # Tài liệu chốt Tech Stack của dự án.
```

---

## 📂 1. Tài liệu dự án (`docs/`)

Chứa các tài liệu thiết kế, yêu cầu nghiệp vụ và cơ sở dữ liệu.

```text
docs/
├── database/
│   └── design/
│       ├── DatabaseDesignPlan.md    # Các quyết định thiết kế CSDL và quy định schema.
│       ├── DataDictionary.md        # Từ điển dữ liệu chi tiết cho từng cột/bảng.
│       ├── schema.sql               # File export SQL thuần.
│       └── schema.prisma            # File Prisma Schema gốc (để backup/tham chiếu).
├── diagrams/
│   └── sequence/                    # Sơ đồ tuần tự (Sequence diagrams) cho các vai trò (admin, staff, customer...)
├── phases/                          # Kế hoạch phát triển theo từng giai đoạn
├── plan/                            # Kế hoạch chi tiết (plan.md)
├── requirements/
│   ├── Requirement.md               # Tài liệu đặc tả yêu cầu, FR/NFR, quy tắc nghiệp vụ.
│   ├── UseCase.md                   # Mô tả các luồng Use Case chi tiết.
│   └── ObjectStatus.md              # Tài liệu định nghĩa chi tiết vòng đời và trạng thái các đối tượng.
├── UI/                              # Tài liệu & thiết kế UI cho các portal (auth, admin, manager, staff, qc, cus)
│   ├── DESIGN_SYSTEM.md             # Hệ thống thiết kế chuẩn
│   └── UI_DESIGN_PLAN.md            # Kế hoạch thiết kế giao diện
└── DirectoryStructure.md            # (Là file này) Cấu trúc thư mục.
```

---

## 📂 2. Backend API (`src/backend/`)

Xây dựng theo mô hình MVC kết hợp Repository Pattern trên nền **Express.js (TypeScript)** và **Prisma ORM**.

```text
src/backend/
├── prisma/
│   └── schema.prisma                # Định nghĩa các model Database cho Prisma.
├── src/
│   ├── controllers/                 # [Controller] Nhận HTTP Request, gọi Service và trả về Response.
│   ├── middlewares/                 # Các hàm can thiệp Request (Auth, ErrorHandler).
│   ├── routes/                      # [Router] Định tuyến URL tới các Controllers.
│   ├── services/                    # [Service] Chứa Business Logic cốt lõi (tính toán, xử lý nghiệp vụ).
│   ├── utils/                       # Các hàm Helper dùng chung (jwt, prisma instance...).
│   ├── validations/                 # Validation Schema (Joi/Zod) để validate input.
│   ├── app.ts                       # Khởi tạo Express, nạp middlewares và routes (Không listen port).
│   └── server.ts                    # Entry point: Nạp env, khởi chạy HTTP Server (Listen port).
├── .env                             # Biến môi trường (chứa DATABASE_URL, SECRET_KEY...).
├── .env.example                     # File mẫu biến môi trường.
├── package.json                     # Quản lý dependencies (express, prisma, typescript...).
└── tsconfig.json                    # Cấu hình biên dịch TypeScript.
```

---

## 📂 3. Frontend Web (`src/frontend/` - Monorepo)

Xây dựng theo chuẩn **Next.js (App Router)** với **Tailwind CSS** và **Redux Toolkit**. 
Sử dụng cấu trúc **Monorepo (npm workspaces)** để tách biệt Web cho Khách hàng và Web Nội bộ, nhưng vẫn tái sử dụng được UI Components.

```text
src/frontend/
├── apps/
│   ├── customer-web/                # [Port 3000] Web dành cho Khách hàng & Guest.
│   │   ├── src/app/(auth)/          # Đăng nhập, đăng ký cho khách.
│   │   ├── src/app/(customer)/      # Lịch sử dịch vụ, tiến độ sửa chữa, lịch hẹn.
│   │   ├── src/app/(public)/        # Trang chủ, thông tin công khai.
│   │   └── package.json             # App-specific dependencies.
│   └── internal-web/                # [Port 3001] Web dành cho Nhân viên, QC, Quản lý, Admin.
│       ├── src/app/(auth)/          # Đăng nhập nhân viên.
│       ├── src/app/(dashboard)/     # Quản lý dịch vụ, kho, duyệt báo giá.
│       └── package.json             # App-specific dependencies.
├── packages/                        # Chứa các thư viện/components dùng chung.
│   ├── shared/ui/                   # UI components (Button, Modal, Table...).
│   └── shared/lib/                  # Tiện ích chung, Axios client, cấu hình Redux.
├── package.json                     # Root workspace cấu hình npm workspaces.
└── package-lock.json                # Lockfile duy nhất cho toàn bộ Monorepo.
```

---

## 📌 Hướng dẫn dành cho AI Agents
1. **Tra cứu Quy tắc (Rules):** Luôn kiểm tra `.agents/rules/` để hiểu quy ước thiết kế, format API (API_CONVENTION.md) và các nguyên tắc code.
2. **Nghiệp vụ cốt lõi:** Khi làm tính năng mới, bắt buộc đọc `docs/requirements/UseCase.md` để hiểu Flow trước khi tạo API hay Component.
3. **Database:** Cấu trúc DB source-of-truth nằm tại `src/backend/prisma/schema.prisma`. 
4. **Vị trí viết code:** 
   - Tuyệt đối không mix logic Database vào Controller (Backend). Phải thông qua Service/Repository.
   - Các components tái sử dụng (Frontend) phải đặt trong `src/components/`, không đặt trong thư mục của page.
