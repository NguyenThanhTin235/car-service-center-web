# BRD – Business Requirements Document
# Hệ thống Quản lý Trung tâm Dịch vụ Ô tô

> **Phiên bản:** 1.1
> **Ngày tạo:** 2026-10-04
> **Nguồn tham chiếu:** Requirement v2.md · UseCase V2.md

---

## 1. Tổng quan Dự án (Project Overview)

### 1.1. Mục tiêu kinh doanh
Xây dựng một nền tảng web quản lý toàn bộ quy trình vận hành của một trung tâm dịch vụ ô tô, từ khi khách đặt lịch đến khi bàn giao xe. Hệ thống lấy **Work Order** làm hồ sơ trung tâm, tích hợp đầy đủ các mảng: Lịch hẹn, Tiếp nhận xe, Kiểm tra, Công việc, Phụ tùng, Báo giá, Kiểm định chất lượng, Hóa đơn và Thanh toán.

### 1.2. Vấn đề hiện tại (Pain Points)
- Dữ liệu nằm rời rạc trên sổ tay, bảng tính và tin nhắn → khó xác định trách nhiệm và trạng thái thực tế.
- Không có cơ chế truy vết từ vấn đề phát hiện (Finding) → công việc thực hiện (Job) → phụ tùng sử dụng (Part).
- Các loại dịch vụ có cách tính tiền khác nhau, nếu không được chuẩn hóa sẽ dẫn đến báo giá không nhất quán và không truy vết được lợi nhuận.

### 1.3. Phạm vi

| Nhóm | Phạm vi |
|------|---------|
| Tổ chức | Một trung tâm dịch vụ ô tô, một chi nhánh, một kho |
| Nhóm dịch vụ | Sửa chữa (Repair), Bảo dưỡng (Maintenance), Rửa xe (Car Wash), Chăm sóc (Detailing), Kéo vào (Tow-in) |
| Luồng nghiệp vụ | Appointment / Walk-in / Tow-in → Work Order → Inspection/Finding → Job/Part → Quotation → Execution → QC → Invoice/Payment → Release/Closure |
| Ứng dụng | Web responsive: Customer Portal + Staff Portal + Public Website |
| Ngoài phạm vi | OBD/GPS, native mobile, quotation versioning, resource conflict nâng cao |

---

## 2. Các Actor (Tác nhân) trong Hệ thống

| Actor | Mã | Workspace | Vai trò |
|-------|----|-----------|---------|
| Khách vãng lai | GST | Public Website | Xem thông tin công khai, đăng ký, đăng nhập |
| Khách hàng | CUS | Customer Portal | Quản lý xe, lịch hẹn, theo dõi tiến độ, xem hóa đơn |
| Nhân viên quầy | FDS | Front Desk Workspace | Tiếp nhận xe, quản lý appointment, thu ngân |
| Cố vấn dịch vụ | SA | Advisor Workspace | Vận hành chính: Work Order, Job, Quotation, QC, Release |
| Quản lý dịch vụ | MGR | Manager Workspace | Giám sát vận hành, quản lý kho, đóng Work Order |
| Quản trị viên | ADM | Administration | Quản lý tài khoản, phân quyền, cấu hình Master Data |

---

## 3. Danh sách Use Case Baseline

