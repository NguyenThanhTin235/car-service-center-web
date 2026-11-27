# Car Service Center

Nền tảng quản lý vận hành và cung cấp dịch vụ trực tuyến toàn diện cho **Trung tâm Bảo dưỡng & Sửa chữa Ô tô**. Dự án giải quyết bài toán số hóa quy trình vận hành garage từ tiếp nhận xe, khám xe, lập kế hoạch, báo giá, thi công, nghiệm thu chất lượng, thanh toán đến bàn giao và bảo hành hậu mãi — giúp đồng bộ dữ liệu tập trung trên một **Phiếu công việc** duy nhất và minh bạch thông tin với khách hàng theo thời gian thực.

**Đối tượng sử dụng:** Khách vãng lai & Khách hàng, Nhân viên quầy dịch vụ (Lễ tân / Thu ngân), Cố vấn dịch vụ, Kỹ thuật viên & Kiểm định chất lượng, Quản lý dịch vụ và Quản trị viên hệ thống.

### Link Product (Production)

| Thành phần | Đường dẫn |
| :--- | :--- |
| **Customer Web (Khách hàng)** | [https://carservice.id.vn](https://carservice.id.vn) |
| **Internal Web (Nội bộ)** | [https://ops.carservice.id.vn](https://ops.carservice.id.vn) |
| **Backend API** | [https://api.carservice.id.vn](https://api.carservice.id.vn) (`GET /health`) |

---

## Mục lục

- [Tính năng đã triển khai](#tính-năng-đã-triển-khai)
- [Kiến trúc hệ thống & Cơ sở dữ liệu](#kiến-trúc-hệ-thống--cơ-sở-dữ-liệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Hướng dẫn Cài đặt & Khởi chạy](#hướng-dẫn-cài-đặt--khởi-chạy)
- [Kiểm thử & Kiểm tra chất lượng](#kiểm-thử--kiểm-tra-chất-lượng)
- [Tài liệu API](#tài-liệu-api)
- [Nhóm tác giả](#nhóm-tác-giả)

---

## Tính năng đã triển khai

Hệ thống được xây dựng xoay quanh **Phiếu công việc** làm hồ sơ trung tâm, quản lý khép kín toàn bộ vòng đời một lượt xe vào xưởng từ tiếp nhận, khám xe, lập kế hoạch, báo giá, thi công, nghiệm thu chất lượng, thanh toán, bàn giao đến bảo hành hậu mãi:

### 1. Khách vãng lai & Khách hàng
- **Tra cứu thông tin công khai**: Xem trang giới thiệu, danh mục dịch vụ và bảng giá tham khảo mà không cần đăng nhập.
- **Tài khoản & Hồ sơ cá nhân**: Đăng ký tài khoản, đăng nhập, khôi phục mật khẩu qua mã xác thực email và cập nhật thông tin liên hệ.
- **Quản lý phương tiện**: Thêm mới, xem chi tiết, chỉnh sửa và quản lý danh sách xe thuộc quyền sở hữu.
- **Đặt lịch hẹn trực tuyến**: Tạo lịch hẹn dịch vụ mới, dời lịch hoặc hủy lịch hẹn trước khi xe đến xưởng.
- **Xác nhận tiếp nhận xe**: Xem biên bản tiếp nhận (số km, mức nhiên liệu, tình trạng xe, đồ đạc để lại, hình ảnh hiện trạng) và xác nhận bàn giao xe cho xưởng.
- **Theo dõi tiến độ sửa chữa**: Theo dõi trực tiếp tiến độ thực hiện theo từng hạng mục dịch vụ kèm hình ảnh thi công thực tế.
- **Phê duyệt báo giá**: Xem chi tiết các hạng mục trong báo giá (báo giá ban đầu và báo giá bổ sung), thực hiện phê duyệt hoặc từ chối trực tuyến.
- **Hóa đơn & Thanh toán**: Xem hóa đơn điện tử, thanh toán trực tuyến qua mã quét chuyển khoản ngân hàng và tải về chứng từ (biên bản bàn giao, hóa đơn).
- **Lịch sử & Bảo hành**: Tra cứu lịch sử dịch vụ, xem sổ bảo dưỡng điện tử, kiểm tra thời hạn bảo hành (theo thời gian và số km) và đặt lịch hẹn bảo hành trực tuyến.
- **Thông báo tức thời**: Nhận thông báo cập nhật kịp thời theo từng bước xử lý xe.
- **Trợ lý AI tư vấn**: Hỗ trợ khách vãng lai chẩn đoán sơ bộ triệu chứng xe, tra cứu dịch vụ, bảng giá tham khảo, chính sách bảo hành và mở nhanh biểu mẫu đặt lịch hẹn; đồng thời cá nhân hóa theo ngữ cảnh khách hàng đã đăng nhập để nhắc và giải thích chi tiết báo giá đang chờ phê duyệt, tra cứu tiến độ sửa chữa và hướng dẫn thanh toán hóa đơn ngay trong khung hội thoại.

### 2. Nhân viên quầy dịch vụ (Lễ tân & Thu ngân)
- **Quản lý lịch hẹn**: Tạo lịch hẹn thay cho khách gọi điện, xác nhận lịch, dời lịch hoặc hủy lịch có ghi nhận lý do.
- **Tiếp nhận xe vào xưởng**: Đánh dấu khách đã đến theo lịch hẹn hoặc tiếp nhận trực tiếp khách vãng lai, xe cứu hộ và xe bảo hành vào hàng đợi tiếp nhận.
- **Quản lý hồ sơ khách hàng & xe**: Tra cứu, tạo mới và cập nhật thông tin khách hàng, phương tiện tại quầy.
- **Lập hóa đơn & Thu ngân**: Kiểm tra các hạng mục đã phê duyệt, lập và phát hành hóa đơn thương mại (theo chính sách không thuế) hoặc hóa đơn bảo hành 0 đồng; ghi nhận thanh toán (tiền mặt, thẻ, chuyển khoản mã quét ngân hàng) và tự động xác nhận hoàn tất tài chính khi thu đủ.

### 3. Cố vấn dịch vụ
- **Khởi tạo & Điều phối phiếu công việc**: Tiếp nhận xe từ hàng đợi và quản lý toàn bộ vòng đời phiếu công việc từ lúc lập kế hoạch đến khi bàn giao xe xuất xưởng.
- **Ghi nhận hiện trạng & Khám xe trực quan**: Lập biên bản tiếp nhận (số km, mức nhiên liệu, phản ánh của khách, hình ảnh xung quanh xe); đánh dấu vị trí hư hỏng phát hiện trực tiếp trên sơ đồ xe hai chiều kèm ảnh chụp chi tiết.
- **Lập kế hoạch công việc & Phụ tùng**: Liên kết hư hỏng phát hiện sang các đầu công việc cụ thể, phân công nhân công và dự trù phụ tùng/vật tư; tích hợp trợ lý AI đề xuất công việc (ước lượng giờ công, gợi ý kỹ thuật viên theo chuyên môn) và đề xuất phụ tùng/vật tư (số lượng dự kiến, kiểm tra tồn kho thực tế, khuyến nghị kỹ thuật).
- **Quản lý vòng đời báo giá**: Tự động tính giá theo ba mô hình (gói cố định, theo kích cỡ xe, theo giờ công và phụ tùng), áp dụng chiết khấu, cố định đơn giá tại thời điểm báo giá và tự động giữ chỗ phụ tùng trong kho khi báo giá được duyệt.
- **Điều phối thi công & Kiểm định chất lượng**: Theo dõi quá trình thực hiện công việc, kiểm định nghiệm thu theo bộ tiêu chí chất lượng (tự động tạo công việc làm lại nếu chưa đạt), gửi yêu cầu thanh toán và ký biên bản bàn giao xe xuất xưởng.
- **Xử lý phiếu công việc bảo hành**: Thẩm định xe bảo hành, liên kết phiếu dịch vụ gốc và áp dụng đơn giá 0 đồng cho các hạng mục thuộc phạm vi bảo hành.

### 4. Quản lý dịch vụ
- **Giám sát vận hành xưởng**: Theo dõi tổng thể hoạt động xưởng, trạng thái các phiếu công việc và cảnh báo ách tắc trên bảng điều khiển.
- **Quản lý kho & Nhà cung cấp**: Quản lý danh mục phụ tùng, mã phụ tùng thực tế, nhà cung cấp; nhập kho trực tiếp, tự động tính giá vốn bình quân gia quyền di động, xuất kho theo công việc, nhập trả phụ tùng thừa, theo dõi thẻ kho và phê duyệt phiếu điều chỉnh tồn kho.
- **Đóng hồ sơ & Phê duyệt bảo hành thiện chí**: Kiểm tra điều kiện hoàn tất để đóng vĩnh viễn phiếu công việc và đồng bộ sổ bảo dưỡng; xem xét phê duyệt hoặc từ chối các trường hợp bảo hành thiện chí ngoài phạm vi cam kết.
- **Báo cáo quản trị**: Xem và xuất báo cáo doanh thu, hiệu suất vận hành và báo cáo phân tích chi phí vốn bảo hành nội bộ.

### 5. Quản trị viên
- **Quản lý người dùng & Nhân sự**: Tạo tài khoản, phân quyền theo vai trò, khóa/mở khóa tài khoản và quản lý hồ sơ nhân sự kỹ thuật kèm kỹ năng chuyên môn.
- **Cấu hình danh mục nghiệp vụ**: Quản lý danh mục dịch vụ, gói dịch vụ chuẩn, bảng giá theo kích cỡ xe, loại công việc, đơn giá giờ công, bộ tiêu chí kiểm tra/nghiệm thu chất lượng và các danh mục dùng chung của hệ thống.

### 6. Tự động hóa hệ thống
- **Nhắc lịch hẹn tự động**: Định kỳ quét các lịch hẹn sắp diễn ra và tự động gửi email nhắc hẹn cho khách hàng trước 24 giờ.
- **Đồng bộ thông báo tức thời**: Tự động cập nhật trạng thái và gửi thông báo kịp thời giữa các bộ phận nội bộ và khách hàng trong suốt quy trình.

---

## Kiến trúc hệ thống & Cơ sở dữ liệu

### Kiến trúc tổng quan (System Architecture)

```mermaid
flowchart TD
    subgraph Client["Người dùng & Trình duyệt"]
        CW["Customer Web (Next.js :3000)"]
        IW["Internal Web (Next.js :3001)"]
    end

    Nginx["Nginx Reverse Proxy / SSL"]
    API["Backend API & Socket.IO (Express :5000)"]

    subgraph Data["Lưu trữ & Bộ nhớ đệm"]
        MySQL[("MySQL 8.0 (Prisma ORM)")]
        Redis[("Redis Cache (In-Memory Fallback)")]
    end

    subgraph External["Dịch vụ bên thứ ba"]
        Gemini["Google Gemini AI"]
        SePay["SePay VietQR & Webhook IPN"]
        Storage["Cloudinary / AWS S3"]
        Mail["SMTP Gmail / AWS SES"]
    end

    CW --> Nginx
    IW --> Nginx
    Nginx --> API
    API --> MySQL
    API --> Redis
    API --> Gemini
    API --> SePay
    API --> Storage
    API --> Mail
```

### Sơ đồ thực thể cốt lõi (Core ERD)

Hệ thống lấy `WORK_ORDER` làm hồ sơ trung tâm kết nối xuyên suốt các phân hệ nghiệp vụ:

```mermaid
erDiagram
    USER ||--o{ VEHICLE : "so huu"
    USER ||--o{ APPOINTMENT : "dat lich"
    VEHICLE ||--o{ APPOINTMENT : "dung cho"
    APPOINTMENT ||--o| INTAKE_RECORD : "tiep nhan"
    INTAKE_RECORD ||--o| WORK_ORDER : "khoi tao"
    USER ||--o{ WORK_ORDER : "khach hang / co van"
    VEHICLE ||--o{ WORK_ORDER : "sua chua"
    WORK_ORDER ||--o| CHECK_IN : "bien ban"
    WORK_ORDER ||--o{ INSPECTION : "kham xe"
    INSPECTION ||--o{ FINDING : "phat hien"
    WORK_ORDER ||--o{ JOB : "cong viec"
    FINDING }o--o{ JOB : "lien ket"
    JOB ||--o{ INVENTORY_ITEM : "xuat phu tung"
    WORK_ORDER ||--o{ QUOTATION : "bao gia"
    WORK_ORDER ||--o{ QC_RECORD : "kiem dinh QC"
    WORK_ORDER ||--o{ INVOICE : "hoa don"
    INVOICE ||--o{ PAYMENT : "thanh toan"
    WORK_ORDER ||--o| VEHICLE_RELEASE : "ban giao"
```

---

## Công nghệ sử dụng

| Tầng hệ thống | Công nghệ chính |
| :--- | :--- |
| **Frontend (`src/frontend`)** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Redux Toolkit, Axios, Socket.IO Client, SheetJS (`xlsx`), React Hot Toast, Playwright |
| **Backend (`src/backend`)** | Node.js 20+, Express 5, TypeScript 5.9, Prisma ORM 5, Joi, JWT & bcrypt, Socket.IO 4.8, PDFKit, Winston, Helmet, `node-cron`, Vitest & Supertest |
| **Database & Cache** | MySQL 8.0, Redis (`ioredis` — hỗ trợ fallback in-memory cache) |
| **Dịch vụ bên thứ ba** | Google Gemini (`@google/genai`), SePay (`sepay-pg-node` / VietQR IPN), Cloudinary / AWS S3, SMTP Gmail / AWS SES |
| **DevOps & Cloud** | Docker & Docker Compose, Nginx, AWS CDK v2 (6 stacks), GitHub Actions (CI/CD/Rollback), Trivy, Gitleaks |

---

## Cấu trúc thư mục

```text
CAR SERVICE CENTER/
├── .github/workflows/          # CI/CD pipelines (ci.yml, cd.yml, rollback.yml)
├── deploy/                     # Cấu hình Nginx, docker-compose.aws.yml và scripts deploy/rollback/backup
├── docs/                       # Tài liệu nghiệp vụ, Use Case, Database design, UI & CI/CD specs
├── infra/                      # AWS CDK v2 Infrastructure as Code (6 stacks + unit tests)
├── src/
│   ├── backend/                # Express + TypeScript + Prisma + Socket.IO API Server
│   │   ├── prisma/             # Prisma schema, seed.ts, seed-massive.ts
│   │   ├── src/                # controllers, services, repositories, routes, dtos, middlewares, socket, jobs
│   │   └── tests/              # Unit & Integration tests (Vitest)
│   └── frontend/               # npm workspaces Monorepo
│       ├── apps/
│       │   ├── customer-web/   # Cổng Khách hàng (Next.js - Port 3000)
│       │   └── internal-web/   # Cổng Nội bộ (Next.js - Port 3001)
│       ├── packages/shared/    # Thư viện dùng chung (ui, lib)
│       └── e2e/                # Kiểm thử E2E (Playwright)
├── docker-compose.yml          # Khởi chạy full stack local (MySQL, Redis, Backend, Customer Web, Internal Web)
├── DirectoryStructure.md       # Mô tả chi tiết cấu trúc thư mục
└── SETUP_GUIDE.md              # Hướng dẫn cài đặt, SePay Webhook & xử lý sự cố
```

---

## Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu môi trường (Prerequisites)
- **Node.js**: `v20+` (khuyến nghị `v20 LTS` hoặc `v22 LTS`)
- **MySQL**: `8.0+`
- **Redis**: `7+` *(tùy chọn khi chạy local — Backend tự fallback sang in-memory cache nếu không có Redis)*
- **Docker & Docker Compose** *(nếu khởi chạy bằng container)*

### Biến môi trường (Environment Variables)

Tham khảo file mẫu `src/backend/.env.example` để tạo `src/backend/.env`:

| Biến môi trường | Bắt buộc | Mô tả | Giá trị mẫu / Mặc định |
| :--- | :---: | :--- | :--- |
| `PORT` | Có | Cổng chạy Backend API | `5000` |
| `DATABASE_URL` | Có | Chuỗi kết nối MySQL cho Prisma | `mysql://root:password@localhost:3306/car_service_center` |
| `JWT_SECRET` | Có | Khóa bí mật ký JWT (tối thiểu 32 ký tự) | `your_super_secret_key_here_min_32_chars` |
| `JWT_EXPIRES_IN` | Không | Thời hạn Access Token | `7d` |
| `FRONTEND_URL` | Có | URL cổng Khách hàng (CORS & redirect) | `http://localhost:3000` |
| `INTERNAL_FRONTEND_URL` | Có | URL cổng Nội bộ (CORS) | `http://localhost:3001` |
| `CORS_ORIGINS` | Có | Danh sách origin được phép gọi API | `http://localhost:3000,http://localhost:3001` |
| `REDIS_URL` | Không | Địa chỉ kết nối Redis | `redis://localhost:6379` |
| `STORAGE_PROVIDER` | Không | Nhà cung cấp lưu trữ ảnh (`cloudinary` \| `s3`) | `cloudinary` |
| `CLOUDINARY_NAME` / `API_KEY` / `API_SECRET` | Tùy chọn | Cấu hình Cloudinary khi `STORAGE_PROVIDER=cloudinary` | `your_cloudinary_...` |
| `EMAIL_PROVIDER` | Không | Nhà cung cấp gửi email (`smtp` \| `ses`) | `smtp` |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Tùy chọn | Tài khoản & App Password Gmail khi `EMAIL_PROVIDER=smtp` | `your.email@gmail.com` |
| `GEMINI_API_KEY_1` / `GEMINI_MODEL` | Tùy chọn | API key & model Google Gemini cho Trợ lý AI | `gemini-2.5-flash` |
| `SEPAY_*` | Tùy chọn | Cấu hình cổng thanh toán SePay VietQR & Webhook IPN | `SEPAY_ENV=sandbox` |

Đối với Frontend (`src/frontend/apps/customer-web/.env` và `src/frontend/apps/internal-web/.env`):

| Biến môi trường | Bắt buộc | Mô tả | Giá trị mẫu |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Có | URL gốc của Backend API *(không có hậu tố `/api`)* | `http://localhost:5000` |

### Các bước cài đặt & chạy dự án

#### 1. Clone repository

```bash
git clone https://github.com/NguyenThanhTin235/car-service-center-web.git
cd "car-service-center-web"
```

#### 2. Cách 1 — Chạy nhanh bằng Docker Compose

```bash
docker compose up --build
```

Lệnh trên sẽ tự động khởi chạy `mysql` (`:3306`), `redis` (`:6379`), `backend` (`:5000`), `customer-web` (`:3000`) và `internal-web` (`:3001`).

#### 3. Cách 2 — Chạy môi trường phát triển Local

**Bước A: Khởi chạy Backend (`src/backend`)**

```bash
cd src/backend
npm install
cp .env.example .env
# Cập nhật các biến môi trường trong .env, sau đó đồng bộ DB & seed dữ liệu:
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Backend API mặc định chạy tại `http://localhost:5000` (Health check: `http://localhost:5000/health`).

**Bước B: Khởi chạy Frontend (`src/frontend`)**

Mở terminal mới tại `src/frontend`:

```bash
cd src/frontend
npm install
```

Tạo `.env` trong `src/frontend/apps/customer-web/.env` và `src/frontend/apps/internal-web/.env` với `NEXT_PUBLIC_API_URL=http://localhost:5000`, sau đó chạy:

```bash
# Chạy đồng thời cả Customer Web (3000) và Internal Web (3001)
npm run dev

# Hoặc chạy riêng lẻ từng cổng
npm run dev:customer
npm run dev:internal
```

- **Customer Web**: `http://localhost:3000`
- **Internal Web**: `http://localhost:3001`

---

## Kiểm thử & Kiểm tra chất lượng

```bash
# Backend (tại src/backend)
npm test                   # Chạy toàn bộ test suite (Vitest)
npm run test:unit          # Chạy unit tests
npm run test:integration   # Chạy integration tests
npm run typecheck          # Kiểm tra kiểu TypeScript
npm run lint               # Kiểm tra ESLint

# Frontend (tại src/frontend)
npm run test:unit          # Chạy toàn bộ unit tests Frontend (customer-web + internal-web)
npm run test:unit:customer # Chạy unit tests của customer-web
npm run test:e2e           # Chạy E2E tests (Playwright)
npm run lint               # Kiểm tra ESLint tất cả workspaces
npm run build              # Build kiểm tra production cho các apps

# Infrastructure AWS CDK (tại infra)
npm run typecheck && npm test && npm run synth
```

---

## Tài liệu API

Các nhóm endpoint chính được mount tại `src/backend/src/app.ts` (trả về JSON theo chuẩn envelope `{ success, code, message, data, timestamp }`):

| Nhóm chức năng | Prefix / Endpoint chính | Mô tả & Xác thực |
| :--- | :--- | :--- |
| **Hệ thống & Công khai** | `GET /health`, `/api/public`, `/api/upload` | Kiểm tra sức khỏe dịch vụ, thông tin công khai và tải tệp ảnh |
| **Xác thực & Tài khoản** | `/api/auth`, `/api/users`, `/api/employees` | Đăng ký/đăng nhập, OTP, làm mới token, quản lý nhân sự & phân quyền |
| **Khách hàng & Phương tiện** | `/api/customers`, `/api/vehicles` | Quản lý hồ sơ khách hàng và thông tin phương tiện |
| **Lịch hẹn & Tiếp nhận** | `/api/appointments`, `/api/intake` | Đặt/xác nhận/hủy lịch hẹn, tiếp nhận xe vào hàng đợi |
| **Phiếu công việc & Báo giá** | `/api/work-orders`, `/api/quotations` | Check-in, khám xe, lập công việc, báo giá, thi công, QC và bàn giao |
| **Bảo hành** | `/api/warranty` | Tra cứu điều kiện bảo hành, tạo & xử lý phiếu bảo hành, bảo hành thiện chí |
| **Danh mục & Kho** | `/api/services`, `/api/service-categories`, `/api/job-types`, `/api/system-catalogs`, `/api` (inventory) | Quản lý dịch vụ, loại công việc, danh mục dùng chung và nhập/xuất/tồn kho |
| **Hóa đơn & Thanh toán** | `/api/invoices`, `/api/payments`, `POST /api/payments/sepay/ipn` | Phát hành hóa đơn, thu ngân, SePay VietQR IPN & giả lập Sandbox |
| **Thống kê & Thông báo** | `/api/dashboard`, `/api/reports`, `/api/notifications` | Dashboard vận hành, báo cáo doanh thu/bảo hành và thông báo real-time |
| **Trợ lý AI** | `/api/ai-chat`, `/api/work-orders/:id/ai-job-suggestions`, `/api/work-orders/:id/jobs/:jobId/ai-part-suggestions` | Tư vấn khách hàng (Guest/Customer) và gợi ý công việc/phụ tùng cho SA |

---

## Nhóm tác giả

**Nhóm 47** — [GitHub](https://github.com/NguyenThanhTin235)

| MSSV | Họ và tên |
| :--- | :--- |
| `23110340` | Nguyễn Thành Tin |
| `23110243` | Trác Ngọc Đăng Khoa |
