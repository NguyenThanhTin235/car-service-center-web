**MỤC LỤC**

|     |     |
| --- | --- |
| **PHẦN MỞ ĐẦU** | **3** |
| 1\. Lý do chọn đề tài | 3   |
| 2\. Mục tiêu của đề tài | 3   |
| 3\. Phạm vi nghiên cứu | 3   |
| 4\. Phương pháp nghiên cứu | 4   |
| **CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VÀ XÁC ĐỊNH YÊU CẦU** | **4** |
| 1.1. Phân tích hiện trạng | 4   |
| 1.2. Phân tích yêu cầu | 5   |
| 1.2.1. Yêu cầu chức năng | 5   |
| 1.2.2. Yêu cầu phi chức năng | 12  |
| 1.3. Quy trình tác nghiệp | 13  |
| **CHƯƠNG 2: MÔ HÌNH HÓA YÊU CẦU** | **14** |
| 2.1. Nhận diện tác nhân và phạm vi chức năng | 14  |
| 2.2. Mô tả chi tiết từng tác nhân | 14  |
| 2.3. Danh sách Use Case baseline | 15  |
| 2.4. Tiêu chí hoàn thành Tiểu luận | 18  |
| **KẾT LUẬN** | **19** |

# PHẦN MỞ ĐẦU

## 1\. Lý do chọn đề tài

Các trung tâm dịch vụ ô tô thường phải phối hợp nhiều hoạt động trong một lần xe đến: đặt lịch, tiếp nhận, kiểm tra tình trạng, phát hiện hư hỏng, lập kế hoạch công việc, chuẩn bị phụ tùng, báo giá, thực hiện, kiểm soát chất lượng, thanh toán và bàn giao. Khi dữ liệu nằm rời rạc trên sổ, bảng tính và tin nhắn, doanh nghiệp khó xác định trách nhiệm, trạng thái thực tế và chi phí của từng hạng mục.

Đề tài đề xuất một nền tảng web lấy Work Order làm hồ sơ trung tâm, tách rõ Service, Finding, Job, Part/Material, Quotation, QC và Invoice. Điểm cốt lõi của Tiểu luận là triển khai được chuỗi truy vết Finding → Job → Part và một quy trình hoàn chỉnh từ Appointment đến Vehicle Release.

## 2\. Mục tiêu của đề tài

Tiểu luận chuyên ngành xây dựng một MVP full E2E có khả năng quản lý Customer/Vehicle, Appointment, Work Order, Check-in, Inspection/Finding, Service/Job, Part/Material, tính giá, Quotation Approval, Job Execution, QC, Invoice/Payment, Vehicle Release, Closure và Service History.

MVP tập trung vào happy path và các business rule cốt lõi. Những phần nâng cao như quotation versioning, resource conflict, purchase order nhiều trạng thái, reserve/stocktake, QC nhiều vòng, partial payment, override và KPI được dành cho giai đoạn Khóa luận tốt nghiệp.

## 3\. Phạm vi nghiên cứu

_Bảng 0-1: Tóm tắt phạm vi Tiểu luận chuyên ngành_

| **Nhóm** | **Phạm vi** |
| --- | --- |
| Phạm vi tổ chức | Một trung tâm dịch vụ ô tô, một chi nhánh và một kho. |
| Nhóm dịch vụ | Repair, Maintenance, Car Wash, Detailing và Tow-in cơ bản. |
| Luồng nghiệp vụ | Appointment/Walk-in/Tow-in → Work Order → Inspection/Finding → Job/Part → Quotation → Execution → QC → Invoice/Payment → Release/Closure. |
| Pricing | Fixed package, theo kích thước xe, labour theo Job Type và parts/materials. |
| Inventory MVP | Item/Supplier cơ bản, direct receipt, moving average cost, issue/return theo Job và stock card. |
| Ứng dụng | Web responsive gồm Customer Portal và Staff Portal, có trang thông tin công khai cho Khách vãng lai. |
| Ngoài phạm vi | OBD/GPS và native mobile. |

**Ranh giới MVP:** Tiểu luận phải đi hết luồng đến bàn giao xe, nhưng ưu tiên luồng chính, ít trạng thái ngoại lệ và một phương án nghiệp vụ chuẩn cho mỗi phân hệ.

## 4\. Phương pháp nghiên cứu

