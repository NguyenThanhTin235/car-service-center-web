# Hướng dẫn Khởi chạy Dự án (Car Service Center)

Tài liệu này hướng dẫn chi tiết cách cài đặt và khởi chạy toàn bộ dự án (bao gồm cả Backend và Frontend) trên máy cá nhân (Localhost).

---

## 1. Yêu cầu hệ thống (Prerequisites)
Để chạy được dự án, máy tính của bạn cần cài đặt sẵn:
- **Node.js** (Phiên bản v20.x trở lên)
- **MySQL** (Phiên bản 8.0 trở lên) - Có thể dùng XAMPP hoặc cài trực tiếp.
- **Git**

---

## 2. Thiết lập & Khởi chạy Backend (Node.js + Express + Prisma)

Backend nằm trong thư mục `src/backend`.

### Bước 2.1: Cài đặt thư viện (Dependencies)
Mở Terminal, đi tới thư mục backend và cài đặt thư viện:
```bash
cd "src/backend"
npm install
```

### Bước 2.2: Thiết lập biến môi trường (.env)
Tạo một file có tên là `.env` nằm trong thư mục `src/backend`. Copy nội dung sau vào file và sửa lại thông tin `root:password` cho khớp với MySQL của bạn:

```env
# Port chạy Server Backend
PORT=5000

# Cấu hình CSDL MySQL (Thay đổi 'root' và 'password' cho phù hợp)
# Định dạng: mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
DATABASE_URL="mysql://root:123456@localhost:3306/car_service_db"

# Cấu hình Cloudinary (Dùng để upload/lưu trữ hình ảnh)
CLOUDINARY_NAME="dmxxo6wgl"
CLOUDINARY_API_KEY="315628768938735"
CLOUDINARY_API_SECRET="w9ziEUTs3giXY9hR8O1S75NBIF4"
```

### Bước 2.3: Đồng bộ CSDL & Tạo dữ liệu mẫu (Seed Data)
Để Prisma tạo các bảng trong Database MySQL:
```bash
npx prisma migrate dev
```

Tiếp theo, chạy lệnh nạp dữ liệu giả lập (để có sẵn các tài khoản, lịch hẹn, dịch vụ, kho bãi để test):
```bash
npx prisma db seed
```
*(Lệnh này sẽ tự động xóa sạch dữ liệu cũ và nạp lại từ đầu).*

### Bước 2.4: Chạy Server
Sau khi cấu hình xong, khởi động backend bằng lệnh:
```bash
npm run dev
```
✅ Khi thấy thông báo `Server is running on port 5000`, tức là Backend đã chạy thành công ở địa chỉ `http://localhost:5000`.

---

## 3. Thiết lập & Khởi chạy Frontend (Next.js)

Frontend nằm trong thư mục `src/frontend`.

### Bước 3.1: Cài đặt thư viện
Mở một Tab Terminal mới (Vẫn phải giữ Terminal backend đang chạy), đi tới thư mục frontend:
```bash
cd "src/frontend"
npm install
```

### Bước 3.2: Thiết lập biến môi trường (.env.local)
Tạo file `.env.local` trong thư mục `src/frontend` với nội dung:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Bước 3.3: Chạy giao diện Web
```bash
npm run dev
```
✅ Web sẽ khởi động và có thể truy cập bằng trình duyệt tại: `http://localhost:3000`.

---

## 4. Các câu lệnh thao tác nhanh (Cheat Sheet)

Dưới đây là một số công cụ rất hữu ích trong quá trình phát triển (Chỉ chạy khi đang đứng trong thư mục `src/backend`):

- **Mở giao diện quản lý Database trực quan (Prisma Studio):**
  ```bash
  npx prisma studio
  ```
  *Hệ thống sẽ mở web tại `http://localhost:5555`. Tại đây bạn có thể xem danh sách User, WorkOrder, thêm/sửa/xóa bảng dễ dàng.*

- **Cập nhật lại Prisma sau khi sửa file `schema.prisma`:**
  Nếu bạn có đổi tên cột hoặc thêm bảng mới, cần chạy 2 lệnh sau:
  ```bash
  npx prisma format
  npx prisma migrate dev --name <ten_thay_doi>
  npx prisma generate
  ```

- **Xóa trắng và Reset lại toàn bộ Database (khi gặp lỗi xung đột):**
  Nếu `migrate dev` báo lỗi do dữ liệu cũ không tương thích với schema mới, hãy dùng lệnh ép buộc đồng bộ (lưu ý: thao tác này sẽ xóa toàn bộ dữ liệu):
  ```bash
  npx prisma db push --force-reset
  npx tsx prisma/seed.ts
  ```
