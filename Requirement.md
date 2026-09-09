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

Yêu cầu chức năng nghiệp vụ được mô tả theo actor trực tiếp sử dụng hệ thống. Mỗi actor có bảng công việc và bảng quy định/công thức làm căn cứ cho thiết kế API, giao diện, kiểm thử và nghiệm thu.

### Khách vãng lai (Guest) – GST

_Bảng 1-0: Yêu cầu chức năng nghiệp vụ – Khách vãng lai (Guest)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| GST-B01 | Xem thông tin công khai | Tra cứu | QĐ-GST01 | Xem trang chủ, danh mục dịch vụ, bảng giá tham khảo và FAQ mà không cần đăng nhập. |
| GST-B02 | Đăng ký tài khoản | Lưu trữ | QĐ-GST02 | Tạo tài khoản Khách hàng mới bằng email và mật khẩu. |
| GST-B03 | Đăng nhập | Xác thực | QĐ-GST03 | Đăng nhập bằng email và mật khẩu để truy cập hệ thống. |

_Bảng 1-0b: Quy định/công thức – Khách vãng lai (Guest)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-GST01 | Thông tin công khai | Trang thông tin công khai không yêu cầu tài khoản; chỉ hiển thị Service Template Active và giá tham khảo. |  |
| QĐ-GST02 | Đăng ký | Email và số điện thoại phải duy nhất; sau khi đăng ký, hệ thống tự đăng nhập và chuyển về trang chủ Customer. |  |
| QĐ-GST03 | Đăng nhập | Sau khi xác thực thành công, hệ thống mở phiên và điều hướng đến trang chủ tương ứng vai trò. |  |

### Khách hàng (Customer) – CUS

_Bảng 1-1: Yêu cầu chức năng nghiệp vụ – Khách hàng (Customer)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| CUS-B01 | Đăng xuất | Xác thực | QĐ-CUS01 | Kết thúc phiên làm việc hiện tại; áp dụng cho tất cả vai trò. |
| CUS-B02 | Đặt lại mật khẩu | Xác thực | QĐ-CUS02 | Khách hàng tự đặt lại mật khẩu qua OTP gửi về email; chỉ dành cho Customer. |
| CUS-B03 | Cập nhật hồ sơ cá nhân | Lưu trữ/Cập nhật | QĐ-CUS03 | Cập nhật họ tên, số điện thoại và địa chỉ. |
| CUS-B04 | Quản lý phương tiện | Lưu trữ/Cập nhật | QĐ-CUS04 | Một khách hàng có thể quản lý nhiều xe. |
| CUS-B05 | Quản lý lịch hẹn | Lưu trữ/Xử lý | QĐ-CUS05 | Tạo, dời hoặc hủy lịch hẹn. |
| CUS-B06 | Xác nhận tiếp nhận xe | Xác nhận | QĐ-CUS06 | Xác nhận tình trạng xe và phạm vi tiếp nhận. |
| CUS-B07 | Theo dõi tiến độ sửa chữa | Tra cứu | QĐ-CUS07 | Theo dõi trạng thái thân thiện theo Service. |
| CUS-B08 | Phản hồi báo giá | Tra cứu/Xác nhận | QĐ-CUS08 | Approve hoặc Reject báo giá. |
| CUS-B09 | Xem hóa đơn | Tra cứu | QĐ-CUS09 | Theo dõi số tiền phải thanh toán và trạng thái Paid. |
| CUS-B10 | Xác nhận nhận xe và xem lịch sử | Xác nhận/Tra cứu | QĐ-CUS10 | Xác nhận bàn giao và xem Service History. |