Nhóm sử dụng khảo sát nghiệp vụ, mô hình hóa AS-IS/TO-BE, Use Case, Activity Flow, Domain Model và ERD; phát triển theo vertical slice; kiểm thử bằng unit test, API test và một E2E flow trọng yếu. Dữ liệu demo được xây dựng sát các tình huống sửa chữa, bảo dưỡng và chăm sóc xe.

# CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VÀ XÁC ĐỊNH YÊU CẦU

## 1.1. Phân tích hiện trạng

Trong vận hành thực tế, Appointment, Walk-in và Tow-in thường được tiếp nhận bằng nhiều kênh. Check-in, ảnh tình trạng xe, Finding, Job, báo giá và phụ tùng sử dụng có thể do nhiều nhân sự ghi nhận ở các công cụ khác nhau. Điều này làm mất liên kết giữa vấn đề được phát hiện và công việc thực hiện, đồng thời khó xác định phụ tùng nào đã được dùng cho Job nào.

Các loại Service cũng có cách tính tiền khác nhau. Repair thường gồm labour và part; Maintenance có thể theo package hoặc labour/parts; Car Wash/Detailing thường theo gói và kích thước xe. Nếu hệ thống không tách Job Type, Labour Rate, Part Cost và Selling Price thì báo giá khó nhất quán và không thể truy vết lợi nhuận cơ bản.

Giải pháp sử dụng Work Order làm record trung tâm. Mỗi Work Order chứa nhiều Service; mỗi Service có thể không có Job hoặc chứa nhiều Job; mỗi Job thuộc đúng 1 Service; một Job có thể xử lý nhiều Finding; Finding có thể chưa gắn Job nếu không xử lý, có thể sử dụng nhiều Part/Material.

_Hình 1-1: Quy trình E2E của Tiểu luận chuyên ngành_

## 1.2. Phân tích yêu cầu

### 1.2.1. Yêu cầu chức năng

#### 1.2.1.1. Yêu cầu chức năng nghiệp vụ

> **Lưu ý:** Chi tiết toàn bộ Yêu cầu chức năng nghiệp vụ đã được chuẩn hóa và chuyển sang file [UseCase.md](./UseCase.md). Tài liệu UseCase.md là Single Source of Truth cho tất cả các Use Case (từ UC-01 đến UC-40) phân bổ cho 6 Actor chính.

#### 1.2.1.2. Công thức tính giá và tồn kho

|     |     |
| --- | --- |
| **CT-PRICE01** | **Labour Amount = Billable Hours × Hourly Rate**<br><br>Hourly Rate được xác định theo Job Type; Tiểu luận dùng Estimated/Billable Hours để báo giá. |

|     |     |
| --- | --- |
| **CT-PRICE02** | **Repair Total = Labour + Parts + Materials + Approved Fees**<br><br>Phù hợp các Job sửa chữa phát sinh từ Finding hoặc kế hoạch thủ công. |

|     |     |
| --- | --- |
| **CT-PRICE03** | **Maintenance Total = Package Price + Additional Labour + Additional Parts**<br><br>Cho phép gói bảo dưỡng bao gồm một số hạng mục mặc định. |

|     |     |
| --- | --- |
| **CT-PRICE04** | **Car Care Total = Vehicle-size Package + Add-ons**<br><br>Giá rửa xe/detailing phụ thuộc nhóm kích thước xe và dịch vụ bổ sung. |

|     |     |
| --- | --- |
| **CT-PRICE05** | **Grand Total = Subtotal − Discount + Tax**<br><br>Subtotal là tổng package, labour, parts, materials và fee được duyệt. |

|     |     |
| --- | --- |
| **CT-INV01** | **New Average Cost = (Old Qty × Old Avg Cost + Receipt Qty × Purchase Cost) / (Old Qty + Receipt Qty)**<br><br>Áp dụng Moving Weighted Average sau mỗi Goods Receipt. |

|     |     |
| --- | --- |
| **CT-INV02** | **On-hand = Opening + Receipt + Return − Issue**<br><br>Không cho Issue làm On-hand âm; mọi thay đổi tồn phải có Stock Movement. |

|     |     |
| --- | --- |
| **CT-BILL01** | **Invoice Amount = Approved Chargeable Lines − Discount + Tax**<br><br>Invoice line phải truy vết về Service, Job, Labour, Part/Material hoặc Fee. |

