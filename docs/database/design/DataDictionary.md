# TỪ ĐIỂN DỮ LIỆU – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ

> **DBMS:** MySQL 8.x · **ORM:** Prisma · **Khóa chính:** INT AUTO_INCREMENT  
> **Phiên bản:** 1.0 · **Cập nhật:** 2026-09-08

---

## MỤC LỤC

| STT | Nhóm | Bảng | Số thứ tự bảng |
|-----|------|------|----------------|
| 1 | Identity & Access | users | Bảng 1 |
| 2 | Identity & Access | roles | Bảng 2 |
| 3 | Identity & Access | user_roles | Bảng 3 |
| 4 | Identity & Access | employees | Bảng 4 |
| 5 | Identity & Access | skills | Bảng 5 |
| 6 | Identity & Access | employee_skills | Bảng 6 |
| 7 | Customer & Vehicle | vehicles | Bảng 7 |
| 8 | Service Catalog & Pricing | service_categories | Bảng 8 |
| 9 | Service Catalog & Pricing | service_templates | Bảng 9 |
| 10 | Service Catalog & Pricing | vehicle_size_prices | Bảng 10 |
| 11 | Service Catalog & Pricing | job_types | Bảng 11 |
| 12 | Service Catalog & Pricing | job_templates | Bảng 12 |
| 13 | Service Catalog & Pricing | job_template_parts | Bảng 13 |
| 14 | Inspection & QC Templates | inspection_templates | Bảng 14 |
| 15 | Inspection & QC Templates | inspection_template_items | Bảng 15 |
| 16 | Appointment & Intake | appointments | Bảng 16 |
| 17 | Appointment & Intake | appointment_services | Bảng 17 |
| 18 | Appointment & Intake | intake_records | Bảng 18 |
| 19 | Work Order Core | work_orders | Bảng 19 |
| 20 | Work Order Core | check_ins | Bảng 20 |
| 21 | Work Order Core | wo_services | Bảng 21 |
| 22 | Work Order Core | inspections | Bảng 22 |
| 23 | Work Order Core | inspection_results | Bảng 23 |
| 24 | Work Order Core | findings | Bảng 24 |
| 25 | Work Order Core | jobs | Bảng 25 |
| 26 | Work Order Core | job_findings | Bảng 26 |
| 27 | Work Order Core | job_labours | Bảng 27 |
| 28 | Work Order Core | job_parts | Bảng 28 |
| 29 | Quotation | quotations | Bảng 29 |
| 30 | Quotation | quotation_lines | Bảng 30 |
| 31 | QC & Rework | qc_records | Bảng 31 |
| 32 | QC & Rework | qc_items | Bảng 32 |
| 33 | Inventory | suppliers | Bảng 33 |
| 34 | Inventory | inventory_items | Bảng 34 |
| 35 | Inventory | goods_receipts | Bảng 35 |
| 36 | Inventory | goods_receipt_items | Bảng 36 |
| 37 | Inventory | stock_movements | Bảng 37 |
| 38 | Inventory | stock_adjustments | Bảng 38 |
| 39 | Billing & Payment | billing_requests | Bảng 39 |
| 40 | Billing & Payment | invoices | Bảng 40 |
| 41 | Billing & Payment | invoice_lines | Bảng 41 |
| 42 | Billing & Payment | payments | Bảng 42 |
| 43 | Billing & Payment | vehicle_releases | Bảng 43 |
| 44 | System & Support | system_catalogs | Bảng 44 |
| 45 | System & Support | notifications | Bảng 45 |
| 46 | System & Support | audit_logs | Bảng 46 |

---

# NHÓM 1 – IDENTITY & ACCESS

---

## 3.1.1. Người dùng