_Bảng 1-2: Quy định/công thức – Khách hàng (Customer)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-CUS01 | Đăng xuất | Tất cả vai trò đều có thể đăng xuất; hệ thống hủy phiên và chuyển về trang đăng nhập. |  |
| QĐ-CUS02 | Đặt lại mật khẩu | OTP có hiệu lực 5 phút; chỉ Customer tự đặt lại; tài khoản nhân viên do Admin cấp lại qua UC-41. |  |
| QĐ-CUS03 | Quyền sở hữu dữ liệu | Customer chỉ xem và thao tác trên hồ sơ, Vehicle, Appointment và Work Order thuộc mình. | RBAC + object ownership. |
| QĐ-CUS04 | Vehicle | Biển số phải duy nhất trong phạm vi hệ thống; Vehicle không được xóa khi đã phát sinh Work Order. | Dùng trạng thái Inactive. |
| QĐ-CUS05 | Appointment | Appointment mới ở REQUESTED; chỉ được dời/hủy trước khi ARRIVED hoặc CANCELLED. |  |
| QĐ-CUS06 | Check-in | Xác nhận Check-in lưu người xác nhận và thời điểm; nội dung đã xác nhận không bị ghi đè im lặng. |  |
| QĐ-CUS07 | Theo dõi tiến độ | Customer nhìn thấy trạng thái tổng quát, không thấy internal note hoặc giá vốn. |  |
| QĐ-CUS08 | Duyệt báo giá | Approved Quotation được khóa snapshot; Customer không tự thay đổi line hoặc đơn giá. |  |
| QĐ-CUS09 | Thanh toán MVP | Xem Invoice và Payment Status thuộc Work Order của mình; trạng thái UNPAID hoặc PAID. |  |
| QĐ-CUS10 | Service History | Lịch sử dịch vụ chỉ được ghi nhận sau khi Work Order RELEASED/CLOSED. |  |

### Nhân viên quầy dịch vụ (Front Desk Staff) – FDS

_Bảng 1-3: Yêu cầu chức năng nghiệp vụ – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| FDS-B01 | Quản lý Appointment | Lưu trữ/Xử lý | QĐ-FDS01 | Tạo thay khách, Confirm, Reschedule, Cancel. |
| FDS-B02 | Tiếp nhận xe | Xử lý | QĐ-FDS02 | Mark Arrived, Walk-in và Tow-in; đưa xe vào Intake Queue. |
| FDS-B03 | Quản lý hồ sơ khách hàng | Lưu trữ/Cập nhật | QĐ-FDS03 | Tìm hoặc tạo dữ liệu Customer/Vehicle tại quầy; tránh trùng. |
| FDS-B04 | Xem phiếu công việc | Tra cứu | QĐ-FDS04 | Tra cứu trạng thái để hỗ trợ khách. |
| FDS-B05 | Xử lý hóa đơn | Tính toán/Lưu trữ | QĐ-FDS05 | Nhận Billing Request, tạo Draft Invoice và phát hành Invoice chính thức. |
| FDS-B06 | Xử lý thanh toán | Lưu trữ | QĐ-FDS06 | Ghi nhận Manual Payment hoặc tạo QR Payment; sau khi thanh toán thành công, hệ thống tự ghi nhận Financial Clearance và thông báo cho Cố vấn dịch vụ. |

_Bảng 1-4: Quy định/công thức – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-FDS01 | Appointment transition | Chỉ thực hiện chuyển trạng thái hợp lệ; Cancel phải lưu lý do. |  |
| QĐ-FDS02 | Intake | Walk-in/Tow-in phải có Customer, Vehicle, thời điểm đến và nguồn tiếp nhận. Chỉ Appointment CONFIRMED mới được Mark Arrived. |  |
| QĐ-FDS03 | Tránh trùng dữ liệu | Tìm Customer theo số điện thoại/email và Vehicle theo biển số trước khi tạo mới. |  |
| QĐ-FDS04 | Phạm vi xem | Front Desk chỉ xem Work Order Summary và dữ liệu cần thiết cho chăm sóc khách/billing. |  |
| QĐ-FDS05 | Invoice | Invoice line phải truy vết về Service, Job, Labour, Part/Material hoặc Fee; Invoice ISSUED không sửa trực tiếp. Chỉ nhận Billing Request khi Service Advisor xác nhận Job, QC và Quotation đủ điều kiện. |  |
| QĐ-FDS06 | Payment & Financial Clearance | Payment không vượt Amount Due; payment hợp lệ chuyển Invoice sang PAID và hệ thống tự động ghi nhận Financial Clearance. Financial Clearance chỉ đạt khi Invoice đã PAID. | CT-BILL02 |

### Cố vấn dịch vụ (Service Advisor) – SA