|     |     |
| --- | --- |
| **CT-BILL02** | **Amount Due = Invoice Total − Valid Payment**<br><br>Trong MVP, một full payment hợp lệ đưa Amount Due về 0 và Invoice sang PAID. |

#### 1.2.1.3. Yêu cầu chức năng hệ thống

_Bảng 1-13: Yêu cầu chức năng hệ thống_

| **ID** | **Phân hệ** | **Yêu cầu** | **Ưu tiên** |
| --- | --- | --- | --- |
| FR-01 | Identity & Access | Đăng ký/đăng nhập/đăng xuất, đặt lại mật khẩu (OTP cho Customer), quản lý phiên và RBAC cơ bản. | Must |
| FR-02 | Public Website | Trang thông tin công khai cho Khách vãng lai: trang chủ, danh mục dịch vụ, bảng giá tham khảo và FAQ. | Must |
| FR-03 | Customer & Vehicle | Quản lý tập trung khách hàng, phương tiện và ownership. | Must |
| FR-04 | Appointment & Intake | Hỗ trợ Appointment, Walk-in và Tow-in cơ bản; tạo Intake Queue. | Must |
| FR-05 | Work Order | Work Order là hồ sơ trung tâm, chứa nhiều Service, Job, Quotation và Invoice. | Must |
| FR-06 | Check-in & Evidence | Ghi mileage, fuel, complaint, belongings, tình trạng và evidence cơ bản. | Must |
| FR-07 | Inspection & Finding | Ghi Inspection, Finding; một Finding có thể liên kết một hoặc nhiều Job. | Must |
| FR-08 | Service & Job | Sinh Job từ Finding/Template hoặc tạo thủ công; gắn Employee cơ bản. | Must |
| FR-09 | Job–Part Traceability | Mỗi Job có nhiều Part/Material; Planned/Used Quantity và unit price được lưu theo line. | Must |
| FR-10 | Pricing Engine | Tính fixed package, vehicle-size, labour/parts và các tổng tiền cơ bản. | Must |
| FR-11 | Quotation | Tạo, gửi, approve/reject và freeze snapshot Quotation chính, Supplementary Quotation. | Must |
| FR-12 | Inventory Basic | Item/Supplier, direct receipt, moving average cost, issue/return theo Job và stock card. | Must |
| FR-13 | Job Execution | Start/Complete, ghi result và Used Part. | Must |
| FR-14 | QC & Rework Basic | Checklist Pass/Fail và tạo Rework Job đơn giản. | Must |
| FR-15 | Billing & Payment Basic | Hỗ trợ quản lý hóa đơn (Invoice) từ trạng thái BILLING_REQUESTED, tích hợp Payment gateway, phát hành Invoice và quản lý Payment tại Front Desk. Hỗ trợ Manual Payment và QR Payment. Payment thành công tự động ghi nhận Financial Clearance và thông báo cho Cố vấn dịch vụ. | Must |
| FR-16 | Release, Closure & History | Release Gate, bàn giao, Close Work Order và cập nhật Service History. | Must |
| FR-17 | Basic Dashboard & Report | Danh sách trạng thái, doanh thu dịch vụ và tồn kho theo khoảng ngày. | Should |
| FR-18 | PDF/Export Basic | In hoặc xuất Quotation, Invoice và Release Record ở mức cơ bản. | Should |

### 1.2.2. Yêu cầu phi chức năng

_Bảng 1-14: Yêu cầu chất lượng hệ thống_

| **ID** | **Thuộc tính** | **Yêu cầu** | **Nhóm** |
| --- | --- | --- | --- |
| NFR-01 | Tính tiện dụng | Customer Portal dùng ngôn ngữ trạng thái thân thiện; form nghiệp vụ có validation rõ ràng. | User |
| NFR-02 | Responsive | Customer và Staff Portal dùng được trên desktop; các form Check-in/QC hỗ trợ tablet. | User |
| NFR-03 | Bảo mật | Mật khẩu được băm; API kiểm tra RBAC và ownership; không hiển thị giá vốn cho Customer. | IT  |
| NFR-04 | Toàn vẹn dữ liệu | Transaction được dùng cho Quotation approval, stock movement, invoice/payment và release. | IT  |
| NFR-05 | Truy vết | Truy vết tối thiểu Finding → Job → Part → QC → Invoice → Release. | Business |
| NFR-06 | Hiệu năng | Danh sách có pagination/filter; thao tác thông thường phản hồi mục tiêu dưới 3 giây trong môi trường demo. | IT  |
| NFR-07 | Khả năng bảo trì | Mã nguồn tách module identity, appointment, work-order, pricing, inventory, QC, billing và release. | IT  |
| NFR-08 | Khả năng kiểm thử | Business rule pricing, Finding–Job, stock non-negative, QC gate và Release Gate có unit/API test. | IT  |
| NFR-09 | Khả năng triển khai | Hệ thống chạy được trên môi trường demo với database, backend, frontend và file storage. | IT  |

