# Entity-Relationship Diagram (ERD) - Mô tả Chi tiết Dữ liệu

Tài liệu này chuẩn hóa và liệt kê **TOÀN BỘ 47 thực thể (models/tables)** của hệ thống Car Service Center từ `schema.prisma`, chi tiết các thuộc tính cốt lõi (PK, FK, scalar) và mối quan hệ cardinality, được phân chia theo **4 Phân hệ kiến trúc (Modules)**.

---

## 1. Module: System, Users & Assets (Hệ thống, Người dùng & Tài sản)
*Bao gồm: Người dùng, Vai trò, Nhân sự & Kỹ năng, Phương tiện của khách hàng, Danh mục chuẩn hệ thống, Thông báo và Nhật ký kiểm toán.*

### Thực thể
| Tên Bảng (Model) | Bảng CSDL (Table) | Thuộc tính quan trọng |
| :--- | :--- | :--- |
| **User** | `users` | id **(PK)**<br>email, phone, password_hash, full_name, address, is_active, otp_hash, otp_attempts, otp_requested_at, otp_expires_at, created_at, updated_at |
| **Role** | `roles` | id **(PK)**<br>name |
| **UserRole** | `user_roles` | id **(PK)**<br>user_id *(FK)*, role_id *(FK)* |
| **Employee** | `employees` | id **(PK)**<br>user_id *(FK)*<br>full_name, position, is_active, created_at, updated_at |
| **Skill** | `skills` | id **(PK)**<br>name, is_active |
| **EmployeeSkill** | `employee_skills` | id **(PK)**<br>employee_id *(FK)*, skill_id *(FK)* |
| **Vehicle** | `vehicles` | id **(PK)**<br>customer_id *(FK)*<br>license_plate, make, model, year, color, vehicle_size, status, created_at, updated_at |
| **SystemCatalog** | `system_catalogs` | id **(PK)**<br>catalog_type, name, description, is_active, sort_order |
| **Notification** | `notifications` | id **(PK)**<br>user_id *(FK)*<br>notification_type, title, message, entity_type, entity_id, is_read, read_at, created_at |
| **AuditLog** | `audit_logs` | id **(PK)**<br>user_id *(FK)*<br>action, entity_type, entity_id, before_data, after_data, ip_address, user_agent, created_at |

### Quan hệ
| Thực thể 1 | Lượng số | Thực thể 2 | Mô tả quan hệ |
| :--- | :---: | :--- | :--- |
| **UserRole** | N : 1 | **User** | Gán vai trò cho người dùng hệ thống (`user_id`) |
| **UserRole** | N : 1 | **Role** | Vai trò chức năng hệ thống (`role_id`) |
| **Employee** | 0..1 : 1 | **User** | Hồ sơ nhân viên liên kết tài khoản đăng nhập (`user_id`) |
| **EmployeeSkill** | N : 1 | **Employee** | Kỹ năng chuyên môn nhân sự (`employee_id`) |
| **EmployeeSkill** | N : 1 | **Skill** | Danh mục kỹ năng chuẩn hóa (`skill_id`) |
| **Vehicle** | N : 1 | **User** | Xe thuộc quyền sở hữu của khách hàng (`customer_id`) |
| **Notification** | N : 1 | **User** | Thông báo realtime gửi tới người dùng (`user_id`) |
| **AuditLog** | N : 1 | **User** | Nhật ký hành động của người dùng (`user_id`) |

---

## 2. Module: Service Catalog (Danh mục Dịch vụ & Mẫu Quy trình)
*Bao gồm: Danh mục dịch vụ, Bảng giá theo kích thước xe, Loại công việc, Mẫu công việc kỹ thuật, Mẫu vật tư và Mẫu biên bản kiểm định chất lượng/QC.*