_Bảng 1-5: Yêu cầu chức năng nghiệp vụ – Cố vấn dịch vụ (Service Advisor)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| SA-B01 | Xử lý Intake Queue | Tra cứu/Xử lý | QĐ-SA01 | Nhận Appointment Arrived, Walk-in hoặc Tow-in. |
| SA-B02 | Tạo phiếu công việc | Lưu trữ | QĐ-SA02 | Tạo hồ sơ trung tâm từ Intake hợp lệ. |
| SA-B03 | Ghi nhận tình trạng xe | Lưu trữ | QĐ-SA03 | Ghi mileage, fuel, complaint, belongings, tình trạng và evidence. |
| SA-B04 | Quản lý dịch vụ | Lưu trữ | QĐ-SA04 | Một Work Order có nhiều Service; thêm, sửa, xóa Service. |
| SA-B05 | Kiểm tra xe và ghi nhận phát hiện | Lưu trữ | QĐ-SA05 | Chọn loại marker hư hỏng (Damage, Rust, Dent...) và nhấp lên sơ đồ 2D mô phỏng xe để đặt marker, tự động tạo dòng Finding, đính kèm ảnh và ghi chú. |
| SA-B06 | Lên kế hoạch công việc | Lưu trữ/Liên kết | QĐ-SA06 | Tạo Job từ Finding (mở modal Create Dispatch Jobs), sinh Job từ Template hoặc tạo thủ công. |
| SA-B07 | Khai báo nhân công | Lưu trữ | QĐ-SA07 | Khai báo Labour line: loại nhân công, kỹ thuật viên và giờ ước tính theo Job. |
| SA-B08 | Khai báo phụ tùng | Lưu trữ/Liên kết | QĐ-SA08 | Khai báo Planned/Used Quantity của Part/Material theo Job. |
| SA-B09 | Quản lý báo giá | Tính toán/Lưu trữ | QĐ-SA09 | Tính package, labour, part/material; tạo, gửi, xử lý Approval và freeze snapshot. |
| SA-B10 | Thực hiện công việc | Xử lý | QĐ-SA10 | Start và Complete Job; ghi kết quả và Used Part. |
| SA-B11 | Kiểm định chất lượng | Lưu trữ/Xử lý | QĐ-SA11 | Ghi Pass/Fail theo checklist; Fail tạo Rework Job đơn giản. |
| SA-B12 | Gửi yêu cầu thanh toán | Xử lý | QĐ-SA12 | Chuyển dữ liệu sang Front Desk khi đủ điều kiện. |
| SA-B13 | Bàn giao xe | Xác nhận | QĐ-SA13 | Kiểm tra Release Gate và ghi nhận bàn giao xe chính thức. |

_Bảng 1-6: Quy định/công thức – Cố vấn dịch vụ (Service Advisor)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-SA01 | Nguồn Work Order | Work Order được tạo từ Appointment ARRIVED hoặc Intake Record hợp lệ. |  |
| QĐ-SA02 | Tạo phiếu công việc | Phải liên kết với khách hàng, xe và nguồn tiếp nhận hợp lệ. |  |
| QĐ-SA03 | Check-in bắt buộc | Mileage, fuel, complaint và tình trạng xe là bắt buộc; belongings có thể để trống. |  |
| QĐ-SA04 | Service | Một Work Order có nhiều Service; mỗi Service có pricing và QC policy riêng. |  |
| QĐ-SA05 | Inspection | Inspection phải gắn Work Order/Service; evidence lưu nguồn và visibility. Finding–Job: Mỗi Finding hợp lệ có thể liên kết một hoặc nhiều hoặc không Job nào. | Core traceability. |
| QĐ-SA06 | Nguồn Job | Job có thể sinh từ Finding, Service Template hoặc được tạo thủ công. |  |
| QĐ-SA07 | Labour | Labour line gắn với Job; loại nhân công lấy từ danh mục đã cấu hình; đơn giá được snapshot khi tạo báo giá. |  |
| QĐ-SA08 | Job–Part | Một Job có 0..N Part/Material; mọi Used Part phải gắn đúng Job. |  |
| QĐ-SA09 | Pricing | Giá được tính từ Pricing Model; Quotation lưu snapshot đơn giá tại thời điểm gửi/duyệt. | CT-PRICE01..05 |
| QĐ-SA10 | Job Progress MVP | Job chỉ Start khi Quotation đã APPROVED và đủ Part; chỉ Complete sau khi ghi kết quả. |  |
| QĐ-SA11 | QC MVP | QC Fail không được coi là Pass; Service chỉ Completed khi QC Pass. |  |
| QĐ-SA12 | Billing Request | Chỉ gửi khi các Job bắt buộc Completed, QC Pass và charge đã được duyệt. |  |
| QĐ-SA13 | Release Gate | Chỉ Release khi Job Completed, QC Pass và Invoice PAID. |  |

