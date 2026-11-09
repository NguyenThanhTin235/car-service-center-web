# TỪ ĐIỂN DỮ LIỆU – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (CAR SERVICE CENTER)

> **Hệ quản trị CSDL:** MySQL 8.x (InnoDB, utf8mb4_unicode_ci)  
> **ORM Engine:** Prisma 5.22.0  
> **Quy ước khóa chính:** INT AUTO_INCREMENT  
> **Phiên bản tài liệu:** 3.0 (Đồng bộ toàn diện 47 bảng CSDL & Phân hệ Bảo hành Warranty Module)  
> **Ngày cập nhật:** 09/11/2026

---

## MỤC LỤC TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU

| STT | Phân hệ nghiệp vụ | Tên bảng (Table Name) | Model (Prisma) | Ý nghĩa bảng dữ liệu |
|:---:|:---|:---|:---|:---|
| 1 | IDENTITY & ACCESS | **`users`** | `User` | Tài khoản Người dùng |
| 2 | IDENTITY & ACCESS | **`roles`** | `Role` | Vai trò Hệ thống |
| 3 | IDENTITY & ACCESS | **`user_roles`** | `UserRole` | Phân quyền Người dùng - Vai trò |
| 4 | IDENTITY & ACCESS | **`employees`** | `Employee` | Hồ sơ Nhân sự Xưởng |
| 5 | IDENTITY & ACCESS | **`skills`** | `Skill` | Danh mục Kỹ năng Kỹ thuật |
| 6 | IDENTITY & ACCESS | **`employee_skills`** | `EmployeeSkill` | Kỹ năng của Nhân viên |
| 7 | CUSTOMER & VEHICLE | **`vehicles`** | `Vehicle` | Phương tiện Khách hàng |
| 8 | SERVICE CATALOG & PRICING | **`service_categories`** | `ServiceCategory` | Danh mục Nhóm Dịch vụ |
| 9 | SERVICE CATALOG & PRICING | **`services`** | `Service` | Gói Dịch vụ Tiêu chuẩn |
| 10 | SERVICE CATALOG & PRICING | **`vehicle_size_prices`** | `VehicleSizePrice` | Bảng giá Dịch vụ theo Cỡ xe |
| 11 | SERVICE CATALOG & PRICING | **`job_types`** | `JobType` | Loại Công việc Kỹ thuật |
| 12 | SERVICE CATALOG & PRICING | **`job_templates`** | `JobTemplate` | Mẫu Đầu việc Kỹ thuật Chuẩn |
| 13 | SERVICE CATALOG & PRICING | **`job_template_parts`** | `JobTemplatePart` | Định mức Phụ tùng Mẫu |
| 14 | INSPECTION & QC TEMPLATES | **`inspection_templates`** | `InspectionTemplate` | Mẫu Biên bản Kiểm tra / QC |
| 15 | INSPECTION & QC TEMPLATES | **`inspection_template_items`** | `InspectionTemplateItem` | Tiêu chí Kiểm tra Chi tiết |
| 16 | APPOINTMENT & INTAKE | **`appointments`** | `Appointment` | Lịch hẹn Dịch vụ |
| 17 | APPOINTMENT & INTAKE | **`appointment_services`** | `AppointmentService` | Dịch vụ Mong muốn khi Đặt lịch |
| 18 | APPOINTMENT & INTAKE | **`intake_records`** | `IntakeRecord` | Phiếu Tiếp nhận Xe Thực tế |
| 19 | APPOINTMENT & INTAKE | **`intake_services`** | `IntakeService` | Dịch vụ Yêu cầu khi Tiếp nhận |
| 20 | WORK ORDER CORE | **`work_orders`** | `WorkOrder` | Lệnh Sửa chữa (Work Order) |
| 21 | WORK ORDER CORE | **`check_ins`** | `CheckIn` | Biên bản Nhận xe & Hiện trạng Ngoại quan |
| 22 | WORK ORDER CORE | **`wo_services`** | `WoService` | Hạng mục Dịch vụ trong Lệnh |
| 23 | WORK ORDER CORE | **`inspections`** | `Inspection` | Biên bản Kiểm tra Kỹ thuật |
| 24 | WORK ORDER CORE | **`inspection_results`** | `InspectionResult` | Kết quả Tiêu chí Kiểm tra |
| 25 | WORK ORDER CORE | **`findings`** | `Finding` | Vết lỗi & Hư hỏng Phát hiện |
| 26 | WORK ORDER CORE | **`jobs`** | `Job` | Đầu việc Kỹ thuật Thi công |
| 27 | WORK ORDER CORE | **`job_findings`** | `JobFinding` | Liên kết Đầu việc - Vết lỗi |
| 28 | WORK ORDER CORE | **`job_labours`** | `JobLabour` | Nhân công Thi công Đầu việc |
| 29 | WORK ORDER CORE | **`job_parts`** | `JobPart` | Phụ tùng Cấp phát cho Đầu việc |
| 30 | QUOTATION & ESTIMATION | **`quotations`** | `Quotation` | Bản Báo giá Dịch vụ |
| 31 | QUOTATION & ESTIMATION | **`quotation_lines`** | `QuotationLine` | Chi tiết Dòng Báo giá |
| 32 | QUALITY CONTROL | **`qc_records`** | `QcRecord` | Biên bản Nghiệm thu Chất lượng (QC) |
| 33 | QUALITY CONTROL | **`qc_items`** | `QcItem` | Kết quả Tiêu chí QC |
| 34 | INVENTORY & PROCUREMENT | **`suppliers`** | `Supplier` | Nhà cung cấp Phụ tùng |
| 35 | INVENTORY & PROCUREMENT | **`part_categories`** | `PartCategory` | Danh mục Phân loại Phụ tùng |
| 36 | INVENTORY & PROCUREMENT | **`inventory_items`** | `InventoryItem` | Mặt hàng Kho Phụ tùng |
| 37 | INVENTORY & PROCUREMENT | **`goods_receipts`** | `GoodsReceipt` | Phiếu Nhập kho Phụ tùng |
| 38 | INVENTORY & PROCUREMENT | **`goods_receipt_items`** | `GoodsReceiptItem` | Chi tiết Dòng Phụ tùng Nhập kho |
| 39 | INVENTORY & PROCUREMENT | **`stock_movements`** | `StockMovement` | Lịch sử Biến động Thẻ kho (Stock Movement) |
| 40 | INVENTORY & PROCUREMENT | **`stock_adjustments`** | `StockAdjustment` | Phiếu Điều chỉnh Kiểm kê Kho |
| 41 | BILLING, PAYMENT & SETTLEMENT | **`invoices`** | `Invoice` | Hóa đơn Dịch vụ |
| 42 | BILLING, PAYMENT & SETTLEMENT | **`invoice_lines`** | `InvoiceLine` | Dòng Chi tiết Hóa đơn |
| 43 | BILLING, PAYMENT & SETTLEMENT | **`payments`** | `Payment` | Giao dịch Thanh toán |
| 44 | BILLING, PAYMENT & SETTLEMENT | **`vehicle_releases`** | `VehicleRelease` | Biên bản Bàn giao Xe Xuất xưởng |
| 45 | SYSTEM & SUPPORT | **`system_catalogs`** | `SystemCatalog` | Danh mục Chung Hệ thống |
| 46 | SYSTEM & SUPPORT | **`notifications`** | `Notification` | Thông báo Hệ thống |
| 47 | SYSTEM & SUPPORT | **`audit_logs`** | `AuditLog` | Nhật ký Kiểm toán Hệ thống (Audit Trail) |

---

## BẢNG DANH MỤC ENUMS HỆ THỐNG (38 ENUMS)