| UC ID | Tên Use Case | Actor | Ưu tiên |
|-------|-------------|-------|---------|
| UC-01 | Xem thông tin website | GST | Must |
| UC-02 | Đăng ký tài khoản | GST | Must |
| UC-03 | Đăng nhập | GST/All | Must |
| UC-04 | Đăng xuất | All | Must |
| UC-05 | Khôi phục mật khẩu | CUS | Must |
| UC-06 | Cập nhật hồ sơ cá nhân | CUS | Must |
| UC-07 | Thêm phương tiện | CUS | Must |
| UC-08 | Xem phương tiện | CUS | Must |
| UC-09 | Cập nhật phương tiện | CUS | Must |
| UC-10 | Xóa phương tiện | CUS | Must |
| UC-11 | Đặt lịch hẹn | CUS | Must |
| UC-12 | Xem lịch hẹn | CUS | Must |
| UC-13 | Dời lịch hẹn | CUS | Must |
| UC-14 | Hủy lịch hẹn | CUS | Must |
| UC-15 | Theo dõi tiến độ sửa chữa | CUS | Must |
| UC-16 | Xem hóa đơn (Customer) | CUS | Must |
| UC-17 | Đặt lịch hẹn (FDS) | FDS | Must |
| UC-18 | Xem lịch hẹn (FDS) | FDS | Must |
| UC-19 | Dời lịch hẹn (FDS) | FDS | Must |
| UC-20 | Hủy lịch hẹn (FDS) | FDS | Must |
| UC-21 | Tiếp nhận xe | FDS | Must |
| UC-22 | Thêm hồ sơ khách hàng | FDS | Must |
| UC-23 | Xem hồ sơ khách hàng | FDS | Must |
| UC-24 | Cập nhật hồ sơ khách hàng | FDS | Must |
| UC-25 | Xóa hồ sơ khách hàng | FDS | Must |
| UC-26 | Xem phiếu công việc | FDS | Must |
| UC-27 | Xử lý hóa đơn | FDS | Must |
| UC-28 | Xử lý thanh toán | FDS | Must |
| UC-29 | Tạo phiếu công việc | SA | Must |
| UC-30 | Ghi nhận tình trạng xe | SA | Must |
| UC-31 | Thêm hạng mục dịch vụ | SA | Must |
| UC-32 | Xóa hạng mục dịch vụ | SA | Must |
| UC-33 | Kiểm tra xe (Inspect Vehicle) | SA | Must |
| UC-34 | Lên kế hoạch công việc (Plan Jobs) | SA | Must |
| UC-35 | Khai báo nhân công | SA | Must |
| UC-36 | Khai báo phụ tùng | SA | Must |
| UC-37 | Tạo báo giá | SA | Must |
| UC-38 | Xem báo giá | SA/CUS | Must |
| UC-39 | Cập nhật báo giá | SA | Must |
| UC-40 | Hủy báo giá | SA | Must |
| UC-41 | Kiểm định chất lượng | SA | Must |
| UC-42 | Bàn giao xe | SA | Must |
| UC-43 | Theo dõi hoạt động xưởng | MGR | Must |
| UC-44 | Thêm phụ tùng | MGR | Must |
| UC-45 | Xem phụ tùng | MGR | Must |
| UC-46 | Cập nhật phụ tùng | MGR | Must |
| UC-47 | Xóa phụ tùng | MGR | Must |
| UC-48 | Nhập kho | MGR | Must |
| UC-49 | Xem báo cáo vận hành | MGR | Must |
| UC-50 | Thêm tài khoản | ADM | Must |
| UC-51 | Xem tài khoản | ADM | Must |
| UC-52 | Cập nhật tài khoản | ADM | Must |
| UC-53 | Xóa tài khoản | ADM | Must |
| UC-54 | Thêm nhân viên | ADM | Must |
| UC-55 | Xem nhân viên | ADM | Must |
| UC-56 | Cập nhật nhân viên | ADM | Must |
| UC-57 | Xóa nhân viên | ADM | Must |
| UC-58 | Thêm danh mục dịch vụ | ADM | Must |
| UC-59 | Xem danh mục dịch vụ | ADM | Must |
| UC-60 | Cập nhật danh mục dịch vụ | ADM | Must |
| UC-61 | Xóa danh mục dịch vụ | ADM | Must |
| UC-62 | Thêm dịch vụ (Service) | ADM | Must |
| UC-63 | Xem dịch vụ (Service) | ADM | Must |
| UC-64 | Cập nhật dịch vụ (Service) | ADM | Must |
| UC-65 | Xóa dịch vụ (Service) | ADM | Must |
| UC-66 | Thêm loại công việc | ADM | Must |
| UC-67 | Xem loại công việc | ADM | Must |
| UC-68 | Cập nhật loại công việc | ADM | Must |
| UC-69 | Xóa loại công việc | ADM | Must |
| UC-70 | Thêm danh mục chung | ADM | Must |
| UC-71 | Xem danh mục chung | ADM | Must |
| UC-72 | Cập nhật danh mục chung | ADM | Must |
| UC-73 | Xóa danh mục chung | ADM | Must |