### Quản lý dịch vụ (Service Manager) – MGR

**Bảng 1-9: Yêu cầu chức năng nghiệp vụ – Quản lý dịch vụ**

|     |     |     |     |     |
| --- | --- | --- | --- | --- |
| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| MGR-B01 | Xem bảng điều hành cơ bản | Tra cứu | QĐ-MGR01 | Theo dõi Work Order, Service và Job. |
| MGR-B02 | Quản lý Part/Material Master | Lưu trữ/Cập nhật | QĐ-MGR03 | Quản lý SKU, tên, loại, UoM, giá vốn và giá bán. |
| MGR-B03 | Quản lý Supplier cơ bản | Lưu trữ/Cập nhật | QĐ-MGR04 | Lưu thông tin nhà cung cấp phục vụ Direct Goods Receipt. |
| MGR-B04 | Nhập tồn đầu kỳ/Direct Goods Receipt | Lưu trữ | QĐ-MGR05 | Tăng On-hand và tạo Stock Movement. |
| MGR-B05 | Tính Average Cost | Tính toán | QĐ-MGR06 | Tính giá vốn bình quân gia quyền sau mỗi lần nhập. |
| MGR-B06 | Issue Part cho Job | Xuất kho | QĐ-MGR07 | Giảm tồn và gắn Stock Movement với Job. |
| MGR-B07 | Return Part từ Job | Nhập trả | QĐ-MGR08 | Nhập lại lượng phụ tùng chưa sử dụng. |
| MGR-B08 | Xem tồn và Stock Card | Tra cứu | QĐ-MGR09 | Xem On-hand và lịch sử Stock Movement. |
| MGR-B9 | Phê duyệt điều chỉnh kho | Phê duyệt | QĐ-MGR10 | Duyệt Stock Adjustment nếu phát sinh. |
| MGR-B10 | Kiểm tra và đóng Work Order | Kiểm tra/Xử lý | QĐ-MGR11 | Close Work Order sau khi xe đã Release và thỏa điều kiện Closure Gate. |
| MGR-B11 | Xem báo cáo cơ bản | Tra cứu | QĐ-MGR12 | Xem số lượng dịch vụ, doanh thu và tồn kho. |

**Bảng 1-10: Quy định/công thức – Quản lý dịch vụ**

|     |     |     |     |
| --- | --- | --- | --- |
| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| QĐ-MGR01 | Dashboard MVP | Hiển thị trạng thái hiện tại của Work Order, Service và Job; chưa yêu cầu real-time hoặc KPI nâng cao. |  |
| QĐ-MGR02 | Inventory Item | Mỗi item có SKU duy nhất, type Part/Consumable/Chemical/Accessory và một UoM cơ sở. |  |
| QĐ-MGR03 | Supplier MVP | Supplier chỉ lưu dữ liệu cơ bản; chưa có RFQ, hợp đồng hoặc công nợ nhà cung cấp. |  |
| QĐ-MGR04 | Goods Receipt | Receipt phải lưu supplier/reference, item, quantity, unit purchase cost và received date; tăng tồn và tạo Stock Movement. |  |
| QĐ-MGR05 | Average Cost | Giá vốn mới được tính theo Moving Weighted Average; không thay đổi giá bán snapshot của Quotation đã duyệt. | CT-MGR01 |
| QĐ-MGR06 | Issue to Job | Không cho xuất vượt On-hand; mọi lần xuất tạo Stock Movement và lưu unit cost tại thời điểm xuất. | CT-MGR02 |
| QĐ-MGR07 | Return from Job | Số lượng trả không vượt số lượng đã issue chưa dùng; nhập lại theo unit cost của movement gốc. |  |
| QĐ-MGR08 | Không sửa tồn trực tiếp | On-hand được tổng hợp từ Stock Movement; thay đổi tồn phải qua nghiệp vụ nhập, xuất, trả hoặc adjustment được phê duyệt. |  |
| QĐ-MGR9 | Stock Adjustment | Adjustment phải được ghi thành Stock Movement và lưu thông tin người thực hiện/lý do điều chỉnh. |  |
| QĐ-MGR10 | Closure Gate | Chỉ Close Work Order khi xe đã Release, không còn Job/Rework mở và Invoice ở trạng thái PAID. |  |
| QĐ-MGR11 | Báo cáo | Số liệu được tổng hợp từ giao dịch và hỗ trợ lọc theo khoảng ngày cơ bản. |  |