## 1.3. Quy trình tác nghiệp

### 1.3.1. Appointment và Intake

Customer chọn Vehicle, Service và thời gian để tạo Appointment REQUESTED. Front Desk Confirm/Reschedule/Cancel; khi khách đến thì Mark Arrived. Walk-in/Tow-in tạo Intake Record trực tiếp và được đưa vào Intake Queue.

### 1.3.2. Work Order và Check-in

Service Advisor tạo Work Order từ Intake hợp lệ, ghi mileage, fuel, complaint, belongings, tình trạng và evidence; Customer xác nhận Check-in. Work Order có thể chứa nhiều Service.

### 1.3.3. Inspection, Finding và Job

Service Advisor ghi Inspection Result. Maintenance/Car Wash/Detailing có thể sinh Job từ Service Template mà không cần Finding. Một job có thể tạo thẳng, không cần link đến Finding (Một WO có thể không có Finding).

### 1.3.4. Job và Part

Service Advisor khai báo Part/Material dự kiến theo Job. Service Manager thực hiện receipt nếu cần, sau đó issue Part cho đúng Job; Used Quantity được xác nhận khi hoàn thành và lượng thừa được return.

### 1.3.5. Tính giá và Quotation

Hệ thống tính package, labour theo Job Type/Hours và Part/Material. Service Advisor gửi Quotation; Customer Approve/Reject. Approved Quotation được freeze snapshot.

### 1.3.6. Job Execution

Job đã được duyệt và đủ Part được Start. Service Advisor ghi kết quả, Used Part và Complete Job. MVP chưa yêu cầu Pause/Resume hoặc conflict nâng cao.

### 1.3.7. QC và Rework

Sau khi Job hoàn thành, Service Advisor ghi QC Result. QC Fail không được coi là Pass và có thể tạo Rework Job đơn giản. Service chỉ Completed khi QC Pass.

### 1.3.8. Invoice và Payment

Khi Work Order đủ điều kiện (Job Completed, QC Pass), Cố vấn dịch vụ chuyển trạng thái Work Order sang `BILLING_REQUESTED`. Front Desk tạo Draft Invoice từ các chargeable line, Issue Invoice và ghi nhận thanh toán. Payment thành công tự động ghi nhận Financial Clearance và thông báo cho Cố vấn dịch vụ để chuẩn bị bàn giao xe.

### 1.3.9. Release và Closure

Service Advisor kiểm tra Release Gate gồm Job Completed, QC Pass và Invoice PAID; thực hiện bàn giao xe. Manager kiểm tra Closure Gate, Close Work Order và cập nhật Service History.

# CHƯƠNG 2: MÔ HÌNH HÓA YÊU CẦU

## 2.1. Nhận diện tác nhân và phạm vi chức năng

_Bảng 2-1: Danh sách actor và workspace_

| **Actor** | **Workspace** | **Phạm vi chức năng** |
| --- | --- | --- |
| Khách vãng lai (Guest) | Public Website | Xem trang chủ, danh mục dịch vụ, bảng giá tham khảo và FAQ; Đăng ký; Đăng nhập. |
| Khách hàng (Customer) | Customer Portal | Vehicle, Appointment, Check-in confirmation, tracking, Finding, Quotation, Invoice, Release, History. |
| Nhân viên quầy (Front Desk Staff) | Front Desk Workspace | Appointment/Intake, Customer/Vehicle cơ bản, Invoice, Payment (tích hợp Financial Clearance tự động). |
| Cố vấn dịch vụ (Service Advisor) | Advisor Workspace | Work Order, Inspection/Finding, Job/Labour/Part planning, Quotation, Execution, QC, Release. |
| Quản lý dịch vụ (Service Manager) | Manager Workspace | Theo dõi vận hành Work Order, Service và Job; quản lý Item/Supplier; Goods Receipt; Average Cost; Issue/Return Part theo Job; Stock Card; approval cơ bản; Closure và báo cáo. |
| Quản trị viên (Administrator) | Administration Workspace | RBAC, Employee/Skill, Service/Job/Pricing/QC master data, danh mục dùng chung. |