| STT | Tên Enum | Danh sách các giá trị | Ý nghĩa nghiệp vụ |
|:---:|:---|:---|:---|
| 1 | **`EmployeePosition`** | `TECHNICIAN`, `DETAILER`, `QC_STAFF`, `ADVISOR`, `OTHER` | Vị trí chức danh nhân sự xưởng: TECHNICIAN (Kỹ thuật viên), DETAILER (Thợ chăm sóc xe/rửa xe), QC_STAFF (Nhân viên kiểm định chất lượng), ADVISOR (Cố vấn dịch vụ), OTHER (Khác) |
| 2 | **`VehicleSize`** | `SMALL`, `MEDIUM`, `LARGE`, `SUV`, `TRUCK` | Phân loại kích thước phương tiện: SMALL (Hatchback/A-B), MEDIUM (Sedan/C), LARGE (Sedan D/E), SUV (Gầm cao 5-7 chỗ), TRUCK (Bán tải/Tải nhẹ) |
| 3 | **`VehicleStatus`** | `ACTIVE`, `INACTIVE` | Trạng thái hồ sơ phương tiện: ACTIVE (Đang hoạt động), INACTIVE (Ngưng hoạt động/Đã xóa logic) |
| 4 | **`PricingType`** | `FIXED`, `VEHICLE_SIZE`, `LABOUR_PARTS` | Phương thức định giá dịch vụ: FIXED (Giá cố định), VEHICLE_SIZE (Giá phân theo kích cỡ xe), LABOUR_PARTS (Giá tính theo giờ công và phụ tùng thực tế) |
| 5 | **`InspectionTemplateType`** | `INSPECTION`, `QC` | Loại biểu mẫu kiểm định: INSPECTION (Kiểm tra chẩn đoán tình trạng xe), QC (Nghiệm thu chất lượng xuất xưởng) |
| 6 | **`AppointmentStatus`** | `REQUESTED`, `CONFIRMED`, `RESCHEDULED`, `ARRIVED`, `CANCELLED` | Trạng thái lịch hẹn: REQUESTED (Khách đặt lịch trực tuyến), CONFIRMED (Đã xác nhận), RESCHEDULED (Đổi giờ hẹn), ARRIVED (Xe đã đến xưởng), CANCELLED (Đã hủy) |
| 7 | **`IntakeType`** | `WALK_IN`, `TOW_IN`, `APPOINTMENT`, `WARRANTY` | Hình thức tiếp nhận xe: WALK_IN (Xe tự đến xưởng), TOW_IN (Xe cứu hộ kéo đến), APPOINTMENT (Xe đến theo lịch hẹn trước), WARRANTY (Xe quay lại xử lý bảo hành) |
| 8 | **`IntakeStatus`** | `QUEUED`, `CONVERTED`, `CANCELLED` | Trạng thái phiếu tiếp nhận: QUEUED (Đang xếp hàng chờ phân công), CONVERTED (Đã chuyển thành Work Order), CANCELLED (Đã hủy tiếp nhận) |
| 9 | **`WorkOrderSourceType`** | `APPOINTMENT`, `WALK_IN`, `TOW_IN`, `WARRANTY` | Nguồn gốc khởi tạo Lệnh: APPOINTMENT (Từ lịch hẹn), WALK_IN (Khách vãng lai), TOW_IN (Cứu hộ), WARRANTY (Bảo hành sự cố) |
| 10 | **`WoCloseType`** | `MANUAL`, `AUTO` | Hình thức đóng Lệnh sửa chữa: MANUAL (Đóng thủ công bởi quản đốc/cố vấn), AUTO (Hệ thống tự động đóng sau khi bàn giao xe) |
| 11 | **`WorkOrderType`** | `NORMAL`, `WARRANTY`, `MIXED` | Phân loại Lệnh sửa chữa: NORMAL (Lệnh sửa chữa/bảo dưỡng tiêu chuẩn tính phí), WARRANTY (Lệnh xử lý bảo hành miễn phí 0đ), MIXED (Lệnh hỗn hợp gồm cả bảo hành và dịch vụ tính phí) |
| 12 | **`WorkOrderStatus`** | `DRAFT`, `IN_PLANNING`, `PENDING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BILLING_REQUESTED`, `FINANCIAL_CLEARED`, `RELEASED`, `CLOSED`, `CANCELLED` | Vòng đời máy trạng thái Work Order: DRAFT (Bản nháp) → IN_PLANNING (Lên phương án & phân công) → PENDING_APPROVAL (Chờ khách duyệt báo giá) → APPROVED (Khách đã duyệt) → IN_PROGRESS (Đang thi công) → BILLING_REQUESTED (Đã QC xong, yêu cầu thanh toán) → FINANCIAL_CLEARED (Đã thanh toán/giải tỏa tài chính 0đ) → RELEASED (Đã bàn giao xe) → CLOSED (Hồ sơ đóng hoàn tất); CANCELLED (Đã hủy) |
| 13 | **`FuelLevel`** | `EMPTY`, `QUARTER`, `HALF`, `THREE_QUARTER`, `FULL` | Mức nhiên liệu khi tiếp nhận xe: EMPTY (Cạn), QUARTER (1/4 bình), HALF (1/2 bình), THREE_QUARTER (3/4 bình), FULL (Đầy bình) |
| 14 | **`CheckInStatus`** | `PENDING_CONFIRMATION`, `CONFIRMED`, `REJECTED`, `REVISION_REQUIRED` | Trạng thái biên bản bàn giao nhận xe: PENDING_CONFIRMATION (Chờ khách hàng ký xác nhận) → CONFIRMED (Khách đã ký xác nhận hiện trạng); REJECTED (Khách từ chối), REVISION_REQUIRED (Yêu cầu cố vấn chỉnh sửa lại) |
| 15 | **`ServiceStatus`** | `PENDING`, `IN_PROGRESS`, `COMPLETED` | Tiến độ dịch vụ trong lệnh: PENDING (Chờ thực hiện), IN_PROGRESS (Đang thi công), COMPLETED (Đã hoàn thành) |
| 16 | **`InspectionStatus`** | `IN_PROGRESS`, `COMPLETED` | Tiến độ biên bản kiểm tra: IN_PROGRESS (Đang tiến hành kiểm tra), COMPLETED (Đã hoàn thành biên bản) |
| 17 | **`InspectionResultValue`** | `PASS`, `FAIL`, `MONITOR` | Đánh giá từng tiêu chí kiểm tra: PASS (Đạt tiêu chuẩn), FAIL (Không đạt/Cần khắc phục), MONITOR (Theo dõi thêm) |
| 18 | **`Severity`** | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Mức độ nghiêm trọng của vết lỗi/hư hỏng: LOW (Nhẹ/Thẩm mỹ), MEDIUM (Trung bình/Cần sửa sớm), HIGH (Nghiêm trọng/Ảnh hưởng vận hành), CRITICAL (Nguy hiểm/Không an toàn khi lăn bánh) |
| 19 | **`FindingStatus`** | `NEW`, `LINKED_TO_JOB`, `RESOLVED` | Tình trạng xử lý vết lỗi: NEW (Mới phát hiện) → LINKED_TO_JOB (Đã đưa vào công việc xử lý) → RESOLVED (Đã khắc phục xong) |
| 20 | **`MarkerType`** | `DAMAGE`, `RUST`, `DENT`, `SCRATCH`, `MISSING`, `OTHER` | Phân loại marker vết lỗi ngoại thất: DAMAGE (Hư hỏng), RUST (Rỉ sét), DENT (Móp méo), SCRATCH (Trầy xước), MISSING (Thiếu linh kiện), OTHER (Khác) |
| 21 | **`JobStatus`** | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `REWORK`, `PASSED` | Tiến độ thi công đầu việc: PLANNED (Đã lập kế hoạch) → IN_PROGRESS (Thợ đang làm) → COMPLETED (Thợ báo xong) → REWORK (QC không đạt phải làm lại) → PASSED (QC nghiệm thu đạt) |
| 22 | **`PartAllocationStatus`** | `PLANNED`, `RESERVED`, `ISSUED`, `USED`, `RETURNED` | Trạng thái cấp phát phụ tùng: PLANNED (Dự kiến trong báo giá) → RESERVED (Đã giữ chỗ tồn kho) → ISSUED (Đã thực xuất kho giao thợ) → USED (Đã lắp lên xe) → RETURNED (Thừa trả lại kho) |
| 23 | **`QuotationType`** | `PRIMARY`, `SUPPLEMENTARY` | Phân loại báo giá: PRIMARY (Báo giá ban đầu), SUPPLEMENTARY (Báo giá phát sinh/bổ sung sau khi rã máy kiểm tra) |
| 24 | **`QuotationStatus`** | `DRAFT`, `SENT`, `APPROVED`, `REJECTED` | Trạng thái báo giá: DRAFT (Bản nháp) → SENT (Đã gửi khách) → APPROVED (Khách đồng ý thi công) / REJECTED (Khách từ chối) |
| 25 | **`LineType`** | `PACKAGE`, `LABOUR`, `PART`, `MATERIAL`, `FEE` | Phân loại dòng chi phí: PACKAGE (Gói dịch vụ), LABOUR (Tiền công thợ), PART (Phụ tùng thay thế), MATERIAL (Vật tư tiêu hao), FEE (Phụ phí khác) |
| 26 | **`QcResult`** | `PASS`, `FAIL` | Kết quả nghiệm thu chất lượng: PASS (Đạt tiêu chuẩn xuất xưởng), FAIL (Không đạt, kích hoạt công việc làm lại Rework) |
| 27 | **`ItemType`** | `PART`, `CONSUMABLE`, `CHEMICAL`, `ACCESSORY` | Phân loại mặt hàng kho: PART (Phụ tùng thay thế), CONSUMABLE (Vật tư tiêu hao như giẻ lau, gioăng), CHEMICAL (Hóa chất/dầu nhớt), ACCESSORY (Phụ kiện đồ chơi xe) |
| 28 | **`ReceiptType`** | `PURCHASE`, `OPENING_STOCK` | Loại chứng từ nhập kho: PURCHASE (Nhập hàng mua từ Nhà cung cấp), OPENING_STOCK (Nhập số dư kiểm kê ban đầu khi khởi tạo hệ thống) |
| 29 | **`GoodsReceiptStatus`** | `DRAFT`, `POSTED`, `CANCELLED` | Trạng thái phiếu nhập kho: DRAFT (Lưu nháp chứng từ) → POSTED (Đã ghi sổ kho, cập nhật tồn kho và tính lại giá vốn MWA) → CANCELLED (Đã hủy an toàn) |
| 30 | **`MovementType`** | `RECEIPT`, `OPENING`, `ISSUE`, `RETURN`, `ADJUSTMENT` | Loại biến động thẻ kho: RECEIPT (Nhập kho từ NCC), OPENING (Nhập số dư đầu kỳ), ISSUE (Xuất kho cho Lệnh sửa chữa), RETURN (Nhập hoàn trả phụ tùng thừa từ xưởng), ADJUSTMENT (Điều chỉnh tăng/giảm sau kiểm kê) |
| 31 | **`ReferenceType`** | `GOODS_RECEIPT`, `JOB`, `ADJUSTMENT` | Chứng từ nguồn phát sinh thẻ kho: GOODS_RECEIPT (Phiếu nhập kho), JOB (Đầu việc sửa chữa), ADJUSTMENT (Phiếu điều chỉnh kiểm kê) |
| 32 | **`AdjustmentStatus`** | `PENDING`, `APPROVED`, `REJECTED` | Trạng thái đề xuất điều chỉnh kho: PENDING (Chờ quản lý duyệt) → APPROVED (Đã duyệt điều chỉnh tồn kho) / REJECTED (Từ chối đề xuất) |
| 33 | **`InvoiceStatus`** | `DRAFT`, `ISSUED`, `PAID`, `CANCELLED` | Vòng đời hóa đơn: DRAFT (Bản nháp) → ISSUED (Đã phát hành gửi khách) → PAID (Đã thanh toán đủ, hoặc hóa đơn bảo hành 0đ tự động PAID) → CANCELLED (Đã hủy) |
| 34 | **`PaymentMethod`** | `CASH`, `CARD`, `QR_TRANSFER` | Phương thức thanh toán: CASH (Tiền mặt tại quầy thu ngân), CARD (Quẹt thẻ POS), QR_TRANSFER (Chuyển khoản VietQR tự động qua SePay) |
| 35 | **`PaymentStatus`** | `PENDING`, `SUCCESS`, `FAILED` | Trạng thái giao dịch thanh toán: PENDING (Chờ giao dịch/Chờ SePay Webhook) → SUCCESS (Thanh toán thành công) → FAILED (Thất bại/Hết hạn) |
| 36 | **`CatalogType`** | `UOM`, `CANCEL_REASON`, `ADJUST_REASON`, `TERMS`, `BRAND` | Nhóm danh mục dùng chung: UOM (Đơn vị tính: Cái, Lít, Bộ, Giờ), CANCEL_REASON (Lý do hủy lịch/hủy lệnh), ADJUST_REASON (Lý do điều chỉnh kiểm kê), TERMS (Điều khoản thanh toán & bảo hành), BRAND (Thương hiệu phụ tùng: Bosch, Denso, Motul, Castrol, v.v.) |
| 37 | **`NotificationType`** | `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, `CHECKIN_READY`, `QUOTATION_SENT`, `QUOTATION_APPROVED`, `QUOTATION_REJECTED`, `INVOICE_ISSUED`, `PAYMENT_SUCCESS`, `VEHICLE_READY`, `BILLING_REQUEST`, `GENERAL` | Loại thông báo: APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, CHECKIN_READY, QUOTATION_SENT, QUOTATION_APPROVED, QUOTATION_REJECTED, INVOICE_ISSUED, PAYMENT_SUCCESS, VEHICLE_READY, BILLING_REQUEST, GENERAL |
| 38 | **`AuditAction`** | `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE` | Loại hành động kiểm toán hệ thống: CREATE (Tạo mới), UPDATE (Cập nhật), DELETE (Xóa), STATUS_CHANGE (Chuyển đổi trạng thái máy FSM) |

---

# PHÂN HỆ 1: IDENTITY & ACCESS

## 1. Tài khoản Người dùng (`users`)

*Lưu trữ thông tin xác thực, định danh của toàn bộ khách hàng và nhân viên trong hệ thống.*

**users**(id, email, phone, password_hash, full_name, address, is_active, otp_hash, otp_attempts, otp_requested_at, otp_expires_at, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Định danh duy nhất của người dùng | Khóa chính tự tăng |
| 2 | `email` | VARCHAR(255) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Địa chỉ email định danh đăng nhập | Bắt buộc duy nhất trong toàn hệ thống, dùng nhận thông báo và lấy lại mật khẩu |
| 3 | `phone` | VARCHAR(20) | Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Số điện thoại liên lạc | Bắt buộc duy nhất nếu có, dùng tra cứu xe và nhận thông báo SMS/Zalo |
| 4 | `password_hash` | VARCHAR(255) | Không rỗng (NOT NULL) | Chuỗi băm mật khẩu bảo mật | Băm bằng bcrypt/argon2 với salt an toàn |
| 5 | `full_name` | VARCHAR(150) | Không rỗng (NOT NULL) | Họ và tên đầy đủ của người dùng | Hiển thị trên phiếu tiếp nhận, báo giá và hóa đơn |
| 6 | `address` | TEXT | Cho phép rỗng (NULL) | Địa chỉ liên lạc hoặc địa chỉ khách hàng | Dùng để in thông tin khách hàng lên hóa đơn GTGT |
| 7 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Cờ kích hoạt trạng thái tài khoản | true: Hoạt động bình thường; false: Bị vô hiệu hóa đăng nhập |
| 8 | `otp_hash` | VARCHAR(255) | Cho phép rỗng (NULL) | Mã OTP đã băm bảo vệ đặt lại mật khẩu | Xác thực 2 bước khi quên mật khẩu hoặc xác thực số điện thoại |
| 9 | `otp_attempts` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Số lần nhập sai mã OTP liên tiếp | Tự động khóa yêu cầu khi đạt ngưỡng 5 lần nhập sai |
| 10 | `otp_requested_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm gửi yêu cầu OTP gần nhất | Dùng để giới hạn tần suất gửi lại mã (Rate limiting 60s) |
| 11 | `otp_expires_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm mã OTP hết hạn hiệu lực | Thời hạn hiệu lực tiêu chuẩn 5 phút (300 giây) |
| 12 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm khởi tạo tài khoản | Tự động gán thời gian hiện tại lúc đăng ký |
| 13 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật tài khoản gần nhất | Tự động cập nhật khi có thay đổi thông tin profile |

---
## 2. Vai trò Hệ thống (`roles`)

*Định nghĩa danh mục các vai trò bảo mật và phân quyền chức năng trong hệ thống (RBAC).*

**roles**(id, name)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh vai trò | Khóa chính tự tăng |
| 2 | `name` | VARCHAR(50) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Tên vai trò hệ thống | CUSTOMER (Khách hàng), FRONT_DESK (Lễ tân tiếp nhận), SERVICE_ADVISOR (Cố vấn dịch vụ), TECHNICIAN (Kỹ thuật viên), PARTS_MANAGER (Thủ kho), SERVICE_MANAGER (Quản đốc/Giám đốc xưởng), ADMIN (Quản trị viên) |

---
## 3. Phân quyền Người dùng - Vai trò (`user_roles`)

*Bảng kết hợp N-N phân bổ các vai trò hệ thống cho từng tài khoản người dùng.*

**user_roles**(id, user_id, role_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi phân quyền | Khóa chính tự tăng |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã người dùng được gán quyền | Tham chiếu khóa ngoại đến bảng users(id) |
| 3 | `role_id` | INT | Khóa ngoại → `roles(id)`; Không rỗng (NOT NULL) | Mã vai trò được cấp | Tham chiếu khóa ngoại đến bảng roles(id) |

---
## 4. Hồ sơ Nhân sự Xưởng (`employees`)

*Lưu trữ hồ sơ nhân viên nội bộ, chức danh kỹ thuật, phân công thi công và định mức hiệu suất.*

**employees**(id, user_id, full_name, position, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh nhân viên | Khóa chính tự tăng |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`; Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Tài khoản người dùng liên kết của nhân viên | Quan hệ 1-1 duy nhất với users(id) |
| 3 | `full_name` | VARCHAR(150) | Không rỗng (NOT NULL) | Họ và tên nhân viên xưởng | Tên hiển thị nội bộ và trên phiếu công việc |
| 4 | `position` | ENUM (EmployeePosition) | Không rỗng (NOT NULL) | Chức vụ / Vị trí chuyên môn | Enum EmployeePosition: TECHNICIAN, DETAILER, QC_STAFF, ADVISOR, OTHER |
| 5 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Tình trạng làm việc của nhân sự | true: Đang làm việc tại xưởng; false: Đã nghỉ việc / tạm ngưng |
| 6 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tiếp nhận nhân sự | Tự động ghi nhận |
| 7 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật hồ sơ nhân sự | Tự động cập nhật |

---
## 5. Danh mục Kỹ năng Kỹ thuật (`skills`)

*Định nghĩa các chứng chỉ, năng lực kỹ thuật của thợ sửa chữa (Điện, Máy, Gầm, Sơn, Đồng, Chẩn đoán OBD).*