---

## 4. Business Rules (Quy tắc Nghiệp vụ)

### 4.1. Xác thực & Phân quyền (Identity & Access)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-AUTH-01 | RBAC | Mỗi User có thể có nhiều vai trò. Quyền được kiểm tra ở cả giao diện và API. |
| BR-AUTH-02 | Đăng ký | Email và số điện thoại phải duy nhất trong hệ thống. Sau khi đăng ký, hệ thống tự đăng nhập và chuyển về trang chủ Customer. |
| BR-AUTH-03 | OTP | OTP có hiệu lực 5 phút. Chỉ Customer tự đặt lại mật khẩu qua OTP. Nhân viên do Admin đặt lại. |
| BR-AUTH-04 | Đăng nhập | Sau khi xác thực thành công, hệ thống mở phiên và điều hướng đến trang chủ tương ứng vai trò. |
| BR-AUTH-05 | Quyền sở hữu dữ liệu | Customer chỉ xem và thao tác trên hồ sơ, Vehicle, Appointment và Work Order thuộc về chính mình. |

### 4.2. Khách hàng & Phương tiện (Customer & Vehicle)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-VEH-01 | Biển số xe | Biển số phải duy nhất trong toàn hệ thống. |
| BR-VEH-02 | Xóa xe | Vehicle không được xóa vật lý khi đã phát sinh Work Order. Chỉ chuyển trạng thái Inactive. |
| BR-VEH-03 | Tìm kiếm trùng | Nhân viên quầy phải tìm kiếm Customer theo số điện thoại/email và Vehicle theo biển số trước khi tạo mới để tránh trùng lặp dữ liệu. |

### 4.3. Lịch hẹn & Tiếp nhận (Appointment & Intake)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-APT-01 | Trạng thái khởi tạo | Appointment mới ở trạng thái REQUESTED. |
| BR-APT-02 | Dời/Hủy | Chỉ được dời hoặc hủy khi trạng thái chưa phải ARRIVED hoặc CANCELLED. |
| BR-APT-03 | Mark Arrived | Chỉ Appointment ở trạng thái CONFIRMED mới được Mark Arrived. |
| BR-APT-04 | Lý do hủy | Khi Cancel Appointment phải lưu lý do hủy. |
| BR-APT-05 | Walk-in/Tow-in | Intake Record phải có Customer, Vehicle, thời điểm đến và nguồn tiếp nhận. |

### 4.4. Phiếu Công việc (Work Order)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-WO-01 | Nguồn tạo | Work Order chỉ được tạo từ Appointment ARRIVED hoặc Intake Record hợp lệ (Walk-in, Tow-in). |
| BR-WO-02 | Check-in bắt buộc | Mileage, fuel, complaint và tình trạng xe là bắt buộc khi ghi nhận Check-in. |
| BR-WO-03 | Cấu trúc | Mỗi Work Order chứa nhiều Service. Mỗi Service có thể chứa nhiều Job. Mỗi Job thuộc đúng một Service. |
| BR-WO-04 | Customer Privacy | Customer chỉ thấy trạng thái tổng quát, không thấy internal note hoặc giá vốn. |

### 4.5. Inspection & Finding

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-INS-01 | Gắn kết | Inspection phải gắn với Work Order và/hoặc Service. |
| BR-INS-02 | Finding–Job | Mỗi Finding hợp lệ có thể liên kết một, nhiều hoặc không Job nào. |
| BR-INS-03 | Truy vết cốt lõi | Chuỗi truy vết bắt buộc: Finding → Job → Part/Material → QC → Invoice → Release. |

