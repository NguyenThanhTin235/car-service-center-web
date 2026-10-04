# Kế hoạch Chuyển đổi Database & Logic tính tiền

Theo yêu cầu mới nhất, hệ thống sẽ có 2 sự thay đổi lớn về mặt Kiến trúc Database:
1. **Đổi tên Master Data Dịch vụ**: Xóa bỏ khái niệm "Template" ở mảng Dịch vụ. Chuyển `ServiceTemplate` thành `Service`.
2. **Đổi cơ chế tính tiền Nhân công**: Chuyển từ "Tính theo giờ" sang "Giá Cố định (Fixed Price)".

---

## 1. Giai đoạn 1: Sửa đổi Database (`schema.prisma`)

### A. Đổi tên Bảng Dịch vụ
- [ ] **Bảng `ServiceTemplate`**:
  - Đổi tên model thành `Service`.
  - Đổi tên bảng dưới DB thành `@@map("services")`.
- [ ] **Cập nhật Khóa ngoại (Foreign Keys)**:
  - Tất cả các bảng đang tham chiếu đến `service_template_id` (như `WoService`, `AppointmentService`, `IntakeService`, `VehicleSizePrice`, `JobTemplate`, `InspectionTemplate`) sẽ được đổi tên trường thành `service_id`.
- [ ] **Bảng `ServiceCategory`**:
  - Giữ nguyên cấu trúc, đổi relation name để map với model `Service` mới.

### B. Thay đổi Logic Tính tiền (Giá Cố định)
- [ ] **Bảng `JobType`**:
  - Xóa bỏ trường `hourly_rate` (Đơn giá giờ công). Bảng này giờ chỉ dùng làm danh mục phân loại nhóm kỹ năng.
- [ ] **Bảng `JobTemplate`**:
  - Thêm trường `price Decimal @db.Decimal(12, 2)` (Giá tiền cứng của công việc).
  - Đổi `estimated_hours` thành tùy chọn (`Decimal?`) để phục vụ xếp lịch thay vì tính tiền.
- [ ] **Bảng `JobLabour` (Chi tiết nhân công trong Phiếu sửa chữa)**:
  - Thêm trường `price Decimal @db.Decimal(12, 2)` (Giá tiền thực tế thu của khách).
  - Xóa bỏ trường `hourly_rate` và `billable_hours`.

### C. Thực thi Migration
- [ ] Chạy lệnh `npx prisma db push` và `npx prisma generate` để cập nhật Database và Prisma Client.

---

## 2. Giai đoạn 2: Cập nhật Backend (Service & API)

- [ ] **Global Rename**: Thay thế toàn bộ từ khóa `ServiceTemplate` thành `Service` trong các file Backend (Controllers, Services, Routes, DTOs).
  - Đổi endpoint từ `/api/service-templates` thành `/api/services`.
- [ ] **Cập nhật DTO (Validation)**:
  - Bỏ `hourlyRate` khỏi `JobType`.
  - Thêm bắt buộc `price` vào `JobTemplate`.
- [ ] **Cập nhật Logic Tính tiền (`WorkOrderService` / `QuotationService`)**:
  - Tính tiền nhân công: Lấy trực tiếp từ `JobLabour.price` cộng lại, không nhân giờ nữa.

---

## 3. Giai đoạn 3: Cập nhật Frontend (UI)

- [ ] **Đổi tên Menu & URL**:
  - Chuyển "Quản lý mẫu dịch vụ" thành "Quản lý Dịch vụ" (Menu UI như trong ảnh).
  - Đổi URL tương ứng nếu cần.
- [ ] **Form Quản lý Loại công việc (`job-types`)**:
  - Xóa cột/input "Đơn giá/giờ".
- [ ] **Form Quản lý Công việc (`job-templates`)**:
  - Thêm ô input "Giá tiền (VNĐ)".
- [ ] **Màn hình Cố vấn dịch vụ (Lên báo giá)**:
  - Khi chèn Job vào Phiếu, hệ thống tự động bốc `price` từ JobTemplate bỏ vào Báo giá. SA có quyền gõ sửa lại số tiền này nếu muốn giảm giá, bỏ hẳn cột "Số giờ thanh toán".

---

*(Sau khi bạn review và chốt plan này, chúng ta sẽ bắt đầu thực thi ngay từ Giai đoạn 1: sửa schema.prisma).*