### Thực thể
| Tên Bảng (Model) | Bảng CSDL (Table) | Thuộc tính quan trọng |
| :--- | :--- | :--- |
| **ServiceCategory** | `service_categories` | id **(PK)**<br>name, description, is_active, sort_order |
| **Service** | `services` | id **(PK)**<br>category_id *(FK)*<br>name, description, pricing_type, fixed_price, warranty_months, warranty_mileage, is_active, created_at, updated_at |
| **VehicleSizePrice** | `vehicle_size_prices` | id **(PK)**<br>service_id *(FK)*<br>vehicle_size, price |
| **JobType** | `job_types` | id **(PK)**<br>name, description, is_active |
| **JobTemplate** | `job_templates` | id **(PK)**<br>job_type_id *(FK)*, service_id *(FK)*<br>name, price, estimated_hours, requires_qc |
| **JobTemplatePart** | `job_template_parts` | id **(PK)**<br>job_template_id *(FK)*, item_id *(FK)*<br>default_quantity |
| **InspectionTemplate** | `inspection_templates` | id **(PK)**<br>service_id *(FK)*<br>template_type, name, is_active |
| **InspectionTemplateItem** | `inspection_template_items` | id **(PK)**<br>template_id *(FK)*<br>name, is_required, sort_order |

### Quan hệ
| Thực thể 1 | Lượng số | Thực thể 2 | Mô tả quan hệ |
| :--- | :---: | :--- | :--- |
| **Service** | N : 1 | **ServiceCategory** | Dịch vụ thuộc nhóm danh mục (`category_id`) |
| **VehicleSizePrice** | N : 1 | **Service** | Đơn giá phân theo kích cỡ xe (HATCHBACK, SEDAN, SUV...) (`service_id`) |
| **JobTemplate** | N : 1 | **JobType** | Phân loại loại hình công việc (`job_type_id`) |
| **JobTemplate** | N : 0..1 | **Service** | Gói dịch vụ liên kết mẫu công việc (`service_id`) |
| **JobTemplatePart** | N : 1 | **JobTemplate** | Phụ tùng định mức thuộc mẫu công việc (`job_template_id`) |
| **JobTemplatePart** | N : 1 | **InventoryItem** | Mặt hàng phụ tùng định mức trong kho (`item_id` - Module 4) |
| **InspectionTemplate** | N : 0..1 | **Service** | Mẫu biên bản kiểm tra liên kết dịch vụ (`service_id`) |
| **InspectionTemplateItem** | N : 1 | **InspectionTemplate** | Tiêu chí kiểm tra chi tiết (`template_id`) |

---

## 3. Module: Operations & Execution (Vận hành Tiếp nhận & Thi công Xưởng)
*Bao gồm: Lịch hẹn, Tiếp nhận xe, Lệnh sửa chữa (Work Order), Biên bản nhận xe & Hiện trạng (Check-in), Biên bản kiểm định xe (Inspection & Finding), Công việc kỹ thuật (Job, Labour, Part) và Kiểm tra chất lượng (QC).* 

### Thực thể
| Tên Bảng (Model) | Bảng CSDL (Table) | Thuộc tính quan trọng |
| :--- | :--- | :--- |
| **Appointment** | `appointments` | id **(PK)**<br>customer_id *(FK)*, created_by_id *(FK)*, vehicle_id *(FK)*<br>scheduled_date, scheduled_time, status, cancel_reason, notes, is_warranty, created_at, updated_at |
| **AppointmentService** | `appointment_services` | id **(PK)**<br>appointment_id *(FK)*, service_id *(FK)* |
| **IntakeRecord** | `intake_records` | id **(PK)**<br>customer_id *(FK)*, created_by_id *(FK)*, vehicle_id *(FK)*<br>intake_type, status, arrived_at, tow_company, notes, created_at |
| **IntakeService** | `intake_services` | id **(PK)**<br>intake_id *(FK)*, service_id *(FK)* |
| **WorkOrder** | `work_orders` | id **(PK)**<br>customer_id *(FK)*, closed_by_id *(FK)*, vehicle_id *(FK)*, advisor_id *(FK)*, created_by_id *(FK)*, appointment_id *(FK)*, intake_record_id *(FK)*, parent_work_order_id *(FK)*, claim_approved_by_id *(FK)*<br>wo_number, source_type, status, order_type, warranty_reason, closed_at, close_type, close_notes, created_at, updated_at |
| **CheckIn** | `check_ins` | id **(PK)**<br>work_order_id *(FK)*, confirmed_by_customer_id *(FK)*, created_by_id *(FK)*<br>mileage, fuel_level, complaint, belongings, exterior_condition, status, rejection_reason, confirmed_at, evidence_urls, created_at, updated_at |
| **WoService** | `wo_services` | id **(PK)**<br>work_order_id *(FK)*, service_id *(FK)*<br>name, pricing_type, status, sort_order, created_at, updated_at |
| **Inspection** | `inspections` | id **(PK)**<br>work_order_id *(FK)*, wo_service_id *(FK)*, template_id *(FK)*, created_by_id *(FK)*<br>status, created_at, updated_at |
| **InspectionResult** | `inspection_results` | id **(PK)**<br>inspection_id *(FK)*, template_item_id *(FK)*<br>item_name, result, notes |
| **Finding** | `findings` | id **(PK)**<br>inspection_id *(FK)*, created_by_id *(FK)*<br>status, description, severity, recommendation, evidence_urls, is_visible_to_customer, marker_type, part_name, coordinates, created_at, updated_at |
| **Job** | `jobs` | id **(PK)**<br>wo_service_id *(FK)*, job_type_id *(FK)*, job_template_id *(FK)*, parent_job_id *(FK)*, rework_source_qc_item_id *(FK)*, created_by_id *(FK)*<br>name, description, estimated_hours, actual_hours, status, result_notes, is_rework, is_warranty, original_job_id, started_at, completed_at, created_at, updated_at |
| **JobFinding** | `job_findings` | id **(PK)**<br>job_id *(FK)*, finding_id *(FK)* |
| **JobLabour** | `job_labours` | id **(PK)**<br>job_id *(FK)*, job_type_id *(FK)*, employee_id *(FK)*<br>description, estimated_hours, price, created_at, updated_at |
| **JobPart** | `job_parts` | id **(PK)**<br>job_id *(FK)*, item_id *(FK)*<br>status, is_warranty, planned_quantity, issued_quantity, returned_quantity, unit_price, created_at, updated_at |
| **QcRecord** | `qc_records` | id **(PK)**<br>wo_service_id *(FK)*, template_id *(FK)*, inspector_id *(FK)*<br>overall_result, notes, created_at |
| **QcItem** | `qc_items` | id **(PK)**<br>qc_record_id *(FK)*, template_item_id *(FK)*<br>item_name, result, notes |