### 4.6. Lên kế hoạch Công việc & Nhân công (Job Planning & Labour)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-JOB-01 | Nguồn Job | Job có thể sinh từ Finding, Service hoặc được tạo thủ công. |
| BR-JOB-02 | Labour Line | Labour line gắn với Job; loại nhân công chọn từ danh mục JobType; giá tiền là giá cố định được nhập hoặc tự điền từ JobTemplate. |
| BR-JOB-03 | Job–Part | Một Job có thể dùng 0..N phụ tùng/vật tư. Mọi Used Part phải gắn đúng Job. |

### 4.7. Tính giá & Báo giá (Pricing & Quotation)

**Mô hình tính tiền (Giá Cố định – Fixed Price):**

```
Tiền Quotation = Tổng tiền tất cả Service
Tiền Service   = Tổng tiền tất cả Job thuộc Service đó
Tiền Job       = Tiền Labour (cố định) + Tiền Part/Material
Tiền Labour    = Giá tiền cứng được nhập sẵn trên mỗi Labour Line
Tiền Part      = Số lượng sử dụng × Đơn giá bán của phụ tùng
```

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-PRI-01 | Giá Labour cố định | Tiền nhân công của mỗi Labour Line là giá tiền cứng được nhập trực tiếp. Không tính theo giờ. |
| BR-PRI-02 | Nguồn giá Labour | Khi SA chọn JobType cho Labour Line, hệ thống tự động điền giá tiền mặc định từ JobTemplate tương ứng. SA có thể chỉnh sửa lại giá này trực tiếp trên Quotation. |
| BR-PRI-03 | Tiền Job | Tiền Job = Tổng giá tất cả Labour Line + Tổng (Số lượng × Đơn giá bán) của tất cả Part Line thuộc Job đó. |
| BR-PRI-04 | Tiền Service | Tiền Service = Tổng Tiền Job của tất cả Job thuộc Service đó. |
| BR-PRI-05 | Tiền Quotation | Tiền Quotation = Tổng Tiền Service của tất cả Service trong Work Order. |
| BR-PRI-06 | Grand Total | Tổng cuối = Subtotal (Tiền Quotation) − Chiết khấu + Thuế. |
| BR-QUO-01 | Snapshot | Quotation lưu snapshot đơn giá tại thời điểm gửi/duyệt. Snapshot không bị ảnh hưởng khi giá Master Data thay đổi về sau. |
| BR-QUO-02 | Approval | SA cập nhật trạng thái Approved/Rejected cho Quotation dựa trên phản hồi của khách hàng ngoài hệ thống. |
| BR-QUO-03 | Khóa Quotation | Quotation đã APPROVED thì bị freeze, không được chỉnh sửa. |

### 4.8. Thực hiện Công việc (Job Execution)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-EXE-01 | Điều kiện Start | Job chỉ được Start khi Quotation đã APPROVED và đủ phụ tùng. |
| BR-EXE-02 | Complete | Job chỉ được Complete sau khi ghi kết quả thực hiện. |

### 4.9. Kiểm định chất lượng (QC)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-QC-01 | Pass/Fail | QC Fail không được coi là Pass. |
| BR-QC-02 | Điều kiện Completed | Service chỉ chuyển sang trạng thái Completed khi QC Pass. |
| BR-QC-03 | Rework | QC Fail có thể tạo Rework Job đơn giản. |

### 4.10. Hóa đơn & Thanh toán (Invoice & Payment)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-INV-01 | Truy vết dòng | Invoice line phải truy vết về Service, Job, Labour, Part/Material hoặc Fee. |
| BR-INV-02 | Không sửa trực tiếp | Invoice đã ISSUED không được sửa trực tiếp. |
| BR-INV-03 | Billing Request | SA chỉ gửi Billing Request khi các Job bắt buộc Completed, QC Pass và charge đã được duyệt. |
| BR-INV-04 | Amount Due | Amount Due = Invoice Total − Valid Payment. Không chấp nhận Payment vượt Amount Due. |
| BR-INV-05 | Financial Clearance | Financial Clearance tự động đạt khi Invoice PAID. Hệ thống tự thông báo cho SA sau khi thanh toán thành công. |