**skills**(id, name, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh kỹ năng | Khóa chính tự tăng |
| 2 | `name` | VARCHAR(100) | Không rỗng (NOT NULL) | Tên kỹ năng chuyên môn | Ví dụ: 'Sửa chữa hộp số tự động', 'Chẩn đoán hệ thống điện ô tô', 'Sơn sấy cao cấp' |
| 3 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái áp dụng kỹ năng | true: Đang kích hoạt; false: Ngưng sử dụng |

---
## 6. Kỹ năng của Nhân viên (`employee_skills`)

*Bảng liên kết N-N ghi nhận các kỹ năng chuyên môn của từng nhân viên xưởng phục vụ tự động gợi ý phân công.*

**employee_skills**(id, employee_id, skill_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi kỹ năng nhân viên | Khóa chính tự tăng |
| 2 | `employee_id` | INT | Khóa ngoại → `employees(id)`; Không rỗng (NOT NULL) | Mã nhân viên sở hữu kỹ năng | Tham chiếu khóa ngoại đến bảng employees(id) |
| 3 | `skill_id` | INT | Khóa ngoại → `skills(id)`; Không rỗng (NOT NULL) | Mã kỹ năng đạt được | Tham chiếu khóa ngoại đến bảng skills(id) |

---

# PHÂN HỆ 2: CUSTOMER & VEHICLE

## 7. Phương tiện Khách hàng (`vehicles`)

*Lưu trữ thông tin phương tiện ô tô của khách hàng, theo dõi lịch sử dịch vụ, kích thước tính giá và sổ bảo hành điện tử.*

**vehicles**(id, customer_id, license_plate, make, model, year, color, vehicle_size, status, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh xe | Khóa chính tự tăng |
| 2 | `customer_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã khách hàng sở hữu xe | Tham chiếu khóa ngoại đến bảng users(id) |
| 3 | `license_plate` | VARCHAR(20) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Biển số xe kiểm soát | Duy nhất toàn hệ thống (Format chuẩn: 51K-12345, 30H-99999). Dùng tra cứu lịch sử sửa chữa và sổ bảo hành |
| 4 | `make` | VARCHAR(100) | Không rỗng (NOT NULL) | Hãng sản xuất ô tô | Toyota, Honda, Mercedes-Benz, BMW, Ford, Hyundai, VinFast, v.v. |
| 5 | `model` | VARCHAR(100) | Không rỗng (NOT NULL) | Dòng xe / Mẫu xe | Vios, Camry, Civic, CR-V, Ranger, VF8, v.v. |
| 6 | `year` | SMALLINT | Cho phép rỗng (NULL) | Năm sản xuất | Số nguyên năm sản xuất (VD: 2022) |
| 7 | `color` | VARCHAR(50) | Cho phép rỗng (NULL) | Màu sơn ngoại thất xe | Trắng, Đen, Đỏ, Bạc, Xám, v.v. |
| 8 | `vehicle_size` | ENUM (VehicleSize) | Không rỗng (NOT NULL) | Phân loại kích thước thân xe | Enum VehicleSize: SMALL, MEDIUM, LARGE, SUV, TRUCK. Dùng quyết định bảng giá dịch vụ |
| 9 | `status` | ENUM (VehicleStatus) | Không rỗng (NOT NULL); Mặc định: 'ACTIVE' | Trạng thái xe | Enum VehicleStatus: ACTIVE (Đang hoạt động), INACTIVE (Ngưng hoạt động) |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm nhập xe vào hệ thống | Tự động ghi nhận |
| 11 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật thông tin xe | Tự động cập nhật |

---

# PHÂN HỆ 3: SERVICE CATALOG & PRICING

## 8. Danh mục Nhóm Dịch vụ (`service_categories`)

*Phân loại các gói dịch vụ theo nhóm chuyên môn (Bảo dưỡng định kỳ, Sửa chữa chung, Chăm sóc làm đẹp Detailing, Đồng sơn).*

**service_categories**(id, name, description, is_active, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã nhóm dịch vụ | Khóa chính tự tăng |
| 2 | `name` | VARCHAR(100) | Không rỗng (NOT NULL) | Tên nhóm danh mục dịch vụ | Bảo dưỡng định kỳ, Sửa chữa Gầm - Máy, Hệ thống Điện - Lạnh, Chăm sóc Detailing |
| 3 | `description` | TEXT | Cho phép rỗng (NULL) | Mô tả chi tiết nhóm dịch vụ | Nội dung giải thích phạm vi dịch vụ |
| 4 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái áp dụng nhóm dịch vụ | true: Hiển thị trên bảng chọn dịch vụ; false: Ẩn |
| 5 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự sắp xếp hiển thị | Số nguyên xác định vị trí ưu tiên trên giao diện Portal/Web |

---
## 9. Gói Dịch vụ Tiêu chuẩn (`services`)

*Định nghĩa gói dịch vụ, cơ chế định giá, cấu hình thời hạn bảo hành tiêu chuẩn theo tháng và theo số km ODO.*

**services**(id, category_id, name, description, pricing_type, fixed_price, warranty_months, warranty_mileage, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh dịch vụ | Khóa chính tự tăng |
| 2 | `category_id` | INT | Khóa ngoại → `service_categories(id)`; Không rỗng (NOT NULL) | Mã nhóm danh mục cha | Tham chiếu khóa ngoại đến bảng service_categories(id) |
| 3 | `name` | VARCHAR(150) | Không rỗng (NOT NULL) | Tên gói dịch vụ | Ví dụ: 'Bảo dưỡng cấp 40.000 km', 'Vệ sinh khoang động cơ', 'Cân chỉnh thước lái 3D' |
| 4 | `description` | TEXT | Cho phép rỗng (NULL) | Diễn giải chi tiết nội dung quy trình dịch vụ | Mô tả cho khách hàng và cố vấn tham khảo |
| 5 | `pricing_type` | ENUM (PricingType) | Không rỗng (NOT NULL) | Phương thức tính giá dịch vụ | Enum PricingType: FIXED (Giá cố định), VEHICLE_SIZE (Theo cỡ xe), LABOUR_PARTS (Theo công và phụ tùng thực tế) |
| 6 | `fixed_price` | DECIMAL(12,2) | Cho phép rỗng (NULL) | Đơn giá cố định | Áp dụng nếu pricing_type = FIXED; đơn vị VNĐ |
| 7 | `warranty_months` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thời hạn bảo hành tiêu chuẩn (Số tháng) | Thời gian bảo hành dịch vụ tính theo tháng (Ví dụ: 6 tháng, 12 tháng). Phục vụ tự động kiểm tra điều kiện bảo hành |
| 8 | `warranty_mileage` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Hạn mức ODO bảo hành tiêu chuẩn (Số km) | Số km lăn bánh tối đa còn bảo hành (Ví dụ: 10.000 km). Phục vụ tự động đối chiếu số km bảo hành |
| 9 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái kích hoạt dịch vụ | true: Cho phép mở lệnh và đặt lịch; false: Tạm ngưng cung cấp |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm khởi tạo dịch vụ | Tự động ghi nhận |
| 11 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật dịch vụ | Tự động cập nhật |

---
## 10. Bảng giá Dịch vụ theo Cỡ xe (`vehicle_size_prices`)

*Lưu trữ đơn giá dịch vụ phân theo kích cỡ xe (Hatchback, Sedan, SUV, Bán tải) cho các dịch vụ rửa xe, đánh bóng, phủ ceramic.*

**vehicle_size_prices**(id, service_id, vehicle_size, price)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi bảng giá | Khóa chính tự tăng |
| 2 | `service_id` | INT | Khóa ngoại → `services(id)`; Không rỗng (NOT NULL) | Mã dịch vụ áp dụng | Tham chiếu khóa ngoại đến bảng services(id) |
| 3 | `vehicle_size` | ENUM (VehicleSize) | Không rỗng (NOT NULL) | Kích thước xe áp dụng | Enum VehicleSize: SMALL, MEDIUM, LARGE, SUV, TRUCK |
| 4 | `price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá tương ứng | Đơn vị tính: VNĐ |

---
## 11. Loại Công việc Kỹ thuật (`job_types`)

*Phân loại các thao tác kỹ thuật chuyên môn (Tháo lắp, Kiểm tra, Thay thế, Cân chỉnh, Vệ sinh).*

**job_types**(id, name, description, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã loại công việc | Khóa chính tự tăng |
| 2 | `name` | VARCHAR(150) | Không rỗng (NOT NULL) | Tên loại thao tác kỹ thuật | Tháo rã hộp số, Vệ sinh kim phun, Cân mâm bấm chì, Căn chỉnh góc đặt bánh xe |
| 3 | `description` | TEXT | Cho phép rỗng (NULL) | Mô tả tính chất loại công việc | Cho phép rỗng |
| 4 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái sử dụng | true: Áp dụng; false: Ngưng dùng |

---
## 12. Mẫu Đầu việc Kỹ thuật Chuẩn (`job_templates`)

*Khuôn mẫu các bước thi công chuẩn kèm theo gói dịch vụ, định mức giá công thợ và quy định bắt buộc kiểm tra QC.*

**job_templates**(id, job_type_id, service_id, name, price, estimated_hours, requires_qc)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã mẫu đầu việc | Khóa chính tự tăng |
| 2 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`; Không rỗng (NOT NULL) | Mã loại công việc kỹ thuật | Tham chiếu khóa ngoại đến bảng job_types(id) |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ liên kết | Tham chiếu khóa ngoại đến bảng services(id), có thể NULL nếu là việc độc lập |
| 4 | `name` | VARCHAR(150) | Không rỗng (NOT NULL) | Tên đầu việc kỹ thuật mẫu | Ví dụ: 'Thay dầu động cơ & lọc nhớt', 'Kiểm tra độ mòn má phanh 4 bánh' |
| 5 | `price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá nhân công tiêu chuẩn | Đơn giá tiền công định mức (VNĐ) khi áp dụng mẫu vào báo giá |
| 6 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng (NULL) | Định mức giờ công lao động tiêu chuẩn | Số giờ công thợ dự kiến (VD: 1.50 giờ) |
| 7 | `requires_qc` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Quy định bắt buộc nghiệm thu QC | true: Bắt buộc nhân viên QC kiểm tra mới được phép đóng việc; false: Thợ tự hoàn tất |

---
## 13. Định mức Phụ tùng Mẫu (`job_template_parts`)

*Định mức danh sách và số lượng phụ tùng tiêu hao tự động nạp vào Lệnh khi chọn một Mẫu đầu việc kỹ thuật.*

**job_template_parts**(id, job_template_id, item_id, default_quantity)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi định mức phụ tùng | Khóa chính tự tăng |
| 2 | `job_template_id` | INT | Khóa ngoại → `job_templates(id)`; Không rỗng (NOT NULL) | Mã mẫu đầu việc kỹ thuật | Tham chiếu khóa ngoại đến bảng job_templates(id) |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`; Không rỗng (NOT NULL) | Mã mặt hàng phụ tùng trong kho | Tham chiếu khóa ngoại đến bảng inventory_items(id) |
| 4 | `default_quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng phụ tùng định mức mặc định | Số lượng quy định (VD: 4.00 lít dầu, 1.00 cái lọc nhớt) |

---

# PHÂN HỆ 4: INSPECTION & QC TEMPLATES

## 14. Mẫu Biên bản Kiểm tra / QC (`inspection_templates`)

*Khuôn mẫu biểu kiểm tra kỹ thuật (Checklist 24 điểm gầm, Checklist 48 điểm động cơ, Nghiệm thu chất lượng xuất xưởng).*

**inspection_templates**(id, service_id, template_type, name, is_active)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã mẫu biên bản kiểm tra | Khóa chính tự tăng |
| 2 | `service_id` | INT | Khóa ngoại → `services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ liên kết | Tham chiếu khóa ngoại đến bảng services(id), có thể NULL |
| 3 | `template_type` | ENUM (InspectionTemplateType) | Không rỗng (NOT NULL) | Loại mẫu biên bản | Enum InspectionTemplateType: INSPECTION (Chẩn đoán ban đầu), QC (Nghiệm thu xuất xưởng) |
| 4 | `name` | VARCHAR(150) | Không rỗng (NOT NULL) | Tên mẫu biên bản kiểm định | Ví dụ: 'Biên bản kiểm tra hệ thống phanh ABS', 'Checklist bàn giao xe 10 bước' |
| 5 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái kích hoạt mẫu | true: Áp dụng; false: Ngưng dùng |

---
## 15. Tiêu chí Kiểm tra Chi tiết (`inspection_template_items`)

*Từng hạng mục tiêu chí chi tiết cần đánh giá Đạt/Không đạt nằm trong Biểu mẫu kiểm định.*

**inspection_template_items**(id, template_id, name, is_required, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã tiêu chí kiểm tra | Khóa chính tự tăng |
| 2 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`; Không rỗng (NOT NULL) | Mã biểu mẫu kiểm định cha | Tham chiếu khóa ngoại đến bảng inspection_templates(id) |
| 3 | `name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên tiêu chí cần đánh giá | Ví dụ: 'Độ dày má phanh trước bên trái', 'Độ rơ thước lái', 'Nồng độ dầu phanh DOT4' |
| 4 | `is_required` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Bắt buộc phải đánh giá | true: Không được bỏ trống khi KTV nộp kết quả kiểm tra |
| 5 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự hiển thị tiêu chí | Số nguyên sắp xếp hiển thị trên Tablet kỹ thuật viên |

---

# PHÂN HỆ 5: APPOINTMENT & INTAKE

## 16. Lịch hẹn Dịch vụ (`appointments`)

*Quản lý các yêu cầu đặt lịch hẹn trước của khách hàng qua Portal/App hoặc do Lễ tân ghi nhận.*

**appointments**(id, customer_id, vehicle_id, scheduled_date, scheduled_time, status, cancel_reason, notes, is_warranty, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh lịch hẹn | Khóa chính tự tăng |
| 2 | `customer_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã khách hàng đặt lịch | Tham chiếu khóa ngoại đến bảng users(id) |
| 3 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`; Không rỗng (NOT NULL) | Mã phương tiện hẹn mang đến | Tham chiếu khóa ngoại đến bảng vehicles(id) |
| 4 | `scheduled_date` | DATETIME | Không rỗng (NOT NULL) | Ngày hẹn mang xe đến | Ngày thực hiện dịch vụ (YYYY-MM-DD) |
| 5 | `scheduled_time` | DATETIME | Không rỗng (NOT NULL) | Giờ hẹn dự kiến | Khung giờ bắt đầu tiếp nhận (HH:mm:ss) |
| 6 | `status` | ENUM (AppointmentStatus) | Không rỗng (NOT NULL); Mặc định: 'REQUESTED' | Trạng thái lịch hẹn | Enum AppointmentStatus: REQUESTED, CONFIRMED, RESCHEDULED, ARRIVED, CANCELLED |
| 7 | `cancel_reason` | TEXT | Cho phép rỗng (NULL) | Lý do hủy lịch hẹn | Ghi nhận nếu trạng thái là CANCELLED |
| 8 | `notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú của khách hàng khi đặt lịch | Yêu cầu đặc biệt của khách hàng |
| 9 | `is_warranty` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: false | Đánh dấu lịch hẹn xử lý sự cố bảo hành | true: Khách đặt hẹn bảo hành xe; false: Đặt hẹn dịch vụ bình thường |
| 10 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Người khởi tạo bản ghi lịch hẹn | Tham chiếu khóa ngoại đến bảng users(id) (Khách tự đặt hoặc Nhân viên lễ tân tạo) |
| 11 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm đặt lịch hẹn | Tự động ghi nhận |
| 12 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật lịch hẹn | Tự động cập nhật |

---
## 17. Dịch vụ Mong muốn khi Đặt lịch (`appointment_services`)

*Bảng liên kết N-N ghi nhận các gói dịch vụ khách hàng lựa chọn trước trong phiếu hẹn.*

**appointment_services**(id, appointment_id, service_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng dịch vụ lịch hẹn | Khóa chính tự tăng |
| 2 | `appointment_id` | INT | Khóa ngoại → `appointments(id)`; Không rỗng (NOT NULL) | Mã lịch hẹn | Tham chiếu khóa ngoại đến bảng appointments(id) |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`; Không rỗng (NOT NULL) | Mã dịch vụ khách lựa chọn | Tham chiếu khóa ngoại đến bảng services(id) |

---
## 18. Phiếu Tiếp nhận Xe Thực tế (`intake_records`)

*Hồ sơ ghi nhận xe vật lý vào cổng xưởng (Khách vãng lai, xe kéo cứu hộ, xe bảo hành, xe hẹn trước).*

**intake_records**(id, customer_id, vehicle_id, intake_type, status, arrived_at, tow_company, notes, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã phiếu tiếp nhận xe | Khóa chính tự tăng |
| 2 | `customer_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã khách hàng bàn giao xe | Tham chiếu khóa ngoại đến bảng users(id) |
| 3 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`; Không rỗng (NOT NULL) | Mã phương tiện vào xưởng | Tham chiếu khóa ngoại đến bảng vehicles(id) |
| 4 | `intake_type` | ENUM (IntakeType) | Không rỗng (NOT NULL) | Hình thức vào xưởng | Enum IntakeType: WALK_IN (Khách vãng lai), TOW_IN (Xe cứu hộ), APPOINTMENT (Theo lịch hẹn), WARRANTY (Đến vì bảo hành) |
| 5 | `status` | ENUM (IntakeStatus) | Không rỗng (NOT NULL); Mặc định: 'QUEUED' | Trạng thái xử lý tiếp nhận | Enum IntakeStatus: QUEUED (Chờ phân công), CONVERTED (Đã lập Work Order), CANCELLED (Đã hủy) |
| 6 | `arrived_at` | DATETIME | Không rỗng (NOT NULL) | Thời điểm xe thực tế vào xưởng | Thời điểm bảo vệ/lễ tân bấm đón xe |
| 7 | `tow_company` | VARCHAR(255) | Cho phép rỗng (NULL) | Tên đơn vị cứu hộ kéo xe | Áp dụng nếu intake_type = TOW_IN |
| 8 | `notes` | TEXT | Cho phép rỗng (NULL) | Mô tả ban đầu về hiện tượng lỗi hoặc yêu cầu | Ghi chú sơ bộ từ khách/tài xế xe cứu hộ |
| 9 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Cố vấn dịch vụ / Lễ tân lập phiếu | Tham chiếu khóa ngoại đến bảng users(id) |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo phiếu tiếp nhận | Tự động ghi nhận |

---
## 19. Dịch vụ Yêu cầu khi Tiếp nhận (`intake_services`)

*Danh sách dịch vụ sơ bộ khách hàng yêu cầu ngay tại bàn tiếp nhận.*

**intake_services**(id, intake_id, service_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng dịch vụ tiếp nhận | Khóa chính tự tăng |
| 2 | `intake_id` | INT | Khóa ngoại → `intake_records(id)`; Không rỗng (NOT NULL) | Mã phiếu tiếp nhận | Tham chiếu khóa ngoại đến bảng intake_records(id) |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`; Không rỗng (NOT NULL) | Mã dịch vụ yêu cầu | Tham chiếu khóa ngoại đến bảng services(id) |

---

# PHÂN HỆ 6: WORK ORDER CORE

## 20. Lệnh Sửa chữa (Work Order) (`work_orders`)

*Thực thể trung tâm điều phối toàn bộ quy trình vận hành dịch vụ của trung tâm, máy trạng thái 10 bước FSM, chuỗi truy vết bảo hành đa cấp.*

**work_orders**(id, wo_number, customer_id, vehicle_id, advisor_id, source_type, appointment_id, intake_record_id, status, order_type, parent_work_order_id, warranty_reason, claim_approved_by_id, closed_at, closed_by_id, close_type, close_notes, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh Lệnh sửa chữa | Khóa chính tự tăng |
| 2 | `wo_number` | VARCHAR(20) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Mã hiệu lệnh sửa chữa hiển thị | Mã duy nhất dạng WO-YYYYMMDD-XXXX (VD: WO-20261109-0001) |
| 3 | `customer_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã khách hàng chủ xe | Tham chiếu khóa ngoại đến bảng users(id) |
| 4 | `vehicle_id` | INT | Khóa ngoại → `vehicles(id)`; Không rỗng (NOT NULL) | Mã phương tiện sửa chữa | Tham chiếu khóa ngoại đến bảng vehicles(id) |
| 5 | `advisor_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Cố vấn dịch vụ chịu trách nhiệm chính | Tham chiếu khóa ngoại đến bảng users(id) |
| 6 | `source_type` | ENUM (WorkOrderSourceType) | Không rỗng (NOT NULL) | Nguồn gốc khởi tạo lệnh | Enum WorkOrderSourceType: APPOINTMENT, WALK_IN, TOW_IN, WARRANTY |
| 7 | `appointment_id` | INT | Khóa ngoại → `appointments(id)`; Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Mã lịch hẹn nguồn gốc | Tham chiếu khóa ngoại duy nhất đến appointments(id), NULL nếu không từ lịch hẹn |
| 8 | `intake_record_id` | INT | Khóa ngoại → `intake_records(id)`; Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Mã phiếu tiếp nhận xe nguồn gốc | Tham chiếu khóa ngoại duy nhất đến intake_records(id), NULL nếu tạo trực tiếp |
| 9 | `status` | ENUM (WorkOrderStatus) | Không rỗng (NOT NULL); Mặc định: 'DRAFT' | Trạng thái vòng đời Lệnh sửa chữa (10 bước FSM) | Enum WorkOrderStatus: DRAFT, IN_PLANNING, PENDING_APPROVAL, APPROVED, IN_PROGRESS, BILLING_REQUESTED, FINANCIAL_CLEARED, RELEASED, CLOSED, CANCELLED |
| 10 | `order_type` | ENUM (WorkOrderType) | Không rỗng (NOT NULL); Mặc định: 'NORMAL' | Phân loại lệnh sửa chữa | Enum WorkOrderType: NORMAL (Tiêu chuẩn tính phí), WARRANTY (Lệnh bảo hành 0đ), MIXED (Lệnh hỗn hợp có cả bảo hành và có phí) |
| 11 | `parent_work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Cho phép rỗng (NULL) | Mã Lệnh sửa chữa gốc phát sinh bảo hành | Quan hệ tự tham chiếu (Self-relation) đến work_orders(id) để truy vết nguồn gốc lỗi bảo hành |
| 12 | `warranty_reason` | TEXT | Cho phép rỗng (NULL) | Diễn giải chi tiết lý do và hiện tượng khiếu nại bảo hành | Mô tả nguyên nhân xe bị lỗi phải quay lại xưởng bảo hành |
| 13 | `claim_approved_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Cấp quản lý phê duyệt chính sách bảo hành thiện chí (Goodwill) | Tham chiếu khóa ngoại đến users(id) (Quản đốc hoặc Giám đốc dịch vụ) |
| 14 | `closed_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm đóng hồ sơ lệnh | Ghi nhận khi chuyển trạng thái sang CLOSED |
| 15 | `closed_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Người thực hiện đóng lệnh | Tham chiếu khóa ngoại đến users(id) |
| 16 | `close_type` | ENUM (WoCloseType) | Cho phép rỗng (NULL) | Hình thức đóng lệnh | Enum WoCloseType: MANUAL (Đóng tay), AUTO (Tự động đóng sau khi hoàn tất bàn giao) |
| 17 | `close_notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú khi đóng lệnh sửa chữa | Cho phép rỗng |
| 18 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Người khởi tạo Lệnh | Tham chiếu khóa ngoại đến bảng users(id) |
| 19 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo Lệnh sửa chữa | Tự động ghi nhận |
| 20 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật Lệnh sửa chữa | Tự động cập nhật |

---
## 21. Biên bản Nhận xe & Hiện trạng Ngoại quan (`check_ins`)

*Biên bản kiểm tra tiếp nhận xe, ghi nhận số km ODO, lượng xăng, tài sản tư trang và sơ đồ đánh dấu vết xước/móp méo.*

**check_ins**(id, work_order_id, mileage, fuel_level, complaint, belongings, exterior_condition, status, rejection_reason, confirmed_by_customer_id, confirmed_at, evidence_urls, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh biên bản check-in | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Mã Lệnh sửa chữa liên kết | Khóa ngoại duy nhất (1-1) tham chiếu đến work_orders(id) |
| 3 | `mileage` | INT | Không rỗng (NOT NULL) | Số km ODO của xe tại thời điểm vào xưởng | Số nguyên km (Ví dụ: 45200 km). Cực kỳ quan trọng để xác thực điều kiện bảo hành |
| 4 | `fuel_level` | ENUM (FuelLevel) | Không rỗng (NOT NULL) | Mức nhiên liệu hiện tại | Enum FuelLevel: EMPTY, QUARTER, HALF, THREE_QUARTER, FULL |
| 5 | `complaint` | TEXT | Không rỗng (NOT NULL) | Mô tả hiện tượng lỗi theo lời kể của khách hàng | Triệu chứng xe rung giật, kêu bất thường, đèn báo lỗi taplo sáng |
| 6 | `belongings` | TEXT | Cho phép rỗng (NULL) | Tư trang, tài sản để lại trên xe | Ví dụ: 'Thẻ thu phí VETC, camera hành trình Vietmap, dù che mưa' |
| 7 | `exterior_condition` | TEXT | Không rỗng (NOT NULL) | Đánh giá sơ bộ ngoại thất xe | Mô tả tình trạng bụi bẩn, sơn cũ, vết va chạm cũ |
| 8 | `status` | ENUM (CheckInStatus) | Không rỗng (NOT NULL); Mặc định: 'PENDING_CONFIRMATION' | Trạng thái xác nhận của khách hàng | Enum CheckInStatus: PENDING_CONFIRMATION, CONFIRMED, REJECTED, REVISION_REQUIRED |
| 9 | `rejection_reason` | TEXT | Cho phép rỗng (NULL) | Lý do khách từ chối ký xác nhận biên bản | Ghi nhận nếu khách hàng bấm Từ chối trên Portal/SMS link |
| 10 | `confirmed_by_customer_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Khách hàng thực hiện xác nhận điện tử | Tham chiếu khóa ngoại đến users(id) |
| 11 | `confirmed_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm khách hàng ký xác nhận | Ghi nhận dấu thời gian xác nhận OTP hoặc chữ ký điện tử |
| 12 | `evidence_urls` | JSON | Cho phép rỗng (NULL) | Mảng danh sách đường dẫn ảnh chụp hiện trạng xe | Định dạng JSON: Mảng các URL ảnh chụp 4 góc xe và các vết lỗi ngoại quan |
| 13 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Cố vấn dịch vụ lập biên bản | Tham chiếu khóa ngoại đến users(id) |
| 14 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm lập biên bản | Tự động ghi nhận |
| 15 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật biên bản | Tự động cập nhật |

---
## 22. Hạng mục Dịch vụ trong Lệnh (`wo_services`)

*Tập hợp các gói dịch vụ được giao thi công trong phiếu công việc, quản lý trạng thái tiến độ từng dịch vụ.*

**wo_services**(id, work_order_id, service_id, name, pricing_type, status, sort_order, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng dịch vụ trong lệnh | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Không rỗng (NOT NULL) | Mã Lệnh sửa chữa cha | Tham chiếu khóa ngoại đến bảng work_orders(id) |
| 3 | `service_id` | INT | Khóa ngoại → `services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ gốc từ danh mục chuẩn | Tham chiếu khóa ngoại đến bảng services(id), NULL nếu dịch vụ phát sinh ngoài danh mục |
| 4 | `name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên dịch vụ hiển thị trong lệnh | Tên gói dịch vụ được áp dụng |
| 5 | `pricing_type` | ENUM (PricingType) | Không rỗng (NOT NULL) | Phương thức tính giá của dịch vụ này | Enum PricingType: FIXED, VEHICLE_SIZE, LABOUR_PARTS |
| 6 | `status` | ENUM (ServiceStatus) | Không rỗng (NOT NULL); Mặc định: 'PENDING' | Tiến độ thực hiện dịch vụ | Enum ServiceStatus: PENDING, IN_PROGRESS, COMPLETED |
| 7 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự sắp xếp hiển thị | Số nguyên sắp xếp trên giao diện điều phối |
| 8 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm thêm dịch vụ vào lệnh | Tự động ghi nhận |
| 9 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật trạng thái dịch vụ | Tự động cập nhật |

---
## 23. Biên bản Kiểm tra Kỹ thuật (`inspections`)

*Biên bản chẩn đoán tình trạng xe do kỹ thuật viên thực hiện trên tablet, ghi nhận chi tiết kết quả kiểm tra.*

**inspections**(id, work_order_id, wo_service_id, template_id, status, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã biên bản kiểm tra kỹ thuật | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Không rỗng (NOT NULL) | Mã Lệnh sửa chữa | Tham chiếu khóa ngoại đến bảng work_orders(id) |
| 3 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ kiểm tra liên kết | Tham chiếu khóa ngoại đến wo_services(id), cho phép NULL |
| 4 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`; Cho phép rỗng (NULL) | Mã mẫu kiểm tra chuẩn được áp dụng | Tham chiếu khóa ngoại đến inspection_templates(id), cho phép NULL |
| 5 | `status` | ENUM (InspectionStatus) | Không rỗng (NOT NULL); Mặc định: 'IN_PROGRESS' | Trạng thái biên bản kiểm tra | Enum InspectionStatus: IN_PROGRESS (Đang đo đạc kiểm tra), COMPLETED (Đã kiểm tra xong) |
| 6 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Kỹ thuật viên thực hiện kiểm tra | Tham chiếu khóa ngoại đến bảng users(id) |
| 7 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm bắt đầu kiểm tra | Tự động ghi nhận |
| 8 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm hoàn thành biên bản | Tự động cập nhật |

---
## 24. Kết quả Tiêu chí Kiểm tra (`inspection_results`)

*Kết quả đo lường và đánh giá chi tiết cho từng hạng mục tiêu chí kỹ thuật.*

**inspection_results**(id, inspection_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã kết quả tiêu chí | Khóa chính tự tăng |
| 2 | `inspection_id` | INT | Khóa ngoại → `inspections(id)`; Không rỗng (NOT NULL) | Mã biên bản kiểm tra cha | Tham chiếu khóa ngoại đến bảng inspections(id) |
| 3 | `template_item_id` | INT | Khóa ngoại → `inspection_template_items(id)`; Cho phép rỗng (NULL) | Mã tiêu chí kiểm tra mẫu | Tham chiếu khóa ngoại đến inspection_template_items(id), cho phép NULL |
| 4 | `item_name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên tiêu chí kiểm tra | Tên hạng mục đo đạc (VD: Áp suất lốp, Điện áp ắc quy, Độ dày bố thắng) |
| 5 | `result` | ENUM (InspectionResultValue) | Không rỗng (NOT NULL) | Kết quả đánh giá | Enum InspectionResultValue: PASS (Đạt), FAIL (Hư hỏng), MONITOR (Cần theo dõi) |
| 6 | `notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú số liệu đo đạc thực tế | Ví dụ: '12.4V', 'Độ mòn 3mm', 'Rỉ dầu nhẹ phớt đuôi trục khuỷu' |

---
## 25. Vết lỗi & Hư hỏng Phát hiện (`findings`)

*Hồ sơ chi tiết từng vết lỗi hoặc chi tiết hư hỏng được KTV phát hiện trong quá trình kiểm tra xe, kèm ảnh bằng chứng.*

**findings**(id, inspection_id, status, description, severity, recommendation, evidence_urls, is_visible_to_customer, marker_type, part_name, coordinates, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh vết lỗi phát hiện | Khóa chính tự tăng |
| 2 | `inspection_id` | INT | Khóa ngoại → `inspections(id)`; Không rỗng (NOT NULL) | Mã biên bản kiểm tra phát hiện lỗi | Tham chiếu khóa ngoại đến bảng inspections(id) |
| 3 | `status` | ENUM (FindingStatus) | Không rỗng (NOT NULL); Mặc định: 'NEW' | Tình trạng xử lý lỗi | Enum FindingStatus: NEW (Mới phát hiện) → LINKED_TO_JOB (Đã gán vào đầu việc sửa) → RESOLVED (Đã khắc phục) |
| 4 | `description` | TEXT | Không rỗng (NOT NULL) | Mô tả chi tiết tình trạng hư hỏng | Ví dụ: 'Rách cao su chụp bụi láp ngoài bên phải, mỡ bò bắn tung tóe' |
| 5 | `severity` | ENUM (Severity) | Không rỗng (NOT NULL); Mặc định: 'MEDIUM' | Mức độ nghiêm trọng của hư hỏng | Enum Severity: LOW, MEDIUM, HIGH, CRITICAL |
| 6 | `recommendation` | TEXT | Cho phép rỗng (NULL) | Khuyến nghị kỹ thuật từ KTV | Ví dụ: 'Cần thay thế cao su chụp bụi và bổ sung mỡ láp mới ngay' |
| 7 | `evidence_urls` | JSON | Cho phép rỗng (NULL) | Ảnh chụp bằng chứng hư hỏng | Định dạng JSON: Mảng các đường dẫn ảnh chụp chi tiết lỗi thực tế |
| 8 | `is_visible_to_customer` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Cho phép khách hàng xem trên Portal | true: Hiển thị minh bạch hình ảnh trên Portal khách hàng; false: Chỉ lưu hành nội bộ |
| 9 | `marker_type` | ENUM (MarkerType) | Cho phép rỗng (NULL) | Loại marker hư hỏng | Enum MarkerType: DAMAGE, RUST, DENT, SCRATCH, MISSING, OTHER |
| 10 | `part_name` | VARCHAR(255) | Cho phép rỗng (NULL) | Tên chi tiết / bộ phận bị lỗi | Bộ phận hư hỏng (VD: Cao su chụp bụi láp ngoài) |
| 11 | `coordinates` | JSON | Cho phép rỗng (NULL) | Tọa độ điểm lỗi trên sơ đồ 2D/3D | Định dạng JSON: { x: number, y: number, view: 'top'|'front'|'side' } |
| 12 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Kỹ thuật viên ghi nhận lỗi | Tham chiếu khóa ngoại đến bảng users(id) |
| 13 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm phát hiện lỗi | Tự động ghi nhận |
| 14 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật tình trạng lỗi | Tự động cập nhật |

---
## 26. Đầu việc Kỹ thuật Thi công (`jobs`)

*Từng hạng mục công việc kỹ thuật cụ thể phân bổ cho thợ thi công, hỗ trợ xử lý làm lại Rework và công việc bảo hành miễn phí 0đ.*

**jobs**(id, wo_service_id, job_type_id, job_template_id, name, description, estimated_hours, actual_hours, status, result_notes, is_rework, is_warranty, original_job_id, parent_job_id, rework_source_qc_item_id, created_by_id, started_at, completed_at, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh đầu việc kỹ thuật | Khóa chính tự tăng |
| 2 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`; Không rỗng (NOT NULL) | Mã dịch vụ cha trong lệnh | Tham chiếu khóa ngoại đến bảng wo_services(id) |
| 3 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`; Cho phép rỗng (NULL) | Mã loại công việc kỹ thuật | Tham chiếu khóa ngoại đến bảng job_types(id), cho phép NULL |
| 4 | `job_template_id` | INT | Khóa ngoại → `job_templates(id)`; Cho phép rỗng (NULL) | Mã mẫu đầu việc gốc áp dụng | Tham chiếu khóa ngoại đến job_templates(id), cho phép NULL |
| 5 | `name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên đầu việc kỹ thuật | Ví dụ: 'Thay thế cụm moay-ơ bánh trước bên phụ' |
| 6 | `description` | TEXT | Cho phép rỗng (NULL) | Hướng dẫn kỹ thuật / ghi chú thi công | Yêu cầu kỹ thuật chi tiết cho thợ |
| 7 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng (NULL) | Định mức thời gian thi công dự kiến (Giờ) | Định mức tính hiệu suất (VD: 2.00 giờ) |
| 8 | `actual_hours` | DECIMAL(5,2) | Cho phép rỗng (NULL) | Thời gian thi công thực tế (Giờ) | Thời gian thợ bấm giờ thực hiện thực tế (VD: 1.75 giờ) |
| 9 | `status` | ENUM (JobStatus) | Không rỗng (NOT NULL); Mặc định: 'PLANNED' | Trạng thái thi công đầu việc | Enum JobStatus: PLANNED, IN_PROGRESS, COMPLETED, REWORK, PASSED |
| 10 | `result_notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú kết quả sau khi thi công xong | Thợ ghi nhận sau khi chạy thử nghiệm |
| 11 | `is_rework` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: false | Đánh dấu công việc làm lại do QC không đạt | true: Công việc Rework không tính thêm tiền khách hàng |
| 12 | `is_warranty` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: false | Đánh dấu công việc thuộc diện bảo hành | true: Hạng mục bảo hành miễn phí (Đơn giá nhân công tự động 0 VNĐ) |
| 13 | `original_job_id` | INT | Cho phép rỗng (NULL) | Mã công việc cũ phát sinh lỗi ở Lệnh trước | Truy vết ID công việc ở Lệnh sửa chữa gốc cần làm lại theo chế độ bảo hành |
| 14 | `parent_job_id` | INT | Khóa ngoại → `jobs(id)`; Cho phép rỗng (NULL) | Mã công việc cha trong chuỗi làm lại | Quan hệ tự tham chiếu (Self-relation) jobs(id) |
| 15 | `rework_source_qc_item_id` | INT | Khóa ngoại → `qc_items(id)`; Cho phép rỗng (NULL) | Mã tiêu chí QC không đạt kích hoạt việc làm lại này | Tham chiếu khóa ngoại đến bảng qc_items(id) |
| 16 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Người phân công đầu việc | Tham chiếu khóa ngoại đến bảng users(id) |
| 17 | `started_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm thợ bấm giờ bắt đầu làm | Ghi nhận lúc thợ chuyển trạng thái sang IN_PROGRESS |
| 18 | `completed_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm thợ hoàn tất công việc | Ghi nhận lúc thợ chuyển trạng thái sang COMPLETED |
| 19 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo đầu việc | Tự động ghi nhận |
| 20 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật tiến độ công việc | Tự động cập nhật |

---
## 27. Liên kết Đầu việc - Vết lỗi (`job_findings`)

*Bảng kết hợp N-N liên kết đầu việc sửa chữa với vết lỗi chẩn đoán tương ứng cần khắc phục.*

**job_findings**(id, job_id, finding_id)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi liên kết | Khóa chính tự tăng |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Không rỗng (NOT NULL) | Mã đầu việc kỹ thuật xử lý | Tham chiếu khóa ngoại đến bảng jobs(id) |
| 3 | `finding_id` | INT | Khóa ngoại → `findings(id)`; Không rỗng (NOT NULL) | Mã vết lỗi được khắc phục | Tham chiếu khóa ngoại đến bảng findings(id) |

---
## 28. Nhân công Thi công Đầu việc (`job_labours`)

*Ghi nhận chi phí nhân công, phân công kỹ thuật viên cụ thể chịu trách nhiệm cho từng công việc.*

**job_labours**(id, job_id, job_type_id, description, employee_id, estimated_hours, price, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh bản ghi nhân công | Khóa chính tự tăng |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Không rỗng (NOT NULL) | Mã đầu việc kỹ thuật liên kết | Tham chiếu khóa ngoại đến bảng jobs(id) |
| 3 | `job_type_id` | INT | Khóa ngoại → `job_types(id)`; Không rỗng (NOT NULL) | Mã loại công việc | Tham chiếu khóa ngoại đến bảng job_types(id) |
| 4 | `description` | TEXT | Cho phép rỗng (NULL) | Mô tả công việc thực hiện của thợ | Nội dung công việc nhân công chi tiết |
| 5 | `employee_id` | INT | Khóa ngoại → `employees(id)`; Cho phép rỗng (NULL) | Kỹ thuật viên đảm nhận thi công | Tham chiếu khóa ngoại đến bảng employees(id), có thể NULL khi chưa gán thợ |
| 6 | `estimated_hours` | DECIMAL(5,2) | Cho phép rỗng (NULL) | Số giờ công dự kiến | Định mức giờ tính tiền (VD: 1.50 giờ) |
| 7 | `price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá tiền công thợ tính phí | Đơn vị tính: VNĐ (Nếu công việc bảo hành thì đơn giá bán là 0 VNĐ) |
| 8 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm lập bản ghi nhân công | Tự động ghi nhận |
| 9 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật nhân công | Tự động cập nhật |

---
## 29. Phụ tùng Cấp phát cho Đầu việc (`job_parts`)

*Quản lý nhu cầu phụ tùng cho công việc, quy trình cấp phát từ kho (Kế hoạch → Giữ chỗ → Xuất kho → Sử dụng/Trả thừa), hỗ trợ xuất vật tư bảo hành 0đ.*

**job_parts**(id, job_id, item_id, status, is_warranty, planned_quantity, issued_quantity, returned_quantity, unit_price, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi cấp phát phụ tùng | Khóa chính tự tăng |
| 2 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Không rỗng (NOT NULL) | Mã đầu việc kỹ thuật cần dùng phụ tùng | Tham chiếu khóa ngoại đến bảng jobs(id) |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`; Không rỗng (NOT NULL) | Mã mặt hàng phụ tùng trong kho | Tham chiếu khóa ngoại đến bảng inventory_items(id) |
| 4 | `status` | ENUM (PartAllocationStatus) | Không rỗng (NOT NULL); Mặc định: 'PLANNED' | Trạng thái cấp phát phụ tùng | Enum PartAllocationStatus: PLANNED, RESERVED, ISSUED, USED, RETURNED |
| 5 | `is_warranty` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: false | Đánh dấu phụ tùng thay thế bảo hành miễn phí | true: Phụ tùng bảo hành (Đơn giá bán cho khách = 0 VNĐ; nội bộ hạch toán xuất kho theo giá vốn MWA) |
| 6 | `planned_quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng phụ tùng dự kiến cần dùng | Số lượng khai báo trong báo giá (VD: 1.00 cái, 4.00 lít) |
| 7 | `issued_quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL); Mặc định: '0' | Số lượng phụ tùng thực tế thủ kho đã xuất | Số lượng đã trừ khỏi tồn kho on_hand của thủ kho |
| 8 | `returned_quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL); Mặc định: '0' | Số lượng phụ tùng thừa thợ mang trả kho | Số lượng hoàn kho (Được cộng ngược lại vào on_hand và ghi thẻ kho RETURN) |
| 9 | `unit_price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá bán phụ tùng cho khách hàng | Đơn vị VNĐ (0 VNĐ nếu là phụ tùng bảo hành is_warranty = true) |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm yêu cầu phụ tùng | Tự động ghi nhận |
| 11 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật cấp phát | Tự động cập nhật |

---

# PHÂN HỆ 7: QUOTATION & ESTIMATION

## 30. Bản Báo giá Dịch vụ (`quotations`)

*Hồ sơ dự toán chi phí chi tiết gửi khách hàng phê duyệt trước khi tiến hành sửa chữa, hỗ trợ báo giá bổ sung đa phiên bản.*

**quotations**(id, work_order_id, quotation_number, quotation_type, parent_quotation_id, status, subtotal, discount_amount, tax_rate, tax_amount, grand_total, sent_at, approved_at, approved_by_id, rejected_at, reject_reason, snapshot_at, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh bản báo giá | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Không rỗng (NOT NULL) | Mã Lệnh sửa chữa cha | Tham chiếu khóa ngoại đến bảng work_orders(id) |
| 3 | `quotation_number` | VARCHAR(30) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Số hiệu báo giá hiển thị | Mã duy nhất định dạng QT-YYYYMMDD-XXXX |
| 4 | `quotation_type` | ENUM (QuotationType) | Không rỗng (NOT NULL); Mặc định: 'PRIMARY' | Phân loại báo giá | Enum QuotationType: PRIMARY (Báo giá ban đầu), SUPPLEMENTARY (Báo giá phát sinh/bổ sung) |
| 5 | `parent_quotation_id` | INT | Khóa ngoại → `quotations(id)`; Cho phép rỗng (NULL) | Mã báo giá gốc trước khi bổ sung | Quan hệ tự tham chiếu (Self-relation) quotations(id) |
| 6 | `status` | ENUM (QuotationStatus) | Không rỗng (NOT NULL); Mặc định: 'DRAFT' | Trạng thái phê duyệt báo giá | Enum QuotationStatus: DRAFT (Bản nháp), SENT (Đã gửi khách), APPROVED (Khách đồng ý), REJECTED (Khách từ chối) |
| 7 | `subtotal` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tổng tiền trước thuế và giảm giá | Tổng cộng các dòng báo giá (VNĐ) |
| 8 | `discount_amount` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Số tiền giảm giá / chiết khấu | Đơn vị tính: VNĐ |
| 9 | `tax_rate` | DECIMAL(5,4) | Không rỗng (NOT NULL); Mặc định: '0.1000' | Thuế suất GTGT (VAT) | Ví dụ: 0.1000 tương đương 10% VAT; 0.0800 tương đương 8% |
| 10 | `tax_amount` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tiền thuế GTGT tương ứng | Đơn vị tính: VNĐ (tax_amount = (subtotal - discount_amount) * tax_rate) |
| 11 | `grand_total` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tổng tiền thanh toán cuối cùng | grand_total = subtotal - discount_amount + tax_amount (VNĐ) |
| 12 | `sent_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm gửi báo giá cho khách | Thời điểm gửi qua Zalo/Email/Portal |
| 13 | `approved_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm khách hàng duyệt báo giá | Thời điểm khách bấm Đồng ý trên Portal |
| 14 | `approved_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Người thực hiện duyệt báo giá | Tham chiếu khóa ngoại đến users(id) (Khách hàng hoặc Cố vấn duyệt thay mặt) |
| 15 | `rejected_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm khách từ chối báo giá | Cho phép rỗng |
| 16 | `reject_reason` | TEXT | Cho phép rỗng (NULL) | Lý do khách hàng từ chối báo giá | Ví dụ: 'Chi phí vượt ngân sách', 'Chỉ muốn làm trước hạng mục phanh' |
| 17 | `snapshot_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm chốt snapshot số liệu báo giá | Đóng băng giá phụ tùng và công thợ tại thời điểm duyệt |
| 18 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Cố vấn dịch vụ lập báo giá | Tham chiếu khóa ngoại đến bảng users(id) |
| 19 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo báo giá | Tự động ghi nhận |
| 20 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật báo giá | Tự động cập nhật |

---
## 31. Chi tiết Dòng Báo giá (`quotation_lines`)

*Từng dòng chi tiết nhân công và vật tư được chào giá cho khách hàng.*

**quotation_lines**(id, quotation_id, line_type, wo_service_id, job_id, job_labour_id, job_part_id, description, quantity, snapshot_unit_price, amount, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng báo giá | Khóa chính tự tăng |
| 2 | `quotation_id` | INT | Khóa ngoại → `quotations(id)`; Không rỗng (NOT NULL) | Mã bản báo giá cha | Tham chiếu khóa ngoại đến bảng quotations(id) |
| 3 | `line_type` | ENUM (LineType) | Không rỗng (NOT NULL) | Phân loại dòng chi phí | Enum LineType: PACKAGE, LABOUR, PART, MATERIAL, FEE |
| 4 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ liên kết | Tham chiếu khóa ngoại đến wo_services(id), cho phép NULL |
| 5 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Cho phép rỗng (NULL) | Mã đầu việc liên kết | Tham chiếu khóa ngoại đến jobs(id), cho phép NULL |
| 6 | `job_labour_id` | INT | Khóa ngoại → `job_labours(id)`; Cho phép rỗng (NULL) | Mã nhân công kỹ thuật liên kết | Tham chiếu khóa ngoại đến job_labours(id), cho phép NULL |
| 7 | `job_part_id` | INT | Khóa ngoại → `job_parts(id)`; Cho phép rỗng (NULL) | Mã phụ tùng cấp phát liên kết | Tham chiếu khóa ngoại đến job_parts(id), cho phép NULL |
| 8 | `description` | VARCHAR(500) | Không rỗng (NOT NULL) | Nội dung diễn giải chi tiết dòng báo giá | Tên phụ tùng hoặc nội dung công việc (VD: 'Thay dầu động cơ Castrol Magnatec 5W-30') |
| 9 | `quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng tính tiền | Số lượng (VD: 4.00 lít, 1.00 bộ) |
| 10 | `snapshot_unit_price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá chốt tại thời điểm báo giá | Đơn giá (VNĐ). Nếu là hạng mục bảo hành thì = 0 VNĐ |
| 11 | `amount` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Thành tiền của dòng báo giá | amount = quantity * snapshot_unit_price (VNĐ) |
| 12 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự sắp xếp dòng trên phiếu in | Số nguyên sắp xếp |

---

# PHÂN HỆ 8: QUALITY CONTROL

## 32. Biên bản Nghiệm thu Chất lượng (QC) (`qc_records`)

*Hồ sơ nghiệm thu tổng thể kỹ thuật và thẩm mỹ sau khi KTV hoàn tất công việc, quyết định cho phép lập hóa đơn hoặc bắt buộc làm lại (Rework).*

**qc_records**(id, wo_service_id, template_id, overall_result, notes, inspector_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã biên bản nghiệm thu QC | Khóa chính tự tăng |
| 2 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`; Không rỗng (NOT NULL) | Mã dịch vụ được nghiệm thu | Tham chiếu khóa ngoại đến bảng wo_services(id) |
| 3 | `template_id` | INT | Khóa ngoại → `inspection_templates(id)`; Cho phép rỗng (NULL) | Mã biểu mẫu QC áp dụng | Tham chiếu khóa ngoại đến inspection_templates(id), cho phép NULL |
| 4 | `overall_result` | ENUM (QcResult) | Không rỗng (NOT NULL) | Đánh giá nghiệm thu tổng thể | Enum QcResult: PASS (Đạt chuẩn xuất xưởng) → Cho phép thanh toán; FAIL (Không đạt) → Buộc tạo Job Rework |
| 5 | `notes` | TEXT | Cho phép rỗng (NULL) | Nhận xét tổng quát của Chuyên viên QC | Ghi chú nguyên nhân không đạt hoặc các điểm cần lưu ý |
| 6 | `inspector_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Chuyên viên QC / Quản đốc kiểm định | Tham chiếu khóa ngoại đến bảng users(id) |
| 7 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm thực hiện nghiệm thu QC | Tự động ghi nhận |

---
## 33. Kết quả Tiêu chí QC (`qc_items`)

*Đánh giá Đạt/Không đạt cho từng tiêu chí kiểm tra chất lượng xuất xưởng.*

**qc_items**(id, qc_record_id, template_item_id, item_name, result, notes)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã kết quả tiêu chí QC | Khóa chính tự tăng |
| 2 | `qc_record_id` | INT | Khóa ngoại → `qc_records(id)`; Không rỗng (NOT NULL) | Mã biên bản QC cha | Tham chiếu khóa ngoại đến bảng qc_records(id) |
| 3 | `template_item_id` | INT | Khóa ngoại → `inspection_template_items(id)`; Cho phép rỗng (NULL) | Mã tiêu chí kiểm định mẫu | Tham chiếu khóa ngoại đến inspection_template_items(id), cho phép NULL |
| 4 | `item_name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên tiêu chí nghiệm thu | Ví dụ: 'Lực siết ốc bánh xe 110Nm', 'Kiểm tra rò rỉ dầu gầm', 'Vệ sinh sạch sẽ khoang máy' |
| 5 | `result` | ENUM (QcResult) | Không rỗng (NOT NULL) | Kết quả tiêu chí | Enum QcResult: PASS (Đạt), FAIL (Không đạt) |
| 6 | `notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú lỗi chi tiết nếu tiêu chí bị FAIL | Ghi chú dùng làm nguồn để kích hoạt đầu việc Rework mới |

---

# PHÂN HỆ 9: INVENTORY & PROCUREMENT

## 34. Nhà cung cấp Phụ tùng (`suppliers`)

*Quản lý đối tác cung ứng phụ tùng, dầu nhớt, vật tư tiêu hao và thiết bị cho trung tâm.*

**suppliers**(id, code, name, tax_code, contact_person, phone, email, address, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã nhà cung cấp | Khóa chính tự tăng |
| 2 | `code` | VARCHAR(30) | Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Mã hiệu nhà cung cấp | Mã quản lý nội bộ (VD: NCC-DENSO, NCC-CASTROL) |
| 3 | `name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên đầy đủ của Nhà cung cấp / Công ty | Tên pháp nhân công ty cung ứng |
| 4 | `tax_code` | VARCHAR(30) | Cho phép rỗng (NULL) | Mã số thuế doanh nghiệp | Dùng để đối chiếu hóa đơn GTGT đầu vào |
| 5 | `contact_person` | VARCHAR(150) | Cho phép rỗng (NULL) | Người liên hệ trực tiếp / Sales đại diện | Họ và tên nhân viên kinh doanh của NCC |
| 6 | `phone` | VARCHAR(20) | Cho phép rỗng (NULL) | Số điện thoại liên hệ | Hotline hoặc số di động người phụ trách |
| 7 | `email` | VARCHAR(255) | Cho phép rỗng (NULL) | Địa chỉ email nhận đơn đặt hàng | Email gửi đơn PO đặt hàng phụ tùng |
| 8 | `address` | TEXT | Cho phép rỗng (NULL) | Địa chỉ văn phòng / kho bãi của NCC | Địa chỉ nhận giao hàng |
| 9 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Tình trạng hợp tác | true: Đang giao dịch cung ứng hàng; false: Tạm dừng |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo hồ sơ nhà cung cấp | Tự động ghi nhận |
| 11 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật thông tin nhà cung cấp | Tự động cập nhật |

---
## 35. Danh mục Phân loại Phụ tùng (`part_categories`)

*Phân loại các nhóm phụ tùng trong kho (Má phanh, Lọc dầu, Lọc gió, Giảm xóc, Dầu nhờn, v.v.) và đơn vị tính chuẩn.*

**part_categories**(id, code, name, item_type, uom_id, description, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã nhóm danh mục phụ tùng | Khóa chính tự tăng |
| 2 | `code` | VARCHAR(50) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Mã ký hiệu danh mục | Mã nhóm viết tắt (VD: BRAKE_PAD, OIL_FILTER, SHOCK_ABSORBER) |
| 3 | `name` | VARCHAR(255) | Không rỗng (NOT NULL) | Tên danh mục phân loại | Bố thắng / Má phanh, Lọc nhớt động cơ, Bugi đánh lửa, Dầu động cơ tổng hợp |
| 4 | `item_type` | ENUM (ItemType) | Không rỗng (NOT NULL) | Loại mặt hàng lưu kho | Enum ItemType: PART (Phụ tùng), CONSUMABLE (Vật tư tiêu hao), CHEMICAL (Hóa chất), ACCESSORY (Phụ kiện) |
| 5 | `uom_id` | INT | Khóa ngoại → `system_catalogs(id)`; Không rỗng (NOT NULL) | Mã đơn vị tính cơ sở | Tham chiếu khóa ngoại đến system_catalogs(id) (Cái, Chiếc, Lít, Bình, Bộ) |
| 6 | `description` | TEXT | Cho phép rỗng (NULL) | Mô tả phạm vi danh mục | Cho phép rỗng |
| 7 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái kích hoạt | true: Đang sử dụng; false: Ngưng dùng |
| 8 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo danh mục | Tự động ghi nhận |
| 9 | `updated_at` | DATETIME | Không rỗng (NOT NULL) | Thời điểm cập nhật danh mục | Tự động cập nhật |

---
## 36. Mặt hàng Kho Phụ tùng (`inventory_items`)

*Hồ sơ từng mã phụ tùng tồn kho (SKU), theo dõi số lượng tồn vật lý on_hand, giá bán niêm yết, giá vốn bình quân MWA và hạn mức bảo hành tiêu chuẩn.*

**inventory_items**(id, part_category_id, sku, brand_id, selling_price, average_cost, on_hand, reorder_level, warranty_months, warranty_mileage, is_active, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh mặt hàng kho | Khóa chính tự tăng |
| 2 | `part_category_id` | INT | Khóa ngoại → `part_categories(id)`; Không rỗng (NOT NULL) | Mã danh mục phân loại phụ tùng | Tham chiếu khóa ngoại đến bảng part_categories(id) |
| 3 | `sku` | VARCHAR(50) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Mã SKU quản lý kho duy nhất | Mã Barcode / SKU duy nhất (VD: OIL-SYN-5W30, BP-TOY-VIOS-01) |
| 4 | `brand_id` | INT | Khóa ngoại → `system_catalogs(id)`; Cho phép rỗng (NULL) | Mã thương hiệu sản xuất | Tham chiếu khóa ngoại đến system_catalogs(id) (Bosch, Denso, Toyota OEM, Brembo, Motul, v.v.) |
| 5 | `selling_price` | DECIMAL(15,2) | Không rỗng (NOT NULL) | Đơn giá bán niêm yết cho khách hàng | Đơn giá bán lẻ tiêu chuẩn chưa VAT (VNĐ) |
| 6 | `average_cost` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Giá vốn bình quân gia quyền di động (MWA) | Giá vốn thực tế tính tự động sau mỗi lần Nhập kho theo công thức MWA (Moving Weighted Average) |
| 7 | `on_hand` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Số lượng tồn kho thực tế khả dụng | Số lượng tồn kho vật lý hiện tại trong kho (Số nguyên) |
| 8 | `reorder_level` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Ngưỡng tồn kho tối thiểu cảnh báo nhập hàng | Khi on_hand <= reorder_level hệ thống tự động phát cảnh báo hết hàng |
| 9 | `warranty_months` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thời hạn bảo hành tiêu chuẩn của phụ tùng (Số tháng) | Thời hạn bảo hành phụ tùng theo tháng (Ví dụ: 12 tháng, 24 tháng) |
| 10 | `warranty_mileage` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Hạn mức ODO bảo hành tiêu chuẩn (Số km) | Số km lăn bánh tối đa được bảo hành đối với phụ tùng (Ví dụ: 20.000 km) |
| 11 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái kinh doanh mặt hàng | true: Đang kinh doanh và xuất kho; false: Ngừng nhập/bán |
| 12 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo mặt hàng | Tự động ghi nhận |
| 13 | `updated_at` | DATETIME | Không rỗng (NOT NULL) | Thời điểm cập nhật mặt hàng | Tự động cập nhật |

---
## 37. Phiếu Nhập kho Phụ tùng (`goods_receipts`)

*Chứng từ nhập kho vật tư từ Nhà cung cấp hoặc nhập số dư đầu kỳ, tự động cập nhật thẻ kho và tính lại giá vốn bình quân MWA.*

**goods_receipts**(id, receipt_number, supplier_id, receipt_type, status, reference_no, received_date, subtotal, discount_amount, tax_rate, tax_amount, grand_total, notes, cancel_reason, cancelled_at, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh phiếu nhập kho | Khóa chính tự tăng |
| 2 | `receipt_number` | VARCHAR(30) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Số phiếu nhập kho hiển thị | Mã duy nhất định dạng GR-YYYYMMDD-XXXX (VD: GR-20261108-0001) |
| 3 | `supplier_id` | INT | Khóa ngoại → `suppliers(id)`; Cho phép rỗng (NULL) | Mã nhà cung cấp giao hàng | Tham chiếu khóa ngoại đến suppliers(id), có thể NULL nếu là OPENING_STOCK |
| 4 | `receipt_type` | ENUM (ReceiptType) | Không rỗng (NOT NULL) | Loại chứng từ nhập kho | Enum ReceiptType: PURCHASE (Nhập mua hàng), OPENING_STOCK (Nhập số dư đầu kỳ) |
| 5 | `status` | ENUM (GoodsReceiptStatus) | Không rỗng (NOT NULL); Mặc định: 'POSTED' | Trạng thái chứng từ nhập kho | Enum GoodsReceiptStatus: DRAFT (Bản nháp), POSTED (Đã ghi sổ kho), CANCELLED (Đã hủy an toàn) |
| 6 | `reference_no` | VARCHAR(100) | Cho phép rỗng (NULL) | Số hóa đơn GTGT / Chứng từ giao hàng của NCC | Số hóa đơn đỏ hoặc số phiếu giao hàng của NCC để đối soát kế toán |
| 7 | `received_date` | DATETIME | Không rỗng (NOT NULL) | Ngày thực tế nhận hàng vào kho | Ngày nhận hàng vật lý tại kho |
| 8 | `subtotal` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tổng tiền hàng trước thuế và chiết khấu | Tổng cộng các dòng nhập kho (VNĐ) |
| 9 | `discount_amount` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Số tiền chiết khấu thương mại từ NCC | Đơn vị tính: VNĐ |
| 10 | `tax_rate` | DECIMAL(5,2) | Không rỗng (NOT NULL); Mặc định: '0' | Thuế suất GTGT đầu vào | Phần trăm thuế (VD: 8.00%, 10.00%) |
| 11 | `tax_amount` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tiền thuế GTGT đầu vào | Đơn vị tính: VNĐ |
| 12 | `grand_total` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tổng giá trị thanh toán cho Nhà cung cấp | grand_total = subtotal - discount_amount + tax_amount (VNĐ) |
| 13 | `notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú chứng từ nhập kho | Cho phép rỗng |
| 14 | `cancel_reason` | TEXT | Cho phép rỗng (NULL) | Lý do hủy chứng từ nhập | Ghi nhận bắt buộc nếu status = CANCELLED |
| 15 | `cancelled_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm hủy chứng từ | Cho phép rỗng |
| 16 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Thủ kho lập phiếu nhập | Tham chiếu khóa ngoại đến bảng users(id) |
| 17 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo phiếu nhập kho | Tự động ghi nhận |

---
## 38. Chi tiết Dòng Phụ tùng Nhập kho (`goods_receipt_items`)

*Từng mặt hàng phụ tùng nhập kho, lưu vết lịch sử tồn kho và giá vốn trước/sau khi nhập để phục vụ kiểm toán MWA.*

**goods_receipt_items**(id, receipt_id, item_id, quantity, unit_cost, discount_rate, line_total, old_on_hand, old_average_cost, new_average_cost)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng nhập kho | Khóa chính tự tăng |
| 2 | `receipt_id` | INT | Khóa ngoại → `goods_receipts(id)`; Không rỗng (NOT NULL) | Mã phiếu nhập kho cha | Tham chiếu khóa ngoại đến bảng goods_receipts(id) |
| 3 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`; Không rỗng (NOT NULL) | Mã mặt hàng phụ tùng nhập | Tham chiếu khóa ngoại đến bảng inventory_items(id) |
| 4 | `quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng thực nhập vào kho | Số lượng nhập (VD: 50.00 cái, 200.00 lít) |
| 5 | `unit_cost` | DECIMAL(12,4) | Không rỗng (NOT NULL) | Đơn giá nhập mua thực tế | Đơn vị VNĐ, độ chính xác 4 số thập phân (DECIMAL(12,4)) |
| 6 | `discount_rate` | DECIMAL(5,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tỷ lệ chiết khấu trên dòng hàng (%) | Ví dụ: 5.00 tương đương 5% |
| 7 | `line_total` | DECIMAL(15,2) | Không rỗng (NOT NULL); Mặc định: '0' | Thành tiền dòng hàng sau chiết khấu | line_total = quantity * unit_cost * (1 - discount_rate/100) (VNĐ) |
| 8 | `old_on_hand` | INT | Cho phép rỗng (NULL) | Snapshot số lượng tồn kho trước khi ghi sổ | Lưu vết phục vụ kiểm toán số dư tồn kho |
| 9 | `old_average_cost` | DECIMAL(15,2) | Cho phép rỗng (NULL) | Snapshot giá vốn bình quân MWA trước khi ghi sổ | Lưu vết giá vốn cũ phục vụ kiểm toán MWA |
| 10 | `new_average_cost` | DECIMAL(15,2) | Cho phép rỗng (NULL) | Giá vốn bình quân MWA mới sau khi ghi sổ | Công thức MWA = ((old_on_hand * old_avg_cost) + (quantity * unit_cost)) / (old_on_hand + quantity) |

---
## 39. Lịch sử Biến động Thẻ kho (Stock Movement) (`stock_movements`)

*Sổ cái thẻ kho ghi nhận bất biến (Immutable Ledger) mọi giao dịch làm biến động số lượng và giá vốn phụ tùng (Nhập kho, Xuất cho lệnh, Hoàn kho thừa, Điều chỉnh kiểm kê).*

**stock_movements**(id, item_id, movement_type, reference_type, reference_id, source_movement_id, job_id, job_part_id, quantity, unit_cost, balance_after, notes, created_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã giao dịch biến động thẻ kho | Khóa chính tự tăng |
| 2 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`; Không rỗng (NOT NULL) | Mã mặt hàng phụ tùng biến động | Tham chiếu khóa ngoại đến bảng inventory_items(id) |
| 3 | `movement_type` | ENUM (MovementType) | Không rỗng (NOT NULL) | Loại biến động thẻ kho | Enum MovementType: RECEIPT (Nhập kho), OPENING (Số dư đầu kỳ), ISSUE (Xuất kho thợ dùng), RETURN (Thợ trả hàng thừa), ADJUSTMENT (Điều chỉnh kiểm kê) |
| 4 | `reference_type` | ENUM (ReferenceType) | Không rỗng (NOT NULL) | Loại chứng từ nguồn đối soát | Enum ReferenceType: GOODS_RECEIPT, JOB, ADJUSTMENT |
| 5 | `reference_id` | INT | Không rỗng (NOT NULL) | Mã ID của chứng từ đối ứng | ID tham chiếu đến bảng goods_receipts, jobs hoặc stock_adjustments |
| 6 | `source_movement_id` | INT | Khóa ngoại → `stock_movements(id)`; Cho phép rỗng (NULL) | Mã bút toán xuất gốc khi thực hiện trả hàng | Quan hệ tự tham chiếu (Self-relation) stock_movements(id) đối ứng hoàn kho |
| 7 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Cho phép rỗng (NULL) | Mã đầu việc sửa chữa sử dụng vật tư | Tham chiếu khóa ngoại đến bảng jobs(id), cho phép NULL |
| 8 | `job_part_id` | INT | Khóa ngoại → `job_parts(id)`; Cho phép rỗng (NULL) | Mã yêu cầu cấp phát phụ tùng | Tham chiếu khóa ngoại đến bảng job_parts(id), cho phép NULL |
| 9 | `quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng biến động trong giao dịch | Số dương: Tăng kho (Nhập/Hoàn trả); Số âm: Giảm kho (Xuất xưởng thi công) |
| 10 | `unit_cost` | DECIMAL(12,4) | Không rỗng (NOT NULL) | Đơn giá vốn tại thời điểm phát sinh giao dịch | Giá vốn MWA của giao dịch xuất kho hoặc đơn giá nhập |
| 11 | `balance_after` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng tồn kho tức thời sau giao dịch | Số dư tồn kho thực tế sau khi cộng/trừ số lượng biến động |
| 12 | `notes` | TEXT | Cho phép rỗng (NULL) | Diễn giải chi tiết lý do biến động thẻ kho | Ghi chú chứng từ nghiệp vụ |
| 13 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Thủ kho / Người thực hiện giao dịch | Tham chiếu khóa ngoại đến bảng users(id) |
| 14 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm ghi nhận thẻ kho | Tự động ghi nhận |

---
## 40. Phiếu Điều chỉnh Kiểm kê Kho (`stock_adjustments`)

*Hồ sơ đề xuất và phê duyệt điều chỉnh số lượng tồn kho sau các đợt kiểm kê định kỳ hoặc khi phát hiện hư hỏng, thất thoát.*

**stock_adjustments**(id, item_id, adjustment_quantity, reason, status, requested_by_id, approved_by_id, approved_at, reject_reason, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã phiếu điều chỉnh kiểm kê | Khóa chính tự tăng |
| 2 | `item_id` | INT | Khóa ngoại → `inventory_items(id)`; Không rỗng (NOT NULL) | Mã mặt hàng cần điều chỉnh | Tham chiếu khóa ngoại đến bảng inventory_items(id) |
| 3 | `adjustment_quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng điều chỉnh (Chênh lệch kiểm kê) | Số dương: Tồn thực tế > Sổ sách (Tăng kho); Số âm: Tồn thực tế < Sổ sách (Hao hụt/Mất mát) |
| 4 | `reason` | TEXT | Không rỗng (NOT NULL) | Lý do điều chỉnh số dư kho | Ví dụ: 'Hao hụt bay hơi dầu thắng', 'Hàng vỡ rách trong kho', 'Lệch kiểm kê cuối tháng' |
| 5 | `status` | ENUM (AdjustmentStatus) | Không rỗng (NOT NULL); Mặc định: 'PENDING' | Trạng thái phê duyệt điều chỉnh | Enum AdjustmentStatus: PENDING (Chờ duyệt), APPROVED (Đã duyệt), REJECTED (Từ chối) |
| 6 | `requested_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Thủ kho đề xuất điều chỉnh | Tham chiếu khóa ngoại đến bảng users(id) |
| 7 | `approved_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Quản đốc / Giám đốc xưởng phê duyệt | Tham chiếu khóa ngoại đến users(id), NULL khi chưa duyệt |
| 8 | `approved_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm phê duyệt điều chỉnh | Thời điểm ghi nhận biến động thẻ kho chính thức |
| 9 | `reject_reason` | TEXT | Cho phép rỗng (NULL) | Lý do từ chối đề xuất điều chỉnh | Ghi nhận nếu status = REJECTED |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo đề xuất | Tự động ghi nhận |

---

# PHÂN HỆ 10: BILLING, PAYMENT & SETTLEMENT

## 41. Hóa đơn Dịch vụ (`invoices`)

*Hóa đơn tài chính chính thức của Lệnh sửa chữa, quản lý số tiền phải thu, chiết khấu và tự động quyết toán PAID đối với các đơn hàng bảo hành 0đ.*

**invoices**(id, work_order_id, invoice_number, status, subtotal, discount_amount, discount_reason, tax_amount, total_amount, amount_due, notes, issued_at, issued_by_id, paid_at, cancelled_at, cancel_reason, created_by_id, created_at, updated_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh hóa đơn | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Không rỗng (NOT NULL) | Mã Lệnh sửa chữa thanh toán | Tham chiếu khóa ngoại đến bảng work_orders(id) |
| 3 | `invoice_number` | VARCHAR(30) | Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Số hóa đơn tài chính hiển thị | Mã duy nhất định dạng INV-YYYYMMDD-XXXX (VD: INV-20261109-0001) |
| 4 | `status` | ENUM (InvoiceStatus) | Không rỗng (NOT NULL); Mặc định: 'DRAFT' | Trạng thái hóa đơn | Enum InvoiceStatus: DRAFT (Bản nháp), ISSUED (Đã phát hành), PAID (Đã thanh toán đủ), CANCELLED (Đã hủy). Hóa đơn bảo hành 0đ tự động kích hoạt trạng thái PAID |
| 5 | `subtotal` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Tổng tiền hàng trước thuế và giảm giá | Tổng cộng các dòng dịch vụ và phụ tùng (VNĐ) |
| 6 | `discount_amount` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Số tiền giảm giá / khuyến mãi | Đơn vị tính: VNĐ |
| 7 | `discount_reason` | VARCHAR(500) | Cho phép rỗng (NULL) | Lý do áp dụng giảm giá | Ví dụ: 'Khách hàng thân thiết VIP Gold giảm 10%', 'Voucher khai trương' |
| 8 | `tax_amount` | DECIMAL(12,2) | Không rỗng (NOT NULL); Mặc định: '0' | Tiền thuế GTGT (VAT) | Đơn vị tính: VNĐ |
| 9 | `total_amount` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Tổng giá trị hóa đơn sau thuế | total_amount = subtotal - discount_amount + tax_amount (VNĐ) |
| 10 | `amount_due` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Số tiền còn lại khách hàng phải thanh toán | amount_due = total_amount - Tổng các khoản Payment đã thanh toán thành công (VNĐ) |
| 11 | `notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú trên hóa đơn | Thông tin thanh toán, số tài khoản nhận tiền |
| 12 | `issued_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm phát hành hóa đơn | Thời điểm thu ngân in hoặc gửi hóa đơn điện tử cho khách |
| 13 | `issued_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Thu ngân phát hành hóa đơn | Tham chiếu khóa ngoại đến users(id), cho phép NULL |
| 14 | `paid_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm hóa đơn được tất toán đủ tiền | Thời điểm amount_due = 0 hoặc hóa đơn bảo hành 0đ được xác nhận |
| 15 | `cancelled_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm hủy hóa đơn | Cho phép rỗng |
| 16 | `cancel_reason` | TEXT | Cho phép rỗng (NULL) | Lý do hủy hóa đơn | Ghi nhận nếu status = CANCELLED |
| 17 | `created_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Người lập hóa đơn | Tham chiếu khóa ngoại đến bảng users(id) |
| 18 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm tạo bản ghi hóa đơn | Tự động ghi nhận |
| 19 | `updated_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm cập nhật hóa đơn | Tự động cập nhật |

---
## 42. Dòng Chi tiết Hóa đơn (`invoice_lines`)

*Từng dòng chi phí dịch vụ, nhân công, phụ tùng được quyết toán trên hóa đơn, liên kết đối ứng với dòng báo giá đã duyệt.*

**invoice_lines**(id, invoice_id, line_type, quotation_line_id, wo_service_id, job_id, description, quantity, unit_price, amount, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã dòng chi tiết hóa đơn | Khóa chính tự tăng |
| 2 | `invoice_id` | INT | Khóa ngoại → `invoices(id)`; Không rỗng (NOT NULL) | Mã hóa đơn cha | Tham chiếu khóa ngoại đến bảng invoices(id) |
| 3 | `line_type` | ENUM (LineType) | Không rỗng (NOT NULL) | Phân loại dòng chi phí | Enum LineType: PACKAGE, LABOUR, PART, MATERIAL, FEE |
| 4 | `quotation_line_id` | INT | Khóa ngoại → `quotation_lines(id)`; Cho phép rỗng (NULL) | Mã dòng báo giá gốc tương ứng | Tham chiếu khóa ngoại đến quotation_lines(id), cho phép NULL |
| 5 | `wo_service_id` | INT | Khóa ngoại → `wo_services(id)`; Cho phép rỗng (NULL) | Mã dịch vụ liên kết | Tham chiếu khóa ngoại đến wo_services(id), cho phép NULL |
| 6 | `job_id` | INT | Khóa ngoại → `jobs(id)`; Cho phép rỗng (NULL) | Mã đầu việc liên kết | Tham chiếu khóa ngoại đến jobs(id), cho phép NULL |
| 7 | `description` | VARCHAR(500) | Không rỗng (NOT NULL) | Nội dung diễn giải chi tiết dòng hóa đơn | Tên dịch vụ/phụ tùng in trên hóa đơn VAT |
| 8 | `quantity` | DECIMAL(10,2) | Không rỗng (NOT NULL) | Số lượng quyết toán | Số lượng thực tế (VD: 1.00 cái, 4.00 lít) |
| 9 | `unit_price` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Đơn giá tính tiền | Đơn vị VNĐ (0 VNĐ nếu thuộc diện bảo hành miễn phí) |
| 10 | `amount` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Thành tiền của dòng hóa đơn | amount = quantity * unit_price (VNĐ) |
| 11 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự sắp xếp hiển thị | Số nguyên sắp xếp |

---
## 43. Giao dịch Thanh toán (`payments`)

*Lưu trữ từng giao dịch thanh toán của khách hàng (Tiền mặt, Thẻ POS hoặc Chuyển khoản VietQR tự động qua SePay Payment Gateway).*

**payments**(id, invoice_id, payment_method, amount, tendered_amount, transaction_ref, gateway_provider, payment_url, payment_payload, status, failure_reason, expires_at, paid_at, received_by_id, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã định danh giao dịch thanh toán | Khóa chính tự tăng |
| 2 | `invoice_id` | INT | Khóa ngoại → `invoices(id)`; Không rỗng (NOT NULL) | Mã hóa đơn được thanh toán | Tham chiếu khóa ngoại đến bảng invoices(id) |
| 3 | `payment_method` | ENUM (PaymentMethod) | Không rỗng (NOT NULL) | Phương thức thanh toán áp dụng | Enum PaymentMethod: CASH (Tiền mặt), CARD (Quẹt thẻ POS), QR_TRANSFER (Chuyển khoản VietQR qua SePay) |
| 4 | `amount` | DECIMAL(12,2) | Không rỗng (NOT NULL) | Số tiền thanh toán thực tế | Đơn vị tính: VNĐ |
| 5 | `tendered_amount` | DECIMAL(12,2) | Cho phép rỗng (NULL) | Số tiền mặt khách đưa (Thu tiền mặt) | Dùng để tính tiền thừa trả lại khách hàng (VNĐ) |
| 6 | `transaction_ref` | VARCHAR(255) | Duy nhất (UNIQUE); Cho phép rỗng (NULL) | Mã tham chiếu giao dịch ngân hàng / SePay | Mã giao dịch duy nhất đối soát với ngân hàng hoặc SePay Webhook |
| 7 | `gateway_provider` | VARCHAR(50) | Cho phép rỗng (NULL) | Cổng thanh toán cung ứng | Ví dụ: 'SEPAY', 'VNPAY', 'MOMO', 'VIETCOMBANK_POS' |
| 8 | `payment_url` | TEXT | Cho phép rỗng (NULL) | Đường dẫn thanh toán hoặc mã QR code trực tuyến | URL mã QR VietQR động sinh ra từ SePay |
| 9 | `payment_payload` | JSON | Cho phép rỗng (NULL) | Dữ liệu Webhook nguyên bản từ Cổng thanh toán | Định dạng JSON: Payload Webhook gửi từ SePay để phục vụ đối soát, kiểm toán tài chính |
| 10 | `status` | ENUM (PaymentStatus) | Không rỗng (NOT NULL); Mặc định: 'PENDING' | Trạng thái giao dịch | Enum PaymentStatus: PENDING (Chờ khách chuyển tiền), SUCCESS (Đã nhận tiền thành công), FAILED (Thất bại/Hết hạn) |
| 11 | `failure_reason` | VARCHAR(500) | Cho phép rỗng (NULL) | Lý do giao dịch thất bại | Ghi nhận nếu status = FAILED |
| 12 | `expires_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm link/mã QR thanh toán hết hạn | Mặc định mã VietQR có hiệu lực trong 15 phút |
| 13 | `paid_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm ngân hàng ghi có thành công | Thời điểm tiền vào tài khoản xưởng |
| 14 | `received_by_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Thu ngân tiếp nhận tiền mặt tại quầy | Tham chiếu khóa ngoại đến users(id), NULL nếu thanh toán online qua Webhook |
| 15 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm khởi tạo giao dịch | Tự động ghi nhận |

---
## 44. Biên bản Bàn giao Xe Xuất xưởng (`vehicle_releases`)

*Thủ tục cổng an ninh (Release Gate) xuất xưởng xe sau khi hoàn tất kiểm tra QC và giải tỏa tài chính (Financial Cleared).*

**vehicle_releases**(id, work_order_id, release_notes, released_by_id, released_at, confirmed_by_customer_id, confirmed_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã biên bản bàn giao xe | Khóa chính tự tăng |
| 2 | `work_order_id` | INT | Khóa ngoại → `work_orders(id)`; Duy nhất (UNIQUE); Không rỗng (NOT NULL) | Mã Lệnh sửa chữa hoàn tất | Khóa ngoại duy nhất (1-1) tham chiếu đến work_orders(id) |
| 3 | `release_notes` | TEXT | Cho phép rỗng (NULL) | Ghi chú dặn dò khách hàng khi bàn giao xe | Ví dụ: 'Dặn dò khách chạy rà phanh mới trong 200km đầu', 'Hẹn bảo dưỡng mốc 50.000km' |
| 4 | `released_by_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Cố vấn dịch vụ / Nhân sự thực hiện bàn giao | Tham chiếu khóa ngoại đến bảng users(id) |
| 5 | `released_at` | DATETIME | Không rỗng (NOT NULL) | Thời điểm xe chính thức lăn bánh xuất xưởng | Dấu thời gian xe qua cổng an ninh |
| 6 | `confirmed_by_customer_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Khách hàng nhận xe ký xác nhận | Tham chiếu khóa ngoại đến users(id), cho phép NULL |
| 7 | `confirmed_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm khách hàng ký nhận xe | Cho phép rỗng |

---

# PHÂN HỆ 11: SYSTEM & SUPPORT

## 45. Danh mục Chung Hệ thống (`system_catalogs`)

*Bảng Master Data lưu trữ các danh mục dùng chung (Đơn vị tính UOM, Thương hiệu phụ tùng BRAND, Lý do hủy, Điều khoản).*

**system_catalogs**(id, catalog_type, name, description, is_active, sort_order)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi danh mục chuẩn | Khóa chính tự tăng |
| 2 | `catalog_type` | ENUM (CatalogType) | Không rỗng (NOT NULL) | Phân loại nhóm danh mục | Enum CatalogType: UOM (Đơn vị tính), CANCEL_REASON (Lý do hủy), ADJUST_REASON (Lý do điều chỉnh kho), TERMS (Điều khoản), BRAND (Thương hiệu phụ tùng) |
| 3 | `name` | VARCHAR(150) | Không rỗng (NOT NULL) | Tên giá trị danh mục | Ví dụ: 'Cái', 'Lít', 'Bộ', 'Bosch', 'Denso', 'Khách đổi kế hoạch' |
| 4 | `description` | TEXT | Cho phép rỗng (NULL) | Diễn giải chi tiết mục danh mục | Cho phép rỗng |
| 5 | `is_active` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: true | Trạng thái kích hoạt | true: Áp dụng trên dropdowns; false: Ẩn |
| 6 | `sort_order` | INT | Không rỗng (NOT NULL); Mặc định: '0' | Thứ tự sắp xếp hiển thị | Số nguyên sắp xếp |

---
## 46. Thông báo Hệ thống (`notifications`)

*Lưu trữ các thông báo sự kiện theo thời gian thực (Web Socket, In-app, Email) gửi tới từng người dùng.*

**notifications**(id, user_id, notification_type, title, message, entity_type, entity_id, is_read, read_at, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã thông báo | Khóa chính tự tăng |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`; Không rỗng (NOT NULL) | Mã người nhận thông báo | Tham chiếu khóa ngoại đến bảng users(id) |
| 3 | `notification_type` | ENUM (NotificationType) | Không rỗng (NOT NULL) | Loại sự kiện thông báo | Enum NotificationType: APPOINTMENT_CONFIRMED, CHECKIN_READY, QUOTATION_SENT, INVOICE_ISSUED, PAYMENT_SUCCESS, VEHICLE_READY, v.v. |
| 4 | `title` | VARCHAR(255) | Không rỗng (NOT NULL) | Tiêu đề ngắn gọn của thông báo | Ví dụ: 'Báo giá sửa chữa đã sẵn sàng', 'Xe của bạn đã hoàn tất sửa chữa' |
| 5 | `message` | TEXT | Không rỗng (NOT NULL) | Nội dung chi tiết thông báo | Nội dung thông điệp gửi tới người dùng |
| 6 | `entity_type` | VARCHAR(50) | Cho phép rỗng (NULL) | Loại đối tượng liên kết | Tên bảng liên quan: 'work_orders', 'quotations', 'invoices', 'appointments' |
| 7 | `entity_id` | INT | Cho phép rỗng (NULL) | Mã ID của đối tượng liên kết | ID đối tượng để người dùng bấm vào xem chi tiết |
| 8 | `is_read` | BOOLEAN | Không rỗng (NOT NULL); Mặc định: false | Trạng thái đã đọc thông báo | true: Khách/Nhân viên đã đọc; false: Chưa đọc |
| 9 | `read_at` | DATETIME | Cho phép rỗng (NULL) | Thời điểm người dùng mở đọc thông báo | Ghi nhận khi người dùng bấm vào thông báo |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm phát sinh thông báo | Tự động ghi nhận |

---
## 47. Nhật ký Kiểm toán Hệ thống (Audit Trail) (`audit_logs`)

*Lưu trữ nhật ký bất biến mọi hành vi thao tác dữ liệu nhạy cảm (Tạo, Sửa, Xóa, Chuyển trạng thái máy FSM), lưu vết IP và dữ liệu Before/After JSON.*

**audit_logs**(id, user_id, action, entity_type, entity_id, before_data, after_data, ip_address, user_agent, created_at)

| STT | Thuộc tính (Column) | Kiểu dữ liệu | Miền giá trị / Ràng buộc | Ý nghĩa nghiệp vụ | Ghi chú kỹ thuật |
|:---:|:---|:---|:---|:---|:---|
| 1 | `id` | INT AUTO_INCREMENT | Khóa chính, Tự tăng (PK) | Mã bản ghi nhật ký kiểm toán | Khóa chính tự tăng |
| 2 | `user_id` | INT | Khóa ngoại → `users(id)`; Cho phép rỗng (NULL) | Người thực hiện hành động | Tham chiếu khóa ngoại đến users(id), NULL nếu là hành động hệ thống tự động |
| 3 | `action` | ENUM (AuditAction) | Không rỗng (NOT NULL) | Loại hành động tác động | Enum AuditAction: CREATE (Tạo mới), UPDATE (Cập nhật), DELETE (Xóa), STATUS_CHANGE (Chuyển trạng thái FSM) |
| 4 | `entity_type` | VARCHAR(50) | Không rỗng (NOT NULL) | Tên thực thể bị tác động | Tên bảng CSDL: 'work_orders', 'quotations', 'invoices', 'goods_receipts', v.v. |
| 5 | `entity_id` | INT | Không rỗng (NOT NULL) | Mã ID của bản ghi bị tác động | Khóa chính ID của bản ghi mục tiêu |
| 6 | `before_data` | JSON | Cho phép rỗng (NULL) | Snapshot dữ liệu trước khi thay đổi | Định dạng JSON: Toàn bộ dữ liệu trước khi cập nhật |
| 7 | `after_data` | JSON | Cho phép rỗng (NULL) | Snapshot dữ liệu sau khi thay đổi | Định dạng JSON: Toàn bộ dữ liệu sau khi cập nhật |
| 8 | `ip_address` | VARCHAR(45) | Cho phép rỗng (NULL) | Địa chỉ IP nguồn của client | Hỗ trợ IPv4 và IPv6 (Tối đa 45 ký tự) |
| 9 | `user_agent` | VARCHAR(500) | Cho phép rỗng (NULL) | Thông tin trình duyệt / Ứng dụng người dùng | Chuỗi User-Agent của thiết bị thực hiện thao tác |
| 10 | `created_at` | DATETIME | Không rỗng (NOT NULL); Mặc định: CURRENT_TIMESTAMP | Thời điểm ghi nhận hành động kiểm toán | Tự động ghi nhận |

---