### Quan hệ
| Thực thể 1 | Lượng số | Thực thể 2 | Mô tả quan hệ |
| :--- | :---: | :--- | :--- |
| **Appointment** | N : 1 | **User** | Khách hàng đặt lịch (`customer_id`) |
| **Appointment** | N : 1 | **Vehicle** | Phương tiện hẹn bảo dưỡng (`vehicle_id`) |
| **Appointment** | N : 0..1 | **User** | Nhân sự tiếp nhận tạo lịch hẹn (`created_by_id`) |
| **AppointmentService** | N : 1 | **Appointment** | Hạng mục dịch vụ trong lịch hẹn (`appointment_id`) |
| **AppointmentService** | N : 1 | **Service** | Dịch vụ chuẩn hóa (`service_id`) |
| **IntakeRecord** | N : 1 | **User** | Khách hàng đưa xe đến xưởng (`customer_id`) |
| **IntakeRecord** | N : 1 | **Vehicle** | Xe đưa vào tiếp nhận (`vehicle_id`) |
| **IntakeRecord** | N : 1 | **User** | Cố vấn dịch vụ lập phiếu tiếp nhận (`created_by_id`) |
| **IntakeService** | N : 1 | **IntakeRecord** | Dịch vụ yêu cầu khi tiếp nhận (`intake_id`) |
| **IntakeService** | N : 1 | **Service** | Dịch vụ chuẩn hóa (`service_id`) |
| **WorkOrder** | N : 1 | **User** | Khách hàng sở hữu xe (`customer_id`) |
| **WorkOrder** | N : 1 | **Vehicle** | Xe sửa chữa (`vehicle_id`) |
| **WorkOrder** | N : 1 | **User** | Cố vấn dịch vụ phụ trách (`advisor_id`) |
| **WorkOrder** | 0..1 : 1 | **Appointment** | Lịch hẹn gốc (`appointment_id`) |
| **WorkOrder** | 0..1 : 1 | **IntakeRecord** | Phiếu tiếp nhận thực tế (`intake_record_id`) |
| **WorkOrder** | N : 0..1 | **WorkOrder** | Lệnh sửa chữa gốc phát sinh bảo hành (`parent_work_order_id`) |
| **WorkOrder** | N : 0..1 | **User** | Quản lý phê duyệt yêu cầu bảo hành/goodwill (`claim_approved_by_id`) |
| **WorkOrder** | N : 0..1 | **User** | Người thực hiện đóng lệnh (`closed_by_id`) |
| **WorkOrder** | N : 1 | **User** | Nhân sự khởi tạo lệnh (`created_by_id`) |
| **CheckIn** | 1 : 1 | **WorkOrder** | Biên bản nhận xe gắn liền Lệnh sửa chữa (`work_order_id`) |
| **CheckIn** | N : 0..1 | **User** | Khách hàng xác nhận hiện trạng xe (`confirmed_by_customer_id`) |
| **CheckIn** | N : 1 | **User** | Cố vấn lập biên bản tiếp nhận (`created_by_id`) |
| **WoService** | N : 1 | **WorkOrder** | Dịch vụ thuộc Lệnh sửa chữa (`work_order_id`) |
| **WoService** | N : 0..1 | **Service** | Dịch vụ gốc từ danh mục chuẩn (`service_id`) |
| **Inspection** | N : 1 | **WorkOrder** | Biên bản kiểm tra gắn với Lệnh (`work_order_id`) |
| **Inspection** | N : 0..1 | **WoService** | Dịch vụ kiểm tra chuyên sâu (`wo_service_id`) |
| **Inspection** | N : 0..1 | **InspectionTemplate** | Mẫu kiểm định kỹ thuật (`template_id`) |
| **Inspection** | N : 1 | **User** | Kỹ thuật viên thực hiện kiểm tra (`created_by_id`) |
| **InspectionResult** | N : 1 | **Inspection** | Kết quả kiểm tra chi tiết (`inspection_id`) |
| **InspectionResult** | N : 0..1 | **InspectionTemplateItem** | Tiêu chí kiểm tra mẫu (`template_item_id`) |
| **Finding** | N : 1 | **Inspection** | Hư hỏng/vết lỗi phát hiện trong kiểm tra (`inspection_id`) |
| **Finding** | N : 1 | **User** | Kỹ thuật viên ghi nhận hư hỏng (`created_by_id`) |
| **Job** | N : 1 | **WoService** | Công việc thi công thuộc dịch vụ (`wo_service_id`) |
| **Job** | N : 0..1 | **JobType** | Loại hình công việc (`job_type_id`) |
| **Job** | N : 0..1 | **JobTemplate** | Mẫu công việc chuẩn (`job_template_id`) |
| **Job** | N : 0..1 | **Job** | Công việc cha trong chuỗi làm lại rework (`parent_job_id`) |
| **Job** | N : 0..1 | **QcItem** | Hạng mục QC không đạt kích hoạt rework (`rework_source_qc_item_id`) |
| **Job** | N : 1 | **User** | Người khởi tạo công việc (`created_by_id`) |
| **JobFinding** | N : 1 | **Job** | Công việc khắc phục lỗi (`job_id`) |
| **JobFinding** | N : 1 | **Finding** | Vết lỗi được xử lý (`finding_id`) |
| **JobLabour** | N : 1 | **Job** | Công thợ thi công đầu việc (`job_id`) |
| **JobLabour** | N : 1 | **JobType** | Loại công việc định mức (`job_type_id`) |
| **JobLabour** | N : 0..1 | **Employee** | Kỹ thuật viên thực hiện (`employee_id`) |
| **JobPart** | N : 1 | **Job** | Phụ tùng sử dụng cho công việc (`job_id`) |
| **JobPart** | N : 1 | **InventoryItem** | Mặt hàng phụ tùng xuất từ kho (`item_id` - Module 4) |
| **QcRecord** | N : 1 | **WoService** | Biên bản nghiệm thu dịch vụ (`wo_service_id`) |
| **QcRecord** | N : 0..1 | **InspectionTemplate** | Mẫu tiêu chí kiểm định QC (`template_id`) |
| **QcRecord** | N : 1 | **User** | Quản đốc/Chuyên viên QC nghiệm thu (`inspector_id`) |
| **QcItem** | N : 1 | **QcRecord** | Hạng mục đánh giá QC chi tiết (`qc_record_id`) |
| **QcItem** | N : 0..1 | **InspectionTemplateItem** | Tiêu chí QC mẫu (`template_item_id`) |

