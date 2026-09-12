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
├── requirements/
│   ├── Requirement.md               # Tài liệu đặc tả yêu cầu, FR/NFR, quy tắc nghiệp vụ.
│   ├── UseCasev2.md                 # Mô tả các luồng Use Case chi tiết (phiên bản 2.0).
│   └── ObjectStatus.md              # Tài liệu định nghĩa chi tiết vòng đời và trạng thái các đối tượng.
└── DirectoryStructure.md            # (Là file này) Cấu trúc thư mục.
```

---

## 📂 2. Backend API (`src/backend/`)

Xây dựng theo mô hình MVC kết hợp Repository Pattern trên nền **Express.js (TypeScript)** và **Prisma ORM**.

```text
src/backend/
├── prisma/
│   ├── migrations/                  # Lịch sử các bản cập nhật schema DB.
│   └── schema.prisma                # Định nghĩa các model Database cho Prisma.
├── src/
│   ├── config/                      # Cấu hình biến môi trường, Redis, Cloudinary, DB connection.
│   ├── constants/                   # Các hằng số (Enums, HTTP Status Codes, Messages).
│   ├── controllers/                 # [Controller] Nhận HTTP Request, gọi Service và trả về Response.
│   ├── dtos/                        # Data Transfer Objects (Định dạng dữ liệu giao tiếp).
│   ├── errors/                      # Các class Custom Error (VD: NotFoundError, ValidationError).
│   ├── loggers/                     # Cấu hình ghi log hệ thống (Winston/Pino).
│   ├── middlewares/                 # Các hàm can thiệp Request (AuthGuard, RateLimiter, ErrorHandler).
│   ├── models/                      # Định nghĩa Models logic (nếu không dùng thuần Prisma).
│   ├── repositories/                # [Repository] Chứa các truy vấn tương tác trực tiếp với Database.
│   ├── routes/                      # [Router] Định tuyến URL tới các Controllers.
│   ├── services/                    # [Service] Chứa Business Logic cốt lõi (tính toán, xử lý nghiệp vụ).
│   ├── utils/                       # Các hàm Helper dùng chung (format date, hash password...).
│   ├── validations/                 # Validation Schema (Joi/Zod) để validate input.
│   ├── app.ts                       # Khởi tạo Express, nạp middlewares và routes (Không listen port).
│   └── server.ts                    # Entry point: Nạp env, khởi chạy HTTP Server (Listen port).
├── .env                             # Biến môi trường (chứa DATABASE_URL, SECRET_KEY...).
├── package.json                     # Quản lý dependencies (express, prisma, typescript...).
└── tsconfig.json                    # Cấu hình biên dịch TypeScript.
```

---

## 📂 3. Frontend Web (`src/frontend/`)

Xây dựng theo chuẩn **Next.js (App Router)** với **Tailwind CSS** và **Redux Toolkit**.

```text
src/frontend/
├── src/
│   ├── app/                         # [Next.js App Router] Chứa các Pages và Layouts.
│   │   ├── (auth)/                  # Route group cho các trang đăng nhập/đăng ký.
│   │   ├── (dashboard)/             # Route group cho khu vực quản trị/nhân viên.
│   │   ├── layout.tsx               # Root layout.
│   │   └── page.tsx                 # Trang chủ (Landing page).
│   ├── components/                  # [UI] Chứa các React Components dùng chung (Button, Modal, Table...).
│   ├── hooks/                       # Các Custom React Hooks (useAuth, useFetch...).
│   ├── lib/                         # Chứa các config thư viện (Axios client, Konva helpers...).
│   ├── store/                       # [Redux] Quản lý global state.
│   │   ├── slices/                  # Các Redux Toolkit slices (authSlice, cartSlice...).
│   │   └── store.ts                 # File cấu hình Redux Store chính.
│   ├── types/                       # Định nghĩa các TypeScript Interfaces/Types cho Frontend.
│   └── utils/                       # Hàm helper tiện ích cho Frontend.
├── public/                          # Chứa các file tĩnh (Hình ảnh, Icons, Fonts).
├── next.config.ts                   # Cấu hình Next.js.
├── tailwind.config.ts               # Cấu hình Tailwind CSS (Màu sắc, Font, Spacing).
├── package.json                     # Quản lý dependencies Frontend.
└── tsconfig.json                    # Cấu hình biên dịch TypeScript cho Frontend.
```

---

## 📌 Hướng dẫn dành cho AI Agents
1. **Tra cứu Quy tắc (Rules):** Luôn kiểm tra `.agents/rules/` để hiểu quy ước thiết kế, format API (API_CONVENTION.md) và các nguyên tắc code.
2. **Nghiệp vụ cốt lõi:** Khi làm tính năng mới, bắt buộc đọc `docs/requirements/UseCase.md` để hiểu Flow trước khi tạo API hay Component.
3. **Database:** Cấu trúc DB source-of-truth nằm tại `src/backend/prisma/schema.prisma`. 
4. **Vị trí viết code:** 
   - Tuyệt đối không mix logic Database vào Controller (Backend). Phải thông qua Service/Repository.
   - Các components tái sử dụng (Frontend) phải đặt trong `src/components/`, không đặt trong thư mục của page.