### 4.11. Bàn giao & Đóng phiếu (Release & Closure)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-REL-01 | Release Gate | Chỉ Release xe khi: Job Completed + QC Pass + Invoice PAID. |
| BR-CLO-01 | Closure Gate | Chỉ Close Work Order khi: Xe đã Release + Không còn Job/Rework mở + Invoice PAID. |
| BR-HIS-01 | Service History | Lịch sử dịch vụ chỉ được ghi nhận sau khi Work Order RELEASED/CLOSED. |

### 4.12. Kho hàng (Inventory)

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-INV-ITEM-01 | SKU | Mỗi item có SKU duy nhất, loại (Part/Consumable/Chemical/Accessory) và UoM cơ sở. |
| BR-INV-ITEM-02 | Average Cost | Giá vốn mới = (Qty cũ × Giá cũ + Qty nhập × Giá nhập) / (Qty cũ + Qty nhập). Áp dụng Moving Weighted Average sau mỗi lần nhập. |
| BR-INV-ITEM-03 | Không âm tồn kho | Không cho phép xuất kho vượt On-hand. |
| BR-INV-ITEM-04 | On-hand | On-hand = Tồn đầu + Nhập + Trả − Xuất. Mọi thay đổi tồn phải có Stock Movement. |
| BR-INV-ITEM-05 | Không sửa tồn trực tiếp | Thay đổi tồn phải qua nghiệp vụ nhập, xuất, trả hoặc Stock Adjustment được phê duyệt. |
| BR-INV-ITEM-06 | Issue to Job | Mọi lần xuất kho tạo Stock Movement và lưu unit cost tại thời điểm xuất. |
| BR-INV-ITEM-07 | Return from Job | Số lượng trả không vượt số lượng đã issue chưa dùng; nhập lại theo unit cost của movement gốc. |

### 4.13. Master Data

| Mã | Tên | Quy tắc |
|----|-----|---------|
| BR-MDT-01 | Không xóa vật lý | Không xóa vật lý danh mục (Service, JobType, Employee...) đã có giao dịch tham chiếu. Chỉ chuyển trạng thái Inactive. |
| BR-MDT-02 | Service Active | Chỉ Service Active mới được sử dụng trong Work Order và hiển thị trên Public Website. |
| BR-MDT-03 | Job Template | Job Template định nghĩa JobType, giá tiền công mặc định, part/material mặc định và yêu cầu QC. |
| BR-MDT-04 | Inspection Template | Inspection/QC item có tên, bắt buộc/không bắt buộc và thứ tự hiển thị. |

---

## 5. Công thức tính giá (Pricing Formulas)

### 5.1. Mô hình tổng quát

| Cấp | Đối tượng | Công thức |
|-----|-----------|----------|
| 1 | **Labour Line** | Giá tiền cứng (nhập tay hoặc tự điền từ JobTemplate) |
| 2 | **Part Line** | Số lượng sử dụng × Đơn giá bán |
| 3 | **Job** | Σ Labour Lines + Σ Part Lines |
| 4 | **Service** | Σ các Job thuộc Service |
| 5 | **Quotation** | Σ các Service trong Work Order |
| 6 | **Grand Total** | Quotation − Chiết khấu + Thuế |

### 5.2. Công thức chi tiết