### Quản trị viên (Administrator) – ADM

_Bảng 1-11: Yêu cầu chức năng nghiệp vụ – Quản trị viên (Administrator)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| ADM-B01 | Quản lý User/Role | Lưu trữ/Cập nhật | QĐ-ADM01 | Tạo, khóa và gán quyền; đặt lại mật khẩu tạm thời cho nhân viên. |
| ADM-B02 | Quản lý Employee/Skill | Lưu trữ/Cập nhật | QĐ-ADM02 | Technician, Detailer, QC Staff và kỹ năng chuyên môn. |
| ADM-B03 | Quản lý Service Category/Template | Lưu trữ/Cập nhật | QĐ-ADM03 | Repair, Maintenance, Wash, Detailing. |
| ADM-B04 | Quản lý Job Type/Template | Lưu trữ/Cập nhật | QĐ-ADM04 | Loại công việc, mẫu job mặc định và đơn giá giờ công. |
| ADM-B05 | Quản lý Pricing Policy | Lưu trữ/Cập nhật | QĐ-ADM05 | Fixed, vehicle-size, labour/parts. |
| ADM-B06 | Quản lý Inspection/QC Template | Lưu trữ/Cập nhật | QĐ-ADM06 | Checklist cơ bản theo Service. |
| ADM-B07 | Quản lý UoM/Reason/Terms | Lưu trữ/Cập nhật | QĐ-ADM07 | Danh mục dùng chung trong toàn hệ thống. |

_Bảng 1-12: Quy định/công thức – Quản trị viên (Administrator)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-ADM01 | RBAC | User có thể có nhiều role; quyền được kiểm tra ở giao diện và API; Admin đặt lại mật khẩu tạm thời cho nhân viên qua email. |  |
| QĐ-ADM02 | Employee | Employee không phải actor nếu không có tài khoản; Employee có Skill và Assignment. |  |
| QĐ-ADM03 | Service Template | Template Active mới được sử dụng; Work Order Service lưu snapshot dữ liệu quan trọng. |  |
| QĐ-ADM04 | Job Template | Job Template định nghĩa Job Type, estimated hours, part/material và QC yêu cầu. |  |
| QĐ-ADM05 | Labour Rate | Mỗi Job Type có hourly rate; rate dùng trong Quotation được snapshot. | CT-PRICE01 |
| QĐ-ADM06 | Pricing Policy MVP | Hỗ trợ fixed package, vehicle-size-based và labour/parts; custom line phải lưu lý do. |  |
| QĐ-ADM07 | Template checklist | Inspection/QC item có tên, bắt buộc/không bắt buộc và thứ tự hiển thị. |  |
| QĐ-ADM08 | Master data | Không xóa vật lý danh mục đã được giao dịch tham chiếu; chuyển Inactive. |  |

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
| FR-15 | Billing & Payment Basic | Hỗ trợ Billing Request, tích hợp Payment gateway, tạo/phát hành Invoice và quản lý Payment tại Front Desk. Hỗ trợ Manual Payment và QR Payment. Payment thành công tự động ghi nhận Financial Clearance và thông báo cho Cố vấn dịch vụ. | Must |
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

Service Advisor gửi Billing Request; Front Desk tạo Draft Invoice từ các chargeable line, Issue Invoice và ghi một full payment. Payment thành công tự động ghi nhận Financial Clearance và thông báo cho Cố vấn dịch vụ để bàn giao xe.

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

Actor vận hành chính: tạo Work Order, Inspection/Finding, Job, Labour/Part planning, Quotation, Execution, QC, Billing Request và Release. Tài khoản do Admin cấp.

### 2.2.5. Quản lý dịch vụ (Service Manager)