---

## 4. Module: Finance, Inventory & Settlement (Tài chính, Báo giá & Kho phụ tùng)
*Bao gồm: Báo giá, Hóa đơn, Giao dịch thanh toán, Bàn giao xe, Nhà cung cấp, Danh mục phụ tùng, Mặt hàng tồn kho, Phiếu nhập kho, Biến động thẻ kho và Điều chỉnh kiểm kê.*

### Thực thể
| Tên Bảng (Model) | Bảng CSDL (Table) | Thuộc tính quan trọng |
| :--- | :--- | :--- |
| **Quotation** | `quotations` | id **(PK)**<br>work_order_id *(FK)*, parent_quotation_id *(FK)*, approved_by_id *(FK)*, created_by_id *(FK)*<br>quotation_number, quotation_type, status, subtotal, discount_amount, tax_rate, tax_amount, grand_total, sent_at, approved_at, rejected_at, reject_reason, snapshot_at, created_at, updated_at |
| **QuotationLine** | `quotation_lines` | id **(PK)**<br>quotation_id *(FK)*, wo_service_id *(FK)*, job_id *(FK)*, job_labour_id *(FK)*, job_part_id *(FK)*<br>line_type, description, quantity, snapshot_unit_price, amount, sort_order |
| **Invoice** | `invoices` | id **(PK)**<br>work_order_id *(FK)*, created_by_id *(FK)*, issued_by_id *(FK)*<br>invoice_number, status, subtotal, discount_amount, discount_reason, tax_amount, total_amount, amount_due, notes, issued_at, paid_at, cancelled_at, cancel_reason, created_at, updated_at |
| **InvoiceLine** | `invoice_lines` | id **(PK)**<br>invoice_id *(FK)*, quotation_line_id *(FK)*, wo_service_id *(FK)*, job_id *(FK)*<br>line_type, description, quantity, unit_price, amount, sort_order |
| **Payment** | `payments` | id **(PK)**<br>invoice_id *(FK)*, received_by_id *(FK)*<br>payment_method, amount, tendered_amount, transaction_ref, gateway_provider, payment_url, payment_payload, status, failure_reason, expires_at, paid_at, created_at |
| **VehicleRelease** | `vehicle_releases` | id **(PK)**<br>work_order_id *(FK)*, released_by_id *(FK)*, confirmed_by_customer_id *(FK)*<br>release_notes, released_at, confirmed_at |
| **Supplier** | `suppliers` | id **(PK)**<br>code, name, tax_code, contact_person, phone, email, address, is_active, created_at, updated_at |
| **PartCategory** | `part_categories` | id **(PK)**<br>uom_id *(FK)*<br>code, name, item_type, description, is_active, created_at, updated_at |
| **InventoryItem** | `inventory_items` | id **(PK)**<br>part_category_id *(FK)*, brand_id *(FK)*<br>sku, selling_price, average_cost, on_hand, reorder_level, warranty_months, warranty_mileage, is_active, created_at, updated_at |
| **GoodsReceipt** | `goods_receipts` | id **(PK)**<br>supplier_id *(FK)*, created_by_id *(FK)*<br>receipt_number, receipt_type, status, reference_no, received_date, subtotal, discount_amount, tax_rate, tax_amount, grand_total, notes, cancel_reason, cancelled_at, created_at |
| **GoodsReceiptItem** | `goods_receipt_items` | id **(PK)**<br>receipt_id *(FK)*, item_id *(FK)*<br>quantity, unit_cost, discount_rate, line_total, old_on_hand, old_average_cost, new_average_cost |
| **StockMovement** | `stock_movements` | id **(PK)**<br>item_id *(FK)*, source_movement_id *(FK)*, job_id *(FK)*, job_part_id *(FK)*, created_by_id *(FK)*<br>movement_type, reference_type, reference_id, quantity, unit_cost, balance_after, notes, created_at |
| **StockAdjustment** | `stock_adjustments` | id **(PK)**<br>item_id *(FK)*, requested_by_id *(FK)*, approved_by_id *(FK)*<br>adjustment_quantity, reason, status, approved_at, reject_reason, created_at |