| Mã | Công thức |
|----|----------|
| CT-PRICE01 | **Labour Amount = Fixed Price per Labour Line** *(Nhập trực tiếp; hệ thống tự điền từ JobTemplate khi SA chọn)* |
| CT-PRICE02 | **Part Amount = Used Quantity × Selling Price** |
| CT-PRICE03 | **Job Total = Σ Labour Amount + Σ Part Amount** |
| CT-PRICE04 | **Service Total = Σ Job Total** |
| CT-PRICE05 | **Quotation Subtotal = Σ Service Total** |
| CT-PRICE06 | **Grand Total = Quotation Subtotal − Discount + Tax** |
| CT-INV01 | **New Avg Cost = (Old Qty × Old Avg Cost + Receipt Qty × Purchase Cost) / (Old Qty + Receipt Qty)** |
| CT-INV02 | **On-hand = Opening + Receipt + Return − Issue** |
| CT-BILL01 | **Invoice Amount = Approved Chargeable Lines − Discount + Tax** |
| CT-BILL02 | **Amount Due = Invoice Total − Valid Payment** |

---

## 6. Quy trình nghiệp vụ E2E (End-to-End Business Flow)

```
[Khách] Đặt lịch / Walk-in / Tow-in
   → [FDS] Tiếp nhận → Intake Queue
      → [SA] Tạo Work Order
         → [SA] Check-in (Mileage, Fuel, Complaint, Tình trạng xe)
            → [SA] Kiểm tra xe → Finding (Phát hiện hư hỏng)
               → [SA] Thêm Dịch vụ (Service) vào Work Order
                  → [SA] Lên kế hoạch Job (từ Finding / Template / Thủ công)
                     → [SA] Khai báo Labour (giá cố định) + Phụ tùng dự kiến
                        → [SA] Tạo Báo giá → Gửi → [CUS] Duyệt/Từ chối
                           → [MGR] Xuất phụ tùng cho Job
                              → [SA] Thực hiện Job (Start → Complete)
                                 → [SA] Kiểm định chất lượng (QC Pass/Fail)
                                    → [SA] Gửi Billing Request
                                       → [FDS] Tạo Hóa đơn → Thu tiền
                                          → [SA] Bàn giao xe (Release)
                                             → [MGR] Đóng Work Order (Closure)
                                                → Service History được cập nhật
```

---

## 7. Yêu cầu phi chức năng (Non-Functional Requirements)

| ID | Thuộc tính | Yêu cầu |
|----|-----------|---------|
| NFR-01 | Tiện dụng | Customer Portal dùng ngôn ngữ trạng thái thân thiện; form có validation rõ ràng. |
| NFR-02 | Responsive | Dùng được trên desktop; Check-in/QC form hỗ trợ tablet. |
| NFR-03 | Bảo mật | Mật khẩu băm; API kiểm tra RBAC và ownership; không hiển thị giá vốn cho Customer. |
| NFR-04 | Toàn vẹn dữ liệu | Transaction được dùng cho: Quotation approval, stock movement, invoice/payment và release. |
| NFR-05 | Truy vết | Truy vết tối thiểu: Finding → Job → Part → QC → Invoice → Release. |
| NFR-06 | Hiệu năng | Danh sách có pagination/filter; thao tác thông thường phản hồi dưới 3 giây trong môi trường demo. |
| NFR-07 | Bảo trì | Mã nguồn tách module: identity, appointment, work-order, pricing, inventory, QC, billing, release. |
| NFR-08 | Kiểm thử | Business rule pricing, Finding–Job, stock non-negative, QC gate và Release Gate có unit/API test. |
| NFR-09 | Triển khai | Hệ thống chạy được trên môi trường demo với database, backend, frontend và file storage. |

---

## 8. Trạng thái Đối tượng (Object State Summary)

| Đối tượng | Các trạng thái |
|-----------|---------------|
| Appointment | REQUESTED → CONFIRMED → ARRIVED / RESCHEDULED / CANCELLED |
| Work Order | OPEN → IN_PROGRESS → COMPLETED → RELEASED → CLOSED |
| Job | PLANNED → IN_PROGRESS → COMPLETED / REWORK |
| Quotation | DRAFT → SENT → APPROVED / REJECTED / CANCELLED |
| Invoice | DRAFT → ISSUED → PAID |
| Payment | PENDING → PAID |

---

*Tài liệu này mô tả nghiệp vụ và quy tắc kinh doanh của hệ thống, không đề cập đến kỹ thuật triển khai Backend hay Frontend.*