Giám sát, phê duyệt ngoại lệ cơ bản và Close Work Order. Manager không mặc định kế thừa toàn bộ quyền Front Desk. Actor quản lý kho trong hệ thống: nhập hàng cơ bản, tính giá vốn và xuất/trả Part theo Job. Tài khoản do Admin cấp.

### 2.2.6. Quản trị viên (Administrator)

Quản lý tài khoản, phân quyền, cấp và đặt lại mật khẩu cho nhân viên, cấu hình master/template. Administrator không xử lý giao dịch vận hành hằng ngày.

## 2.3. Danh sách Use Case baseline

Các Use Case dưới đây tạo thành baseline bắt buộc của Tiểu luận chuyên ngành. Tài liệu Khóa luận tốt nghiệp chỉ liệt kê Use Case NEW hoặc EXTENDED so với danh sách này.

### 2.3.1. Khách vãng lai (Guest)

_Bảng 2-1b: Use Case baseline – Khách vãng lai (Guest)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-01 | **Xem thông tin và danh mục dịch vụ (Browse Website)** | Must | Xem trang chủ, danh mục dịch vụ, bảng giá tham khảo và FAQ |
| UC-02 | **Đăng ký tài khoản (Register)** | Must | Tạo tài khoản Customer mới bằng email và mật khẩu |
| UC-03 | **Đăng nhập (Login)** | Must | Đăng nhập để truy cập hệ thống theo vai trò |

### 2.3.2. Khách hàng (Customer)

_Bảng 2-2: Use Case baseline – Khách hàng (Customer)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-04 | **Đăng xuất (Logout)** | Must | Kết thúc phiên làm việc; áp dụng cho tất cả vai trò |
| UC-05 | **Đặt lại mật khẩu (Reset Password)** | Must | Tự đặt lại mật khẩu qua OTP email; chỉ dành cho Customer |
| UC-06 | **Cập nhật hồ sơ cá nhân (Update Profile)** | Must | Cập nhật họ tên, số điện thoại và địa chỉ |
| UC-07 | **Quản lý phương tiện (Manage Vehicles)** | Must | Thêm, sửa, vô hiệu hóa Vehicle |
| UC-08 | **Quản lý lịch hẹn (Manage Appointments)** | Must | Tạo, dời, hủy lịch hẹn |
| UC-09 | **Xác nhận tiếp nhận xe (Confirm Vehicle Check-in)** | Must | Xác nhận tình trạng xe và phạm vi tiếp nhận |
| UC-10 | **Theo dõi tiến độ sửa chữa (Track Repair Progress)** | Must | Theo dõi trạng thái Work Order/Service/Finding |
| UC-11 | **Phản hồi báo giá (Respond to Quotation)** | Must | Xem, Approve hoặc Reject Quotation |
| UC-12 | **Xem hóa đơn (View Invoice)** | Must | Xem Invoice, số tiền cần thanh toán và trạng thái Payment |
| UC-13 | **Xác nhận nhận xe (Confirm Vehicle Release)** | Must | Xác nhận bàn giao và xem Service History |

### 2.3.3. Nhân viên quầy dịch vụ (Front Desk Staff)

_Bảng 2-3: Use Case baseline – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-14 | **Quản lý lịch hẹn (Manage Appointments)** | Must | Tạo thay Customer, Confirm, Reschedule, Cancel |
| UC-15 | **Tiếp nhận xe (Receive Vehicle)** | Must | Mark Arrived, Walk-in, Tow-in; đưa xe vào Intake Queue |
| UC-16 | **Quản lý hồ sơ khách hàng (Manage Customer Profile)** | Must | Tìm, tạo, cập nhật Customer/Vehicle cơ bản |
| UC-17 | **Xem phiếu công việc (View Work Order)** | Must | Tra cứu trạng thái để hỗ trợ khách |
| UC-18 | **Xử lý hóa đơn (Process Invoice)** | Must | Nhận Billing Request, tạo Draft Invoice, phát hành Invoice |
| UC-19 | **Xử lý thanh toán (Process Payment)** | Must | Manual Payment và QR Payment; tự động ghi nhận Financial Clearance sau khi thanh toán thành công |

### 2.3.4. Cố vấn dịch vụ (Service Advisor)