**users**(id, email, phone, password_hash, full_name, address, user_type, is_active, otp_code, otp_expires_at, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã người dùng | |
| 2 | email | VARCHAR(255) | Duy nhất, không rỗng | Địa chỉ email đăng nhập | |
| 3 | phone | VARCHAR(20) | Duy nhất, cho phép rỗng | Số điện thoại | Customer bắt buộc, Staff có thể NULL |
| 4 | password_hash | VARCHAR(255) | Không rỗng | Mật khẩu đã băm | bcrypt/argon2 |
| 5 | full_name | VARCHAR(150) | Không rỗng | Họ và tên | |
| 6 | address | TEXT | Cho phép rỗng | Địa chỉ | Dùng cho Customer profile |
| 7 | user_type | ENUM | 'CUSTOMER', 'STAFF' | Loại tài khoản | Phân biệt khách hàng và nhân viên |
| 8 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | Khóa/mở khóa tài khoản |
| 9 | otp_code | VARCHAR(10) | Cho phép rỗng | Mã OTP đặt lại mật khẩu | |
| 10 | otp_expires_at | DATETIME | Cho phép rỗng | Thời điểm OTP hết hạn | Hiệu lực 5 phút |
| 11 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 12 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 1. Người dùng (users)*

---

## 3.1.2. Vai trò

**roles**(id, name, description)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã vai trò | |
| 2 | name | VARCHAR(50) | Duy nhất, không rỗng | Tên vai trò | CUSTOMER, FRONT_DESK, SERVICE_ADVISOR, SERVICE_MANAGER, ADMIN |
| 3 | description | VARCHAR(255) | Cho phép rỗng | Mô tả vai trò | |

*Bảng 2. Vai trò (roles)*

---

## 3.1.3. Phân quyền người dùng

**user_roles**(id, user_id, role_id)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phân quyền | |
| 2 | user_id | INT | Khóa ngoại → users(id), không rỗng | Mã người dùng | |
| 3 | role_id | INT | Khóa ngoại → roles(id), không rỗng | Mã vai trò | |
| | | | UNIQUE(user_id, role_id) | | Một người dùng có thể có nhiều vai trò |

*Bảng 3. Phân quyền người dùng (user_roles)*

---

## 3.1.4. Nhân viên

**employees**(id, user_id, full_name, position, is_active, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã nhân viên | |
| 2 | user_id | INT | Khóa ngoại → users(id), duy nhất, cho phép rỗng | Mã tài khoản liên kết | Employee có thể chưa có tài khoản |
| 3 | full_name | VARCHAR(150) | Không rỗng | Họ và tên nhân viên | |
| 4 | position | ENUM | 'TECHNICIAN', 'DETAILER', 'QC_STAFF', 'ADVISOR', 'OTHER' | Vị trí công việc | |
| 5 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |
| 6 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 7 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 4. Nhân viên (employees)*

---

## 3.1.5. Kỹ năng

**skills**(id, name, is_active)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã kỹ năng | |
| 2 | name | VARCHAR(100) | Không rỗng | Tên kỹ năng | Ví dụ: Engine Repair, Brake System |
| 3 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |

*Bảng 5. Kỹ năng (skills)*

---

## 3.1.6. Kỹ năng nhân viên

**employee_skills**(id, employee_id, skill_id)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã gán kỹ năng | |
| 2 | employee_id | INT | Khóa ngoại → employees(id), không rỗng | Mã nhân viên | |
| 3 | skill_id | INT | Khóa ngoại → skills(id), không rỗng | Mã kỹ năng | |
| | | | UNIQUE(employee_id, skill_id) | | Mỗi kỹ năng chỉ gán 1 lần cho 1 nhân viên |

*Bảng 6. Kỹ năng nhân viên (employee_skills)*

---

# NHÓM 2 – CUSTOMER & VEHICLE

---

## 3.2.1. Phương tiện

**vehicles**(id, customer_id, license_plate, make, model, year, color, vehicle_size, status, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phương tiện | |
| 2 | customer_id | INT | Khóa ngoại → users(id), không rỗng | Mã khách hàng sở hữu | |
| 3 | license_plate | VARCHAR(20) | Duy nhất, không rỗng | Biển số xe | Duy nhất toàn hệ thống |
| 4 | make | VARCHAR(100) | Không rỗng | Hãng xe | |
| 5 | model | VARCHAR(100) | Không rỗng | Dòng xe | |
| 6 | year | SMALLINT | Cho phép rỗng | Năm sản xuất | |
| 7 | color | VARCHAR(50) | Cho phép rỗng | Màu sắc | |
| 8 | vehicle_size | ENUM | 'SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK' | Kích thước xe | Dùng cho tính giá CT-PRICE04 |
| 9 | status | ENUM | 'ACTIVE', 'INACTIVE'; mặc định 'ACTIVE' | Trạng thái | Không xóa khi đã có Work Order |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 11 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 7. Phương tiện (vehicles)*

---

# NHÓM 3 – SERVICE CATALOG & PRICING

---

## 3.3.1. Danh mục dịch vụ

**service_categories**(id, name, description, is_active, sort_order)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã danh mục dịch vụ | |
| 2 | name | VARCHAR(100) | Không rỗng | Tên danh mục | REPAIR, MAINTENANCE, CAR_WASH, DETAILING |
| 3 | description | TEXT | Cho phép rỗng | Mô tả | |
| 4 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |
| 5 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |

*Bảng 8. Danh mục dịch vụ (service_categories)*

---

## 3.3.2. Mẫu dịch vụ

**service_templates**(id, category_id, name, description, pricing_type, fixed_price, is_active, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã mẫu dịch vụ | |
| 2 | category_id | INT | Khóa ngoại → service_categories(id), không rỗng | Mã danh mục dịch vụ | |
| 3 | name | VARCHAR(150) | Không rỗng | Tên mẫu dịch vụ | Ví dụ: "Bảo dưỡng 10.000km" |
| 4 | description | TEXT | Cho phép rỗng | Mô tả | |
| 5 | pricing_type | ENUM | 'FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS' | Loại tính giá | CT-PRICE01..05 |
| 6 | fixed_price | DECIMAL(12,2) | Cho phép rỗng | Giá cố định | Dùng khi pricing_type = FIXED |
| 7 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | Chỉ Active hiển thị cho Customer |
| 8 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 9 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 9. Mẫu dịch vụ (service_templates)*

---

## 3.3.3. Giá theo kích thước xe

**vehicle_size_prices**(id, service_template_id, vehicle_size, price)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã giá | |
| 2 | service_template_id | INT | Khóa ngoại → service_templates(id), không rỗng | Mã mẫu dịch vụ | |
| 3 | vehicle_size | ENUM | 'SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK' | Kích thước xe | |
| 4 | price | DECIMAL(12,2) | Không rỗng | Giá dịch vụ | |
| | | | UNIQUE(service_template_id, vehicle_size) | | Mỗi kích thước xe chỉ có 1 mức giá |

*Bảng 10. Giá theo kích thước xe (vehicle_size_prices)*

---

## 3.3.4. Loại công việc

**job_types**(id, name, description, hourly_rate, is_active)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã loại công việc | |
| 2 | name | VARCHAR(150) | Không rỗng | Tên loại công việc | |
| 3 | description | TEXT | Cho phép rỗng | Mô tả | |
| 4 | hourly_rate | DECIMAL(12,2) | Không rỗng | Đơn giá nhân công theo giờ | CT-PRICE01: Labour Amount = Hours × Rate |
| 5 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |

*Bảng 11. Loại công việc (job_types)*

---

## 3.3.5. Mẫu công việc

**job_templates**(id, job_type_id, service_template_id, name, estimated_hours, requires_qc)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã mẫu công việc | |
| 2 | job_type_id | INT | Khóa ngoại → job_types(id), không rỗng | Mã loại công việc | |
| 3 | service_template_id | INT | Khóa ngoại → service_templates(id), cho phép rỗng | Mã mẫu dịch vụ | Sinh Job từ mẫu dịch vụ |
| 4 | name | VARCHAR(150) | Không rỗng | Tên mẫu công việc | |
| 5 | estimated_hours | DECIMAL(5,2) | Không rỗng | Số giờ dự kiến | |
| 6 | requires_qc | BOOLEAN | Mặc định TRUE | Yêu cầu kiểm định chất lượng | |

*Bảng 12. Mẫu công việc (job_templates)*

---

## 3.3.6. Phụ tùng mặc định của mẫu công việc

**job_template_parts**(id, job_template_id, item_id, default_quantity)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng phụ tùng mẫu | |
| 2 | job_template_id | INT | Khóa ngoại → job_templates(id), không rỗng | Mã mẫu công việc | |
| 3 | item_id | INT | Khóa ngoại → inventory_items(id), không rỗng | Mã mặt hàng kho | |
| 4 | default_quantity | DECIMAL(10,2) | Không rỗng | Số lượng mặc định | |

*Bảng 13. Phụ tùng mặc định của mẫu công việc (job_template_parts)*

---

# NHÓM 4 – INSPECTION & QC TEMPLATES

---

## 3.4.1. Mẫu kiểm tra

**inspection_templates**(id, service_template_id, template_type, name, is_active)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã mẫu kiểm tra | |
| 2 | service_template_id | INT | Khóa ngoại → service_templates(id), cho phép rỗng | Mã mẫu dịch vụ | NULL = áp dụng chung |
| 3 | template_type | ENUM | 'INSPECTION', 'QC' | Loại mẫu | Kiểm tra ban đầu vs Kiểm định chất lượng |
| 4 | name | VARCHAR(150) | Không rỗng | Tên mẫu kiểm tra | |
| 5 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |

*Bảng 14. Mẫu kiểm tra (inspection_templates)*

---

## 3.4.2. Hạng mục mẫu kiểm tra

**inspection_template_items**(id, template_id, name, is_required, sort_order)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã hạng mục | |
| 2 | template_id | INT | Khóa ngoại → inspection_templates(id), không rỗng | Mã mẫu kiểm tra | |
| 3 | name | VARCHAR(255) | Không rỗng | Tên hạng mục | |
| 4 | is_required | BOOLEAN | Mặc định TRUE | Bắt buộc hay không | |
| 5 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |

*Bảng 15. Hạng mục mẫu kiểm tra (inspection_template_items)*

---

# NHÓM 5 – APPOINTMENT & INTAKE

---

## 3.5.1. Lịch hẹn

**appointments**(id, customer_id, vehicle_id, scheduled_date, scheduled_time, status, cancel_reason, notes, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã lịch hẹn | |
| 2 | customer_id | INT | Khóa ngoại → users(id), không rỗng | Mã khách hàng | |
| 3 | vehicle_id | INT | Khóa ngoại → vehicles(id), không rỗng | Mã phương tiện | |
| 4 | scheduled_date | DATE | Không rỗng | Ngày hẹn | |
| 5 | scheduled_time | TIME | Không rỗng | Giờ hẹn | |
| 6 | status | ENUM | 'REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'ARRIVED', 'CANCELLED'; mặc định 'REQUESTED' | Trạng thái lịch hẹn | State machine |
| 7 | cancel_reason | TEXT | Cho phép rỗng | Lý do hủy | Bắt buộc khi status = CANCELLED |
| 8 | notes | TEXT | Cho phép rỗng | Ghi chú | |
| 9 | created_by_id | INT | Khóa ngoại → users(id), cho phép rỗng | Người tạo | Customer hoặc Front Desk Staff |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 11 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 16. Lịch hẹn (appointments)*

---

## 3.5.2. Dịch vụ mong muốn khi đặt lịch

**appointment_services**(id, appointment_id, service_template_id)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dịch vụ lịch hẹn | |
| 2 | appointment_id | INT | Khóa ngoại → appointments(id), không rỗng | Mã lịch hẹn | |
| 3 | service_template_id | INT | Khóa ngoại → service_templates(id), không rỗng | Mã mẫu dịch vụ | |

*Bảng 17. Dịch vụ mong muốn khi đặt lịch (appointment_services)*

---

## 3.5.3. Phiếu tiếp nhận

**intake_records**(id, customer_id, vehicle_id, intake_type, arrived_at, tow_company, notes, created_by_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu tiếp nhận | |
| 2 | customer_id | INT | Khóa ngoại → users(id), không rỗng | Mã khách hàng | |
| 3 | vehicle_id | INT | Khóa ngoại → vehicles(id), không rỗng | Mã phương tiện | |
| 4 | intake_type | ENUM | 'WALK_IN', 'TOW_IN' | Loại tiếp nhận | Walk-in hoặc Tow-in |
| 5 | arrived_at | DATETIME | Không rỗng | Thời điểm xe đến | |
| 6 | tow_company | VARCHAR(255) | Cho phép rỗng | Tên người/đơn vị bàn giao | Chỉ dùng cho Tow-in |
| 7 | notes | TEXT | Cho phép rỗng | Nhu cầu dịch vụ | |
| 8 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Nhân viên quầy tạo | |
| 9 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 18. Phiếu tiếp nhận (intake_records)*

---

# NHÓM 6 – WORK ORDER CORE

---

## 3.6.1. Phiếu công việc

**work_orders**(id, wo_number, customer_id, vehicle_id, advisor_id, appointment_id, intake_record_id, status, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu công việc | |
| 2 | wo_number | VARCHAR(20) | Duy nhất, không rỗng | Mã phiếu hiển thị | Auto-generate: WO-20260908-001 |
| 3 | customer_id | INT | Khóa ngoại → users(id), không rỗng | Mã khách hàng | |
| 4 | vehicle_id | INT | Khóa ngoại → vehicles(id), không rỗng | Mã phương tiện | |
| 5 | advisor_id | INT | Khóa ngoại → users(id), không rỗng | Mã cố vấn dịch vụ phụ trách | |
| 6 | appointment_id | INT | Khóa ngoại → appointments(id), cho phép rỗng | Mã lịch hẹn | NULL nếu Walk-in/Tow-in |
| 7 | intake_record_id | INT | Khóa ngoại → intake_records(id), cho phép rỗng | Mã phiếu tiếp nhận | NULL nếu từ Appointment |
| 8 | status | ENUM | 'DRAFT', 'IN_PLANNING', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'BILLING_REQUESTED', 'FINANCIAL_CLEARED', 'RELEASED', 'CLOSED', 'CANCELLED'; mặc định 'DRAFT' | Trạng thái phiếu | |
| 9 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người tạo | |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 11 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 19. Phiếu công việc (work_orders)*

---

## 3.6.2. Ghi nhận tình trạng xe

**check_ins**(id, work_order_id, mileage, fuel_level, complaint, belongings, exterior_condition, confirmed_by_customer_id, confirmed_at, evidence_urls, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã ghi nhận | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), duy nhất, không rỗng | Mã phiếu công việc | Quan hệ 1:1 với work_orders |
| 3 | mileage | INT | Không rỗng | Số km hiện tại | |
| 4 | fuel_level | ENUM | 'EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL' | Mức xăng/nhiên liệu | |
| 5 | complaint | TEXT | Không rỗng | Phàn nàn/yêu cầu của khách | |
| 6 | belongings | TEXT | Cho phép rỗng | Tài sản trong xe | |
| 7 | exterior_condition | TEXT | Không rỗng | Tình trạng bên ngoài | |
| 8 | confirmed_by_customer_id | INT | Khóa ngoại → users(id), cho phép rỗng | Mã khách hàng xác nhận | UC-10 Customer confirm |
| 9 | confirmed_at | DATETIME | Cho phép rỗng | Thời điểm xác nhận | |
| 10 | evidence_urls | JSON | Cho phép rỗng | Mảng URL hình ảnh minh chứng | Cloudinary URL |
| 11 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người ghi nhận | |
| 12 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 13 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 20. Ghi nhận tình trạng xe (check_ins)*

---

## 3.6.3. Dịch vụ trong phiếu công việc

**wo_services**(id, work_order_id, service_template_id, name, pricing_type, status, sort_order, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dịch vụ trong phiếu | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), không rỗng | Mã phiếu công việc | |
| 3 | service_template_id | INT | Khóa ngoại → service_templates(id), cho phép rỗng | Mã mẫu dịch vụ | NULL = custom service |
| 4 | name | VARCHAR(255) | Không rỗng | Tên dịch vụ | Snapshot tên từ template |
| 5 | pricing_type | ENUM | 'FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS' | Loại tính giá | Snapshot |
| 6 | status | ENUM | 'PENDING', 'IN_PROGRESS', 'COMPLETED'; mặc định 'PENDING' | Trạng thái dịch vụ | QC Pass → COMPLETED |
| 7 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |
| 8 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 9 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 21. Dịch vụ trong phiếu công việc (wo_services)*

---

## 3.6.4. Phiếu kiểm tra xe

**inspections**(id, work_order_id, wo_service_id, template_id, status, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu kiểm tra | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), không rỗng | Mã phiếu công việc | |
| 3 | wo_service_id | INT | Khóa ngoại → wo_services(id), cho phép rỗng | Mã dịch vụ | Inspection có thể gắn Service |
| 4 | template_id | INT | Khóa ngoại → inspection_templates(id), cho phép rỗng | Mã mẫu kiểm tra | |
| 5 | status | ENUM | 'IN_PROGRESS', 'COMPLETED'; mặc định 'IN_PROGRESS' | Trạng thái | |
| 6 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người kiểm tra | |
| 7 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 8 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 22. Phiếu kiểm tra xe (inspections)*

---

## 3.6.5. Kết quả kiểm tra từng hạng mục

**inspection_results**(id, inspection_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã kết quả | |
| 2 | inspection_id | INT | Khóa ngoại → inspections(id), không rỗng | Mã phiếu kiểm tra | |
| 3 | template_item_id | INT | Khóa ngoại → inspection_template_items(id), cho phép rỗng | Mã hạng mục mẫu | |
| 4 | item_name | VARCHAR(255) | Không rỗng | Tên hạng mục | Snapshot tên hạng mục |
| 5 | result | ENUM | 'PASS', 'FAIL', 'MONITOR' | Kết quả kiểm tra | Đạt / Không đạt / Cần theo dõi |
| 6 | notes | TEXT | Cho phép rỗng | Ghi chú | |

*Bảng 23. Kết quả kiểm tra từng hạng mục (inspection_results)*

---

## 3.6.6. Phát hiện vấn đề

**findings**(id, inspection_id, description, severity, recommendation, evidence_urls, is_visible_to_customer, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phát hiện | |
| 2 | inspection_id | INT | Khóa ngoại → inspections(id), không rỗng | Mã phiếu kiểm tra | |
| 3 | description | TEXT | Không rỗng | Mô tả vấn đề | |
| 4 | severity | ENUM | 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'; mặc định 'MEDIUM' | Mức độ nghiêm trọng | |
| 5 | recommendation | TEXT | Cho phép rỗng | Đề xuất xử lý | |
| 6 | evidence_urls | JSON | Cho phép rỗng | Mảng URL hình ảnh minh chứng | Cloudinary URL |
| 7 | is_visible_to_customer | BOOLEAN | Mặc định TRUE | Hiển thị cho khách hàng | Customer không thấy internal note |
| 8 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người phát hiện | |
| 9 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 10 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 24. Phát hiện vấn đề (findings)*

---

## 3.6.7. Công việc

**jobs**(id, wo_service_id, job_type_id, job_template_id, name, description, estimated_hours, actual_hours, status, result_notes, is_rework, parent_job_id, created_by_id, started_at, completed_at, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã công việc | |
| 2 | wo_service_id | INT | Khóa ngoại → wo_services(id), không rỗng | Mã dịch vụ | Job thuộc đúng 1 Service |
| 3 | job_type_id | INT | Khóa ngoại → job_types(id), cho phép rỗng | Mã loại công việc | |
| 4 | job_template_id | INT | Khóa ngoại → job_templates(id), cho phép rỗng | Mã mẫu công việc | Sinh từ Template |
| 5 | name | VARCHAR(255) | Không rỗng | Tên công việc | |
| 6 | description | TEXT | Cho phép rỗng | Mô tả chi tiết | |
| 7 | estimated_hours | DECIMAL(5,2) | Cho phép rỗng | Số giờ dự kiến | |
| 8 | actual_hours | DECIMAL(5,2) | Cho phép rỗng | Số giờ thực tế | Ghi khi Complete |
| 9 | status | ENUM | 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'REWORK'; mặc định 'PLANNED' | Trạng thái | |
| 10 | result_notes | TEXT | Cho phép rỗng | Kết quả thực hiện | |
| 11 | is_rework | BOOLEAN | Mặc định FALSE | Là công việc sửa lại | Rework từ QC Fail |
| 12 | parent_job_id | INT | Khóa ngoại → jobs(id), cho phép rỗng | Mã job gốc | Link đến Job gốc nếu là Rework |
| 13 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người tạo | |
| 14 | started_at | DATETIME | Cho phép rỗng | Thời điểm bắt đầu | |
| 15 | completed_at | DATETIME | Cho phép rỗng | Thời điểm hoàn thành | |
| 16 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 17 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 25. Công việc (jobs)*

---

## 3.6.8. Liên kết phát hiện – công việc

**job_findings**(id, job_id, finding_id)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã liên kết | |
| 2 | job_id | INT | Khóa ngoại → jobs(id), không rỗng | Mã công việc | |
| 3 | finding_id | INT | Khóa ngoại → findings(id), không rỗng | Mã phát hiện | |
| | | | UNIQUE(job_id, finding_id) | | Finding ↔ Job quan hệ N:M |

*Bảng 26. Liên kết phát hiện – công việc (job_findings)*

---

## 3.6.9. Dòng nhân công

**job_labours**(id, job_id, labour_type, description, employee_id, estimated_hours, billable_hours, hourly_rate, amount, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng nhân công | |
| 2 | job_id | INT | Khóa ngoại → jobs(id), không rỗng | Mã công việc | |
| 3 | labour_type | VARCHAR(100) | Không rỗng | Loại nhân công | Từ danh mục đã cấu hình |
| 4 | description | TEXT | Cho phép rỗng | Mô tả task cụ thể | |
| 5 | employee_id | INT | Khóa ngoại → employees(id), cho phép rỗng | Mã kỹ thuật viên | |
| 6 | estimated_hours | DECIMAL(5,2) | Không rỗng | Giờ ước tính | |
| 7 | billable_hours | DECIMAL(5,2) | Cho phép rỗng | Giờ thanh toán | |
| 8 | hourly_rate | DECIMAL(12,2) | Không rỗng | Đơn giá giờ công | Snapshot từ Job Type |
| 9 | amount | DECIMAL(12,2) | Cột tính toán (STORED) | Thành tiền | = IFNULL(billable_hours, estimated_hours) × hourly_rate |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 11 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 27. Dòng nhân công (job_labours)*

---

## 3.6.10. Dòng phụ tùng/vật tư

**job_parts**(id, job_id, item_id, planned_quantity, used_quantity, unit_price, amount, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng phụ tùng | |
| 2 | job_id | INT | Khóa ngoại → jobs(id), không rỗng | Mã công việc | |
| 3 | item_id | INT | Khóa ngoại → inventory_items(id), không rỗng | Mã mặt hàng kho | |
| 4 | planned_quantity | DECIMAL(10,2) | Không rỗng | Số lượng dự kiến | |
| 5 | used_quantity | DECIMAL(10,2) | Cho phép rỗng | Số lượng thực tế | Cập nhật sau khi Complete |
| 6 | unit_price | DECIMAL(12,2) | Không rỗng | Đơn giá bán | Snapshot tại thời điểm khai báo |
| 7 | amount | DECIMAL(12,2) | Cột tính toán (STORED) | Thành tiền | = IFNULL(used_quantity, planned_quantity) × unit_price |
| 8 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 9 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 28. Dòng phụ tùng/vật tư (job_parts)*

---

# NHÓM 7 – QUOTATION

---

## 3.7.1. Báo giá

**quotations**(id, work_order_id, quotation_number, quotation_type, status, subtotal, discount_amount, tax_rate, tax_amount, grand_total, approved_at, approved_by_id, reject_reason, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã báo giá | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), không rỗng | Mã phiếu công việc | |
| 3 | quotation_number | VARCHAR(30) | Duy nhất, không rỗng | Mã báo giá hiển thị | Auto-gen: QT-20260908-001 |
| 4 | quotation_type | ENUM | 'PRIMARY', 'SUPPLEMENTARY'; mặc định 'PRIMARY' | Loại báo giá | Chính hoặc bổ sung |
| 5 | status | ENUM | 'DRAFT', 'SENT', 'APPROVED', 'REJECTED'; mặc định 'DRAFT' | Trạng thái | |
| 6 | subtotal | DECIMAL(12,2) | Mặc định 0 | Tổng trước giảm giá/thuế | |
| 7 | discount_amount | DECIMAL(12,2) | Mặc định 0 | Số tiền giảm giá | |
| 8 | tax_rate | DECIMAL(5,4) | Mặc định 0.1000 | Thuế suất | 10% VAT |
| 9 | tax_amount | DECIMAL(12,2) | Mặc định 0 | Số tiền thuế | |
| 10 | grand_total | DECIMAL(12,2) | Mặc định 0 | Tổng cộng | CT-PRICE05 |
| 11 | approved_at | DATETIME | Cho phép rỗng | Thời điểm duyệt | |
| 12 | approved_by_id | INT | Khóa ngoại → users(id), cho phép rỗng | Mã khách hàng duyệt | |
| 13 | reject_reason | TEXT | Cho phép rỗng | Lý do từ chối | |
| 14 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Cố vấn dịch vụ tạo | |
| 15 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 16 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 29. Báo giá (quotations)*

---

## 3.7.2. Dòng báo giá

**quotation_lines**(id, quotation_id, line_type, wo_service_id, job_id, job_labour_id, job_part_id, description, quantity, snapshot_unit_price, amount, sort_order)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng báo giá | |
| 2 | quotation_id | INT | Khóa ngoại → quotations(id), không rỗng | Mã báo giá | |
| 3 | line_type | ENUM | 'PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE' | Loại dòng | |
| 4 | wo_service_id | INT | Khóa ngoại → wo_services(id), cho phép rỗng | Truy vết Service | |
| 5 | job_id | INT | Khóa ngoại → jobs(id), cho phép rỗng | Truy vết Job | |
| 6 | job_labour_id | INT | Khóa ngoại → job_labours(id), cho phép rỗng | Truy vết nhân công | |
| 7 | job_part_id | INT | Khóa ngoại → job_parts(id), cho phép rỗng | Truy vết phụ tùng | |
| 8 | description | VARCHAR(500) | Không rỗng | Mô tả hạng mục | |
| 9 | quantity | DECIMAL(10,2) | Không rỗng | Số lượng | |
| 10 | snapshot_unit_price | DECIMAL(12,2) | Không rỗng | Đơn giá freeze | Snapshot tại thời điểm gửi/duyệt |
| 11 | amount | DECIMAL(12,2) | Không rỗng | Thành tiền | = quantity × snapshot_unit_price |
| 12 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |

*Bảng 30. Dòng báo giá (quotation_lines)*

---

# NHÓM 8 – QC & REWORK

---

## 3.8.1. Phiếu kiểm định chất lượng

**qc_records**(id, wo_service_id, template_id, overall_result, notes, inspector_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu QC | |
| 2 | wo_service_id | INT | Khóa ngoại → wo_services(id), không rỗng | Mã dịch vụ | QC theo từng Service |
| 3 | template_id | INT | Khóa ngoại → inspection_templates(id), cho phép rỗng | Mã mẫu QC | |
| 4 | overall_result | ENUM | 'PASS', 'FAIL' | Kết quả tổng | |
| 5 | notes | TEXT | Cho phép rỗng | Ghi chú | |
| 6 | inspector_id | INT | Khóa ngoại → users(id), không rỗng | Người kiểm định | |
| 7 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 31. Phiếu kiểm định chất lượng (qc_records)*

---

## 3.8.2. Hạng mục kiểm định chất lượng

**qc_items**(id, qc_record_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã hạng mục QC | |
| 2 | qc_record_id | INT | Khóa ngoại → qc_records(id), không rỗng | Mã phiếu QC | |
| 3 | template_item_id | INT | Khóa ngoại → inspection_template_items(id), cho phép rỗng | Mã hạng mục mẫu | |
| 4 | item_name | VARCHAR(255) | Không rỗng | Tên hạng mục | |
| 5 | result | ENUM | 'PASS', 'FAIL' | Kết quả | Đạt / Không đạt |
| 6 | notes | TEXT | Cho phép rỗng | Ghi chú | |

*Bảng 32. Hạng mục kiểm định chất lượng (qc_items)*

---

# NHÓM 9 – INVENTORY

---

## 3.9.1. Nhà cung cấp

**suppliers**(id, name, contact_person, phone, email, address, is_active, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã nhà cung cấp | |
| 2 | name | VARCHAR(255) | Không rỗng | Tên nhà cung cấp | |
| 3 | contact_person | VARCHAR(150) | Cho phép rỗng | Người liên hệ | |
| 4 | phone | VARCHAR(20) | Cho phép rỗng | Số điện thoại | |
| 5 | email | VARCHAR(255) | Cho phép rỗng | Địa chỉ email | |
| 6 | address | TEXT | Cho phép rỗng | Địa chỉ | |
| 7 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |
| 8 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 9 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 33. Nhà cung cấp (suppliers)*

---

## 3.9.2. Mặt hàng kho

**inventory_items**(id, sku, name, item_type, uom_id, selling_price, average_cost, on_hand, reorder_level, is_active, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã mặt hàng | |
| 2 | sku | VARCHAR(50) | Duy nhất, không rỗng | Mã SKU | |
| 3 | name | VARCHAR(255) | Không rỗng | Tên mặt hàng | |
| 4 | item_type | ENUM | 'PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY' | Loại mặt hàng | |
| 5 | uom_id | INT | Khóa ngoại → system_catalogs(id), không rỗng | Đơn vị tính | |
| 6 | selling_price | DECIMAL(12,2) | Không rỗng | Giá bán hiện tại | |
| 7 | average_cost | DECIMAL(12,4) | Mặc định 0 | Giá vốn bình quân | CT-INV01: Moving Weighted Average |
| 8 | on_hand | DECIMAL(10,2) | Mặc định 0 | Số lượng tồn kho | CT-INV02 |
| 9 | reorder_level | DECIMAL(10,2) | Mặc định 0 | Mức đặt hàng lại | |
| 10 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |
| 11 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 12 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 34. Mặt hàng kho (inventory_items)*

---

## 3.9.3. Phiếu nhập kho

**goods_receipts**(id, receipt_number, supplier_id, receipt_type, reference_no, received_date, notes, created_by_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu nhập | |
| 2 | receipt_number | VARCHAR(30) | Duy nhất, không rỗng | Mã phiếu hiển thị | |
| 3 | supplier_id | INT | Khóa ngoại → suppliers(id), cho phép rỗng | Mã nhà cung cấp | NULL cho nhập tồn đầu kỳ |
| 4 | receipt_type | ENUM | 'PURCHASE', 'OPENING_STOCK' | Loại nhập kho | |
| 5 | reference_no | VARCHAR(100) | Cho phép rỗng | Số hóa đơn nhà cung cấp | |
| 6 | received_date | DATE | Không rỗng | Ngày nhận hàng | |
| 7 | notes | TEXT | Cho phép rỗng | Ghi chú | |
| 8 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người tạo | |
| 9 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 35. Phiếu nhập kho (goods_receipts)*

---

## 3.9.4. Chi tiết phiếu nhập kho

**goods_receipt_items**(id, receipt_id, item_id, quantity, unit_cost)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng nhập | |
| 2 | receipt_id | INT | Khóa ngoại → goods_receipts(id), không rỗng | Mã phiếu nhập | |
| 3 | item_id | INT | Khóa ngoại → inventory_items(id), không rỗng | Mã mặt hàng | |
| 4 | quantity | DECIMAL(10,2) | Không rỗng | Số lượng nhận | |
| 5 | unit_cost | DECIMAL(12,4) | Không rỗng | Đơn giá mua vào | |

*Bảng 36. Chi tiết phiếu nhập kho (goods_receipt_items)*

---

## 3.9.5. Lịch sử kho (Stock Card)

**stock_movements**(id, item_id, movement_type, reference_type, reference_id, job_id, quantity, unit_cost, balance_after, notes, created_by_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phát sinh kho | |
| 2 | item_id | INT | Khóa ngoại → inventory_items(id), không rỗng | Mã mặt hàng | |
| 3 | movement_type | ENUM | 'RECEIPT', 'OPENING', 'ISSUE', 'RETURN', 'ADJUSTMENT' | Loại phát sinh | |
| 4 | reference_type | ENUM | 'GOODS_RECEIPT', 'JOB', 'ADJUSTMENT' | Nguồn phát sinh | |
| 5 | reference_id | INT | Không rỗng | ID phiếu tham chiếu | ID phiếu nhập / job / adjustment |
| 6 | job_id | INT | Khóa ngoại → jobs(id), cho phép rỗng | Mã công việc | Gắn Job nếu ISSUE/RETURN |
| 7 | quantity | DECIMAL(10,2) | Không rỗng | Số lượng | Dương = nhập, Âm = xuất |
| 8 | unit_cost | DECIMAL(12,4) | Không rỗng | Giá vốn đơn vị | Tại thời điểm giao dịch |
| 9 | balance_after | DECIMAL(10,2) | Không rỗng | Tồn sau giao dịch | |
| 10 | notes | TEXT | Cho phép rỗng | Ghi chú | |
| 11 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Người thực hiện | |
| 12 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 37. Lịch sử kho (stock_movements)*

---

## 3.9.6. Phiếu điều chỉnh kho

**stock_adjustments**(id, item_id, adjustment_quantity, reason, status, requested_by_id, approved_by_id, approved_at, reject_reason, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã phiếu điều chỉnh | |
| 2 | item_id | INT | Khóa ngoại → inventory_items(id), không rỗng | Mã mặt hàng | |
| 3 | adjustment_quantity | DECIMAL(10,2) | Không rỗng | Số lượng điều chỉnh | Dương hoặc âm |
| 4 | reason | TEXT | Không rỗng | Lý do điều chỉnh | |
| 5 | status | ENUM | 'PENDING', 'APPROVED', 'REJECTED'; mặc định 'PENDING' | Trạng thái | |
| 6 | requested_by_id | INT | Khóa ngoại → users(id), không rỗng | Người yêu cầu | |
| 7 | approved_by_id | INT | Khóa ngoại → users(id), cho phép rỗng | Người phê duyệt | Manager |
| 8 | approved_at | DATETIME | Cho phép rỗng | Thời điểm phê duyệt | |
| 9 | reject_reason | TEXT | Cho phép rỗng | Lý do từ chối | |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 38. Phiếu điều chỉnh kho (stock_adjustments)*

---

# NHÓM 10 – BILLING & PAYMENT

---

## 3.10.1. Yêu cầu thanh toán

**billing_requests**(id, work_order_id, status, requested_by_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã yêu cầu | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), duy nhất, không rỗng | Mã phiếu công việc | 1 WO → 1 Billing Request |
| 3 | status | ENUM | 'PENDING', 'PROCESSED'; mặc định 'PENDING' | Trạng thái | |
| 4 | requested_by_id | INT | Khóa ngoại → users(id), không rỗng | Cố vấn dịch vụ gửi | |
| 5 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 39. Yêu cầu thanh toán (billing_requests)*

---

## 3.10.2. Hóa đơn

**invoices**(id, work_order_id, invoice_number, status, subtotal, discount_amount, tax_amount, total_amount, amount_due, issued_at, created_by_id, created_at, updated_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã hóa đơn | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), không rỗng | Mã phiếu công việc | |
| 3 | invoice_number | VARCHAR(30) | Duy nhất, không rỗng | Số hóa đơn | |
| 4 | status | ENUM | 'DRAFT', 'ISSUED', 'PAID', 'CANCELLED'; mặc định 'DRAFT' | Trạng thái | |
| 5 | subtotal | DECIMAL(12,2) | Không rỗng | Tổng phụ | |
| 6 | discount_amount | DECIMAL(12,2) | Mặc định 0 | Số tiền giảm giá | |
| 7 | tax_amount | DECIMAL(12,2) | Mặc định 0 | Số tiền thuế | |
| 8 | total_amount | DECIMAL(12,2) | Không rỗng | Tổng tiền | CT-BILL01 |
| 9 | amount_due | DECIMAL(12,2) | Không rỗng | Số tiền còn phải trả | CT-BILL02 |
| 10 | issued_at | DATETIME | Cho phép rỗng | Thời điểm phát hành | |
| 11 | created_by_id | INT | Khóa ngoại → users(id), không rỗng | Nhân viên quầy tạo | |
| 12 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |
| 13 | updated_at | DATETIME | Tự cập nhật | Thời điểm cập nhật cuối | |

*Bảng 40. Hóa đơn (invoices)*

---

## 3.10.3. Dòng hóa đơn

**invoice_lines**(id, invoice_id, line_type, quotation_line_id, wo_service_id, job_id, description, quantity, unit_price, amount, sort_order)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã dòng hóa đơn | |
| 2 | invoice_id | INT | Khóa ngoại → invoices(id), không rỗng | Mã hóa đơn | |
| 3 | line_type | ENUM | 'PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE' | Loại dòng | |
| 4 | quotation_line_id | INT | Khóa ngoại → quotation_lines(id), cho phép rỗng | Truy vết báo giá | |
| 5 | wo_service_id | INT | Khóa ngoại → wo_services(id), cho phép rỗng | Truy vết dịch vụ | |
| 6 | job_id | INT | Khóa ngoại → jobs(id), cho phép rỗng | Truy vết công việc | |
| 7 | description | VARCHAR(500) | Không rỗng | Mô tả hạng mục | |
| 8 | quantity | DECIMAL(10,2) | Không rỗng | Số lượng | |
| 9 | unit_price | DECIMAL(12,2) | Không rỗng | Đơn giá | |
| 10 | amount | DECIMAL(12,2) | Không rỗng | Thành tiền | |
| 11 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |

*Bảng 41. Dòng hóa đơn (invoice_lines)*

---

## 3.10.4. Thanh toán

**payments**(id, invoice_id, payment_method, amount, transaction_ref, status, paid_at, received_by_id, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã thanh toán | |
| 2 | invoice_id | INT | Khóa ngoại → invoices(id), không rỗng | Mã hóa đơn | |
| 3 | payment_method | ENUM | 'CASH', 'CARD', 'QR_TRANSFER' | Hình thức thanh toán | |
| 4 | amount | DECIMAL(12,2) | Không rỗng | Số tiền thanh toán | Không vượt Amount Due |
| 5 | transaction_ref | VARCHAR(255) | Cho phép rỗng | Mã giao dịch | QR/Card transaction reference |
| 6 | status | ENUM | 'PENDING', 'SUCCESS', 'FAILED'; mặc định 'PENDING' | Trạng thái | |
| 7 | paid_at | DATETIME | Cho phép rỗng | Thời điểm thanh toán | |
| 8 | received_by_id | INT | Khóa ngoại → users(id), không rỗng | Nhân viên quầy nhận | |
| 9 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 42. Thanh toán (payments)*

---

## 3.10.5. Bàn giao xe

**vehicle_releases**(id, work_order_id, release_notes, released_by_id, released_at, confirmed_by_customer_id, confirmed_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã bàn giao | |
| 2 | work_order_id | INT | Khóa ngoại → work_orders(id), duy nhất, không rỗng | Mã phiếu công việc | 1 WO → 1 Release |
| 3 | release_notes | TEXT | Cho phép rỗng | Ghi chú bàn giao | |
| 4 | released_by_id | INT | Khóa ngoại → users(id), không rỗng | Cố vấn dịch vụ bàn giao | |
| 5 | released_at | DATETIME | Không rỗng | Thời điểm bàn giao | |
| 6 | confirmed_by_customer_id | INT | Khóa ngoại → users(id), cho phép rỗng | Khách hàng xác nhận | UC-14 |
| 7 | confirmed_at | DATETIME | Cho phép rỗng | Thời điểm xác nhận | |

*Bảng 43. Bàn giao xe (vehicle_releases)*

---

# NHÓM BỔ SUNG – SYSTEM & SUPPORT

---

## 3.11.1. Danh mục hệ thống

**system_catalogs**(id, catalog_type, name, description, is_active, sort_order)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã danh mục | |
| 2 | catalog_type | ENUM | 'UOM', 'CANCEL_REASON', 'ADJUST_REASON', 'TERMS' | Loại danh mục | Đơn vị tính, lý do hủy, lý do điều chỉnh, điều khoản |
| 3 | name | VARCHAR(150) | Không rỗng | Tên mục | |
| 4 | description | TEXT | Cho phép rỗng | Mô tả | |
| 5 | is_active | BOOLEAN | Mặc định TRUE | Trạng thái hoạt động | |
| 6 | sort_order | INT | Mặc định 0 | Thứ tự hiển thị | |
| | | | UNIQUE(catalog_type, name) | | Không trùng tên trong cùng loại |

*Bảng 44. Danh mục hệ thống (system_catalogs)*

---

## 3.11.2. Thông báo

**notifications**(id, user_id, notification_type, title, message, entity_type, entity_id, is_read, read_at, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã thông báo | |
| 2 | user_id | INT | Khóa ngoại → users(id), không rỗng | Người nhận | |
| 3 | notification_type | ENUM | 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'CHECKIN_READY', 'QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'INVOICE_ISSUED', 'PAYMENT_SUCCESS', 'VEHICLE_READY', 'BILLING_REQUEST', 'GENERAL' | Loại thông báo | Phân loại để filter/icon |
| 4 | title | VARCHAR(255) | Không rỗng | Tiêu đề | |
| 5 | message | TEXT | Không rỗng | Nội dung | |
| 6 | entity_type | VARCHAR(50) | Cho phép rỗng | Loại entity liên quan | 'appointment', 'work_order', 'quotation', 'invoice'... |
| 7 | entity_id | INT | Cho phép rỗng | ID entity liên quan | Dùng để deep-link |
| 8 | is_read | BOOLEAN | Mặc định FALSE | Đã đọc hay chưa | |
| 9 | read_at | DATETIME | Cho phép rỗng | Thời điểm đánh dấu đã đọc | |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm tạo | |

*Bảng 45. Thông báo (notifications)*

---

## 3.11.3. Nhật ký thay đổi

**audit_logs**(id, user_id, action, entity_type, entity_id, before_data, after_data, ip_address, user_agent, created_at)

| STT | Thuộc tính | Kiểu | Miền giá trị | Ý nghĩa | Ghi chú |
|-----|-----------|------|-------------|---------|---------|
| 1 | id | INT | Khóa chính, tự tăng | Mã nhật ký | |
| 2 | user_id | INT | Khóa ngoại → users(id), cho phép rỗng | Người thực hiện | NULL = hệ thống tự động |
| 3 | action | ENUM | 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE' | Hành động | |
| 4 | entity_type | VARCHAR(50) | Không rỗng | Loại entity bị thay đổi | 'work_order', 'quotation', 'invoice', 'stock_movement', 'job', 'payment'... |
| 5 | entity_id | INT | Không rỗng | ID record bị thay đổi | |
| 6 | before_data | JSON | Cho phép rỗng | Dữ liệu trước khi thay đổi | Snapshot JSON |
| 7 | after_data | JSON | Cho phép rỗng | Dữ liệu sau khi thay đổi | Snapshot JSON |
| 8 | ip_address | VARCHAR(45) | Cho phép rỗng | Địa chỉ IP | IPv4/IPv6 |
| 9 | user_agent | VARCHAR(500) | Cho phép rỗng | Thông tin trình duyệt | |
| 10 | created_at | DATETIME | Mặc định CURRENT_TIMESTAMP | Thời điểm ghi nhật ký | |

*Bảng 46. Nhật ký thay đổi (audit_logs)*
