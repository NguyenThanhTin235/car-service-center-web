# TỪ ĐIỂN DỮ LIỆU – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (CAR SERVICE CENTER)

> **Hệ quản trị CSDL:** MySQL 8.x · **ORM:** Prisma 5.x · **Quy ước khóa chính:** INT AUTO_INCREMENT  
> **Phiên bản tài liệu:** 2.0 (Chuẩn hóa toàn diện 47 bảng CSDL) · **Ngày cập nhật:** 08/11/2026

---

## MỤC LỤC TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU

| STT | Phân hệ nghiệp vụ | Tên bảng (Table Name) | Model (Prisma) | Ý nghĩa bảng dữ liệu |
|:---:|:---|:---|:---|:---|
| 1 | IDENTITY & ACCESS | **`users`** | `User` | Người dùng |
| 2 | IDENTITY & ACCESS | **`roles`** | `Role` | Vai trò |
| 3 | IDENTITY & ACCESS | **`user_roles`** | `UserRole` | Phân quyền người dùng |
| 4 | IDENTITY & ACCESS | **`employees`** | `Employee` | Nhân sự xưởng |
| 5 | IDENTITY & ACCESS | **`skills`** | `Skill` | Kỹ năng chuyên môn |
| 6 | IDENTITY & ACCESS | **`employee_skills`** | `EmployeeSkill` | Kỹ năng của nhân sự |
| 7 | CUSTOMER & VEHICLE | **`vehicles`** | `Vehicle` | Phương tiện khách hàng |
| 8 | SERVICE CATALOG & PRICING | **`service_categories`** | `ServiceCategory` | Nhóm danh mục dịch vụ |
| 9 | SERVICE CATALOG & PRICING | **`services`** | `Service` | Gói dịch vụ |
| 10 | SERVICE CATALOG & PRICING | **`vehicle_size_prices`** | `VehicleSizePrice` | Bảng giá dịch vụ theo kích thước xe |
| 11 | SERVICE CATALOG & PRICING | **`job_types`** | `JobType` | Loại công việc kỹ thuật |
| 12 | SERVICE CATALOG & PRICING | **`job_templates`** | `JobTemplate` | Mẫu công việc chuẩn |
| 13 | SERVICE CATALOG & PRICING | **`job_template_parts`** | `JobTemplatePart` | Định mức phụ tùng mẫu cho công việc |
| 14 | INSPECTION & QC TEMPLATES | **`inspection_templates`** | `InspectionTemplate` | Mẫu kiểm tra / QC |
| 15 | INSPECTION & QC TEMPLATES | **`inspection_template_items`** | `InspectionTemplateItem` | Tiêu chí trong mẫu kiểm tra / QC |
| 16 | APPOINTMENT & INTAKE | **`appointments`** | `Appointment` | Lịch hẹn dịch vụ |
| 17 | APPOINTMENT & INTAKE | **`appointment_services`** | `AppointmentService` | Dịch vụ mong muốn khi đặt lịch |
| 18 | APPOINTMENT & INTAKE | **`intake_records`** | `IntakeRecord` | Phiếu tiếp nhận xe |
| 19 | APPOINTMENT & INTAKE | **`intake_services`** | `IntakeService` | Dịch vụ yêu cầu khi tiếp nhận |
| 20 | WORK ORDER CORE | **`work_orders`** | `WorkOrder` | Lệnh sửa chữa (Work Order) |
| 21 | WORK ORDER CORE | **`check_ins`** | `CheckIn` | Biên bản tiếp nhận xe & Sơ đồ vết lỗi |
| 22 | WORK ORDER CORE | **`wo_services`** | `WoService` | Hạng mục dịch vụ trong lệnh |
| 23 | WORK ORDER CORE | **`inspections`** | `Inspection` | Biên bản kiểm tra kỹ thuật |
| 24 | WORK ORDER CORE | **`inspection_results`** | `InspectionResult` | Kết quả kiểm tra chi tiết theo tiêu chí |
| 25 | WORK ORDER CORE | **`findings`** | `Finding` | Vết lỗi / Hư hỏng phát hiện |
| 26 | WORK ORDER CORE | **`jobs`** | `Job` | Đầu việc kỹ thuật thi công |
| 27 | WORK ORDER CORE | **`job_findings`** | `JobFinding` | Liên kết vết lỗi với công việc xử lý |
| 28 | WORK ORDER CORE | **`job_labours`** | `JobLabour` | Nhân công thi công đầu việc |
| 29 | WORK ORDER CORE | **`job_parts`** | `JobPart` | Phụ tùng cấp phát cho đầu việc |
| 30 | QUOTATION | **`quotations`** | `Quotation` | Báo giá dịch vụ |
| 31 | QUOTATION | **`quotation_lines`** | `QuotationLine` | Chi tiết dòng báo giá |
| 32 | QC & REWORK | **`qc_records`** | `QcRecord` | Biên bản nghiệm thu chất lượng (QC) |
| 33 | QC & REWORK | **`qc_items`** | `QcItem` | Kết quả nghiệm thu từng tiêu chí QC |
| 34 | INVENTORY & PROCUREMENT | **`suppliers`** | `Supplier` | Nhà cung cấp phụ tùng |
| 35 | INVENTORY & PROCUREMENT | **`part_categories`** | `PartCategory` | Danh mục phụ tùng (Master Data) |
| 36 | INVENTORY & PROCUREMENT | **`inventory_items`** | `InventoryItem` | Mặt hàng kho phụ tùng |
| 37 | INVENTORY & PROCUREMENT | **`goods_receipts`** | `GoodsReceipt` | Phiếu nhập kho phụ tùng |
| 38 | INVENTORY & PROCUREMENT | **`goods_receipt_items`** | `GoodsReceiptItem` | Chi tiết dòng phụ tùng nhập kho |
| 39 | INVENTORY & PROCUREMENT | **`stock_movements`** | `StockMovement` | Lịch sử biến động Thẻ kho (Stock Card) |
| 40 | INVENTORY & PROCUREMENT | **`stock_adjustments`** | `StockAdjustment` | Phiếu điều chỉnh kiểm kê kho |
| 41 | BILLING, PAYMENT & SETTLEMENT | **`invoices`** | `Invoice` | Hóa đơn dịch vụ |
| 42 | BILLING, PAYMENT & SETTLEMENT | **`invoice_lines`** | `InvoiceLine` | Dòng chi tiết hóa đơn |
| 43 | BILLING, PAYMENT & SETTLEMENT | **`payments`** | `Payment` | Giao dịch thanh toán |
| 44 | BILLING, PAYMENT & SETTLEMENT | **`vehicle_releases`** | `VehicleRelease` | Biên bản bàn giao xe xuất xưởng |
| 45 | SYSTEM & SUPPORT | **`system_catalogs`** | `SystemCatalog` | Danh mục chung hệ thống |
| 46 | SYSTEM & SUPPORT | **`notifications`** | `Notification` | Thông báo hệ thống |
| 47 | SYSTEM & SUPPORT | **`audit_logs`** | `AuditLog` | Nhật ký kiểm toán hệ thống |

---

# NHÓM 1 – IDENTITY & ACCESS

*Quản lý tài khoản người dùng, vai trò, phân quyền, hồ sơ nhân viên và kỹ năng nghiệp vụ.*

---

## 5.2.1. Người dùng (`users`)