_Bảng 2-4: Use Case baseline – Cố vấn dịch vụ (Service Advisor)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-20 | **Tạo phiếu công việc (Create Work Order)** | Must | Xem Intake Queue, tạo Work Order |
| UC-21 | **Ghi nhận tình trạng xe (Record Vehicle Condition)** | Must | Ghi mileage, fuel, complaint, belongings, condition, evidence |
| UC-22 | **Quản lý dịch vụ (Manage Services)** | Must | Thêm, sửa, xóa Service; áp dụng Service Template |
| UC-23 | **Kiểm tra xe (Inspect Vehicle)** | Must | Đặt marker hư hỏng trên sơ đồ xe 2D (Car Diagram UI), tự động tạo dòng Finding, ghi chú và đính kèm hình ảnh |
| UC-24 | **Lên kế hoạch công việc (Plan Jobs)** | Must | Tạo Job từ Finding (modal Create Dispatch Jobs), sinh Job từ Template hoặc tạo thủ công |
| UC-25 | **Khai báo nhân công (Declare Labour)** | Must | Labour line: loại nhân công, kỹ thuật viên, số giờ theo Job |
| UC-26 | **Khai báo phụ tùng (Declare Parts)** | Must | Planned/Used Quantity, Part/Material theo Job |
| UC-27 | **Quản lý báo giá (Manage Quotation)** | Must | Tính giá, tạo, gửi, xử lý Approval và freeze snapshot |
| UC-28 | **Thực hiện công việc (Execute Job)** | Must | Start, thực hiện, ghi Result/Used Part, Complete |
| UC-29 | **Kiểm định chất lượng (Quality Inspection)** | Must | QC checklist, Pass/Fail, tạo Rework khi Fail |
| UC-30 | **Gửi yêu cầu thanh toán (Request Payment)** | Must | Gửi Billing Request sang Front Desk khi đủ điều kiện |
| UC-31 | **Bàn giao xe (Release Vehicle)** | Must | Kiểm tra Release Gate và ghi nhận bàn giao xe |

### 2.3.5. Quản lý dịch vụ (Service Manager)

_Bảng 2-6: Use Case baseline – Quản lý dịch vụ (Service Manager)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-32 | **Theo dõi hoạt động xưởng (Monitor Workshop)** | Must | Dashboard, theo dõi WO/Service/Job |
| UC-33 | **Quản lý danh mục phụ tùng (Manage Parts Catalog)** | Must | Quản lý Part/Material Item (SKU, UoM, giá) |
| UC-34 | **Nhập kho (Receive Inventory)** | Must | Opening Stock, Direct Goods Receipt, tự tính Average Cost |
| UC-35 | **Xuất kho theo công việc (Issue Stock by Job)** | Must | Issue Part to Job, Return Part from Job |
| UC-36 | **Phê duyệt điều chỉnh tồn kho (Approve Inventory Adjustment)** | Should | Duyệt Stock Adjustment |
| UC-37 | **Đóng phiếu công việc (Close Work Order)** | Must | Kiểm tra Closure Gate và Close WO |
| UC-38 | **Xem báo cáo vận hành (View Operational Report)** | Should | Service, revenue, inventory report |

### 2.3.6. Quản trị viên (Administrator)

_Bảng 2-7: Use Case baseline – Quản trị viên (Administrator)_

| **UC ID** | **Use Case** | **Ưu tiên** | **Mô tả ngắn** |
| --- | --- | --- | --- |
| UC-39 | **Quản lý tài khoản (Manage Accounts)** | Must | Tạo, khóa User, gán Role, đặt lại mật khẩu tạm thời |
| UC-40 | **Quản lý nhân viên (Manage Employees)** | Must | Employee, Skill; đặt lại mật khẩu nhân viên |
| UC-41 | **Quản lý danh mục dịch vụ (Manage Service Catalog)** | Must | Service Category, Service Template |
| UC-42 | **Cấu hình loại công việc (Configure Job Types)** | Must | Job Type, Job Template, Labour Rate |
| UC-43 | **Quản lý chính sách tính giá (Manage Pricing Policies)** | Must | Fixed, Vehicle-size, Labour/Parts |
| UC-44 | **Quản lý mẫu kiểm tra (Manage Inspection Templates)** | Must | Inspection Checklist, QC Checklist |
| UC-45 | **Quản lý danh mục (Manage System Catalog)** | Must | UoM, Reason, Terms và danh mục dùng chung |

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