### Quan hệ
| Thực thể 1 | Lượng số | Thực thể 2 | Mô tả quan hệ |
| :--- | :---: | :--- | :--- |
| **Quotation** | N : 1 | **WorkOrder** | Báo giá cho Lệnh sửa chữa (`work_order_id`) |
| **Quotation** | N : 0..1 | **Quotation** | Báo giá gốc trước khi bổ sung điều chỉnh (`parent_quotation_id`) |
| **Quotation** | N : 0..1 | **User** | Khách hàng hoặc Cố vấn duyệt báo giá (`approved_by_id`) |
| **Quotation** | N : 1 | **User** | Nhân viên lập báo giá (`created_by_id`) |
| **QuotationLine** | N : 1 | **Quotation** | Dòng chi tiết báo giá (`quotation_id`) |
| **QuotationLine** | N : 0..1 | **WoService** | Hạng mục dịch vụ báo giá (`wo_service_id`) |
| **QuotationLine** | N : 0..1 | **Job** | Hạng mục công việc (`job_id`) |
| **QuotationLine** | N : 0..1 | **JobLabour** | Hạng mục nhân công kỹ thuật (`job_labour_id`) |
| **QuotationLine** | N : 0..1 | **JobPart** | Hạng mục phụ tùng thay thế (`job_part_id`) |
| **Invoice** | N : 1 | **WorkOrder** | Hóa đơn thanh toán của Lệnh sửa chữa (`work_order_id`) |
| **Invoice** | N : 0..1 | **User** | Thu ngân phát hành hóa đơn (`issued_by_id`) |
| **Invoice** | N : 1 | **User** | Người lập hóa đơn (`created_by_id`) |
| **InvoiceLine** | N : 1 | **Invoice** | Dòng chi tiết trên hóa đơn (`invoice_id`) |
| **InvoiceLine** | N : 0..1 | **QuotationLine** | Ánh xạ từ dòng báo giá đã duyệt (`quotation_line_id`) |
| **InvoiceLine** | N : 0..1 | **WoService** | Hạng mục dịch vụ (`wo_service_id`) |
| **InvoiceLine** | N : 0..1 | **Job** | Hạng mục công việc (`job_id`) |
| **Payment** | N : 1 | **Invoice** | Giao dịch thanh toán cho hóa đơn (`invoice_id`) |
| **Payment** | N : 0..1 | **User** | Thu ngân nhận tiền mặt (`received_by_id`) |
| **VehicleRelease** | 1 : 1 | **WorkOrder** | Biên bản xuất xưởng bàn giao xe (`work_order_id`) |
| **VehicleRelease** | N : 1 | **User** | Cố vấn/Nhân sự thực hiện bàn giao (`released_by_id`) |
| **VehicleRelease** | N : 0..1 | **User** | Khách hàng ký nhận xe (`confirmed_by_customer_id`) |
| **PartCategory** | N : 1 | **SystemCatalog** | Đơn vị tính cơ sở (`uom_id` - UOM Catalog) |
| **InventoryItem** | N : 1 | **PartCategory** | Phân loại phụ tùng kho (`part_category_id`) |
| **InventoryItem** | N : 0..1 | **SystemCatalog** | Thương hiệu sản xuất (`brand_id` - BRAND Catalog) |
| **GoodsReceipt** | N : 0..1 | **Supplier** | Nhà cung cấp phụ tùng (`supplier_id`) |
| **GoodsReceipt** | N : 1 | **User** | Thủ kho lập phiếu nhập (`created_by_id`) |
| **GoodsReceiptItem** | N : 1 | **GoodsReceipt** | Dòng chi tiết trên phiếu nhập kho (`receipt_id`) |
| **GoodsReceiptItem** | N : 1 | **InventoryItem** | Mặt hàng phụ tùng nhập kho (`item_id`) |
| **StockMovement** | N : 1 | **InventoryItem** | Mặt hàng phụ tùng phát sinh biến động thẻ kho (`item_id`) |
| **StockMovement** | N : 0..1 | **StockMovement** | Bút toán gốc đối ứng trả hàng (`source_movement_id`) |
| **StockMovement** | N : 0..1 | **Job** | Công việc sử dụng vật tư (`job_id`) |
| **StockMovement** | N : 0..1 | **JobPart** | Yêu cầu cấp phát phụ tùng (`job_part_id`) |
| **StockMovement** | N : 1 | **User** | Thủ kho thực hiện ghi nhận thẻ kho (`created_by_id`) |
| **StockAdjustment** | N : 1 | **InventoryItem** | Mặt hàng kiểm kê điều chỉnh (`item_id`) |
| **StockAdjustment** | N : 1 | **User** | Thủ kho đề xuất điều chỉnh (`requested_by_id`) |
| **StockAdjustment** | N : 0..1 | **User** | Quản lý phê duyệt điều chỉnh số dư (`approved_by_id`) |

---