**users**(id, email, phone, password_hash, full_name, address, is_active, otp_hash, otp_attempts, otp_requested_at, otp_expires_at, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã người dùng |  |
| 2 | `email` | VARCHAR(255) | Duy nhất, Không rỗng | Địa chỉ email đăng nhập |  |
| 3 | `phone` | VARCHAR(20) | Duy nhất, Cho phép rỗng | Số điện thoại | Customer bắt buộc, Staff có thể NULL |
| 4 | `password_hash` | VARCHAR(255) | Không rỗng | Mật khẩu đã băm | bcrypt/argon2 |
| 5 | `full_name` | VARCHAR(150) | Không rỗng | Họ và tên |  |
| 6 | `address` | TEXT | Cho phép rỗng | Địa chỉ | Dùng cho Customer profile |
| 7 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động | Khóa/mở khóa tài khoản |
| 8 | `otp_hash` | VARCHAR(255) | Cho phép rỗng | Mã băm OTP xác thực | Bảo mật đặt lại mật khẩu |
| 9 | `otp_attempts` | INT | Không rỗng; Mặc định 0 | Số lần nhập sai OTP liên tiếp | Khóa sau 5 lần thất bại |
| 10 | `otp_requested_at` | DATETIME | Cho phép rỗng | Thời điểm yêu cầu gửi OTP gần nhất | Cho phép rỗng |
| 11 | `otp_expires_at` | DATETIME | Cho phép rỗng | Thời điểm OTP hết hạn | Hiệu lực trong 5 phút |
| 12 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 13 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.2. Vai trò (`roles`)

**roles**(id, name)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã vai trò |  |
| 2 | `name` | VARCHAR(50) | Duy nhất, Không rỗng | Tên vai trò | CUSTOMER, FRONT_DESK, SERVICE_ADVISOR, SERVICE_MANAGER, ADMIN |

---

## 5.2.3. Phân quyền người dùng (`user_roles`)

**user_roles**(id, user_id, role_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phân quyền |  |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Mã người dùng |  |
| 3 | `role_id` | INT | Khóa ngoại → `roles(id)`, Không rỗng | Mã vai trò |  |

---

## 5.2.4. Nhân sự xưởng (`employees`)

**employees**(id, user_id, full_name, position, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã nhân viên |  |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`, Cho phép rỗng | Mã tài khoản liên kết | Employee có thể chưa có tài khoản |
| 3 | `full_name` | VARCHAR(150) | Không rỗng | Họ và tên nhân viên |  |
| 4 | `position` | ENUM (EmployeePosition) | 'TECHNICIAN', 'DETAILER', 'QC_STAFF', 'ADVISOR', 'OTHER' | Vị trí công việc |  |
| 5 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |
| 6 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 7 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.5. Kỹ năng chuyên môn (`skills`)

**skills**(id, name, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã kỹ năng |  |
| 2 | `name` | VARCHAR(100) | Không rỗng | Tên kỹ năng | Ví dụ: Engine Repair, Brake System |
| 3 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |

---

## 5.2.6. Kỹ năng của nhân sự (`employee_skills`)

**employee_skills**(id, employee_id, skill_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã gán kỹ năng |  |
| 2 | `employee_id` | INT | Khóa ngoại → `employees(id)`, Không rỗng | Mã nhân viên |  |
| 3 | `skill_id` | INT | Khóa ngoại → `skills(id)`, Không rỗng | Mã kỹ năng |  |

---

# NHÓM 2 – CUSTOMER & VEHICLE

*Quản lý thông tin phương tiện xe của khách hàng.*

---

## 5.2.7. Phương tiện khách hàng (`vehicles`)

**vehicles**(id, customer_id, license_plate, make)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phương tiện |  |
| 2 | `customer_id` | INT | Không rỗng | Mã khách hàng sở hữu |  |
| 3 | `license_plate` | VARCHAR(20) | Duy nhất, Không rỗng | Biển số xe | Duy nhất toàn hệ thống |
| 4 | `make` | VARCHAR(100) | Không rỗng | Hãng xe |  |

---

# NHÓM 3 – SERVICE CATALOG & PRICING

*Quản lý danh mục gói dịch vụ, bảng giá theo kích thước xe, loại công việc, đầu việc mẫu và định mức phụ tùng.*

---

## 5.2.8. Nhóm danh mục dịch vụ (`service_categories`)

**service_categories**(id, name, description, is_active, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã danh mục dịch vụ |  |
| 2 | `name` | VARCHAR(100) | Không rỗng | Tên danh mục | REPAIR, MAINTENANCE, CAR_WASH, DETAILING |
| 3 | `description` | TEXT | Cho phép rỗng | Mô tả |  |
| 4 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |
| 5 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |

---

## 5.2.9. Gói dịch vụ (`services`)

**services**(id, category_id, name, description, pricing_type, fixed_price, warranty_months, warranty_mileage, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã mẫu dịch vụ |  |
| 2 | `category_id` | INT | Khóa ngoại → `service_categories(id)`, Không rỗng | Mã danh mục dịch vụ |  |
| 3 | `name` | VARCHAR(150) | Không rỗng | Tên mẫu dịch vụ | Ví dụ: "Bảo dưỡng 10.000km" |
| 4 | `description` | TEXT | Cho phép rỗng | Mô tả |  |
| 5 | `pricing_type` | ENUM (PricingType) | 'FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS' | Loại tính giá | CT-PRICE01..05 |
| 6 | `fixed_price` | DECIMAL(12,2) | Cho phép rỗng | Giá cố định | Dùng khi pricing_type = FIXED |
| 7 | `warranty_months` | INT | Không rỗng; Mặc định 0 | Thời hạn bảo hành tiêu chuẩn (tháng) | Mặc định 12 tháng |
| 8 | `warranty_mileage` | INT | Không rỗng; Mặc định 0 | Giới hạn số km bảo hành tiêu chuẩn | Ví dụ 10.000 km |
| 9 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động | Chỉ Active hiển thị cho Customer |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 11 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.10. Bảng giá dịch vụ theo kích thước xe (`vehicle_size_prices`)

**vehicle_size_prices**(id, service_id, vehicle_size, price)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã giá |  |
| 2 | `service_id` | INT | Khóa ngoại → `services(id)`, Không rỗng | Mã mẫu dịch vụ |  |
| 3 | `vehicle_size` | ENUM (VehicleSize) | 'SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK' | Kích thước xe |  |
| 4 | `price` | DECIMAL(12,2) | Không rỗng | Giá dịch vụ |  |

---

## 5.2.11. Loại công việc kỹ thuật (`job_types`)

**job_types**(id, name, description, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã loại công việc |  |
| 2 | `name` | VARCHAR(150) | Không rỗng | Tên loại công việc |  |
| 3 | `description` | TEXT | Cho phép rỗng | Mô tả |  |
| 4 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |

---

## 5.2.12. Mẫu công việc chuẩn (`job_templates`)

**job_templates**(id, job_type_id, service_id, name, price, estimated_hours, requires_qc)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã mẫu công việc |  |
| 2 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`, Không rỗng | Mã loại công việc |  |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`, Cho phép rỗng | Mã mẫu dịch vụ | Sinh Job từ mẫu dịch vụ |
| 4 | `name` | VARCHAR(150) | Không rỗng | Tên mẫu công việc |  |
| 5 | `price` | DECIMAL(12,2) | Không rỗng | price |  |
| 6 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng | Số giờ dự kiến |  |
| 7 | `requires_qc` | BOOLEAN | Không rỗng; Mặc định true | Yêu cầu kiểm định chất lượng |  |

---

## 5.2.13. Định mức phụ tùng mẫu cho công việc (`job_template_parts`)

**job_template_parts**(id, job_template_id, item_id, default_quantity)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng phụ tùng mẫu |  |
| 2 | `job_template_id` | INT | Khóa ngoại → `job_templates(id)`, Không rỗng | Mã mẫu công việc |  |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`, Không rỗng | Mã mặt hàng phụ tùng | Khóa ngoại → inventory_items(id) |
| 4 | `default_quantity` | DECIMAL(10,2) | Không rỗng | Số lượng mặc định |  |

---

# NHÓM 4 – INSPECTION & QC TEMPLATES

*Quản lý các mẫu biên bản kiểm tra tiếp nhận xe và mẫu nghiệm thu chất lượng công việc (QC).*

---

## 5.2.14. Mẫu kiểm tra / QC (`inspection_templates`)

**inspection_templates**(id, service_id, template_type, name, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã mẫu kiểm tra |  |
| 2 | `service_id` | INT | Khóa ngoại → `services(id)`, Cho phép rỗng | Mã mẫu dịch vụ | NULL = áp dụng chung |
| 3 | `template_type` | ENUM (InspectionTemplateType) | 'INSPECTION', 'QC' | Loại mẫu | Kiểm tra ban đầu vs Kiểm định chất lượng |
| 4 | `name` | VARCHAR(150) | Không rỗng | Tên mẫu kiểm tra |  |
| 5 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |

---

## 5.2.15. Tiêu chí trong mẫu kiểm tra / QC (`inspection_template_items`)

**inspection_template_items**(id, template_id, name, is_required, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã hạng mục |  |
| 2 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`, Không rỗng | Mã mẫu kiểm tra |  |
| 3 | `name` | VARCHAR(255) | Không rỗng | Tên hạng mục |  |
| 4 | `is_required` | BOOLEAN | Không rỗng; Mặc định true | Bắt buộc hay không |  |
| 5 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |

---

# NHÓM 5 – APPOINTMENT & INTAKE

*Quản lý đặt lịch hẹn trực tuyến và quy trình tiếp nhận xe ban đầu tại quầy lễ tân.*

---

## 5.2.16. Lịch hẹn dịch vụ (`appointments`)

**appointments**(id, customer_id, vehicle_id, scheduled_date, scheduled_time, status, cancel_reason, notes, is_warranty, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã lịch hẹn |  |
| 2 | `customer_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Mã khách hàng |  |
| 3 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`, Không rỗng | Mã phương tiện |  |
| 4 | `scheduled_date` | DATETIME | Không rỗng | Ngày hẹn |  |
| 5 | `scheduled_time` | DATETIME | Không rỗng | Giờ hẹn |  |
| 6 | `status` | ENUM (AppointmentStatus) | 'REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED', 'CANCELLED'; Mặc định 'REQUESTED' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 7 | `cancel_reason` | TEXT | Cho phép rỗng | Lý do hủy chứng từ nhập kho | Bắt buộc nhập khi hủy phiếu đã ghi sổ POSTED |
| 8 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |
| 9 | `is_warranty` | BOOLEAN | Không rỗng; Mặc định false | is_warranty |  |
| 10 | `created_by_id` | INT | Cho phép rỗng | Người tạo | Customer hoặc Front Desk Staff |
| 11 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 12 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.17. Dịch vụ mong muốn khi đặt lịch (`appointment_services`)

**appointment_services**(id, appointment_id, service_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dịch vụ lịch hẹn |  |
| 2 | `appointment_id` | INT | Khóa ngoại → `appointments(id)`, Không rỗng | Mã lịch hẹn |  |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`, Không rỗng | Mã mẫu dịch vụ |  |

---

## 5.2.18. Phiếu tiếp nhận xe (`intake_records`)

**intake_records**(id, customer_id, vehicle_id, intake_type, status, arrived_at, tow_company, notes, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu tiếp nhận |  |
| 2 | `customer_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Mã khách hàng |  |
| 3 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`, Không rỗng | Mã phương tiện |  |
| 4 | `intake_type` | INT | 'WALK_IN', 'TOW_IN', 'APPOINTMENT', 'WARRANTY' | Hình thức xe vào xưởng | WALK_IN, TOW_IN, APPOINTMENT, WARRANTY |
| 5 | `status` | INT | 'QUEUED', 'CONVERTED', 'CANCELLED'; Mặc định 'QUEUED' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 6 | `arrived_at` | DATETIME | Không rỗng | Thời điểm xe đến |  |
| 7 | `tow_company` | VARCHAR(255) | Cho phép rỗng | Tên người/đơn vị bàn giao | Chỉ dùng cho Tow-in |
| 8 | `notes` | TEXT | Cho phép rỗng | Nhu cầu dịch vụ |  |
| 9 | `created_by_id` | INT | Không rỗng | Nhân viên quầy tạo |  |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.19. Dịch vụ yêu cầu khi tiếp nhận (`intake_services`)

**intake_services**(id, intake_id, service_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dịch vụ tiếp nhận |  |
| 2 | `intake_id` | INT | Khóa ngoại → `intake_records(id)`, Không rỗng | Mã phiếu tiếp nhận |  |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`, Không rỗng | Mã mẫu dịch vụ |  |

---

# NHÓM 6 – WORK ORDER CORE

*Quản lý vòng đời Lệnh sửa chữa (Work Order), biên bản nhận xe, sơ đồ vết lỗi, hạng mục dịch vụ, kiểm tra kỹ thuật, đầu việc thi công, nhân công và cấp phát phụ tùng.*

---

## 5.2.20. Lệnh sửa chữa (Work Order) (`work_orders`)

**work_orders**(id, wo_number, customer_id, vehicle_id, advisor_id, source_type, appointment_id, intake_record_id, status, order_type, parent_work_order_id, warranty_reason, claim_approved_by_id, closed_at, closed_by_id, close_type, close_notes, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu công việc |  |
| 2 | `wo_number` | VARCHAR(20) | Duy nhất, Không rỗng | Mã lệnh sửa chữa hiển thị | Auto: WO-YYYYMMDD-XXXX, duy nhất |
| 3 | `customer_id` | INT | Không rỗng | Mã khách hàng |  |
| 4 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`, Không rỗng | Mã phương tiện |  |
| 5 | `advisor_id` | INT | Không rỗng | Mã cố vấn dịch vụ phụ trách |  |
| 6 | `source_type` | ENUM (WorkOrderSourceType) | 'APPOINTMENT', 'WALK_IN', 'TOW_IN', 'WARRANTY' | Nguồn gốc tạo lệnh | APPOINTMENT, WALK_IN, TOW_IN, WARRANTY |
| 7 | `appointment_id` | INT | Khóa ngoại → `appointments(id)`, Cho phép rỗng | Mã lịch hẹn | NULL nếu Walk-in/Tow-in |
| 8 | `intake_record_id` | INT | Khóa ngoại → `intake_records(id)`, Cho phép rỗng | Mã phiếu tiếp nhận | NULL nếu từ Appointment |
| 9 | `status` | ENUM (WorkOrderStatus) | 'DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED', 'CANCELLED'; Mặc định 'DRAFT' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 10 | `order_type` | ENUM (WorkOrderType) | 'NORMAL', 'WARRANTY', 'MIXED'; Mặc định 'NORMAL' | order_type |  |
| 11 | `parent_work_order_id` | INT | Cho phép rỗng | parent_work_order_id |  |
| 12 | `warranty_reason` | TEXT | Cho phép rỗng | warranty_reason |  |
| 13 | `claim_approved_by_id` | INT | Cho phép rỗng | claim_approved_by_id |  |
| 14 | `closed_at` | DATETIME | Cho phép rỗng | Thời điểm đóng lệnh sửa chữa | Cho phép rỗng |
| 15 | `closed_by_id` | INT | Cho phép rỗng | closed_by_id |  |
| 16 | `close_type` | WoCloseType? | Cho phép rỗng | Hình thức đóng lệnh | MANUAL (Đóng tay), AUTO (Hệ thống tự đóng sau release) |
| 17 | `close_notes` | TEXT | Cho phép rỗng | close_notes |  |
| 18 | `created_by_id` | INT | Không rỗng | Người tạo |  |
| 19 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 20 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.21. Biên bản tiếp nhận xe & Sơ đồ vết lỗi (`check_ins`)

**check_ins**(id, work_order_id, mileage, fuel_level, complaint, belongings, exterior_condition, status, rejection_reason, confirmed_by_customer_id, confirmed_at, evidence_urls, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã ghi nhận |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc | Quan hệ 1:1 với work_orders |
| 3 | `mileage` | INT | Không rỗng | Số km hiện tại |  |
| 4 | `fuel_level` | ENUM (FuelLevel) | 'EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL' | Mức xăng/nhiên liệu |  |
| 5 | `complaint` | TEXT | Không rỗng | Phàn nàn/yêu cầu của khách |  |
| 6 | `belongings` | TEXT | Cho phép rỗng | Tài sản trong xe |  |
| 7 | `exterior_condition` | TEXT | Không rỗng | Tình trạng bên ngoài |  |
| 8 | `status` | ENUM (CheckInStatus) | 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'REVISION_REQUIRED'; Mặc định 'PENDING_CONFIRMATION' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 9 | `rejection_reason` | TEXT | Cho phép rỗng | Lý do khách từ chối ký biên bản bàn giao xe | Cho phép rỗng |
| 10 | `confirmed_by_customer_id` | INT | Cho phép rỗng | Mã khách hàng xác nhận | UC-10 Customer confirm |
| 11 | `confirmed_at` | DATETIME | Cho phép rỗng | Thời điểm xác nhận |  |
| 12 | `evidence_urls` | JSON | Cho phép rỗng | Mảng URL hình ảnh minh chứng | Cloudinary URL |
| 13 | `created_by_id` | INT | Không rỗng | Người ghi nhận |  |
| 14 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 15 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.22. Hạng mục dịch vụ trong lệnh (`wo_services`)

**wo_services**(id, work_order_id, service_id, name, pricing_type, status, sort_order, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dịch vụ trong phiếu |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc |  |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`, Cho phép rỗng | Mã mẫu dịch vụ | NULL = custom service |
| 4 | `name` | VARCHAR(255) | Không rỗng | Tên dịch vụ | Snapshot tên từ template |
| 5 | `pricing_type` | ENUM (PricingType) | 'FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS' | Loại tính giá | Snapshot |
| 6 | `status` | ENUM (ServiceStatus) | 'PENDING', 'IN_PROGRESS', 'COMPLETED'; Mặc định 'PENDING' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 7 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |
| 8 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 9 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.23. Biên bản kiểm tra kỹ thuật (`inspections`)

**inspections**(id, work_order_id, wo_service_id, template_id, status, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu kiểm tra |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc |  |
| 3 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`, Cho phép rỗng | Mã dịch vụ | Inspection có thể gắn Service |
| 4 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`, Cho phép rỗng | Mã mẫu kiểm tra |  |
| 5 | `status` | ENUM (InspectionStatus) | 'IN_PROGRESS', 'COMPLETED'; Mặc định 'IN_PROGRESS' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 6 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người kiểm tra |  |
| 7 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 8 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.24. Kết quả kiểm tra chi tiết theo tiêu chí (`inspection_results`)

**inspection_results**(id, inspection_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã kết quả |  |
| 2 | `inspection_id` | INT | Khóa ngoại → `inspections(id)`, Không rỗng | Mã phiếu kiểm tra |  |
| 3 | `template_item_id` | INT | Khóa ngoại → `inspection_template_items(id)`, Cho phép rỗng | Mã hạng mục mẫu |  |
| 4 | `item_name` | VARCHAR(255) | Không rỗng | Tên hạng mục | Snapshot tên hạng mục |
| 5 | `result` | ENUM (InspectionResultValue) | 'PASS', 'FAIL', 'MONITOR' | Kết quả kiểm tra | Đạt / Không đạt / Cần theo dõi |
| 6 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |

---

## 5.2.25. Vết lỗi / Hư hỏng phát hiện (`findings`)

**findings**(id, inspection_id, status, description, severity, recommendation, evidence_urls, is_visible_to_customer, marker_type, part_name, coordinates, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phát hiện |  |
| 2 | `inspection_id` | INT | Khóa ngoại → `inspections(id)`, Không rỗng | Mã phiếu kiểm tra |  |
| 3 | `status` | ENUM (FindingStatus) | 'NEW', 'LINKED_TO_JOB', 'RESOLVED'; Mặc định 'NEW' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 4 | `description` | TEXT | Không rỗng | Mô tả vấn đề |  |
| 5 | `severity` | ENUM (Severity) | 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'; Mặc định 'MEDIUM' | Mức độ nghiêm trọng |  |
| 6 | `recommendation` | TEXT | Cho phép rỗng | Đề xuất xử lý |  |
| 7 | `evidence_urls` | JSON | Cho phép rỗng | Mảng URL hình ảnh minh chứng | Cloudinary URL |
| 8 | `is_visible_to_customer` | BOOLEAN | Không rỗng; Mặc định true | Hiển thị cho khách hàng | Customer không thấy internal note |
| 9 | `marker_type` | MarkerType? | Cho phép rỗng | marker_type |  |
| 10 | `part_name` | VARCHAR(255) | Cho phép rỗng | part_name |  |
| 11 | `coordinates` | JSON | Cho phép rỗng | coordinates |  |
| 12 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người phát hiện |  |
| 13 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 14 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.26. Đầu việc kỹ thuật thi công (`jobs`)

**jobs**(id, wo_service_id, job_type_id, job_template_id, name, description, estimated_hours, actual_hours, status, result_notes, is_rework, is_warranty, original_job_id, parent_job_id, rework_source_qc_item_id, created_by_id, started_at, completed_at, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã công việc |  |
| 2 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`, Không rỗng | Mã dịch vụ | Job thuộc đúng 1 Service |
| 3 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`, Cho phép rỗng | Mã loại công việc |  |
| 4 | `job_template_id` | INT | Khóa ngoại → `job_templates(id)`, Cho phép rỗng | Mã mẫu công việc | Sinh từ Template |
| 5 | `name` | VARCHAR(255) | Không rỗng | Tên công việc |  |
| 6 | `description` | TEXT | Cho phép rỗng | Mô tả chi tiết |  |
| 7 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng | Số giờ dự kiến |  |
| 8 | `actual_hours` | DECIMAL(5,2) | Cho phép rỗng | Số giờ thực tế | Ghi khi Complete |
| 9 | `status` | ENUM (JobStatus) | 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'REWORK', 'PASSED'; Mặc định 'PLANNED' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 10 | `result_notes` | TEXT | Cho phép rỗng | Kết quả thực hiện |  |
| 11 | `is_rework` | BOOLEAN | Không rỗng; Mặc định false | Là công việc sửa lại | Rework từ QC Fail |
| 12 | `is_warranty` | BOOLEAN | Không rỗng; Mặc định false | is_warranty |  |
| 13 | `original_job_id` | INT | Cho phép rỗng | original_job_id |  |
| 14 | `parent_job_id` | INT | Cho phép rỗng | Mã job gốc | Link đến Job gốc nếu là Rework |
| 15 | `rework_source_qc_item_id` | INT | Khóa ngoại → `qc_items(id)`, Cho phép rỗng | rework_source_qc_item_id |  |
| 16 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người tạo |  |
| 17 | `started_at` | DATETIME | Cho phép rỗng | Thời điểm bắt đầu |  |
| 18 | `completed_at` | DATETIME | Cho phép rỗng | Thời điểm hoàn thành |  |
| 19 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 20 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.27. Liên kết vết lỗi với công việc xử lý (`job_findings`)

**job_findings**(id, job_id, finding_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã liên kết |  |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Không rỗng | Mã công việc |  |
| 3 | `finding_id` | INT | Khóa ngoại → `findings(id)`, Không rỗng | Mã phát hiện |  |

---

## 5.2.28. Nhân công thi công đầu việc (`job_labours`)

**job_labours**(id, job_id, job_type_id, description, employee_id, estimated_hours, price, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng nhân công |  |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Không rỗng | Mã công việc |  |
| 3 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`, Không rỗng | job_type_id |  |
| 4 | `description` | TEXT | Cho phép rỗng | Mô tả task cụ thể |  |
| 5 | `employee_id` | INT | Khóa ngoại → `employees(id)`, Cho phép rỗng | Mã kỹ thuật viên |  |
| 6 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng | Giờ ước tính |  |
| 7 | `price` | DECIMAL(12,2) | Không rỗng | price |  |
| 8 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 9 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.29. Phụ tùng cấp phát cho đầu việc (`job_parts`)

**job_parts**(id, job_id, item_id, status, is_warranty, planned_quantity, issued_quantity, returned_quantity, unit_price, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng phụ tùng |  |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Không rỗng | Mã công việc |  |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`, Không rỗng | Mã mặt hàng phụ tùng | Khóa ngoại → inventory_items(id) |
| 4 | `status` | ENUM (PartAllocationStatus) | 'PLANNED', 'RESERVED', 'ISSUED', 'USED', 'RETURNED'; Mặc định 'PLANNED' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 5 | `is_warranty` | BOOLEAN | Không rỗng; Mặc định false | is_warranty |  |
| 6 | `planned_quantity` | DECIMAL(10,2) | Không rỗng | Số lượng dự kiến |  |
| 7 | `issued_quantity` | DECIMAL(10,2) | Không rỗng; Mặc định 0 | issued_quantity |  |
| 8 | `returned_quantity` | DECIMAL(10,2) | Không rỗng; Mặc định 0 | returned_quantity |  |
| 9 | `unit_price` | DECIMAL(12,2) | Không rỗng | Đơn giá bán | Snapshot tại thời điểm khai báo |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 11 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

# NHÓM 7 – QUOTATION

*Quản lý lập báo giá, phiên bản báo giá bổ sung, chiết khấu và phê duyệt báo giá của khách hàng.*

---

## 5.2.30. Báo giá dịch vụ (`quotations`)

**quotations**(id, work_order_id, quotation_number, quotation_type, parent_quotation_id, status, subtotal, discount_amount, tax_rate, tax_amount, grand_total, sent_at, approved_at, approved_by_id, rejected_at, reject_reason, snapshot_at, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã báo giá |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc |  |
| 3 | `quotation_number` | VARCHAR(30) | Duy nhất, Không rỗng | Mã báo giá hiển thị | Auto-gen: QT-20260908-001 |
| 4 | `quotation_type` | ENUM (QuotationType) | 'PRIMARY', 'SUPPLEMENTARY'; Mặc định 'PRIMARY' | Loại báo giá | Chính hoặc bổ sung |
| 5 | `parent_quotation_id` | INT | Cho phép rỗng | parent_quotation_id |  |
| 6 | `status` | ENUM (QuotationStatus) | 'DRAFT', 'SENT', 'APPROVED', 'REJECTED'; Mặc định 'DRAFT' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 7 | `subtotal` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tổng tiền hàng trước thuế | VNĐ, cộng tổng từ các dòng chi tiết |
| 8 | `discount_amount` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tổng số tiền chiết khấu phiếu nhập | VNĐ |
| 9 | `tax_rate` | DECIMAL(5,4) | Không rỗng; Mặc định 0.1000 | Thuế suất GTGT (VAT) | %, hỗ trợ nút nhanh 0%, 8%, 10% và nhập tự do |
| 10 | `tax_amount` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tiền thuế GTGT (VAT) | subtotal * tax_rate / 100 |
| 11 | `grand_total` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tổng giá trị thanh toán của phiếu nhập | subtotal + tax_amount |
| 12 | `sent_at` | DATETIME | Cho phép rỗng | sent_at |  |
| 13 | `approved_at` | DATETIME | Cho phép rỗng | Thời điểm duyệt |  |
| 14 | `approved_by_id` | INT | Cho phép rỗng | Mã khách hàng duyệt |  |
| 15 | `rejected_at` | DATETIME | Cho phép rỗng | rejected_at |  |
| 16 | `reject_reason` | TEXT | Cho phép rỗng | Lý do từ chối |  |
| 17 | `snapshot_at` | DATETIME | Cho phép rỗng | snapshot_at |  |
| 18 | `created_by_id` | INT | Không rỗng | Cố vấn dịch vụ tạo |  |
| 19 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 20 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.31. Chi tiết dòng báo giá (`quotation_lines`)

**quotation_lines**(id, quotation_id, line_type, wo_service_id, job_id, job_labour_id, job_part_id, description, quantity, snapshot_unit_price, amount, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng báo giá |  |
| 2 | `quotation_id` | INT | Khóa ngoại → `quotations(id)`, Không rỗng | Mã báo giá |  |
| 3 | `line_type` | ENUM (LineType) | 'PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE' | Loại dòng |  |
| 4 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`, Cho phép rỗng | Truy vết Service |  |
| 5 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Cho phép rỗng | Truy vết Job |  |
| 6 | `job_labour_id` | INT | Khóa ngoại → `job_labours(id)`, Cho phép rỗng | Truy vết nhân công |  |
| 7 | `job_part_id` | INT | Khóa ngoại → `job_parts(id)`, Cho phép rỗng | Mã phụ tùng công việc được cấp phát | Khóa ngoại → job_parts(id) |
| 8 | `description` | VARCHAR(500) | Không rỗng | Mô tả hạng mục |  |
| 9 | `quantity` | DECIMAL(10,2) | Không rỗng | Số lượng nhập thực tế | Số lượng > 0 |
| 10 | `snapshot_unit_price` | DECIMAL(12,2) | Không rỗng | Đơn giá freeze | Snapshot tại thời điểm gửi/duyệt |
| 11 | `amount` | DECIMAL(12,2) | Không rỗng | Thành tiền | = quantity × snapshot_unit_price |
| 12 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |

---

# NHÓM 8 – QC & REWORK

*Quản lý hồ sơ nghiệm thu chất lượng công việc (QC) và kích hoạt quy trình làm lại (Rework).*

---

## 5.2.32. Biên bản nghiệm thu chất lượng (QC) (`qc_records`)

**qc_records**(id, wo_service_id, template_id, overall_result, notes, inspector_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu QC |  |
| 2 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`, Không rỗng | Mã dịch vụ | QC theo từng Service |
| 3 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`, Cho phép rỗng | Mã mẫu QC |  |
| 4 | `overall_result` | ENUM (QcResult) | 'PASS', 'FAIL' | Kết quả tổng |  |
| 5 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |
| 6 | `inspector_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người kiểm định |  |
| 7 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.33. Kết quả nghiệm thu từng tiêu chí QC (`qc_items`)

**qc_items**(id, qc_record_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã hạng mục QC |  |
| 2 | `qc_record_id` | INT | Khóa ngoại → `qc_records(id)`, Không rỗng | Mã phiếu QC |  |
| 3 | `template_item_id` | INT | Khóa ngoại → `inspection_template_items(id)`, Cho phép rỗng | Mã hạng mục mẫu |  |
| 4 | `item_name` | VARCHAR(255) | Không rỗng | Tên hạng mục |  |
| 5 | `result` | ENUM (QcResult) | 'PASS', 'FAIL' | Kết quả | Đạt / Không đạt |
| 6 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |

---

# NHÓM 9 – INVENTORY & PROCUREMENT

*Quản lý nhà cung cấp, danh mục phụ tùng (Master Data), mặt hàng tồn kho (SKU), chứng từ nhập kho, biến động thẻ kho (Stock Movement) và điều chỉnh kiểm kê.*

---

## 5.2.34. Nhà cung cấp phụ tùng (`suppliers`)

**suppliers**(id, code, name, tax_code, contact_person, phone, email, address, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã nhà cung cấp |  |
| 2 | `code` | VARCHAR(30) | Duy nhất, Cho phép rỗng | Mã định danh duy nhất | Ví dụ: SUP-001, CAT-001 |
| 3 | `name` | VARCHAR(255) | Không rỗng | Tên nhà cung cấp |  |
| 4 | `tax_code` | VARCHAR(30) | Cho phép rỗng | Mã số thuế của nhà cung cấp | Đối chiếu hóa đơn tài chính VAT |
| 5 | `contact_person` | VARCHAR(150) | Cho phép rỗng | Người liên hệ |  |
| 6 | `phone` | VARCHAR(20) | Cho phép rỗng | Số điện thoại |  |
| 7 | `email` | VARCHAR(255) | Cho phép rỗng | Địa chỉ email |  |
| 8 | `address` | TEXT | Cho phép rỗng | Địa chỉ |  |
| 9 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 11 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.35. Danh mục phụ tùng (Master Data) (`part_categories`)

**part_categories**(id, code, name, item_type, uom_id, description, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Khóa chính, tự tăng |  |
| 2 | `code` | VARCHAR(50) | Duy nhất, Không rỗng | Mã định danh duy nhất | Ví dụ: SUP-001, CAT-001 |
| 3 | `name` | VARCHAR(255) | Không rỗng | name |  |
| 4 | `item_type` | ENUM (ItemType) | 'PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY' | Phân loại vật tư kỹ thuật | PART (Phụ tùng), CONSUMABLE (Vật tư tiêu hao), CHEMICAL (Hóa chất), ACCESSORY (Phụ kiện) |
| 5 | `uom_id` | INT | Không rỗng | Mã đơn vị tính cơ sở | Khóa ngoại → system_catalogs(id) |
| 6 | `description` | TEXT | Cho phép rỗng | Mô tả chi tiết | Cho phép rỗng |
| 7 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động | TRUE = Đang hoạt động, FALSE = Vô hiệu hóa |
| 8 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo bản ghi | Mặc định CURRENT_TIMESTAMP |
| 9 | `updated_at` | DATETIME | Không rỗng | Thời điểm cập nhật cuối | Tự động cập nhật |

---

## 5.2.36. Mặt hàng kho phụ tùng (`inventory_items`)

**inventory_items**(id, part_category_id, sku, brand_id, selling_price, average_cost, on_hand, reorder_level, warranty_months, warranty_mileage, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã mặt hàng |  |
| 2 | `part_category_id` | INT | Khóa ngoại → `part_categories(id)`, Không rỗng | Mã phân loại danh mục phụ tùng | Khóa ngoại → part_categories(id) |
| 3 | `sku` | VARCHAR(50) | Duy nhất, Không rỗng | Mã quản lý phụ tùng (SKU) | Duy nhất, tự động sinh: VT-{Prefix}-{Hex} |
| 4 | `brand_id` | INT | Cho phép rỗng | Mã thương hiệu sản xuất | Khóa ngoại → system_catalogs(id), cho phép rỗng |
| 5 | `selling_price` | DECIMAL(15,2) | Không rỗng | Giá bán niêm yết cho khách hàng | VNĐ, không rỗng |
| 6 | `average_cost` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Giá vốn bình quân gia quyền di động | CT-INV01: Tính tự động theo Moving Weighted Average |
| 7 | `on_hand` | INT | Không rỗng; Mặc định 0 | Số lượng tồn kho thực tế khả dụng | CT-INV02: Nguyên tắc không âm kho |
| 8 | `reorder_level` | INT | Không rỗng; Mặc định 0 | Mức cảnh báo tồn an toàn | Gợi ý nhập bù kho tự động khi on_hand <= reorder_level |
| 9 | `warranty_months` | INT | Không rỗng; Mặc định 0 | Thời hạn bảo hành tiêu chuẩn (tháng) | Mặc định 12 tháng |
| 10 | `warranty_mileage` | INT | Không rỗng; Mặc định 0 | Giới hạn số km bảo hành tiêu chuẩn | Ví dụ 10.000 km |
| 11 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |
| 12 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 13 | `updated_at` | DATETIME | Không rỗng | Thời điểm cập nhật cuối |  |

---

## 5.2.37. Phiếu nhập kho phụ tùng (`goods_receipts`)

**goods_receipts**(id, receipt_number, supplier_id, receipt_type, status, reference_no, received_date, subtotal, discount_amount, tax_rate, tax_amount, grand_total, notes, cancel_reason, cancelled_at, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu nhập |  |
| 2 | `receipt_number` | VARCHAR(30) | Duy nhất, Không rỗng | Số chứng từ nhập kho | Duy nhất, tự động sinh: GR-YYYYMMDD-XXXX |
| 3 | `supplier_id` | INT | Khóa ngoại → `suppliers(id)`, Cho phép rỗng | Mã nhà cung cấp | NULL cho nhập tồn đầu kỳ |
| 4 | `receipt_type` | ENUM (ReceiptType) | 'PURCHASE', 'OPENING_STOCK' | Loại chứng từ nhập kho | PURCHASE (Nhập mua hàng từ NCC), OPENING_STOCK (Tồn ban đầu) |
| 5 | `status` | ENUM (GoodsReceiptStatus) | 'DRAFT', 'POSTED', 'CANCELLED'; Mặc định 'POSTED' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 6 | `reference_no` | VARCHAR(100) | Cho phép rỗng | Số hóa đơn VAT / Chứng từ giao hàng của NCC | Bắt buộc đối với nhập mua hàng |
| 7 | `received_date` | DATETIME | Không rỗng | Ngày lập / nhận hàng thực tế | Định dạng Date/DateTime |
| 8 | `subtotal` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Tổng tiền hàng trước thuế | VNĐ, cộng tổng từ các dòng chi tiết |
| 9 | `discount_amount` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Tổng số tiền chiết khấu phiếu nhập | VNĐ |
| 10 | `tax_rate` | DECIMAL(5,2) | Không rỗng; Mặc định 0 | Thuế suất GTGT (VAT) | %, hỗ trợ nút nhanh 0%, 8%, 10% và nhập tự do |
| 11 | `tax_amount` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Tiền thuế GTGT (VAT) | subtotal * tax_rate / 100 |
| 12 | `grand_total` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Tổng giá trị thanh toán của phiếu nhập | subtotal + tax_amount |
| 13 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |
| 14 | `cancel_reason` | TEXT | Cho phép rỗng | Lý do hủy chứng từ nhập kho | Bắt buộc nhập khi hủy phiếu đã ghi sổ POSTED |
| 15 | `cancelled_at` | DATETIME | Cho phép rỗng | Thời điểm hủy chứng từ | Cho phép rỗng |
| 16 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người tạo |  |
| 17 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.38. Chi tiết dòng phụ tùng nhập kho (`goods_receipt_items`)

**goods_receipt_items**(id, receipt_id, item_id, quantity, unit_cost, discount_rate, line_total, old_on_hand, old_average_cost, new_average_cost)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng nhập |  |
| 2 | `receipt_id` | INT | Khóa ngoại → `goods_receipts(id)`, Không rỗng | Mã phiếu nhập kho | Khóa ngoại → goods_receipts(id) |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`, Không rỗng | Mã mặt hàng phụ tùng | Khóa ngoại → inventory_items(id) |
| 4 | `quantity` | DECIMAL(10,2) | Không rỗng | Số lượng nhập thực tế | Số lượng > 0 |
| 5 | `unit_cost` | DECIMAL(12,4) | Không rỗng | Đơn giá mua vào (chưa trừ chiết khấu) | VNĐ |
| 6 | `discount_rate` | DECIMAL(5,2) | Không rỗng; Mặc định 0 | Tỷ lệ chiết khấu dòng hàng (%) | 0% - 100% |
| 7 | `line_total` | DECIMAL(15,2) | Không rỗng; Mặc định 0 | Thành tiền dòng hàng sau chiết khấu | quantity * unit_cost * (1 - discount_rate/100) |
| 8 | `old_on_hand` | INT | Cho phép rỗng | Snapshot số lượng tồn kho trước khi ghi sổ | Phục vụ hoàn nguyên kho khi hủy phiếu |
| 9 | `old_average_cost` | DECIMAL(15,2) | Cho phép rỗng | Snapshot giá vốn bình quân trước khi ghi sổ | Phục vụ hoàn nguyên giá vốn khi hủy phiếu |
| 10 | `new_average_cost` | DECIMAL(15,2) | Cho phép rỗng | Snapshot giá vốn bình quân mới sau khi ghi sổ | Ghi nhận giá vốn mới tính theo công thức CT-INV01 |

---

## 5.2.39. Lịch sử biến động Thẻ kho (Stock Card) (`stock_movements`)

**stock_movements**(id, item_id, movement_type, reference_type, reference_id, source_movement_id, job_id, job_part_id, quantity, unit_cost, balance_after, notes, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phát sinh kho |  |
| 2 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`, Không rỗng | Mã mặt hàng phụ tùng | Khóa ngoại → inventory_items(id) |
| 3 | `movement_type` | ENUM (MovementType) | 'RECEIPT', 'OPENING', 'ISSUE', 'RETURN', 'ADJUSTMENT' | Loại biến động tồn kho | RECEIPT (Nhập kho), ISSUE (Xuất thi công), ADJUSTMENT (Kiểm kê), RETURN (Trả kho) |
| 4 | `reference_type` | ENUM (ReferenceType) | 'GOODS_RECEIPT', 'JOB', 'ADJUSTMENT' | Loại chứng từ / nguồn phát sinh biến động | GOODS_RECEIPT, JOB, STOCK_ADJUSTMENT, MANUAL |
| 5 | `reference_id` | INT | Không rỗng | Mã ID của chứng từ tham chiếu | ID phiếu nhập hoặc Job |
| 6 | `source_movement_id` | INT | Cho phép rỗng | Mã bút toán kho gốc đối ứng | Tự tham chiếu → stock_movements(id) khi nhập trả/đảo bút toán |
| 7 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Cho phép rỗng | Mã công việc | Gắn Job nếu ISSUE/RETURN |
| 8 | `job_part_id` | INT | Khóa ngoại → `job_parts(id)`, Cho phép rỗng | Mã phụ tùng công việc được cấp phát | Khóa ngoại → job_parts(id) |
| 9 | `quantity` | DECIMAL(10,2) | Không rỗng | Số lượng nhập thực tế | Số lượng > 0 |
| 10 | `unit_cost` | DECIMAL(12,4) | Không rỗng | Đơn giá mua vào (chưa trừ chiết khấu) | VNĐ |
| 11 | `balance_after` | DECIMAL(10,2) | Không rỗng | Số dư tồn kho tức thời sau khi phát sinh biến động | Dùng kết xuất sổ Thẻ kho |
| 12 | `notes` | TEXT | Cho phép rỗng | Ghi chú |  |
| 13 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người thực hiện |  |
| 14 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.40. Phiếu điều chỉnh kiểm kê kho (`stock_adjustments`)

**stock_adjustments**(id, item_id, adjustment_quantity, reason, status, requested_by_id, approved_by_id, approved_at, reject_reason, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã phiếu điều chỉnh |  |
| 2 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`, Không rỗng | Mã mặt hàng phụ tùng | Khóa ngoại → inventory_items(id) |
| 3 | `adjustment_quantity` | DECIMAL(10,2) | Không rỗng | Số lượng điều chỉnh | Dương hoặc âm |
| 4 | `reason` | TEXT | Không rỗng | Lý do điều chỉnh |  |
| 5 | `status` | ENUM (AdjustmentStatus) | 'PENDING', 'APPROVED', 'REJECTED'; Mặc định 'PENDING' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 6 | `requested_by_id` | INT | Không rỗng | Người yêu cầu |  |
| 7 | `approved_by_id` | INT | Cho phép rỗng | Người phê duyệt | Manager |
| 8 | `approved_at` | DATETIME | Cho phép rỗng | Thời điểm phê duyệt |  |
| 9 | `reject_reason` | TEXT | Cho phép rỗng | Lý do từ chối |  |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

# NHÓM 10 – BILLING, PAYMENT & SETTLEMENT

*Quản lý hóa đơn dịch vụ, thanh toán (tiền mặt / chuyển khoản VietQR) và thủ tục bàn giao xe xuất xưởng.*

---

## 5.2.41. Hóa đơn dịch vụ (`invoices`)

**invoices**(id, work_order_id, invoice_number, status, subtotal, discount_amount, discount_reason, tax_amount, total_amount, amount_due, notes, issued_at, issued_by_id, paid_at, cancelled_at, cancel_reason, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã hóa đơn |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc |  |
| 3 | `invoice_number` | VARCHAR(30) | Duy nhất, Không rỗng | Số hóa đơn |  |
| 4 | `status` | ENUM (InvoiceStatus) | 'DRAFT', 'ISSUED', 'PAID', 'CANCELLED'; Mặc định 'DRAFT' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 5 | `subtotal` | DECIMAL(12,2) | Không rỗng | Tổng tiền hàng trước thuế | VNĐ, cộng tổng từ các dòng chi tiết |
| 6 | `discount_amount` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tổng số tiền chiết khấu phiếu nhập | VNĐ |
| 7 | `discount_reason` | VARCHAR(500) | Cho phép rỗng | discount_reason |  |
| 8 | `tax_amount` | DECIMAL(12,2) | Không rỗng; Mặc định 0 | Tiền thuế GTGT (VAT) | subtotal * tax_rate / 100 |
| 9 | `total_amount` | DECIMAL(12,2) | Không rỗng | Tổng tiền | CT-BILL01 |
| 10 | `amount_due` | DECIMAL(12,2) | Không rỗng | Số tiền còn phải trả | CT-BILL02 |
| 11 | `notes` | TEXT | Cho phép rỗng | Ghi chú bổ sung | Cho phép rỗng |
| 12 | `issued_at` | DATETIME | Cho phép rỗng | Thời điểm phát hành |  |
| 13 | `issued_by_id` | INT | Cho phép rỗng | issued_by_id |  |
| 14 | `paid_at` | DATETIME | Cho phép rỗng | paid_at |  |
| 15 | `cancelled_at` | DATETIME | Cho phép rỗng | Thời điểm hủy chứng từ | Cho phép rỗng |
| 16 | `cancel_reason` | TEXT | Cho phép rỗng | Lý do hủy chứng từ nhập kho | Bắt buộc nhập khi hủy phiếu đã ghi sổ POSTED |
| 17 | `created_by_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Nhân viên quầy tạo |  |
| 18 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |
| 19 | `updated_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm cập nhật cuối |  |

---

## 5.2.42. Dòng chi tiết hóa đơn (`invoice_lines`)

**invoice_lines**(id, invoice_id, line_type, quotation_line_id, wo_service_id, job_id, description, quantity, unit_price, amount, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã dòng hóa đơn |  |
| 2 | `invoice_id` | INT | Khóa ngoại → `invoices(id)`, Không rỗng | Mã hóa đơn |  |
| 3 | `line_type` | ENUM (LineType) | 'PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE' | Loại dòng |  |
| 4 | `quotation_line_id` | INT | Khóa ngoại → `quotation_lines(id)`, Cho phép rỗng | Truy vết báo giá |  |
| 5 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`, Cho phép rỗng | Truy vết dịch vụ |  |
| 6 | `job_id` | INT | Khóa ngoại → `jobs(id)`, Cho phép rỗng | Truy vết công việc |  |
| 7 | `description` | VARCHAR(500) | Không rỗng | Mô tả hạng mục |  |
| 8 | `quantity` | DECIMAL(10,2) | Không rỗng | Số lượng nhập thực tế | Số lượng > 0 |
| 9 | `unit_price` | DECIMAL(12,2) | Không rỗng | Đơn giá |  |
| 10 | `amount` | DECIMAL(12,2) | Không rỗng | Thành tiền |  |
| 11 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |

---

## 5.2.43. Giao dịch thanh toán (`payments`)

**payments**(id, invoice_id, payment_method, amount, tendered_amount, transaction_ref, gateway_provider, payment_url, payment_payload, status, failure_reason, expires_at, paid_at, received_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã thanh toán |  |
| 2 | `invoice_id` | INT | Khóa ngoại → `invoices(id)`, Không rỗng | Mã hóa đơn |  |
| 3 | `payment_method` | ENUM (PaymentMethod) | 'CASH', 'CARD', 'QR_TRANSFER' | Phương thức thanh toán chính | CASH, BANK_TRANSFER, VIETQR, CARD, SEPAY |
| 4 | `amount` | DECIMAL(12,2) | Không rỗng | Số tiền thanh toán | Không vượt Amount Due |
| 5 | `tendered_amount` | DECIMAL(12,2) | Cho phép rỗng | tendered_amount |  |
| 6 | `transaction_ref` | VARCHAR(255) | Duy nhất, Cho phép rỗng | Mã giao dịch | QR/Card transaction reference |
| 7 | `gateway_provider` | VARCHAR(50) | Cho phép rỗng | Cổng thanh toán điện tử | SEPAY, VNPAY, VIETQR |
| 8 | `payment_url` | TEXT | Cho phép rỗng | payment_url |  |
| 9 | `payment_payload` | JSON | Cho phép rỗng | Dữ liệu phản hồi webhook từ cổng thanh toán (JSON) | Lưu vết xác thực giao dịch tài chính |
| 10 | `status` | ENUM (PaymentStatus) | 'PENDING', 'SUCCESS', 'FAILED'; Mặc định 'PENDING' | Trạng thái chứng từ nhập kho | DRAFT (Lưu nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 11 | `failure_reason` | VARCHAR(500) | Cho phép rỗng | failure_reason |  |
| 12 | `expires_at` | DATETIME | Cho phép rỗng | expires_at |  |
| 13 | `paid_at` | DATETIME | Cho phép rỗng | Thời điểm thanh toán |  |
| 14 | `received_by_id` | INT | Khóa ngoại → `users(id)`, Cho phép rỗng | Nhân viên quầy nhận |  |
| 15 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.44. Biên bản bàn giao xe xuất xưởng (`vehicle_releases`)

**vehicle_releases**(id, work_order_id, release_notes, released_by_id, released_at, confirmed_by_customer_id, confirmed_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã bàn giao |  |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`, Không rỗng | Mã phiếu công việc | 1 WO → 1 Release |
| 3 | `release_notes` | TEXT | Cho phép rỗng | Ghi chú bàn giao |  |
| 4 | `released_by_id` | INT | Không rỗng | Cố vấn dịch vụ bàn giao |  |
| 5 | `released_at` | DATETIME | Không rỗng | Thời điểm bàn giao |  |
| 6 | `confirmed_by_customer_id` | INT | Cho phép rỗng | Khách hàng xác nhận | UC-14 |
| 7 | `confirmed_at` | DATETIME | Cho phép rỗng | Thời điểm xác nhận |  |

---

# NHÓM 11 – SYSTEM & SUPPORT

*Quản lý danh mục chung hệ thống, thông báo thời gian thực và nhật ký kiểm toán (Audit Log).*

---

## 5.2.45. Danh mục chung hệ thống (`system_catalogs`)

**system_catalogs**(id, catalog_type, name, description, is_active, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã danh mục |  |
| 2 | `catalog_type` | ENUM (CatalogType) | 'UOM', 'CANCEL_REASON', 'ADJUST_REASON', 'TERMS', 'BRAND // Thương hiệu phụ tùng (Vd: Bosch, Denso, Toyota OEM...)' | Loại danh mục | Đơn vị tính, lý do hủy, lý do điều chỉnh, điều khoản |
| 3 | `name` | VARCHAR(150) | Không rỗng | Tên mục |  |
| 4 | `description` | TEXT | Cho phép rỗng | Mô tả |  |
| 5 | `is_active` | BOOLEAN | Không rỗng; Mặc định true | Trạng thái hoạt động |  |
| 6 | `sort_order` | INT | Không rỗng; Mặc định 0 | Thứ tự hiển thị |  |

---

## 5.2.46. Thông báo hệ thống (`notifications`)

**notifications**(id, user_id, notification_type, title, message, entity_type, entity_id, is_read, read_at, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã thông báo |  |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`, Không rỗng | Người nhận |  |
| 3 | `notification_type` | ENUM (NotificationType) | 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'CHECKIN_READY', 'QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_ISSUED', 'PAYMENT_SUCCESS', 'VEHICLE_READY', 'BILLING_REQUEST', 'GENERAL' | Loại thông báo | Phân loại để filter/icon |
| 4 | `title` | VARCHAR(255) | Không rỗng | Tiêu đề |  |
| 5 | `message` | TEXT | Không rỗng | Nội dung |  |
| 6 | `entity_type` | VARCHAR(50) | Cho phép rỗng | Loại entity liên quan | 'appointment', 'work_order', 'quotation', 'invoice'... |
| 7 | `entity_id` | INT | Cho phép rỗng | ID entity liên quan | Dùng để deep-link |
| 8 | `is_read` | BOOLEAN | Không rỗng; Mặc định false | Đã đọc hay chưa |  |
| 9 | `read_at` | DATETIME | Cho phép rỗng | Thời điểm đánh dấu đã đọc |  |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm tạo |  |

---

## 5.2.47. Nhật ký kiểm toán hệ thống (`audit_logs`)

**audit_logs**(id, user_id, action, entity_type, entity_id, before_data, after_data, ip_address, user_agent, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT | Khóa chính, tự tăng | Mã nhật ký |  |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`, Cho phép rỗng | Người thực hiện | NULL = hệ thống tự động |
| 3 | `action` | ENUM (AuditAction) | 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE' | Hành động |  |
| 4 | `entity_type` | VARCHAR(50) | Không rỗng | Loại entity bị thay đổi | 'work_order', 'quotation', 'invoice', 'stock_movement', 'job', 'payment'... |
| 5 | `entity_id` | INT | Không rỗng | ID record bị thay đổi |  |
| 6 | `before_data` | JSON | Cho phép rỗng | Dữ liệu trước khi thay đổi | Snapshot JSON |
| 7 | `after_data` | JSON | Cho phép rỗng | Dữ liệu sau khi thay đổi | Snapshot JSON |
| 8 | `ip_address` | VARCHAR(45) | Cho phép rỗng | Địa chỉ IP | IPv4/IPv6 |
| 9 | `user_agent` | VARCHAR(500) | Cho phép rỗng | Thông tin trình duyệt |  |
| 10 | `created_at` | DATETIME | Không rỗng; Mặc định CURRENT_TIMESTAMP | Thời điểm ghi nhật ký |  |

---

