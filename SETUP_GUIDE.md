# Hướng dẫn Cài đặt & Khởi chạy Dự án (Car Service Center)

Tài liệu này hướng dẫn chi tiết cách cài đặt, cấu hình biến môi trường và khởi chạy toàn bộ hệ thống Car Service Center (bao gồm Backend Node.js/Express/Prisma, Customer Web, Internal Web và Cổng thanh toán trực tuyến SePay).

---

## 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt:
- **Node.js**: Phiên bản `v20.x` trở lên (Khuyến nghị `v20 LTS` hoặc `v22 LTS`).
- **MySQL**: Phiên bản `8.0` trở lên (Có thể dùng XAMPP, MySQL Server độc lập hoặc Docker).
- **Git**: Để quản lý mã nguồn.
- **cloudflared**: File thực thi `cloudflared.exe` đã được tích hợp sẵn ở thư mục gốc của dự án (dùng để expose webhook SePay khi test localhost).

---

## 2. Thiết lập & Khởi chạy Backend (Node.js + Express + Prisma)

Mã nguồn Backend nằm trong thư mục `src/backend`.

### Bước 2.1: Cài đặt thư viện (Dependencies)
Mở terminal tại thư mục gốc của dự án và chạy:
```bash
cd "src/backend"
npm install
```

### Bước 2.2: Cấu hình biến môi trường (`.env`)
Tạo file `.env` bên trong thư mục `src/backend` (nếu chưa có). Cấu hình mẫu hoàn chỉnh như sau:

```env
# Port chạy Server Backend
PORT=5000
FRONTEND_URL=http://localhost:3000

# Cấu hình CSDL MySQL (thay đổi 'root' và 'mật_khẩu' theo máy bạn)
# Định dạng: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://root:123456@localhost:3306/car_service_center"

# Cấu hình JSON Web Token (Bảo mật phiên đăng nhập)
JWT_SECRET=super_secret_car_service_center_2026
JWT_EXPIRES_IN=7d

# Cấu hình Redis Cache (Tùy chọn: nếu không chạy Redis, hệ thống tự động fallback in-memory cache)
REDIS_URL=redis://localhost:6379

# Cấu hình Gửi Email Thông báo & Hóa đơn (SMTP Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=thanhtin23122@gmail.com
EMAIL_PASS=your_gmail_app_password
GMAIL_USER=thanhtin23122@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Cấu hình Cloudinary (Upload và lưu trữ ảnh xe, ảnh kiểm tra, avatar)
CLOUDINARY_NAME=dmxxo6wgl
CLOUDINARY_API_KEY=315628768938735
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Cấu hình Trợ lý AI (Google Gemini - Hỗ trợ phân tích kiểm định, chẩn đoán hỏng hóc)
GEMINI_API_KEY_1=your_gemini_api_key_here
GEMINI_API_KEYS=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Cấu hình Cổng thanh toán & Bank Hub (SePay - VietQR)
SEPAY_ENV=sandbox
SEPAY_MERCHANT_ID=SB_MERCHANT_CAR_SERVICE
SEPAY_SECRET_KEY=sepay_secret_key_car_service_2026
SEPAY_API_KEY=car_service_sepay_key_2026
SEPAY_BANK_NAME=Ngân Hàng TMCP Quân Đội (MB)
SEPAY_BANK_CODE=MB
SEPAY_BANK_ACCOUNT_NO=11123092005
SEPAY_BANK_ACCOUNT_NAME=NGUYEN THANH TIN
SEPAY_API_VERSION=v1
SEPAY_CHECKOUT_VERSION=v1
SEPAY_SUCCESS_URL=http://localhost:3000/customer/invoices?status=success
SEPAY_CANCEL_URL=http://localhost:3000/customer/invoices?status=cancel
```

### Bước 2.3: Đồng bộ Database & Nạp dữ liệu khởi tạo (Seed Data)
Đảm bảo MySQL service đang chạy, sau đó chạy lệnh đẩy schema lên MySQL:
```bash
npx prisma migrate dev
```

Tiếp theo, nạp toàn bộ danh mục chuẩn (dịch vụ, phụ tùng, công việc, mẫu kiểm định) và các tài khoản demo:
```bash
npx tsx prisma/seed.ts
# Hoặc: npx prisma db seed
```
*(Thao tác này sẽ dọn sạch DB và tạo đầy đủ dữ liệu mẫu sẵn sàng để kiểm thử).*

### Bước 2.4: Khởi chạy Backend Server
```bash
npm run dev
```
- **Địa chỉ API**: `http://localhost:5000`
- **Swagger API Docs**: `http://localhost:5000/api-docs`

---

## 3. Thiết lập & Khởi chạy Frontend (Next.js Monorepo)

Hệ thống Frontend gồm 2 ứng dụng độc lập nhằm tối ưu phân quyền và bảo mật:
- **Customer Web (Port 3000)**: Cổng thông tin khách hàng (Đặt lịch hẹn, xem tiến độ sửa chữa, kiểm tra báo giá, thanh toán hóa đơn online).
- **Internal Web (Port 3001)**: Cổng nhân viên nội bộ (Lễ tân, Cố vấn dịch vụ SA, Kỹ thuật viên, Quản trị viên, Thu ngân/Kế toán).

### Bước 3.1: Cài đặt thư viện Frontend
Mở một cửa sổ Terminal mới và di chuyển vào thư mục `src/frontend`:
```bash
cd "src/frontend"
npm install
```

### Bước 3.2: Cấu hình biến môi trường Frontend
Tạo file `.env` bên trong từng ứng dụng:

1. **Khách hàng** (`src/frontend/apps/customer-web/.env`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

2. **Quản trị nội bộ** (`src/frontend/apps/internal-web/.env`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Bước 3.3: Khởi chạy Giao diện
Tại thư mục `src/frontend`:
```bash
# Chạy đồng thời cả Customer Web và Internal Web:
npm run dev
```
Hoặc chạy riêng lẻ từng ứng dụng trong từng terminal riêng:
- Chạy Customer Web:
  ```bash
  cd "src/frontend/apps/customer-web"
  npm run dev
  ```
- Chạy Internal Web:
  ```bash
  cd "src/frontend/apps/internal-web"
  npm run dev
  ```

**Địa chỉ truy cập trình duyệt:**
- **Customer Web**: [http://localhost:3000](http://localhost:3000)
- **Internal Web**: [http://localhost:3001](http://localhost:3001)

---

## 4. Tích hợp & Kiểm thử Thanh toán Online (SePay Bank Hub)

Hệ thống hỗ trợ thanh toán VietQR động chuẩn ngân hàng thông qua SePay Webhook.

### Cách 1: Test tự động bằng Sandbox Simulator (Khuyến nghị khi dev offline)
1. Truy cập Customer Web `http://localhost:3000` hoặc màn hình Thu ngân `http://localhost:3001/staff/billing/[id]`.
2. Mở hóa đơn cần thanh toán và chọn **Thanh toán SePay (VietQR)**.
3. Trong Modal thanh toán, nhấn nút **"Giả lập thanh toán thành công (Test Sandbox)"**.
4. Hệ thống sẽ tự động gọi API mock settlement, hóa đơn chuyển sang trạng thái `PAID`, phiếu sửa chữa được nghiệm thu tài chính (`FINANCIAL_CLEARED`), và email biên lai được gửi tới khách hàng.

### Cách 2: Test chuyển khoản thật từ App Ngân hàng (Live Banking via Cloudflare Tunnel)
Để SePay có thể bắn Webhook IPN về Backend localhost của bạn khi có tiền vào tài khoản:

1. **Chạy Cloudflare Tunnel** (đứng từ thư mục gốc dự án):
   ```powershell
   .\cloudflared.exe tunnel --url http://localhost:5000
   ```
2. Terminal sẽ xuất hiện một đường dẫn công khai có dạng:
   ```text
   https://<subdomain-ngau-nhien>.trycloudflare.com
   ```
3. **Cấu hình trên SePay Dashboard (my.sepay.vn)**:
   - Vào mục **Tích hợp Webhook** -> **Thêm Webhook**.
   - **URL Webhook**:
     `https://<subdomain-ngau-nhien>.trycloudflare.com/api/payments/sepay/ipn`
   - **Phương thức**: `POST`
   - **Kiểu xác thực (Authentication)**: `API Key`
   - **API Key**: `car_service_sepay_key_2026`
4. Dùng App ngân hàng quét mã QR trên màn hình hóa đơn. Sau khi chuyển khoản thành công, SePay sẽ gửi IPN về webhook và giao diện tự động cập nhật trạng thái ngay lập tức.

---

## 5. Danh sách tài khoản thử nghiệm (Test Accounts)

Sau khi chạy `npx tsx prisma/seed.ts`, toàn bộ tài khoản bên dưới đều dùng **Mật khẩu mặc định**: `password123`.

| Nhóm người dùng | Email đăng nhập | Vai trò (Role) | Cổng truy cập |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin1@carservice.com` | `ADMIN` | Internal Web (`:3001`) |
| **Quản lý xưởng** | `manager1@carservice.com` | `MANAGER` | Internal Web (`:3001`) |
| **Cố vấn dịch vụ** | `sa1@carservice.com` | `SA` (Service Advisor) | Internal Web (`:3001`) |
| **Lễ tân / Tiếp nhận** | `deskstaff1@carservice.com` | `DESK STAFF` | Internal Web (`:3001`) |
| **Kỹ thuật viên (KTV)** | `staff1@carservice.com` | `TECHNICIAN` | Internal Web (`:3001`) |
| **Khách hàng mẫu 1** | `customer1@carservice.com` | `CUSTOMER` | Customer Web (`:3000`) |
| **Khách hàng mẫu 2** | `customer2@carservice.com` | `CUSTOMER` | Customer Web (`:3000`) |
| **Khách hàng test live** | `thanhtin243@gmail.com` | `CUSTOMER` | Customer Web (`:3000`) |

---

## 6. Các lệnh thao tác nhanh & Xử lý sự cố (Troubleshooting)

### Quản lý CSDL trực quan với Prisma Studio
Mở giao diện web xem/sửa toàn bộ bảng trong CSDL:
```bash
cd "src/backend"
npx prisma studio
```
Truy cập tại: `http://localhost:5555`.

### Cập nhật Database khi thay đổi Schema
Khi bạn chỉnh sửa file `src/backend/prisma/schema.prisma`:
```bash
cd "src/backend"
npx prisma format
npx prisma migrate dev --name <ten_migration>
npx prisma generate
```

### Xóa trắng và Reset CSDL sạch sẽ từ đầu
Nếu bị xung đột migrate hoặc dữ liệu test bị lỗi:
```bash
cd "src/backend"
npx prisma db push --force-reset
npx tsx prisma/seed.ts
```

### Xử lý lỗi trùng Port (Port already in use)
Nếu gặp lỗi `EADDRINUSE: address already in use :::5000` hoặc port `3000`, `3001`:
- **Windows (PowerShell)**:
  ```powershell
  # Tìm PID của tiến trình đang chiếm port (VD: port 5000)
  netstat -ano | findstr :5000
  # Tắt tiến trình bằng PID (thay <PID> bằng số tương ứng)
  taskkill /PID <PID> /F
  ```