## 2.2. Mô tả chi tiết từng tác nhân

### 2.2.1. Khách vãng lai (Guest)

Người truy cập website chưa có tài khoản hoặc chưa đăng nhập. Guest có thể xem thông tin công khai và thực hiện đăng ký hoặc đăng nhập để trở thành Customer hoặc truy cập với tư cách nhân viên.

### 2.2.2. Khách hàng (Customer)

Chủ phương tiện hoặc người đại diện sử dụng dịch vụ. Customer chỉ truy cập dữ liệu thuộc mình và không thấy internal note, giá vốn hoặc dữ liệu quản trị. Tài khoản Customer được tự tạo qua luồng Đăng ký; mật khẩu có thể tự đặt lại qua OTP.

### 2.2.3. Nhân viên quầy dịch vụ (Front Desk Staff)

Nhân viên quầy tiếp nhận và thu ngân cơ bản. Actor này không tạo Work Order chính thức; Service Advisor tiếp nhận hồ sơ từ Intake Queue. Tài khoản do Admin cấp.

### 2.2.4. Cố vấn dịch vụ (Service Advisor)

Actor vận hành chính: tạo Work Order, Inspection/Finding, Job, Labour/Part planning, Quotation, Execution, QC, Yêu cầu thanh toán (chuyển trạng thái BILLING_REQUESTED) và Release. Tài khoản do Admin cấp.

### 2.2.5. Quản lý dịch vụ (Service Manager)

Giám sát, phê duyệt ngoại lệ cơ bản và Close Work Order. Manager không mặc định kế thừa toàn bộ quyền Front Desk. Actor quản lý kho trong hệ thống: nhập hàng cơ bản, tính giá vốn và xuất/trả Part theo Job. Tài khoản do Admin cấp.

### 2.2.6. Quản trị viên (Administrator)

Quản lý tài khoản, phân quyền, cấp và đặt lại mật khẩu cho nhân viên, cấu hình master/template. Administrator không xử lý giao dịch vận hành hằng ngày.

## 2.3. Danh sách Use Case baseline

> **Lưu ý:** Danh sách Use Case baseline chi tiết đã được đồng bộ và cập nhật sang file [UseCase.md](./UseCase.md).
> Vui lòng tham khảo file `UseCase.md` để xem trọn bộ 40 Use Case chuẩn của hệ thống, bao gồm chi tiết các luồng chính và luồng thay thế cho Guest, Customer, Front Desk Staff, Service Advisor, Service Manager, và Administrator.

## 2.4. Tiêu chí hoàn thành Tiểu luận

_Bảng 2-8: Tiêu chí nghiệm thu MVP_

| **ID** | **Tiêu chí** |
| --- | --- |
| AC-01 | Demo được full flow từ Appointment đến Vehicle Release/Closure. |
| AC-02 | Tạo Inspection Finding, có thể liên kết với một hoặc nhiều job hoặc không liên kết với job nào. |
| AC-03 | Một Job liên kết được nhiều Part/Material và truy vết quantity/cost/price. |
| AC-04 | Tính đúng labour theo Job Type, package và part/material; freeze Approved Quotation. |
| AC-05 | Direct Receipt cập nhật On-hand/Average Cost; Issue/Return cập nhật stock và gắn Job. |
| AC-06 | Release bị chặn nếu Job chưa Completed, QC chưa Pass hoặc Invoice chưa Paid. |
| AC-07 | Có test tự động cho Finding–Job, pricing, stock non-negative và Release Gate. |

# KẾT LUẬN

Tài liệu này là baseline requirement cho toàn bộ đề tài. Tiểu luận chuyên ngành phải tạo ra một MVP có full E2E flow, bao gồm các liên kết nghiệp vụ Finding → Job → Part và các gate cơ bản trước khi bàn giao xe. Những chức năng không được mô tả là NEW/EXTENDED trong tài liệu Khóa luận vẫn tiếp tục giữ nguyên theo baseline này.