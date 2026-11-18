**MỤC LỤC**

|     |     |
| --- | --- |
| **PHẦN MỞ ĐẦU** | **3** |
| 1. Lý do chọn đề tài | 3   |
| 2. Mục tiêu của đề tài | 3   |
| 3. Phạm vi nghiên cứu | 3   |
| 4. Phương pháp nghiên cứu | 4   |
| **CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VÀ XÁC ĐỊNH YÊU CẦU** | **4** |
| 1.1. Phân tích hiện trạng | 4   |
| 1.2. Phân tích yêu cầu | 5   |
| 1.2.1. Yêu cầu chức năng | 5   |
| 1.2.1.1. Yêu cầu chức năng nghiệp vụ | 5   |
| 1.2.1.2. Công thức tính giá và tồn kho | 11  |
| 1.2.1.3. Yêu cầu chức năng hệ thống | 14  |
| 1.2.2. Yêu cầu phi chức năng | 15  |
| 1.3. Quy trình tác nghiệp | 16  |
| 1.3.1. Appointment và Intake | 16  |
| 1.3.2. Work Order và Check-in | 16  |
| 1.3.3. Inspection, Finding và Job | 16  |
| 1.3.4. Job và Part | 17  |
| 1.3.5. Báo giá (Quotation) và Phê duyệt | 17  |
| 1.3.6. Job Execution | 17  |
| 1.3.7. QC và Rework | 18  |
| 1.3.8. Invoice và Payment | 18  |
| 1.3.9. Release và Closure | 18  |
| 1.3.10. Quy trình Quản lý Bảo hành | 19  |
| **CHƯƠNG 2: MÔ HÌNH HÓA YÊU CẦU** | **20** |
| 2.1. Nhận diện tác nhân và phạm vi chức năng | 20  |
| 2.2. Mô tả chi tiết từng tác nhân | 20  |
| 2.3. Danh sách Use Case baseline | 22  |
| 2.3.1. Khách vãng lai (Guest) | 22  |
| 2.3.2. Khách hàng (Customer) | 22  |
| 2.3.3. Nhân viên quầy dịch vụ (Front Desk Staff) | 24  |
| 2.3.4. Cố vấn dịch vụ (Service Advisor) | 25  |
| 2.3.5. Quản lý dịch vụ (Service Manager) | 26  |
| 2.3.6. Quản trị viên (Administrator) | 27  |
| 2.3.7. Hệ thống tự động (System / Background Job) | 29  |
| 2.3.8. Phân hệ Quản lý Bảo hành (Warranty Management) | 30  |
| 2.4. Tiêu chí hoàn thành Tiểu luận | 31  |
| **KẾT LUẬN** | **32** |

# PHẦN MỞ ĐẦU

## 1. Lý do chọn đề tài

Các trung tâm dịch vụ kỹ thuật ô tô hiện đại thường phải điều phối và phối hợp chặt chẽ nhiều bộ phận nghiệp vụ trong một lượt xe vào xưởng (Vehicle Visit): Khách hàng (Customer), Nhân viên quầy dịch vụ/Lễ tân (Front Desk Staff), Cố vấn dịch vụ (Service Advisor), Kỹ thuật viên (Technician), Nhân viên kiểm định chất lượng (QC Inspector), Thủ kho phụ tùng và Quản lý dịch vụ (Service Manager). Các hoạt động diễn ra theo chuỗi liên hoàn: tiếp nhận yêu cầu, khám và chẩn đoán hư hỏng, lập kế hoạch công việc, dự trù phụ tùng, tính giá và phê duyệt báo giá, thi công thực tế, nghiệm thu chất lượng, quyết toán hóa đơn, thanh toán, bàn giao xe xuất xưởng và theo dõi bảo hành hậu mãi.

Khi dữ liệu vận hành bị phân mảnh trên sổ sách chép tay, bảng tính điện tử hoặc các ứng dụng nhắn tin rời rạc, doanh nghiệp gặp phải những rủi ro nghiêm trọng:
- Mất khả năng truy vết trách nhiệm và lịch sử can thiệp kỹ thuật trên từng xe.
- Thiếu sợi dây liên kết bản chất giữa hư hỏng phát hiện (Finding) → Công việc xử lý (Job) → Phụ tùng thay thế (Part).
- Cơ chế tính giá dịch vụ không nhất quán giữa các loại hình (Sửa chữa, Bảo dưỡng, Chăm sóc xe) dẫn đến sai lệch doanh thu và thất thoát lợi nhuận.
- Hoạt động bảo hành diễn ra thụ động, khó xác định phương tiện có còn trong thời hạn hay số km cam kết, đồng thời không đo lường được chi phí vốn phụ tùng thiệt hại do bảo hành gây ra.

Đề tài đề xuất xây dựng một nền tảng web toàn diện lấy **Phiếu công việc (Work Order)** làm **hồ sơ trung tâm (Single Source of Truth)**, tách bạch rõ ràng cấu trúc dữ liệu: Service, Inspection/Finding, Job, Part/Material, Quotation, QC, Invoice, Vehicle Release, Service History và Warranty. Trọng tâm của đề tài là thiết lập chuỗi truy vết nghiệp vụ khép kín từ Finding → Job → Part → QC → Release, đi kèm cơ chế tính giá chuẩn hóa (Zero-Tax Policy) và quy trình xử lý bảo hành minh bạch.

## 2. Mục tiêu của đề tài

Tiểu luận chuyên ngành tập trung xây dựng một giải pháp MVP (Minimum Viable Product) hoàn chỉnh đầu-cuối (Full E2E) có khả năng quản lý thông suốt toàn bộ vòng đời của một phương tiện tại trung tâm dịch vụ:
- Quản lý Khách hàng, Phương tiện (Customer & Vehicle) và Lịch hẹn (Appointment).
- Tiếp nhận xe (Check-in), khám xe trực quan trên sơ đồ 2D (Visual Inspection) và đánh dấu hư hỏng (Finding).
- Lập kế hoạch dịch vụ và điều phối công việc: liên kết Finding → Job → Phụ tùng (Part/Material) và Nhân công (Labour).
- Công cụ tính giá tự động (Pricing Engine) hỗ trợ 3 mô hình định giá dịch vụ, chính sách Zero-Tax ($Tax = 0$ VNĐ) và quy tắc đóng băng đơn giá snapshot tại thời điểm báo giá.
- Vòng đời Báo giá (Quotation Lifecycle): Lập báo giá, Cập nhật chiết khấu (% hoặc tiền mặt), Phê duyệt/Từ chối báo giá (tự động giữ chỗ phụ tùng trong kho) và Hủy báo giá.
- Thi công sửa chữa (Job Execution), xuất kho phụ tùng đúng định mức và nghiệm thu chất lượng đa tiêu chí (Quality Inspection / Rework).
- Thanh toán & Quyết toán tài chính (Invoice & Payment) với cơ chế tự động ghi nhận Financial Clearance.
- Bàn giao xe xuất xưởng (Vehicle Release), Đóng hồ sơ (Closure Gate) và đồng bộ Sổ bảo dưỡng điện tử (Service History).
- Phân hệ Quản lý Bảo hành chuyên biệt (Warranty Management): Tra cứu điều kiện bảo hành, Đặt lịch bảo hành, Tiếp nhận bảo hành, Lập phiếu Work Order bảo hành 0đ, Phê duyệt bảo hành thiện chí (Goodwill Warranty), Phát hành hóa đơn 0đ và Báo cáo quản trị chi phí vốn bảo hành.
- Dịch vụ chạy nền tự động (Background Job): Tự động quét lịch hẹn và gửi email nhắc hẹn cho khách hàng trước 24 giờ.

MVP ưu tiên happy path chuẩn hóa, tích hợp đầy đủ các cổng kiểm soát (Gates: Check-in Gate, Quotation Gate, Execution Gate, QC Gate, Financial Gate, Release Gate, Closure Gate) và các quy tắc nghiệp vụ cốt lõi. Các tính năng mở rộng chuyên sâu (như Purchase Order đa trạng thái, quản lý công nợ NCC, xung đột lịch nâng cao) được định hướng phát triển ở giai đoạn Khóa luận tốt nghiệp.

## 3. Phạm vi nghiên cứu

_Bảng 0-1: Tóm tắt phạm vi Tiểu luận chuyên ngành_

| **Nhóm** | **Phạm vi triển khai** |
| --- | --- |
| Phạm vi tổ chức | Một trung tâm kỹ thuật dịch vụ ô tô, một chi nhánh vận hành và một kho phụ tùng tập trung. |
| Nhóm dịch vụ | Sửa chữa (Repair), Bảo dưỡng định kỳ (Maintenance), Rửa xe (Car Wash), Chăm sóc xe chuyên sâu (Detailing), Tiếp nhận xe cứu hộ (Tow-in) và Phân hệ Quản lý Bảo hành (Warranty). |
| Luồng nghiệp vụ chính | Appointment/Walk-in/Tow-in → Work Order → Inspection/Finding → Job/Part Planning → Quotation (Create/Update/Approve/Cancel) → Job Execution → QC Inspection → Invoice/Payment (Zero-Tax) → Vehicle Release → Work Order Closure → Digital Maintenance History. |
| Luồng nghiệp vụ bảo hành | Tra cứu thời hạn/số km bảo hành → Đặt lịch hẹn bảo hành → Tiếp nhận bảo hành tại quầy → Lập phiếu Work Order bảo hành (áp dụng đơn giá 0đ) → Thi công & Kiểm định QC → Phê duyệt bảo hành thiện chí (nếu có ngoại lệ) → Hóa đơn bảo hành 0đ & Financial Clearance tự động → Bàn giao xe xuất xưởng → Báo cáo quản trị chi phí vốn bảo hành. |
| Cơ chế tính giá (Pricing Policy) | Áp dụng **Chính sách Zero-Tax cốt lõi** ($r_{vat} = 0\%$, $Tax = 0$ VNĐ, $\mathbf{GrandTotal = Subtotal - Discount}$). Hỗ trợ 3 mô hình tính giá dịch vụ: Gói cố định (`FIXED`), Theo phân khúc kích cỡ xe (`BY_VEHICLE_SIZE`) và Theo định mức giờ công + phụ tùng (`LABOUR_AND_PARTS`). Áp dụng nguyên tắc đóng băng giá snapshot (`snapshot_unit_price`). |
| Quản lý kho (Inventory) | Quản lý danh mục phụ tùng (Part Category - Master Data) và mã SKU thực tế theo hãng (Inventory Item). Nhập kho trực tiếp (Direct Goods Receipt), tính giá vốn bình quân di động (Moving Weighted Average Cost), giữ chỗ kho (`RESERVED`), xuất kho (`ISSUED`), hoàn kho (`RETURNED`) theo Job và thẻ kho (Stock Movement). |
| Nền tảng ứng dụng | Ứng dụng Web Responsive gồm Public Website (thông tin công khai cho Khách vãng lai), Customer Portal (cổng khách hàng) và Staff Portal (không gian làm việc chuyên biệt theo vai trò: Front Desk, Service Advisor, Service Manager, Administrator); tích hợp dịch vụ nền (Background Cron Job) gửi email tự động. |
| Ngoài phạm vi MVP | Thiết bị phần cứng đọc cổng OBD-II/GPS thời gian thực, ứng dụng di động Native (iOS/Android), quản lý đặt hàng nhà cung cấp đa cấp độ (Purchase Order workflow), và kế toán công nợ nhà cung cấp. |

**Ranh giới MVP:** Toàn bộ hệ thống phải vận hành mượt mà E2E từ tiếp nhận đến bàn giao xe và bảo hành, đảm bảo tính toàn vẹn dữ liệu, các chốt chặn kiểm soát (Gates) hoạt động chính xác và không có trạng thái treo.

## 4. Phương pháp nghiên cứu

Nghiên cứu áp dụng phương pháp khảo sát nghiệp vụ thực tế tại các garage ô tô tiêu biểu; mô hình hóa quy trình hiện trạng (AS-IS) và quy trình mục tiêu (TO-BE); xây dựng tài liệu đặc tả yêu cầu nghiệp vụ (BRD), ma trận phân quyền trạng thái (CRUD Matrix), máy trạng thái hữu hạn (State Machine) và bộ hồ sơ 87 Use Cases chuẩn hóa.

Quá trình phát triển tuân thủ phương pháp phân lát dọc (Vertical Slice Architecture), phân chia ranh giới module rõ ràng; kiểm thử hệ thống thông qua kiểm thử đơn vị (Unit Test) cho các công thức tính giá và kiểm thử tích hợp API (Integration Test) cho luồng E2E cốt lõi.

# CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG VÀ XÁC ĐỊNH YÊU CẦU

## 1.1. Phân tích hiện trạng

Tại các trung tâm dịch vụ ô tô truyền thống, thông tin tiếp nhận xe thường bị phân mảnh qua nhiều kênh (điện thoại, ghi chú giấy, ứng dụng chat cá nhân). Khi xe vào xưởng, việc ghi nhận số km ODO, lượng xăng, tình trạng thân vỏ và các hư hỏng thực tế dễ bị bỏ sót hoặc ghi nhận thiếu minh chứng hình ảnh, dẫn đến khiếu nại từ khách hàng khi bàn giao xe.

Đặc biệt, mối liên hệ kỹ thuật giữa các thực thể thường bị đứt gãy:
- Hư hỏng phát hiện trong quá trình kiểm tra (Finding) không được ánh xạ trực tiếp sang các lệnh công việc sửa chữa (Job).
- Vật tư phụ tùng xuất từ kho không được kiểm soát theo từng công việc cụ thể, dẫn đến việc thất thoát hoặc tính thừa/thiếu chi phí cho khách hàng.
- Mỗi nhóm dịch vụ có cách tính giá đặc thù: Dịch vụ bảo dưỡng thường áp dụng giá trọn gói; Dịch vụ sửa chữa tính theo giờ công nhân công và giá phụ tùng; Dịch vụ chăm sóc/rửa xe tính theo kích thước xe. Nếu không có bộ quy tắc định giá chuẩn hóa và cơ chế lưu trữ đơn giá snapshot tại thời điểm chốt hợp đồng, báo giá sẽ thiếu tính nhất quán và không phản ánh chính xác biên lợi nhuận của trung tâm.
- Về công tác bảo hành, khi phương tiện quay lại vì sự cố lặp lại, nhân sự xưởng thường mất nhiều thời gian tra cứu hồ sơ cũ trên giấy tờ, khó xác minh phụ tùng đã thay có còn trong điều kiện bảo hành hay không. Đồng thời, xưởng không tách bạch được giữa chi phí sửa chữa thông thường và chi phí bảo hành nội bộ, gây khó khăn cho việc quản trị chất lượng tay nghề thợ và đòi bồi hoàn từ nhà cung cấp linh kiện.

Giải pháp của đề tài là xây dựng hệ thống quản lý tập trung lấy **Work Order** làm bản ghi cốt lõi, điều phối 8 thực thể vệ tinh theo máy trạng thái hữu hạn 10 bước khép kín.

## 1.2. Phân tích yêu cầu

### 1.2.1. Yêu cầu chức năng

#### 1.2.1.1. Yêu cầu chức năng nghiệp vụ

Yêu cầu chức năng nghiệp vụ được phân rã chi tiết theo từng tác nhân (Actor) tương tác trực tiếp với hệ thống. Mỗi tác nhân sở hữu bảng danh mục công việc nghiệp vụ và bảng quy định quy tắc (Business Rules) làm căn cứ kỹ thuật.

### Khách vãng lai (Guest) – GST

_Bảng 1-0: Yêu cầu chức năng nghiệp vụ – Khách vãng lai (Guest)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| GST-B01 | Xem thông tin công khai | Tra cứu | QĐ-GST01 | Xem trang chủ, danh mục dịch vụ, bảng giá tham khảo và câu hỏi thường gặp (FAQ) mà không cần đăng nhập. |
| GST-B02 | Đăng ký tài khoản | Lưu trữ | QĐ-GST02 | Tự tạo tài khoản Khách hàng mới bằng email, số điện thoại và mật khẩu. |
| GST-B03 | Đăng nhập | Xác thực | QĐ-GST03 | Đăng nhập vào hệ thống bằng email và mật khẩu để sử dụng các tính năng tương ứng. |

_Bảng 1-0b: Quy định/công thức – Khách vãng lai (Guest)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-GST01 | Thông tin công khai | Trang thông tin công khai không đòi hỏi xác thực; chỉ hiển thị các gói dịch vụ ở trạng thái Active kèm mức giá niêm yết tham khảo. |  |
| QĐ-GST02 | Đăng ký tài khoản | Email và số điện thoại phải là duy nhất trong toàn hệ thống. Sau khi đăng ký thành công, hệ thống tự động khởi tạo phiên làm việc và điều hướng về trang chủ Khách hàng. |  |
| QĐ-GST03 | Điều hướng xác thực | Sau khi xác thực danh tính thành công, hệ thống mở phiên đăng nhập (JWT token) và tự động chuyển hướng đến Portal tương ứng với vai trò của người dùng. |  |

### Khách hàng (Customer) – CUS

_Bảng 1-1: Yêu cầu chức năng nghiệp vụ – Khách hàng (Customer)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| CUS-B01 | Đăng xuất | Xác thực | QĐ-CUS01 | Kết thúc phiên làm việc hiện tại trên hệ thống. |
| CUS-B02 | Đặt lại mật khẩu | Xác thực | QĐ-CUS02 | Tự đặt lại mật khẩu bảo mật thông qua mã xác thực OTP gửi về địa chỉ email đã đăng ký. |
| CUS-B03 | Cập nhật hồ sơ cá nhân | Lưu trữ/Cập nhật | QĐ-CUS03 | Xem và chỉnh sửa thông tin cá nhân: họ tên, số điện thoại, địa chỉ liên hệ. |
| CUS-B04 | Quản lý phương tiện | Lưu trữ/Cập nhật | QĐ-CUS04 | Thêm mới, tra cứu chi tiết, chỉnh sửa thông tin hoặc vô hiệu hóa các phương tiện thuộc sở hữu. |
| CUS-B05 | Quản lý lịch hẹn | Lưu trữ/Xử lý | QĐ-CUS05 | Tạo mới lịch hẹn dịch vụ trực tuyến, dời ngày giờ hẹn hoặc hủy lịch hẹn khi chưa đến giờ tiếp nhận. |
| CUS-B06 | Xác nhận tiếp nhận xe | Xác nhận | QĐ-CUS06 | Xem biên bản Check-in (ODO, mức xăng, đồ đạc, ảnh chụp hiện trạng) và xác nhận bàn giao xe cho xưởng. |
| CUS-B07 | Theo dõi tiến độ sửa chữa | Tra cứu | QĐ-CUS07 | Theo dõi trực tiếp tiến độ thực hiện theo từng dịch vụ qua thanh trạng thái thân thiện, xem ảnh thi công. |
| CUS-B08 | Quản lý & Xem báo giá | Tra cứu/Phê duyệt | QĐ-CUS08 | Xem chi tiết từng dòng báo giá do Cố vấn dịch vụ gửi tới; xác nhận Phê duyệt hoặc Từ chối báo giá. |
| CUS-B09 | Xem hóa đơn & Thanh toán | Tra cứu | QĐ-CUS09 | Xem hóa đơn điện tử, tổng số tiền cần thanh toán (áp dụng Zero-Tax), chi tiết chiết khấu và trạng thái thanh toán. |
| CUS-B10 | Xem lịch sử dịch vụ | Tra cứu | QĐ-CUS10 | Xem danh sách các lần làm dịch vụ trước đây của các xe thuộc quyền sở hữu của mình. |
| CUS-B11 | Tra cứu thông tin bảo hành | Tra cứu | QĐ-CUS11 | Tra cứu danh sách các dịch vụ và phụ tùng đã làm trên xe để kiểm tra thời hạn (ngày) và số km ODO bảo hành còn hiệu lực. |
| CUS-B12 | Đặt lịch hẹn bảo hành | Lưu trữ/Xử lý | QĐ-CUS12 | Chủ động tạo lịch hẹn bảo hành trực tuyến cho các phụ tùng hoặc dịch vụ còn trong thời hạn cam kết. |
| CUS-B13 | Sổ bảo dưỡng điện tử & Lịch sử sửa chữa | Tra cứu/Xuất file | QĐ-CUS13 | Xem sổ bảo dưỡng điện tử chi tiết 4 phần của xe đã hoàn tất chu trình; tải Biên bản bàn giao xe hoặc Hóa đơn VAT dạng PDF. |

_Bảng 1-2: Quy định/công thức – Khách hàng (Customer)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-CUS01 | Đăng xuất an toàn | Hủy token phiên làm việc hiện tại và điều hướng người dùng về trang đăng nhập. |  |
| QĐ-CUS02 | Quản lý OTP | Mã OTP có hiệu lực chính xác 5 phút kể từ lúc gửi. Chỉ tài khoản Khách hàng được phép tự khôi phục mật khẩu qua OTP; tài khoản nhân sự nội bộ do Quản trị viên cấp lại. |  |
| QĐ-CUS03 | Quyền sở hữu dữ liệu (Data Ownership) | Khách hàng chỉ có quyền xem và thao tác trên các phương tiện, lịch hẹn, phiếu công việc, báo giá, hóa đơn và hồ sơ bảo hành thuộc quyền sở hữu của chính mình. | RBAC + Object Ownership |
| QĐ-CUS04 | Ràng buộc phương tiện | Biển số xe là duy nhất trong toàn hệ thống. Phương tiện đã phát sinh Phiếu công việc trong lịch sử không được phép xóa vật lý khỏi cơ sở dữ liệu, chỉ được chuyển trạng thái Không hoạt động (Inactive). |  |
| QĐ-CUS05 | Vòng đời lịch hẹn | Lịch hẹn mới khởi tạo ở trạng thái REQUESTED. Khách hàng chỉ được dời lịch hoặc hủy lịch khi lịch hẹn chưa chuyển sang trạng thái ARRIVED hoặc CANCELLED. |  |
| QĐ-CUS06 | Biên bản Check-in | Ghi nhận dấu vết thời gian (timestamp) và danh tính người xác nhận. Nội dung biên bản Check-in đã xác nhận không được phép sửa đổi ngầm. |  |
| QĐ-CUS07 | Quyền riêng tư khách hàng | Giao diện theo dõi tiến độ của Khách hàng chỉ hiển thị ngôn ngữ trạng thái thân thiện và ảnh minh chứng; ẩn hoàn toàn các ghi chú nội bộ (internal notes) và giá vốn phụ tùng (part cost). |  |
| QĐ-CUS08 | Phê duyệt báo giá | Khách hàng có thể phê duyệt trực tiếp trên Customer Portal hoặc Cố vấn dịch vụ ghi nhận phê duyệt ủy quyền. Khi báo giá được duyệt, hệ thống khóa đóng băng đơn giá snapshot và tự động giữ chỗ phụ tùng trong kho. | BR-QUO-01 |
| QĐ-CUS09 | Thanh toán Zero-Tax | Khách hàng chỉ thanh toán đúng số tiền sau chiết khấu (Grand Total = Subtotal - Discount); không có bất kỳ khoản thuế phụ thu nào. | Zero-Tax Policy |
| QĐ-CUS10 | Điều kiện ghi nhận lịch sử | Lịch sử dịch vụ chỉ được ghi nhận chính thức vào hồ sơ xe sau khi Phiếu công việc đạt trạng thái RELEASED hoặc CLOSED. |  |
| QĐ-CUS11 | Tính toán hạn bảo hành | Hệ thống tự động đối chiếu số km ODO hiện tại và ngày hiện tại với chính sách bảo hành của dịch vụ/phụ tùng để tính ra số ngày và số km còn được bảo hành. | UC-81 |
| QĐ-CUS12 | Điều kiện đặt lịch bảo hành | Chỉ cho phép chọn các dịch vụ hoặc phụ tùng còn trong hạn bảo hành hợp lệ để tạo lịch hẹn bảo hành. | UC-82 |
| QĐ-CUS13 | Sổ bảo dưỡng & Xuất chứng từ | Sổ bảo dưỡng điện tử hiển thị đầy đủ 4 khối thông tin: Tiếp nhận & Hiện trạng, Hạng mục & Phụ tùng, Nghiệm thu QC, Bàn giao & Bảo hành. Cho phép xuất chứng từ PDF hợp lệ. | UC-80 |

### Nhân viên quầy dịch vụ (Front Desk Staff) – FDS

_Bảng 1-3: Yêu cầu chức năng nghiệp vụ – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| FDS-B01 | Quản lý Appointment | Lưu trữ/Xử lý | QĐ-FDS01 | Tạo lịch hẹn thay cho khách gọi điện, xác nhận lịch (Confirm), dời lịch hoặc hủy lịch hẹn. |
| FDS-B02 | Tiếp nhận xe vào xưởng | Xử lý | QĐ-FDS02 | Đánh dấu khách đã đến (Mark Arrived), tiếp nhận khách vãng lai (Walk-in) hoặc xe cứu hộ (Tow-in); đưa xe vào hàng đợi Intake Queue. |
| FDS-B03 | Quản lý hồ sơ khách hàng | Lưu trữ/Cập nhật | QĐ-FDS03 | Tra cứu, tạo mới, cập nhật hồ sơ khách hàng và phương tiện tại quầy; kiểm tra trùng lặp thông tin. |
| FDS-B04 | Tra cứu phiếu công việc | Tra cứu | QĐ-FDS04 | Tra cứu trạng thái tổng quát của Work Order để phản hồi thông tin cho khách hàng. |
| FDS-B05 | Xử lý hóa đơn thương mại | Tính toán/Lưu trữ | QĐ-FDS05 | Nhận yêu cầu thanh toán (Billing Request), kiểm tra các dòng chi phí đã duyệt, lập hóa đơn tạm (Draft Invoice) và phát hành hóa đơn chính thức (Issued Invoice). |
| FDS-B06 | Xử lý thanh toán | Lưu trữ | QĐ-FDS06 | Thu tiền mặt/chuyển khoản hoặc tạo mã VietQR thanh toán; khi nhận đủ tiền, hệ thống tự động ghi nhận Financial Clearance. |
| FDS-B07 | Tiếp nhận xe bảo hành | Xử lý | QĐ-FDS07 | Tiếp nhận phương tiện đến bảo hành (theo hẹn hoặc đột xuất), ghi nhận ODO thực tế, đối chiếu điều kiện bảo hành và đưa vào Intake Queue diện bảo hành. |
| FDS-B08 | Xử lý hóa đơn bảo hành | Lưu trữ/Xử lý | QĐ-FDS08 | Lập và phát hành hóa đơn bảo hành 0 VNĐ cho phiếu công việc bảo hành; hệ thống tự động xác nhận Financial Clearance cho phép xe xuất xưởng. |

_Bảng 1-4: Quy định/công thức – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-FDS01 | Quy chuẩn lịch hẹn | Chỉ thực hiện chuyển trạng thái hợp lệ trên máy trạng thái lịch hẹn; thao tác hủy lịch bắt buộc phải nhập lý do hủy. |  |
| QĐ-FDS02 | Tiếp nhận xe vào Intake | Hồ sơ tiếp nhận Walk-in/Tow-in bắt buộc phải liên kết Khách hàng, Phương tiện, thời điểm đến và nguồn tiếp nhận. Chỉ lịch hẹn ở trạng thái CONFIRMED mới được phép đánh dấu Mark Arrived. |  |
| QĐ-FDS03 | Chống trùng lặp dữ liệu | Nhân viên quầy bắt buộc phải tìm kiếm khách hàng theo số điện thoại/email và tìm xe theo biển số trước khi tạo mới để tránh trùng lặp dữ liệu trong hệ thống. |  |
| QĐ-FDS04 | Phạm vi truy cập của Quầy | Nhân viên quầy chỉ xem được màn hình tóm tắt Work Order và các trường dữ liệu liên quan đến chăm sóc khách hàng và thanh toán hóa đơn. |  |
| QĐ-FDS05 | Nguyên tắc lập hóa đơn | Mỗi dòng trên hóa đơn (Invoice Line) bắt buộc phải truy vết ngược về đúng Service, Job, Labour, Part hoặc Fee được phê duyệt. Hóa đơn đã ISSUED không được sửa trực tiếp các dòng phí. |  |
| QĐ-FDS06 | Thanh toán & Giải tỏa tài chính | Số tiền thanh toán không được vượt quá số tiền còn nợ (Amount Due). Thanh toán hợp lệ đủ 100% chuyển hóa đơn sang PAID và kích hoạt ngay Financial Clearance. | CT-BILL02 |
| QĐ-FDS07 | Kiểm tra điều kiện bảo hành | Khi tiếp nhận xe bảo hành, nhân viên quầy nhập số km ODO thực tế, hệ thống tự động đối chiếu với số km và ngày bảo hành của phiếu dịch vụ gốc. Nếu hợp lệ, chuyển hồ sơ sang hàng đợi Cố vấn; nếu quá hạn, thông báo khách hàng hoặc chuyển luồng duyệt ngoại lệ. | UC-83 |
| QĐ-FDS08 | Hóa đơn 0 đồng bảo hành | Với phiếu công việc được bảo hành 100%, hệ thống tự động sinh hóa đơn có tổng thanh toán = 0 VNĐ. Sau khi nhân viên nhấn Phát hành, hệ thống chuyển hóa đơn sang PAID và tự động cấp quyền Financial Clearance cho Work Order mà không cần ghi nhận giao dịch tiền mặt. | UC-85 |

### Cố vấn dịch vụ (Service Advisor) – SA

_Bảng 1-5: Yêu cầu chức năng nghiệp vụ – Cố vấn dịch vụ (Service Advisor)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| SA-B01 | Tiếp nhận từ Intake Queue | Tra cứu/Xử lý | QĐ-SA01 | Tiếp nhận xe từ hàng đợi xe đã đến xưởng (Appointment Arrived, Walk-in hoặc Tow-in). |
| SA-B02 | Tạo phiếu công việc | Lưu trữ | QĐ-SA02 | Khởi tạo hồ sơ trung tâm Work Order từ hồ sơ tiếp nhận hợp lệ. |
| SA-B03 | Ghi nhận tình trạng xe (Check-in) | Lưu trữ | QĐ-SA03 | Ghi số ODO, lượng xăng, phản ánh của khách, đồ đạc để lại trên xe và chụp ảnh hiện trạng xung quanh xe. |
| SA-B04 | Quản lý danh mục dịch vụ | Lưu trữ | QĐ-SA04 | Thêm mới, chỉnh sửa hoặc xóa bỏ các gói dịch vụ (Service) trong phạm vi Work Order. |
| SA-B05 | Khám xe & Đánh dấu hư hỏng | Lưu trữ/Đồ họa | QĐ-SA05 | Chọn loại marker khuyết tật (móp méo, trầy xước, rỉ sét...) và nhấp chuột trực tiếp lên sơ đồ xe 2D để tạo Finding, đính kèm ảnh chụp chi tiết. |
| SA-B06 | Lập kế hoạch công việc (Job) | Lưu trữ/Liên kết | QĐ-SA06 | Tạo các đầu công việc cụ thể: tạo từ Finding (modal Create Dispatch Jobs), sinh từ Template dịch vụ, hoặc tạo thủ công. |
| SA-B07 | Khai báo nhân công (Labour) | Lưu trữ | QĐ-SA07 | Khai báo các dòng nhân công cho từng Job: chọn loại thợ (Job Type), số giờ định mức (billable hours) và kỹ thuật viên phụ trách. |
| SA-B08 | Khai báo phụ tùng (Part) | Lưu trữ/Liên kết | QĐ-SA08 | Khai báo danh mục phụ tùng/vật tư dự kiến cần dùng cho từng Job, số lượng kế hoạch và tra cứu tồn kho thực tế. |
| SA-B09 | Quản lý báo giá (Quotation Lifecycle) | Tính toán/Lưu trữ | QĐ-SA09 | Tạo báo giá ban đầu (UC-37), Cập nhật chiết khấu & phụ phí (UC-39), Gửi duyệt và ghi nhận phê duyệt/từ chối từ khách (UC-40), hoặc Hủy báo giá (UC-41). |
| SA-B10 | Điều phối thi công sửa chữa | Xử lý | QĐ-SA10 | Chuyển trạng thái bắt đầu làm việc (Start Job), ghi nhận kết quả hoàn thành và xác nhận số lượng phụ tùng thực tế đã dùng (Complete Job). |
| SA-B11 | Kiểm định chất lượng (QC) | Lưu trữ/Xử lý | QĐ-SA11 | Thực hiện kiểm định nghiệm thu chất lượng theo checklist: Đạt (Pass) hoặc Không đạt (Fail - tự động tạo Rework Job). |
| SA-B12 | Gửi yêu cầu thanh toán | Xử lý | QĐ-SA12 | Kiểm tra điều kiện hoàn thành toàn bộ công việc và QC, gửi Billing Request sang cho Nhân viên quầy dịch vụ. |
| SA-B13 | Bàn giao xe xuất xưởng | Xác nhận | QĐ-SA13 | Kiểm tra Release Gate (100% Job Done, QC Pass, Invoice Paid), ký biên bản bàn giao xe và xuất xưởng chính thức. |
| SA-B14 | Lập phiếu công việc bảo hành | Lưu trữ/Xử lý | QĐ-SA14 | Thẩm định tình trạng xe bảo hành, liên kết phiếu dịch vụ gốc, gắn cờ bảo hành cho dịch vụ/phụ tùng thay thế (đơn giá 0đ), tạo báo giá bảo hành 0đ và điều phối thi công. |

_Bảng 1-6: Quy định/công thức – Cố vấn dịch vụ (Service Advisor)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-SA01 | Nguồn hợp lệ tạo Work Order | Work Order chỉ được phép khởi tạo từ các lượt tiếp nhận có trạng thái QUEUED trong hàng đợi Intake Queue. |  |
| QĐ-SA02 | Ràng buộc tạo hồ sơ | Work Order bắt buộc phải gắn liền với đúng Khách hàng, đúng Phương tiện và hồ sơ tiếp nhận hợp lệ. |  |
| QĐ-SA03 | Check-in Gate bắt buộc | Các trường dữ liệu: Số ODO km, mức nhiên liệu, phản ánh hư hỏng của khách và ảnh tình trạng xe là bắt buộc; thông tin tư trang để lại có thể bỏ trống nếu không có. | Check-in Gate |
| QĐ-SA04 | Cấu trúc Service trong Work Order | Một Work Order có thể chứa nhiều Service; mỗi Service có mô hình định giá (`pricing_type`) và chính sách kiểm định chất lượng riêng biệt. |  |
| QĐ-SA05 | Chuỗi truy vết Finding – Job | Mọi Finding phải gắn với Work Order; một Finding có thể liên kết với một, nhiều hoặc không liên kết với Job nào (nếu khách quyết định chưa sửa). | Core Traceability |
| QĐ-SA06 | Nguồn gốc Job | Job có thể được sinh tự động từ Service Template, tạo từ Finding phát hiện được, hoặc do Cố vấn thêm thủ công theo thỏa thuận. |  |
| QĐ-SA07 | Định mức nhân công | Dòng nhân công phải gắn với Job cụ thể; đơn giá giờ công được xác định từ Job Type và được snapshot cố định tại thời điểm lập báo giá. | CT-PRICE01 |
| QĐ-SA08 | Định mức phụ tùng (Job – Part) | Mọi phụ tùng dự kiến hoặc thực dùng đều phải gán đúng vào một Job cụ thể; không được xuất phụ tùng tự do không có Job. |  |
| QĐ-SA09 | Chu trình Báo giá & Khóa Snapshot | Báo giá lưu snapshot đơn giá của mọi dòng chi phí. Khách hàng/SA duyệt báo giá sẽ chuyển trạng thái Quotation sang APPROVED, tự động kích hoạt giữ chỗ phụ tùng trong kho (`RESERVED`). Cho phép cập nhật chiết khấu (% hoặc tiền mặt) ở bước UC-39; Hủy báo giá (UC-41) đưa phiếu về PLANNING. | BR-QUO-01, BR-QUO-02 |
| QĐ-SA10 | Điều kiện thi công (Execution Gate) | Job chỉ được bắt đầu thi công (Start) khi Báo giá liên quan đã được APPROVED và phụ tùng đã sẵn sàng trong kho. Chỉ Complete Job sau khi đã ghi nhận phụ tùng thực tế sử dụng. | Execution Gate |
| QĐ-SA11 | Quy chuẩn nghiệm thu QC | Nếu kiểm định QC Fail, công việc không được coi là hoàn thành; hệ thống tạo Rework Job để kỹ thuật viên làm lại. Dịch vụ chỉ hoàn thành khi toàn bộ hạng mục đạt QC Pass. | QC Gate |
| QĐ-SA12 | Điều kiện gửi Billing Request | Cố vấn chỉ được gửi yêu cầu thanh toán khi 100% công việc của Work Order đã hoàn thành và đạt chuẩn QC Pass. | BR-INV-03 |
| QĐ-SA13 | Cổng bàn giao xe (Release Gate) | Cố vấn chỉ được bàn giao xe xuất xưởng khi thỏa mãn đồng thời 3 điều kiện: Toàn bộ Job Completed, Toàn bộ QC Pass và Hóa đơn đã thanh toán đầy đủ (Invoice PAID / Financial Clearance). | Release Gate |
| QĐ-SA14 | Nguyên tắc phiếu bảo hành | Work Order bảo hành phải liên kết tham chiếu tới mã Work Order cũ. Các hạng mục công việc và phụ tùng được bảo hành áp dụng đơn giá cho khách là 0 VNĐ. Nếu phát sinh các hạng mục sửa chữa ngoài diện bảo hành, phải lập Báo giá bổ sung có tính phí theo quy định. | UC-84 |

### Quản lý dịch vụ (Service Manager) – MGR

**Bảng 1-9: Yêu cầu chức năng nghiệp vụ – Quản lý dịch vụ (Service Manager)**

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| MGR-B01 | Giám sát vận hành xưởng | Tra cứu | QĐ-MGR01 | Theo dõi tổng thể hoạt động của xưởng: số lượng xe đang trong các khâu, trạng thái Work Order, tiến độ công việc và cảnh báo ách tắc. |
| MGR-B02a | Quản lý Danh mục phụ tùng | Lưu trữ/Cập nhật | QĐ-MGR03a | Thêm, sửa, xóa mềm các danh mục phụ tùng (Part Category) dùng làm Master Data phân loại kho. |
| MGR-B02b | Quản lý Phụ tùng thực tế (SKU) | Lưu trữ/Cập nhật | QĐ-MGR03b | Thêm, sửa, ngừng kinh doanh các mã phụ tùng thực tế (Inventory Item/SKU) theo từng hãng xe; hỗ trợ tự sinh mã SKU chuẩn. |
| MGR-B03 | Quản lý Nhà cung cấp | Lưu trữ/Cập nhật | QĐ-MGR04 | Lưu thông tin các nhà cung cấp phụ tùng/vật tư phục vụ nhập kho trực tiếp. |
| MGR-B04 | Nhập kho phụ tùng | Lưu trữ | QĐ-MGR05 | Ghi nhận phiếu nhập kho (Direct Goods Receipt) từ nhà cung cấp hoặc tồn đầu kỳ, tăng số lượng On-hand và ghi nhận Stock Movement. |
| MGR-B05 | Tính giá vốn bình quân di động | Tính toán | QĐ-MGR06 | Hệ thống tự động tính lại giá vốn bình quân gia quyền di động (Moving Weighted Average Cost) sau mỗi lần nhập kho. |
| MGR-B06 | Xuất kho phụ tùng cho Job | Xuất kho | QĐ-MGR07 | Thực hiện xuất phụ tùng từ kho cấp phát cho thợ thi công theo đúng Job chỉ định; giảm số lượng On-hand/Reserved. |
| MGR-B07 | Nhập trả phụ tùng thừa | Nhập trả | QĐ-MGR08 | Ghi nhận hoàn trả lại kho lượng phụ tùng đã xuất nhưng không sử dụng hết trong quá trình sửa chữa. |
| MGR-B08 | Tra cứu tồn kho & Thẻ kho | Tra cứu | QĐ-MGR09 | Xem số lượng tồn thực tế (On-hand), số lượng đang giữ chỗ (Reserved), số lượng khả dụng (Available) và lịch sử biến động thẻ kho. |
| MGR-B09 | Phê duyệt điều chỉnh tồn kho | Phê duyệt | QĐ-MGR10 | Phê duyệt phiếu điều chỉnh kiểm kê kho khi phát sinh chênh lệch thực tế. |
| MGR-B10 | Kiểm tra & Đóng phiếu công việc | Kiểm tra/Xử lý | QĐ-MGR11 | Kiểm tra toàn bộ điều kiện Closure Gate, thực hiện Đóng hồ sơ Work Order vĩnh viễn và đồng bộ lịch sử dịch vụ. |
| MGR-B11 | Xem báo cáo vận hành tổng hợp | Tra cứu | QĐ-MGR12 | Xem thống kê số lượng dịch vụ theo nhóm, biểu đồ doanh thu theo khoảng thời gian và giá trị tồn kho hiện hữu. |
| MGR-B12 | Phê duyệt bảo hành thiện chí | Phê duyệt | QĐ-MGR12b | Xem xét và phê duyệt hoặc từ chối các yêu cầu bảo hành thiện chí (Goodwill Warranty) đối với trường hợp hết hạn bảo hành hoặc ngoài phạm vi cam kết. |
| MGR-B13 | Báo cáo phân tích bảo hành nội bộ | Tra cứu/Bảo mật | QĐ-MGR13 | Theo dõi báo cáo tài chính và kỹ thuật bảo mật về hoạt động bảo hành: tỷ lệ xe bảo hành, chi phí vốn thiệt hại (tính theo giá vốn bình quân di động), top linh kiện hư hỏng nhiều nhất và thông tin nhà cung cấp bồi hoàn. |

**Bảng 1-10: Quy định/công thức – Quản lý dịch vụ (Service Manager)**

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-MGR01 | Dashboard vận hành | Bảng điều hành hiển thị số liệu tổng hợp của toàn xưởng; cập nhật trạng thái các Work Order, Service và Job đang chạy. |  |
| QĐ-MGR02 | Quản lý SKU phụ tùng | Mỗi phụ tùng thực tế có một mã SKU duy nhất trong hệ thống, thuộc một Category và gắn đơn vị tính cơ sở (UoM). |  |
| QĐ-MGR03 | Nhà cung cấp | Quản lý thông tin đối tác cung ứng phục vụ nhập hàng trực tiếp; lưu tên, mã số thuế, số điện thoại và địa chỉ. |  |
| QĐ-MGR04 | Phiếu nhập kho trực tiếp | Phiếu nhập kho phải lưu nhà cung cấp, ngày nhập, danh sách phụ tùng, số lượng nhập và đơn giá mua thực tế; tạo Stock Movement tăng tồn. |  |
| QĐ-MGR05 | Tính giá vốn bình quân | Giá vốn mới được tự động tính toán theo công thức bình quân gia quyền di động; giá vốn mới không làm ảnh hưởng đến giá bán đã chốt trên báo giá quá khứ. | CT-INV01 |
| QĐ-MGR06 | Quy tắc xuất kho cho Job | Nghiêm cấm xuất kho vượt quá số lượng tồn thực tế (On-hand). Mọi giao dịch xuất kho đều lưu lại giá vốn tại thời điểm xuất. | CT-INV02 |
| QĐ-MGR07 | Quy tắc nhập trả phụ tùng | Số lượng phụ tùng trả về kho không được vượt quá số lượng đã xuất trừ đi số lượng thực dùng; nhập lại kho theo giá vốn của lần xuất tương ứng. |  |
| QĐ-MGR08 | Tính toàn vẹn số liệu kho | Không cho phép sửa đổi trực tiếp con số tồn kho trên cơ sở dữ liệu. Mọi thay đổi tồn kho bắt buộc phải sinh ra bản ghi Stock Movement tương ứng. |  |
| QĐ-MGR09 | Kiểm soát điều chỉnh kho | Phiếu điều chỉnh tồn kho phải lưu rõ lý do điều chỉnh (hư hỏng, thất thoát, thừa thiếu kiểm kê) và danh tính người duyệt. |  |
| QĐ-MGR10 | Cổng đóng hồ sơ (Closure Gate) | Chỉ được phép Close Work Order khi thỏa mãn: Xe đã bàn giao xuất xưởng (RELEASED), không còn Job hoặc Rework nào đang mở, và Hóa đơn ở trạng thái PAID. Hồ sơ đã CLOSED bị khóa bất biến vĩnh viễn. | Closure Gate |
| QĐ-MGR11 | Báo cáo vận hành | Báo cáo doanh thu và dịch vụ hỗ trợ lọc linh hoạt theo khoảng thời gian tùy chọn (Từ ngày – Đến ngày). |  |
| QĐ-MGR12 | Phê duyệt bảo hành thiện chí | Quản lý dịch vụ xem xét giải trình từ Cố vấn; bắt buộc nhập lý do phê duyệt hoặc từ chối vào hồ sơ trước khi xác nhận. Phê duyệt thành công sẽ cho phép tạo Work Order bảo hành 0đ; Từ chối sẽ chuyển phương án sang sửa chữa có thu phí. | UC-86 |
| QĐ-MGR13 | Bảo mật báo cáo bảo hành | Báo cáo bảo hành là tài liệu mật của ban quản lý xưởng, chỉ tài khoản Quản lý dịch vụ hoặc Quản trị viên hệ thống mới có quyền truy cập. Chi phí vốn phụ tùng bảo hành được tính toán theo giá vốn bình quân di động tại thời điểm xuất kho. | UC-87 |

### Quản trị viên (Administrator) – ADM

_Bảng 1-11: Yêu cầu chức năng nghiệp vụ – Quản trị viên (Administrator)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| ADM-B01 | Quản lý Người dùng & Phân quyền | Lưu trữ/Cập nhật | QĐ-ADM01 | Tạo mới tài khoản nhân viên, gán vai trò (Roles), kích hoạt/khóa tài khoản và đặt lại mật khẩu tạm thời cho nhân viên nội bộ. |
| ADM-B02 | Quản lý Hồ sơ Nhân sự | Lưu trữ/Cập nhật | QĐ-ADM02 | Quản lý hồ sơ nhân viên kỹ thuật (Kỹ thuật viên gầm/máy, điện/điều hòa, đồng/sơn, thợ chăm sóc xe, kiểm định viên QC) và kỹ năng chuyên môn. |
| ADM-B03 | Quản lý Dịch vụ & Danh mục dịch vụ | Lưu trữ/Cập nhật | QĐ-ADM03 | Quản lý danh mục nhóm dịch vụ (Service Category) và các gói dịch vụ chuẩn (Service Template). |
| ADM-B04 | Quản lý Loại công việc (Job Type) | Lưu trữ/Cập nhật | QĐ-ADM04 | Khai báo các loại công việc kỹ thuật, mẫu công việc mặc định và đơn giá giờ công tiêu chuẩn (Hourly Labour Rate). |
| ADM-B05 | Cấu hình Chính sách giá | Lưu trữ/Cập nhật | QĐ-ADM05 | Thiết lập bảng giá cố định, bảng giá theo phân khúc kích cỡ xe và cấu hình hệ thống Zero-Tax. |
| ADM-B06 | Quản lý Tiêu chí kiểm định (QC) | Lưu trữ/Cập nhật | QĐ-ADM06 | Thiết lập các checklist tiêu chí kiểm tra chẩn đoán (Inspection Checklist) và tiêu chí nghiệm thu chất lượng (QC Checklist) theo từng nhóm dịch vụ. |
| ADM-B07 | Quản lý Danh mục dùng chung | Lưu trữ/Cập nhật | QĐ-ADM07 | Quản lý danh mục các đơn vị tính (UoM), thương hiệu phụ tùng, nhóm kích cỡ xe và các danh mục tra cứu toàn hệ thống. |

_Bảng 1-12: Quy định/công thức – Quản trị viên (Administrator)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-ADM01 | Quản lý phiên & RBAC | Kiểm tra phân quyền đa tầng ở cả Middleware Backend (API Guards) và tầng giao diện Frontend (Component Guards); mật khẩu nhân viên được đặt lại tạm thời và kích hoạt đổi mật khẩu trong lần đăng nhập đầu. |  |
| QĐ-ADM02 | Phân định Nhân sự | Bản ghi Employee liên kết 1-1 với tài khoản User nếu nhân sự đó trực tiếp sử dụng phần mềm; lưu trữ hồ sơ bằng cấp, kỹ năng và lịch trực. |  |
| QĐ-ADM03 | Tính bất biến của Template | Chỉ Service Template ở trạng thái Active mới được chọn để thêm vào Work Order; Work Order Service lưu dữ liệu snapshot của template để đảm bảo lịch sử không bị biến động khi template thay đổi. |  |
| QĐ-ADM04 | Đơn giá giờ công lao động | Mỗi Job Type sở hữu một mức đơn giá giờ công niêm yết (Hourly Rate); mức giá này được dùng làm căn cứ tính tiền công trong Báo giá. | CT-PRICE01 |
| QĐ-ADM05 | Tuân thủ chính sách thuế Zero-Tax | Toàn bộ các gói dịch vụ và bảng giá cấu hình trong hệ thống bắt buộc tuân thủ quy chế thuế suất GTGT $r_{vat} = 0\%$. | Zero-Tax |
| QĐ-ADM06 | Danh mục kiểm định QC | Tiêu chí nghiệm thu được phân loại theo hạng mục bắt buộc (Mandatory) hoặc tùy chọn; thứ tự hiển thị được sắp xếp trực quan. |  |
| QĐ-ADM07 | Bảo vệ toàn vẹn Master Data | Tuyệt đối không xóa vật lý các bản ghi danh mục đã phát sinh liên kết trong giao dịch thực tế; chuyển sang trạng thái Ngừng hoạt động (Inactive). |  |

### Hệ thống tự động (System / Background Job) – SYS

_Bảng 1-12b: Yêu cầu chức năng nghiệp vụ – Hệ thống tự động (System / Background Job)_

| **Mã** | **Công việc** | **Loại** | **Rule** | **Mô tả** |
| --- | --- | --- | --- | --- |
| SYS-B01 | Gửi email nhắc hẹn tự động | Tự động hóa | QĐ-SYS01 | Tiến trình nền (Cron Job) định kỳ quét các lịch hẹn sắp diễn ra trong vòng 24 giờ tới và gửi email nhắc nhở tự động cho khách hàng. |

_Bảng 1-12c: Quy định/công thức – Hệ thống tự động (System / Background Job)_

| **Mã** | **Tên quy định** | **Mô tả chi tiết** | **Ghi chú** |
| --- | --- | --- | --- |
| QĐ-SYS01 | Chu kỳ quét nhắc hẹn | Hệ thống tự động kích hoạt tiến trình nền theo chu kỳ mỗi giờ một lần; tìm kiếm các lịch hẹn ở trạng thái REQUESTED, CONFIRMED hoặc RESCHEDULED diễn ra trong khoảng thời gian từ 23.5 giờ đến 24.5 giờ tới; tạo nội dung email cá nhân hóa và gửi qua cổng SMTP; ghi nhận log gửi tin. | UC-79 |

#### 1.2.1.2. Công thức tính giá và tồn kho

---

> [!IMPORTANT]
> **TUYÊN BỐ QUY CHẾ TÀI CHÍNH CỐT LÕI (ZERO-TAX POLICY):**  
> Dịch vụ và phụ tùng của Trung tâm hiện tại **HOÀN TOÀN KHÔNG CHỊU BẤT KỲ THỨ THUẾ NÀO** (Thuế suất GTGT $r_{vat} = 0\%$, Tiền thuế phát sinh $Tax = 0$ VNĐ).  
> Do đó, toàn bộ công thức tính toán tại mọi phân hệ (Báo giá, Hóa đơn, Quyết toán tài chính) áp dụng nguyên tắc tối giản:  
> $$\mathbf{GrandTotal\ (Tổng\ thanh\ toán) = Subtotal\ (Tổng\ trước\ giảm) - Discount\ (Chiết\ khấu)}$$  
> $$\mathbf{InvoiceAmount\ (Tiền\ hóa\ đơn) = ApprovedChargeableLines - Discount}$$

---

### Bảng công thức tính toán chi tiết

| Mã công thức | Tên công thức | Biểu thức toán học | Diễn giải nghiệp vụ |
| --- | --- | --- | --- |
| **CT-PRICE01** | Tiền nhân công (Labour Amount) | $\text{Labour Amount} = \text{Billable Hours} \times \text{Hourly Rate}$ | Hourly Rate lấy theo Job Type của công việc; Billable Hours là số giờ định mức đã được phê duyệt. |
| **CT-PRICE02** | Tổng chi phí Sửa chữa (Repair Total) | $\text{Repair Total} = \sum \text{Labour} + \sum \text{Parts} + \sum \text{Materials} + \text{Approved Fees}$ | Áp dụng cho các Job sửa chữa phát sinh từ chẩn đoán Finding hoặc bổ sung kỹ thuật. |
| **CT-PRICE03** | Tổng chi phí Bảo dưỡng (Maintenance Total) | $\text{Maintenance Total} = P_{package} + \sum \text{Extra Labour} + \sum \text{Extra Parts}$ | Gói bảo dưỡng đã bao gồm các công việc và phụ tùng tiêu chuẩn (đơn giá 0đ); chỉ cộng thêm các hạng mục phát sinh ngoài gói. |
| **CT-PRICE04** | Tổng chi phí Chăm sóc xe (Car Care Total) | $\text{Car Care Total} = P_{vehicle\_size} + \sum \text{Add-ons}$ | Giá dịch vụ rửa xe/detailing tra cứu tự động theo phân khúc kích cỡ xe (`vehicle_size`) cộng thêm các dịch vụ làm thêm. |
| **CT-PRICE05** | Tổng thanh toán báo giá (Grand Total) | $\mathbf{GrandTotal = Subtotal - Discount}$ | **Zero-Tax:** Tuyệt đối không cộng thêm thuế. Subtotal là tổng các hạng mục đã duyệt; Discount là chiết khấu theo % hoặc số tiền cụ thể do SA áp dụng tại UC-39. |
| **CT-INV01** | Giá vốn bình quân di động (Moving Average Cost) | $\bar{C}_{new} = \frac{Q_{old} \times \bar{C}_{old} + Q_{receipt} \times P_{purchase}}{Q_{old} + Q_{receipt}}$ | Tự động tính toán lại giá vốn bình quân gia quyền của mã phụ tùng ngay sau mỗi lần Nhập kho trực tiếp (Direct Goods Receipt). |
| **CT-INV02** | Cân bằng tồn kho (Inventory Balance) | $\text{On-hand} = \text{Opening} + \text{Receipt} + \text{Return} - \text{Issue}$ | Không cho phép xuất kho khi On-hand < Số lượng yêu cầu; mọi biến động đều phát sinh bản ghi Stock Movement. |
| **CT-BILL01** | Tổng giá trị hóa đơn (Invoice Amount) | $\mathbf{InvoiceAmount = ApprovedChargeableLines - Discount}$ | **Zero-Tax:** Tổng các dòng phí được Cố vấn chuyển sang trừ đi giá trị chiết khấu đã được duyệt trên báo giá. |
| **CT-BILL02** | Số tiền còn phải trả (Amount Due) | $\text{Amount Due} = \text{Invoice Total} - \text{Valid Payments}$ | Khách hàng thanh toán một lần hoặc qua cổng VietQR; khi Valid Payments = Invoice Total thì Amount Due = 0 VNĐ và hóa đơn chuyển sang PAID. |
| **CT-WAR01** | Quyết toán hóa đơn bảo hành (Warranty Invoice) | $\mathbf{WarrantyInvoiceAmount = 0\ VNĐ}$ | Đối với phiếu công việc bảo hành, hóa đơn phát hành cho khách hàng có giá trị đúng 0 VNĐ; tự động kích hoạt Financial Clearance. |
| **CT-WAR02** | Chi phí vốn bảo hành nội bộ (Warranty COGS) | $\text{Warranty Cost} = \sum (Q_{issued} \times \bar{C}_{at\_issue})$ | Dùng riêng cho Báo cáo quản trị của Quản lý dịch vụ (UC-87): phản ánh tổng thiệt hại giá vốn phụ tùng đã xuất phục vụ bảo hành. |

### Chi tiết 3 Mô hình định giá dịch vụ (`pricing_type`)

Hệ thống hỗ trợ 3 mô hình định giá linh hoạt trong cấu trúc bảng `services`:
1. **Mô hình Gói cố định (`FIXED`):** Áp dụng cho các gói dịch vụ bảo dưỡng định kỳ trọn gói (5.000km, 10.000km, 20.000km, 40.000km...). Dịch vụ có một mức giá niêm yết tổng $P_{fixed}$. Các công việc kiểm tra và phụ tùng tiêu chuẩn thuộc gói có đơn giá hiển thị là 0 VNĐ. Nếu khách yêu cầu làm thêm hạng mục ngoài gói, chi phí cộng dồn vào tổng tiền dịch vụ.
2. **Mô hình Theo kích cỡ xe (`BY_VEHICLE_SIZE`):** Áp dụng cho các dịch vụ chăm sóc xe, đánh bóng, phủ ceramic, dán phim cách nhiệt, rửa xe công nghệ cao. Hệ thống tự động tra cứu bảng giá `vehicle_size_prices` dựa trên trường `vehicle.vehicle_size` của xe (Sedan/Hatchback, SUV/CUV, MPV/Bán tải) để lấy đơn giá gói chuẩn, sau đó cộng thêm các phụ phí tùy chọn (Add-ons).
3. **Mô hình Nhân công & Phụ tùng (`LABOUR_AND_PARTS`):** Áp dụng cho các công việc sửa chữa chung, khắc phục hư hỏng phát hiện trong quá trình chẩn đoán (Finding). Tổng tiền bằng tổng chi phí các dòng nhân công (Billable Hours × Hourly Rate theo Job Type) cộng với tổng chi phí các dòng phụ tùng/vật tư thay thế (Planned Qty × Snapshot Unit Price).

### Nguyên tắc đóng băng đơn giá Snapshot (Price Snapshot Rule - BR-QUO-01)

Khi Cố vấn dịch vụ gửi báo giá hoặc ghi nhận duyệt báo giá (`Quotation` ở trạng thái APPROVED), hệ thống tiến hành sao chép và khóa cứng **đơn giá đóng băng (`snapshot_unit_price`)** vào từng dòng chi tiết `quotation_lines`. Nếu sau này Quản trị viên hoặc Quản lý thay đổi bảng giá niêm yết trong Master Data hoặc giá nhập kho thay đổi, toàn bộ báo giá và hóa đơn trong quá khứ **tuyệt đối không bị thay đổi số liệu**, bảo toàn nguyên vẹn tính pháp lý và cam kết với khách hàng.

#### 1.2.1.3. Yêu cầu chức năng hệ thống

_Bảng 1-13: Yêu cầu chức năng hệ thống_

| **ID** | **Phân hệ** | **Yêu cầu chức năng** | **Mức ưu tiên** |
| --- | --- | --- | --- |
| FR-01 | Identity & Access | Đăng ký, đăng nhập, đăng xuất, tự khôi phục mật khẩu qua OTP email cho Khách hàng; cấp lại mật khẩu tạm thời cho nhân viên; phân quyền RBAC đa tầng. | Must |
| FR-02 | Public Website | Cung cấp cổng thông tin công khai: trang chủ, danh mục dịch vụ, bảng giá tham khảo và câu hỏi thường gặp (FAQ) cho Khách vãng lai. | Must |
| FR-03 | Customer & Vehicle | Quản lý tập trung hồ sơ khách hàng, thông tin phương tiện, kiểm tra trùng lặp biển số và kiểm soát quyền sở hữu dữ liệu. | Must |
| FR-04 | Appointment & Intake | Hỗ trợ đặt lịch hẹn trực tuyến, quản lý lịch hẹn (Confirm, Reschedule, Cancel), tiếp nhận xe vãng lai/cứu hộ và điều phối hàng đợi Intake Queue. | Must |
| FR-05 | Work Order Core | Quản lý hồ sơ trung tâm Work Order theo máy trạng thái hữu hạn 10 bước khép kín; liên kết đồng bộ các thực thể vệ tinh. | Must |
| FR-06 | Check-in & Evidence | Biên bản tiếp nhận xe: ghi nhận số km ODO, mức nhiên liệu, phản ánh hư hỏng, tư trang để lại và bộ ảnh minh chứng hiện trạng xung quanh xe. | Must |
| FR-07 | Inspection & Finding | Khám xe trực quan trên sơ đồ 2D mô phỏng, chọn loại marker hư hỏng và nhấp vị trí để tạo Finding kèm ảnh chụp thực tế. | Must |
| FR-08 | Service & Job | Lập kế hoạch dịch vụ và đầu công việc: tạo từ Finding, sinh từ Template dịch vụ hoặc thêm thủ công; gán kỹ thuật viên thi công. | Must |
| FR-09 | Job–Part Traceability | Khai báo định mức phụ tùng dự kiến theo từng Job; kiểm tra tồn kho, giữ chỗ kho và truy vết phụ tùng thực tế sử dụng. | Must |
| FR-10 | Pricing Engine | Công cụ tính giá tự động hỗ trợ 3 mô hình (`FIXED`, `BY_VEHICLE_SIZE`, `LABOUR_AND_PARTS`), áp dụng chính sách Zero-Tax ($Tax = 0$ VNĐ). | Must |
| FR-11 | Quotation Lifecycle | Tạo báo giá ban đầu (UC-37), Xem báo giá (UC-38), Cập nhật báo giá & chiết khấu (UC-39), Duyệt báo giá & đóng băng snapshot & giữ chỗ kho (UC-40), Hủy báo giá nháp (UC-41). | Must |
| FR-12 | Inventory Management | Quản lý Master Data danh mục phụ tùng và mã SKU thực tế; nhập kho trực tiếp; tính giá vốn bình quân di động; xuất kho cho Job và hoàn trả thừa. | Must |
| FR-13 | Job Execution | Bắt đầu thi công (Start Job), cập nhật kết quả thi công, xác nhận phụ tùng thực dùng và hoàn thành công việc (Complete Job). | Must |
| FR-14 | QC & Rework | Nghiệm thu chất lượng theo checklist: Pass chuyển sang thanh toán; Fail tự động khởi tạo Rework Job để kỹ thuật viên làm lại. | Must |
| FR-15 | Billing & Payment | Tiếp nhận Billing Request, lập và phát hành hóa đơn Zero-Tax; hỗ trợ thanh toán tiền mặt/chuyển khoản và mã VietQR; tự động xác nhận Financial Clearance. | Must |
| FR-16 | Release & Closure | Kiểm tra Release Gate, lập biên bản bàn giao xe xuất xưởng; kiểm tra Closure Gate và Đóng hồ sơ Work Order vĩnh viễn. | Must |
| FR-17 | Digital History & PDF | Quản lý Sổ bảo dưỡng điện tử 4 phần; xem lịch sử sửa chữa; trích xuất và tải xuống Biên bản bàn giao xe và Hóa đơn VAT dạng PDF (UC-80). | Must |
| FR-18 | Background Automation | Dịch vụ nền (Cron Job) tự động quét lịch hẹn định kỳ mỗi giờ và gửi email nhắc hẹn trước 24 giờ cho khách hàng (UC-79). | Must |
| FR-19 | Warranty Management | Phân hệ quản lý bảo hành khép kín: Tra cứu hạn bảo hành (UC-81), Đặt lịch bảo hành (UC-82), Tiếp nhận bảo hành (UC-83), Lập Work Order bảo hành 0đ (UC-84), Hóa đơn bảo hành 0đ (UC-85), Phê duyệt bảo hành thiện chí (UC-86) và Báo cáo quản trị chi phí vốn bảo hành (UC-87). | Must |
| FR-20 | Operational Dashboard | Bảng điều hành xưởng tổng quan và báo cáo thống kê doanh thu, dịch vụ, tồn kho theo khoảng thời gian tùy chọn. | Should |

### 1.2.2. Yêu cầu phi chức năng

_Bảng 1-14: Yêu cầu chất lượng hệ thống_

| **ID** | **Thuộc tính** | **Nội dung yêu cầu chi tiết** | **Phân loại** |
| --- | --- | --- | --- |
| NFR-01 | Tính tiện dụng (Usability) | Giao diện Customer Portal sử dụng ngôn ngữ trạng thái thân thiện, dễ hiểu, có timeline trực quan; giao diện Staff tối ưu hóa thao tác nghiệp vụ, form nhập liệu có validation tức thời và thông báo lỗi rõ ràng. | Người dùng |
| NFR-02 | Khả năng đáp ứng (Responsive) | Hệ thống vận hành tương thích hoàn hảo trên các trình duyệt hiện đại (Chrome, Edge, Safari); màn hình Check-in và Nghiệm thu QC hỗ trợ tối ưu cho máy tính bảng (Tablet) cầm tay tại xưởng. | Người dùng |
| NFR-03 | Bảo mật (Security) | Mật khẩu người dùng được băm an toàn bằng thuật toán bcrypt; phân quyền RBAC chặt chẽ ở cả API và giao diện; ẩn tuyệt đối giá vốn và ghi chú nội bộ đối với Khách hàng; phân quyền nghiêm ngặt Báo cáo bảo hành nội bộ (chỉ Manager/Admin). | Kỹ thuật |
| NFR-04 | Toàn vẹn dữ liệu (Data Integrity) | Sử dụng Database Transactions cho các chuỗi thao tác phức tạp: Duyệt báo giá & Giữ chỗ kho, Xuất/Nhập trả kho phụ tùng, Thanh toán hóa đơn & Financial Clearance, và Đóng hồ sơ Work Order. | Kỹ thuật |
| NFR-05 | Khả năng truy vết (Traceability) | Đảm bảo tính liên kết xuyên suốt của chuỗi dữ liệu cốt lõi: Finding → Job → Part → QC Inspection → Quotation → Invoice → Vehicle Release → Service History & Warranty. | Nghiệp vụ |
| NFR-06 | Hiệu năng hệ thống (Performance) | Các bảng dữ liệu danh sách hỗ trợ phân trang (Pagination), tìm kiếm và lọc chỉ mục; thời gian phản hồi trung bình của các API thao tác nghiệp vụ dưới 2.5 giây trong môi trường demo. | Kỹ thuật |
| NFR-07 | Khả năng bảo trì (Maintainability) | Mã nguồn được tổ chức theo kiến trúc module hóa rõ ràng (Identity, Appointment, Work Order, Inventory, Pricing, QC, Billing, Warranty); tách bạch giữa tầng điều khiển (Controller), xử lý nghiệp vụ (Service) và truy cập dữ liệu (Repository/Prisma). | Kỹ thuật |
| NFR-08 | Độ tin cậy & Kiểm thử (Reliability) | Các quy tắc tính giá (Zero-Tax, Pricing Models), cân bằng kho phụ tùng không âm (On-hand ≥ 0), và các cổng logic (Release Gate, Closure Gate) được bao phủ bởi các bài kiểm thử tự động (Unit/API Tests). | Kỹ thuật |
| NFR-09 | Khả năng triển khai (Deployability) | Hệ thống có khả năng đóng gói và triển khai dễ dàng thông qua container Docker hoặc môi trường Node.js/MySQL chuẩn hóa, cấu hình thông qua biến môi trường (.env). | Kỹ thuật |

## 1.3. Quy trình tác nghiệp

Hệ thống quản lý toàn bộ chu trình dịch vụ thông qua **vòng đời 10 trạng thái chuẩn hóa** của Phiếu công việc (`enum WorkOrderStatus`):
$$\text{DRAFT} \rightarrow \text{IN\_PLANNING} \rightarrow \text{PENDING\_APPROVAL} \rightarrow \text{APPROVED} \rightarrow \text{IN\_PROGRESS} \rightarrow \text{BILLING\_REQUESTED} \rightarrow \text{FINANCIAL\_CLEARED} \rightarrow \text{RELEASED} \rightarrow \text{CLOSED}$$
*(Đi kèm trạng thái ngoại lệ \textbf{CANCELLED} khi hủy phiếu trước khi xuất kho).*

### 1.3.1. Appointment và Intake

Khách hàng truy cập Customer Portal, lựa chọn phương tiện, dịch vụ mong muốn và thời gian hẹn để tạo lịch hẹn (`REQUESTED`). Nhân viên quầy gọi điện xác nhận lịch hẹn (`CONFIRMED`). Khi khách đưa xe đến xưởng, nhân viên quầy đánh dấu `Mark Arrived`. Đối với khách vãng lai (Walk-in) hoặc xe cứu hộ (Tow-in), nhân viên quầy tạo hồ sơ tiếp nhận trực tiếp và đưa xe vào hàng đợi **Intake Queue**.

### 1.3.2. Work Order và Check-in

Cố vấn dịch vụ tiếp nhận hồ sơ từ Intake Queue và tạo Phiếu công việc ở trạng thái **DRAFT**. Cố vấn tiến hành kiểm tra xe ban đầu: ghi số ODO, đo mức xăng, ghi nhận yêu cầu của khách, kiểm kê tư trang và chụp ảnh hiện trạng ngoại quan xung quanh xe. Khách hàng xem lại biên bản Check-in và xác nhận. Khi thỏa mãn **Check-in Gate** (có ODO và mức nhiên liệu), Work Order tự động chuyển sang **IN_PLANNING**.

### 1.3.3. Inspection, Finding và Job

Xe được đưa lên cầu nâng chẩn đoán. Cố vấn dịch vụ mở giao diện kiểm tra xe trực quan 2D, chọn loại khuyết tật và nhấp chuột trực tiếp lên sơ đồ xe để đánh dấu các điểm hư hỏng, hệ thống tự động sinh các bản ghi **Finding** đính kèm hình ảnh. Cố vấn mở modal điều phối công việc để ánh xạ Finding thành các **Job** sửa chữa, kết hợp thêm các Job từ Service Template hoặc tạo thủ công. Một Finding có thể liên kết nhiều Job, và một Job có thể xử lý nhiều Finding.

### 1.3.4. Job và Part

Cố vấn dịch vụ khai báo các dòng nhân công (Labour Line) kèm kỹ thuật viên phụ trách, đồng thời khai báo danh mục phụ tùng/vật tư dự kiến cần dùng (JobPart) cho từng Job. Hệ thống kiểm tra số lượng tồn kho khả dụng để chuẩn bị vật tư.

### 1.3.5. Báo giá (Quotation) và Phê duyệt

Cố vấn dịch vụ khởi tạo Báo giá (**UC-37**), hệ thống tính toán chi phí theo đúng mô hình định giá dịch vụ và áp dụng quy chế **Zero-Tax**. Cố vấn có thể thực hiện **Cập nhật báo giá (UC-39)** để áp dụng chiết khấu (% hoặc số tiền cụ thể), ghi rõ lý do giảm giá, ghi chú và điều chỉnh các dòng chi phí dự thảo.

Khi báo giá hoàn chỉnh, Cố vấn gửi báo giá cho khách, Work Order chuyển sang **PENDING_APPROVAL**. Cố vấn hoặc Khách hàng thực hiện **Duyệt báo giá (UC-40)**:
- Nếu khách đồng ý: Hệ thống chuyển trạng thái báo giá sang `APPROVED`, **đóng băng đơn giá snapshot** (`snapshot_unit_price`), tự động chuyển toàn bộ phụ tùng trong báo giá sang trạng thái giữ chỗ kho (**RESERVED**), và Work Order chuyển sang **APPROVED**.
- Nếu khách từ chối sửa: Cố vấn ghi nhận Reject và có thể làm thủ tục xuất trả xe sớm hoặc điều chỉnh lại phương án kỹ thuật.
- Nếu phát hiện sai sót trước khi duyệt: Cố vấn có thể **Hủy báo giá (UC-41)** để đưa phiếu công việc quay lại trạng thái `IN_PLANNING`.

### 1.3.6. Job Execution

Khi Work Order đạt trạng thái **APPROVED** và phụ tùng đã được giữ chỗ đầy đủ trong kho, Cố vấn bàn giao lệnh sản xuất cho xưởng. Thủ kho xuất phụ tùng thực tế (`ISSUED`). Kỹ thuật viên bắt đầu thực hiện công việc (Start Job), Work Order chuyển sang **IN_PROGRESS**. Sau khi hoàn tất thao tác sửa chữa, kỹ thuật viên ghi nhận số lượng phụ tùng thực tế sử dụng và bấm hoàn thành công việc (Complete Job).

### 1.3.7. QC và Rework

Sau khi các Job thi công xong, Cố vấn hoặc Kiểm định viên tiến hành kiểm tra nghiệm thu chất lượng theo Checklist tiêu chuẩn:
- Nếu tất cả tiêu chí đạt: Xác nhận **QC Pass**.
- Nếu có hạng mục không đạt: Xác nhận **QC Fail**, hệ thống tự động tạo **Rework Job** để kỹ thuật viên làm lại. Work Order vẫn giữ trạng thái `IN_PROGRESS` cho đến khi vòng lặp Rework được khắc phục và kiểm định lại đạt QC Pass.

### 1.3.8. Invoice và Payment

Khi 100% công việc đã hoàn thành và đạt chuẩn QC Pass, Cố vấn dịch vụ gửi yêu cầu thanh toán (Billing Request), Work Order chuyển sang trạng thái **BILLING_REQUESTED**.

Nhân viên quầy dịch vụ tiếp nhận yêu cầu, kiểm tra các dòng chi phí đã được duyệt, tạo hóa đơn tạm (Draft Invoice) và phát hành hóa đơn chính thức (Issued Invoice) theo nguyên tắc Zero-Tax ($GrandTotal = Subtotal - Discount$). Khách hàng thanh toán qua quầy bằng tiền mặt/chuyển khoản hoặc quét mã VietQR. Khi số tiền thanh toán đủ 100% (Amount Due = 0 VNĐ), hóa đơn chuyển sang `PAID`, hệ thống tự động kích hoạt **Financial Clearance** và chuyển Work Order sang trạng thái **FINANCIAL_CLEARED**.

### 1.3.9. Release và Closure

Khi Work Order đạt trạng thái `FINANCIAL_CLEARED`, cổng bàn giao xe được mở. Cố vấn dịch vụ kiểm tra **Release Gate** (Job Done, QC Pass, Invoice Paid), tiến hành đối chiếu tư trang, cùng khách hàng ký biên bản bàn giao xe (`VehicleRelease`) và chuyển trạng thái Work Order sang **RELEASED** để xe chính thức rời khỏi xưởng.

Cuối ngày hoặc sau khi hoàn tất thủ tục bàn giao, Quản lý dịch vụ kiểm tra **Closure Gate**, đóng hồ sơ Work Order sang **CLOSED**. Dữ liệu hồ sơ bị khóa bất biến vĩnh viễn và tự động đồng bộ vào **Sổ bảo dưỡng điện tử (Service History)** của phương tiện.

### 1.3.10. Quy trình Quản lý Bảo hành

Phân hệ Quản lý Bảo hành được thiết kế khép kín nhằm xử lý các trường hợp phương tiện hoặc phụ tùng gặp sự cố sau khi đã xuất xưởng:
1. **Tra cứu & Đặt hẹn bảo hành:** Khách hàng (hoặc nhân viên) tra cứu thông tin bảo hành của xe (**UC-81**), hệ thống hiển thị danh sách phụ tùng/dịch vụ còn hạn bảo hành (số ngày và số km ODO còn lại). Khách hàng chủ động tạo lịch hẹn bảo hành trực tuyến (**UC-82**).
2. **Tiếp nhận bảo hành tại quầy:** Khi xe đến xưởng, nhân viên quầy tiếp nhận (**UC-83**), ghi nhận số km ODO thực tế. Hệ thống đối chiếu số km và thời hạn với phiếu dịch vụ gốc. Nếu đủ điều kiện, hồ sơ được đưa vào Intake Queue diện bảo hành.
3. **Lập Phiếu công việc bảo hành:** Cố vấn dịch vụ tạo Work Order bảo hành (**UC-84**) có mã liên kết với Work Order cũ, thẩm định lỗi kỹ thuật, gắn cờ bảo hành cho các công việc và phụ tùng thay thế. Hệ thống tự động áp dụng chính sách **miễn phí 100% (đơn giá 0 VNĐ)**, tạo Báo giá 0 VNĐ và điều phối xưởng thi công.
4. **Phê duyệt bảo hành thiện chí (Goodwill Warranty):** Đối với trường hợp xe hoặc phụ tùng đã quá hạn bảo hành tiêu chuẩn nhưng xưởng quyết định hỗ trợ vì lý do chăm sóc khách hàng đặc biệt, Cố vấn gửi yêu cầu lên Quản lý dịch vụ. Quản lý xem xét, nhập lý do giải trình bắt buộc và xác nhận Phê duyệt hoặc Từ chối (**UC-86**).
5. **Nghiệm thu QC & Quyết toán hóa đơn 0đ:** Sau khi kỹ thuật viên hoàn thành thay thế phụ tùng bảo hành và kiểm định QC Pass, nhân viên quầy lập và phát hành hóa đơn bảo hành 0 VNĐ (**UC-85**). Hệ thống tự động chuyển hóa đơn sang PAID và tự động cấp quyền Financial Clearance cho Work Order.
6. **Bàn giao xe & Báo cáo quản trị:** Cố vấn bàn giao xe cho khách hàng xuất xưởng. Định kỳ, Quản lý dịch vụ truy cập Báo cáo bảo hành nội bộ (**UC-87**) để theo dõi tỷ lệ xe bảo hành, tổng chi phí vốn phụ tùng thiệt hại (tính theo giá vốn bình quân di động) và danh sách phụ tùng lỗi lặp lại để tiến hành thủ tục đòi bồi hoàn từ nhà cung cấp.

# CHƯƠNG 2: MÔ HÌNH HÓA YÊU CẦU

## 2.1. Nhận diện tác nhân và phạm vi chức năng

_Bảng 2-0: Danh sách actor và workspace tương ứng_

| **Actor (Tác nhân)** | **Không gian làm việc (Workspace)** | **Phạm vi chức năng cốt lõi** |
| --- | --- | --- |
| Khách vãng lai (Guest) | Public Website | Xem trang chủ, danh mục dịch vụ, bảng giá tham khảo, câu hỏi thường gặp (FAQ); Đăng ký tài khoản; Đăng nhập hệ thống. |
| Khách hàng (Customer) | Customer Portal | Quản lý hồ sơ cá nhân, phương tiện; Đặt, xem, dời, hủy lịch hẹn; Xác nhận Check-in; Theo dõi tiến độ sửa chữa; Xem và duyệt báo giá; Xem hóa đơn; Tra cứu thông tin bảo hành; Đặt lịch bảo hành; Tra cứu Sổ bảo dưỡng điện tử, lịch sử sửa chữa và tải chứng từ PDF. |
| Nhân viên quầy (Front Desk Staff) | Front Desk Workspace | Quản lý lịch hẹn; Tiếp nhận xe vào xưởng (Arrived, Walk-in, Tow-in); Quản lý hồ sơ khách hàng và xe; Xem tổng quan phiếu công việc; Lập và phát hành hóa đơn (thương mại và bảo hành 0đ); Ghi nhận thanh toán và mở Financial Clearance; Tiếp nhận xe bảo hành. |
| Cố vấn dịch vụ (Service Advisor) | Advisor Workspace | Tiếp nhận xe từ Intake Queue; Tạo Work Order; Thực hiện Check-in; Quản lý dịch vụ; Khám xe 2D và tạo Finding; Lập kế hoạch Job, Labour, Part; Quản lý vòng đời Báo giá (Tạo, Cập nhật chiết khấu, Duyệt/Từ chối, Hủy); Điều phối thi công; Kiểm định chất lượng QC; Bàn giao xe xuất xưởng; Lập Work Order bảo hành 0đ. |
| Quản lý dịch vụ (Service Manager) | Manager Workspace | Giám sát toàn bộ hoạt động vận hành xưởng; Quản lý danh mục phụ tùng (Category) và mã phụ tùng thực tế (SKU); Quản lý nhà cung cấp; Nhập kho trực tiếp; Tính giá vốn bình quân di động; Xuất/Nhập trả phụ tùng theo Job; Tra cứu tồn kho và thẻ kho; Duyệt điều chỉnh kho; Kiểm tra Closure Gate và Đóng Work Order vĩnh viễn; Xem báo cáo vận hành tổng hợp; Phê duyệt bảo hành thiện chí; Xem báo cáo phân tích bảo hành nội bộ (bảo mật). |
| Quản trị viên (Administrator) | Administration Workspace | Quản lý tài khoản người dùng, phân quyền RBAC đa tầng, cấp lại mật khẩu cho nhân viên; Quản lý hồ sơ nhân viên và kỹ năng; Quản lý danh mục dịch vụ và gói mẫu; Quản lý loại công việc (Job Type) và đơn giá giờ công; Cấu hình chính sách giá và quy chế Zero-Tax; Quản lý tiêu chí kiểm định QC; Quản lý các danh mục tra cứu chung. |
| Hệ thống tự động (System / Background Job) | Tiến trình nền hệ thống | Chạy tiến trình nền (Cron Job) định kỳ mỗi giờ quét các lịch hẹn sắp diễn ra trong vòng 24 giờ và tự động gửi email thông báo nhắc hẹn cho khách hàng. |

## 2.2. Mô tả chi tiết từng tác nhân

### 2.2.1. Khách vãng lai (Guest)
Người dùng truy cập vào website của trung tâm thông qua mạng Internet nhưng chưa đăng nhập hoặc chưa có tài khoản. Khách vãng lai có thể tìm hiểu về năng lực dịch vụ, bảng giá tham khảo, chính sách bảo hành và câu hỏi thường gặp, đồng thời có thể thực hiện đăng ký tài khoản mới hoặc đăng nhập để chuyển đổi thành vai trò Khách hàng.

### 2.2.2. Khách hàng (Customer)
Chủ sở hữu phương tiện hoặc người đại diện quản lý xe trực tiếp sử dụng dịch vụ của trung tâm. Khách hàng được cấp quyền truy cập vào Customer Portal để quản lý xe, đặt lịch hẹn, theo dõi trạng thái xe đang sửa chữa theo thời gian thực, xem và phê duyệt báo giá, thanh toán hóa đơn, tra cứu hạn bảo hành phương tiện và tải về các chứng từ điện tử (Biên bản giao xe, Hóa đơn VAT). Hệ thống kiểm soát quyền sở hữu dữ liệu (Object Ownership), ngăn chặn khách hàng xem dữ liệu của người khác hoặc các thông tin giá vốn nội bộ.

### 2.2.3. Nhân viên quầy dịch vụ (Front Desk Staff)
Nhân sự phụ trách khu vực tiền sảnh và quầy thu ngân của trung tâm dịch vụ. Nhân viên quầy là đầu mối tiếp nhận lịch hẹn qua điện thoại, tiếp nhận xe khi khách đến xưởng, tạo mới và chuẩn hóa dữ liệu khách hàng, phương tiện. Tại giai đoạn thanh toán, nhân viên quầy tiếp nhận Billing Request từ Cố vấn, lập và phát hành hóa đơn chính thức (bao gồm cả hóa đơn 0đ cho xe bảo hành) và thu tiền từ khách hàng, giải tỏa tài chính cho phương tiện. Nhân viên quầy không trực tiếp tạo Work Order chính thức.

### 2.2.4. Cố vấn dịch vụ (Service Advisor)
Nhân sự giữ vai trò trọng tâm điều phối kỹ thuật và thương mại trong suốt vòng đời của Phiếu công việc. Cố vấn dịch vụ chịu trách nhiệm tiếp nhận xe từ hàng đợi, thực hiện quy trình Check-in hiện trạng, khám xe và đánh dấu hư hỏng trên sơ đồ 2D, lập kế hoạch chi tiết các hạng mục công việc, dự trù nhân công và phụ tùng, lập và quản lý báo giá (áp dụng chiết khấu linh hoạt), điều phối thợ thi công, tiến hành nghiệm thu chất lượng sau sửa chữa, lập phiếu bảo hành 0đ và bàn giao xe cho khách hàng xuất xưởng.

### 2.2.5. Quản lý dịch vụ (Service Manager)
Người chịu trách nhiệm cao nhất về hiệu quả vận hành, chất lượng kỹ thuật và an toàn tồn kho của toàn xưởng dịch vụ. Quản lý giám sát trạng thái của toàn bộ xe trong xưởng qua Dashboard; trực tiếp quản lý kho phụ tùng (Master Data, nhập kho, tính giá vốn bình quân di động, xuất/trả vật tư theo Job); phê duyệt các trường hợp điều chỉnh kho và bảo hành thiện chí ngoại lệ; kiểm soát chốt chặn Closure Gate để đóng hồ sơ Work Order vĩnh viễn; và phân tích các báo cáo tài chính - kỹ thuật bảo mật của trung tâm.

### 2.2.6. Quản trị viên (Administrator)
Nhân sự phụ trách quản trị hạ tầng phần mềm và an toàn thông tin của hệ thống. Quản trị viên quản lý danh sách tài khoản người dùng, phân bổ vai trò quyền hạn (RBAC), cấp lại mật khẩu tạm thời cho nhân viên nội bộ, cấu hình toàn bộ các bảng danh mục nền tảng (Master Data: nhóm dịch vụ, gói dịch vụ mẫu, loại công việc kỹ thuật, đơn giá giờ công, tiêu chí kiểm định QC và danh mục dùng chung). Quản trị viên không trực tiếp tham gia xử lý các giao dịch vận hành thường nhật.

### 2.2.7. Hệ thống tự động (System / Background Job)
Tác nhân hệ thống phi con người, hoạt động dưới dạng các tiến trình chạy ngầm theo lịch biểu (Cron Jobs). Tác nhân này chịu trách nhiệm tự động hóa các tác vụ lặp lại theo chu kỳ thời gian, điển hình là việc quét cơ sở dữ liệu các lịch hẹn sắp đến hạn trong vòng 24 giờ và kích hoạt dịch vụ gửi email nhắc nhở tự động cho khách hàng nhằm giảm thiểu tỷ lệ khách quên hẹn hoặc vắng mặt.

## 2.3. Danh sách Use Case baseline

Dưới đây là bảng danh mục chuẩn hóa **87 Use Cases** thuộc phạm vi của hệ thống, được phân loại mạch lạc theo từng tác nhân và phân hệ chức năng chuyên biệt.

### 2.3.1. Khách vãng lai (Guest)

_Bảng 2-1: Use Case baseline – Khách vãng lai (Guest)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-01** | Xem thông tin website | Must | Mọi người dùng kể cả chưa đăng nhập đều có thể xem thông tin công khai: trang chủ giới thiệu, danh mục dịch vụ, bảng giá tham khảo và câu hỏi thường gặp (FAQ). |
| **UC-02** | Đăng ký tài khoản (Register) | Must | Khách vãng lai tự tạo tài khoản mới trên hệ thống bằng cách cung cấp thông tin cá nhân cơ bản (họ tên, email, số điện thoại, mật khẩu). |
| **UC-03** | Đăng nhập (Login) | Must | Người dùng đăng nhập vào hệ thống bằng email và mật khẩu để truy cập các chức năng tương ứng với vai trò của mình. |
| **UC-04** | Đăng xuất (Logout) | Must | Người dùng kết thúc phiên làm việc hiện tại trên hệ thống. Thao tác này áp dụng chung cho tất cả các vai trò. |

### 2.3.2. Khách hàng (Customer)

_Bảng 2-2: Use Case baseline – Khách hàng (Customer)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-05** | Khôi phục mật khẩu | Must | Khách hàng quên mật khẩu có thể yêu cầu đặt lại mật khẩu ngay tại trang đăng nhập thông qua mã xác thực OTP gửi về email cá nhân. |
| **UC-06** | Cập nhật hồ sơ cá nhân (Update Profile) | Must | Khách hàng xem và cập nhật thông tin cá nhân của mình trong hệ thống, bao gồm họ tên, số điện thoại và địa chỉ liên lạc. |
| **UC-07** | Thêm phương tiện (Create Vehicle) | Must | Khách hàng tạo mới dữ liệu phương tiện vào hệ thống để lưu trữ và quản lý dưới quyền sở hữu của mình. |
| **UC-08** | Xem phương tiện (View Vehicle) | Must | Khách hàng tra cứu, tìm kiếm và xem chi tiết thông tin của phương tiện đã có trong danh sách sở hữu. |
| **UC-09** | Cập nhật phương tiện (Update Vehicle) | Must | Khách hàng chỉnh sửa và cập nhật lại thông tin của phương tiện hiện có trong hệ thống (màu xe, năm sản xuất). |
| **UC-10** | Xóa phương tiện (Delete Vehicle) | Must | Khách hàng thực hiện xóa hoặc vô hiệu hóa bản ghi phương tiện khỏi danh sách quản lý khi không còn sở hữu xe. |
| **UC-11** | Đặt lịch hẹn (Create Appointment) | Must | Khách hàng tạo mới dữ liệu lịch hẹn dịch vụ trực tuyến vào hệ thống, chọn phương tiện, dịch vụ và thời gian mong muốn. |
| **UC-12** | Xem lịch hẹn (View Appointment) | Must | Khách hàng tra cứu, tìm kiếm và xem chi tiết trạng thái của các lịch hẹn đã đăng ký với trung tâm. |
| **UC-13** | Dời lịch hẹn (Reschedule Appointment) | Must | Khách hàng chỉnh sửa và cập nhật lại thời gian hẹn mới khi có sự thay đổi lịch trình cá nhân trước giờ tiếp nhận. |
| **UC-14** | Hủy lịch hẹn (Cancel Appointment) | Must | Khách hàng thực hiện hủy bản ghi lịch hẹn trên hệ thống kèm lý do hủy khi không còn nhu cầu mang xe đến xưởng. |
| **UC-15** | Theo dõi tiến độ sửa chữa (Track Progress) | Must | Khách hàng xem trạng thái tổng quát của xe đang được xử lý theo thời gian thực: bước thực hiện, tiến độ công việc và ảnh minh chứng. |
| **UC-16** | Xem hóa đơn (View Invoice) | Must | Khách hàng xem hóa đơn của phiếu công việc để biết chi tiết từng dòng phí, số tiền cần thanh toán theo chính sách Zero-Tax và trạng thái thanh toán. |
| **UC-38** | Xem báo giá (View Quotation) | Must | Cố vấn dịch vụ hoặc khách hàng xem chi tiết báo giá đã tạo, bao gồm các hạng mục dịch vụ, nhân công, phụ tùng và tổng chi phí sau chiết khấu. |
| **UC-80** | Xem lịch sử sửa chữa (View Repair History) | Must | Khách hàng tra cứu Sổ bảo dưỡng điện tử và toàn bộ lịch sử sửa chữa của các xe thuộc sở hữu; xem chi tiết 4 phần và tải Biên bản bàn giao xe hoặc Hóa đơn VAT dạng PDF. |

### 2.3.3. Nhân viên quầy dịch vụ (Front Desk Staff)

_Bảng 2-3: Use Case baseline – Nhân viên quầy dịch vụ (Front Desk Staff)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-17** | Đặt lịch hẹn (Create Appointment) | Must | Nhân viên quầy dịch vụ tạo mới dữ liệu lịch hẹn vào hệ thống để lưu trữ và quản lý thay cho khách hàng liên hệ qua điện thoại. |
| **UC-18** | Xem lịch hẹn (View Appointment) | Must | Nhân viên quầy dịch vụ tra cứu, tìm kiếm và xem danh sách lịch hẹn trong ngày để chủ động kế hoạch tiếp đón khách. |
| **UC-19** | Dời lịch hẹn (Reschedule Appointment) | Must | Nhân viên quầy dịch vụ chỉnh sửa và cập nhật lại thông tin thời gian hẹn theo yêu cầu điều chỉnh của khách hàng. |
| **UC-20** | Hủy lịch hẹn (Cancel Appointment) | Must | Nhân viên quầy dịch vụ hủy bản ghi lịch hẹn và ghi nhận lý do hủy khi khách hàng báo hủy hoặc không đến xưởng. |
| **UC-21** | Tiếp nhận xe (Receive Vehicle) | Must | Nhân viên quầy đánh dấu khách có hẹn đã đến (Mark Arrived), hoặc tạo phiếu tiếp nhận cho khách vãng lai (Walk-in) / xe cứu hộ (Tow-in) đưa vào Intake Queue. |
| **UC-22** | Thêm hồ sơ khách hàng (Create Customer) | Must | Nhân viên quầy dịch vụ tạo mới dữ liệu hồ sơ khách hàng vào hệ thống khi khách lần đầu đến xưởng làm dịch vụ. |
| **UC-23** | Xem hồ sơ khách hàng (View Customer) | Must | Nhân viên quầy tra cứu, tìm kiếm khách hàng theo số điện thoại, email hoặc họ tên để hỗ trợ thông tin nhanh chóng. |
| **UC-24** | Cập nhật hồ sơ khách hàng (Update Customer) | Must | Nhân viên quầy dịch vụ chỉnh sửa và cập nhật lại thông tin cá nhân của khách hàng khi có thay đổi liên lạc. |
| **UC-25** | Xóa hồ sơ khách hàng (Delete Customer) | Must | Nhân viên quầy dịch vụ thực hiện xóa hoặc vô hiệu hóa bản ghi hồ sơ khách hàng không còn hoạt động. |
| **UC-26** | Xem phiếu công việc (View Work Order) | Must | Nhân viên quầy tra cứu trạng thái tổng quát của phiếu công việc để giải đáp thắc mắc cho khách hàng hoặc chuẩn bị thanh toán. |
| **UC-27** | Xử lý hóa đơn (Process Invoice) | Must | Sau khi nhận yêu cầu thanh toán từ Cố vấn, nhân viên quầy kiểm tra dòng phí, lập hóa đơn tạm (Draft) và phát hành hóa đơn chính thức (Issued). |
| **UC-28** | Xử lý thanh toán (Process Payment) | Must | Nhân viên quầy ghi nhận khoản thanh toán của khách hàng (tiền mặt/thẻ hoặc mã VietQR); thanh toán đủ tự động kích hoạt Financial Clearance. |

### 2.3.4. Cố vấn dịch vụ (Service Advisor)

_Bảng 2-4: Use Case baseline – Cố vấn dịch vụ (Service Advisor)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-29** | Tạo phiếu công việc (Create Work Order) | Must | Cố vấn dịch vụ xem danh sách xe trong Intake Queue và tạo phiếu công việc – hồ sơ trung tâm quản lý toàn bộ quá trình dịch vụ của xe. |
| **UC-30** | Ghi nhận tình trạng xe (Record Condition) | Must | Cố vấn ghi nhận tình trạng xe tại thời điểm tiếp nhận: số ODO km, mức xăng, yêu cầu ban đầu, đồ đạc trên xe và bộ ảnh hiện trạng (Check-in). |
| **UC-31** | Thêm hạng mục dịch vụ (Add Service) | Must | Cố vấn thêm mới các hạng mục dịch vụ (sửa chữa, bảo dưỡng, chăm sóc xe) vào Work Order theo thỏa thuận với khách hàng. |
| **UC-32** | Xóa hạng mục dịch vụ (Remove Service) | Must | Cố vấn xóa hạng mục dịch vụ khỏi Work Order khi khách thay đổi ý định và dịch vụ chưa bắt đầu thi công. |
| **UC-33** | Kiểm tra xe (Inspect Vehicle) | Must | Cố vấn mở giao diện sơ đồ 2D mô phỏng xe, chọn loại marker hư hỏng (Damage, Rust, Dent...) và nhấp vị trí để đánh dấu, tạo Finding kèm ảnh chụp. |
| **UC-34** | Lên kế hoạch công việc (Plan Jobs) | Must | Cố vấn tạo các job (đầu công việc) cần làm: sinh từ mẫu dịch vụ, tạo từ Finding phát hiện được, hoặc tạo thủ công. |
| **UC-35** | Khai báo nhân công (Declare Labour) | Must | Cố vấn khai báo các dòng nhân công cho từng job: chọn loại thợ (Job Type), số giờ định mức dự kiến và chỉ định kỹ thuật viên phụ trách. |
| **UC-36** | Khai báo phụ tùng (Declare Parts) | Must | Cố vấn khai báo danh sách phụ tùng và vật tư dự kiến cần dùng cho từng job, số lượng kế hoạch và tra cứu tồn kho thực tế. |
| **UC-37** | Tạo báo giá (Create Quotation) | Must | Cố vấn dịch vụ tạo báo giá từ các hạng mục dịch vụ, nhân công và phụ tùng đã lên kế hoạch, áp dụng chính sách Zero-Tax. |
| **UC-39** | Cập nhật báo giá (Update Quotation) | Must | Cố vấn dịch vụ điều chỉnh chiết khấu (tiền mặt hoặc %), lý do giảm giá, ghi chú và cập nhật các dòng chi phí trên báo giá nháp. |
| **UC-40** | Duyệt báo giá (Approve Quotation) | Must | Cố vấn gửi báo giá cho khách và ghi nhận kết quả phê duyệt hoặc từ chối; khi duyệt thành công, hệ thống khóa đóng băng đơn giá snapshot và tự động giữ chỗ kho (`RESERVED`). |
| **UC-41** | Hủy báo giá (Cancel Quotation) | Must | Cố vấn dịch vụ hủy bỏ một báo giá nháp đang chờ nếu phát hiện sai sót trước khi gửi duyệt, đưa phiếu về trạng thái lên kế hoạch. |
| **UC-42** | Kiểm định chất lượng (Quality Inspection) | Must | Sau khi kỹ thuật viên hoàn thành các job, cố vấn (hoặc kiểm định viên) thực hiện nghiệm thu chất lượng theo checklist chuẩn: Pass chuyển thanh toán, Fail tạo Rework Job. |
| **UC-43** | Bàn giao xe (Release Vehicle) | Must | Cố vấn kiểm tra toàn bộ điều kiện bàn giao (Release Gate: job xong, kiểm định đạt, hóa đơn đã thanh toán), ký biên bản bàn giao và xuất xưởng xe. |

### 2.3.5. Quản lý dịch vụ (Service Manager)

_Bảng 2-5: Use Case baseline – Quản lý dịch vụ (Service Manager)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-44** | Theo dõi hoạt động xưởng (Monitor Workshop) | Must | Quản lý xem bảng tổng quan Dashboard để nắm bắt toàn diện tình hình vận hành: số xe trong xưởng, trạng thái các phiếu và tiến độ từng dịch vụ. |
| **UC-45** | Thêm danh mục phụ tùng (Create Category) | Must | Quản lý dịch vụ tạo mới danh mục phụ tùng vào hệ thống làm Master Data phân loại vật tư kho. |
| **UC-46** | Xem danh mục phụ tùng (View Category) | Must | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết danh mục phụ tùng đã có trong hệ thống. |
| **UC-47** | Cập nhật danh mục phụ tùng (Update Category) | Must | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của danh mục phụ tùng hiện có trong hệ thống. |
| **UC-48** | Xóa danh mục phụ tùng (Delete Category) | Must | Quản lý dịch vụ thực hiện xóa hoặc vô hiệu hóa danh mục phụ tùng khỏi hệ thống khi không còn sử dụng. |
| **UC-49** | Thêm phụ tùng (Create Inventory Item) | Must | Quản lý tạo mới mã phụ tùng thực tế (Variant/SKU) theo từng hãng xe vào hệ thống để theo dõi tồn kho và định giá bán. |
| **UC-50** | Xem phụ tùng (View Inventory Item) | Must | Quản lý tra cứu, tìm kiếm và xem chi tiết thông số, giá bán niêm yết, số lượng tồn kho thực tế của các mã phụ tùng. |
| **UC-51** | Cập nhật phụ tùng (Update Inventory Item) | Must | Quản lý chỉnh sửa thông tin của mã phụ tùng hiện có (giá bán, mức tồn kho cảnh báo tối thiểu, vị trí lưu kho). |
| **UC-52** | Ngừng kinh doanh phụ tùng (Deactivate Item) | Must | Quản lý thay đổi trạng thái hoạt động của mã phụ tùng (ngừng kinh doanh hoặc kích hoạt lại khi có nguồn cung). |
| **UC-53** | Nhập kho (Receive Inventory) | Must | Quản lý ghi nhận hàng nhập từ nhà cung cấp hoặc tồn đầu kỳ; hệ thống tự động tính lại giá vốn bình quân di động (Moving Average Cost). |
| **UC-54** | Xem báo cáo vận hành (Operational Report) | Must | Quản lý xem các báo cáo tổng hợp: số lượng dịch vụ theo nhóm, doanh thu theo khoảng thời gian và giá trị tồn kho hiện tại. |

### 2.3.6. Quản trị viên (Administrator)

_Bảng 2-6: Use Case baseline – Quản trị viên (Administrator)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-55** | Thêm tài khoản (Create Account) | Must | Quản trị viên tạo mới tài khoản đăng nhập cho nhân viên nội bộ, thiết lập vai trò và trạng thái kích hoạt. |
| **UC-56** | Xem tài khoản (View Account) | Must | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin, quyền hạn của các tài khoản người dùng trong hệ thống. |
| **UC-57** | Cập nhật tài khoản (Update Account) | Must | Quản trị viên chỉnh sửa thông tin tài khoản, gán lại vai trò hoặc đặt lại mật khẩu tạm thời cho nhân viên. |
| **UC-58** | Xóa tài khoản (Delete Account) | Must | Quản trị viên thực hiện vô hiệu hóa hoặc khóa tài khoản người dùng khỏi hệ thống khi nhân viên nghỉ việc. |
| **UC-59** | Thêm nhân viên (Create Employee) | Must | Quản trị viên tạo mới hồ sơ nhân sự kỹ thuật vào hệ thống để quản lý phân công công việc. |
| **UC-60** | Xem nhân viên (View Employee) | Must | Quản trị viên tra cứu, tìm kiếm và xem chi tiết hồ sơ nhân sự, chức danh và nhóm kỹ năng kỹ thuật. |
| **UC-61** | Cập nhật nhân viên (Update Employee) | Must | Quản trị viên chỉnh sửa thông tin nhân viên, cập nhật kỹ năng chuyên môn hoặc điều chỉnh trạng thái làm việc. |
| **UC-62** | Xóa nhân viên (Delete Employee) | Must | Quản trị viên thực hiện vô hiệu hóa bản ghi nhân viên khỏi hệ thống khi chấm dứt hợp đồng lao động. |
| **UC-63** | Thêm dịch vụ (Create Service) | Must | Quản trị viên tạo mới dịch vụ vào hệ thống, thiết lập mô hình tính giá (`pricing_type`) và quy định nghiệm thu QC. |
| **UC-64** | Xem dịch vụ (View Service) | Must | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin cấu hình của các dịch vụ trong hệ thống. |
| **UC-65** | Cập nhật dịch vụ (Update Service) | Must | Quản trị viên chỉnh sửa nội dung dịch vụ, điều chỉnh mô hình tính giá hoặc chính sách bảo hành mặc định. |
| **UC-66** | Xóa dịch vụ (Delete Service) | Must | Quản trị viên vô hiệu hóa gói dịch vụ không còn cung cấp khỏi hệ thống. |
| **UC-67** | Thêm danh mục dịch vụ (Create Category) | Must | Quản trị viên tạo mới nhóm danh mục dịch vụ (Sửa chữa, Bảo dưỡng, Chăm sóc xe...) để phân loại gói dịch vụ. |
| **UC-68** | Xem danh mục dịch vụ (View Category) | Must | Quản trị viên tra cứu, xem danh sách các nhóm danh mục dịch vụ hiện có trong hệ thống. |
| **UC-69** | Cập nhật danh mục dịch vụ (Update Category) | Must | Quản trị viên chỉnh sửa tên, mô tả hoặc thứ tự hiển thị của nhóm danh mục dịch vụ. |
| **UC-70** | Xóa danh mục dịch vụ (Delete Category) | Must | Quản trị viên vô hiệu hóa nhóm danh mục dịch vụ khi không còn sử dụng. |
| **UC-71** | Thêm loại công việc (Create Job Type) | Must | Quản trị viên tạo mới loại công việc kỹ thuật, thiết lập đơn giá giờ công tiêu chuẩn (Hourly Labour Rate). |
| **UC-72** | Xem loại công việc (View Job Type) | Must | Quản trị viên tra cứu, xem danh sách và mức đơn giá giờ công của các loại công việc kỹ thuật. |
| **UC-73** | Cập nhật loại công việc (Update Job Type) | Must | Quản trị viên chỉnh sửa thông tin hoặc điều chỉnh đơn giá giờ công của loại công việc theo biến động thị trường. |
| **UC-74** | Xóa loại công việc (Delete Job Type) | Must | Quản trị viên vô hiệu hóa loại công việc kỹ thuật không còn áp dụng. |
| **UC-75** | Thêm danh mục chung (Create System Catalog) | Must | Quản trị viên tạo mới các danh mục dữ liệu dùng chung (đơn vị tính UoM, hãng phụ tùng, nhóm kích cỡ xe...). |
| **UC-76** | Xem danh mục chung (View System Catalog) | Must | Quản trị viên tra cứu, xem chi tiết danh sách các giá trị danh mục dùng chung toàn hệ thống. |
| **UC-77** | Cập nhật danh mục chung (Update Catalog) | Must | Quản trị viên chỉnh sửa mã, tên hoặc mô tả của các giá trị danh mục dùng chung. |
| **UC-78** | Xóa danh mục chung (Delete System Catalog) | Must | Quản trị viên vô hiệu hóa các giá trị danh mục dùng chung khi không còn nhu cầu tham chiếu. |

### 2.3.7. Hệ thống tự động (System / Background Job)

_Bảng 2-7: Use Case baseline – Hệ thống tự động (System / Background Job)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-79** | Gửi email nhắc hẹn tự động (Auto Reminder) | Must | Hệ thống tự động kích hoạt tiến trình nền theo chu kỳ định kỳ (mỗi giờ một lần), quét các lịch hẹn sắp diễn ra trong vòng 24 giờ tới và tự động gửi email thông báo nhắc nhở kèm chi tiết thời gian, địa điểm và thông tin xe cho khách hàng. |

### 2.3.8. Phân hệ Quản lý Bảo hành (Warranty Management)

_Bảng 2-8: Use Case baseline – Phân hệ Quản lý Bảo hành (Warranty Management)_

| **UC ID** | **Tên Use Case** | **Mức ưu tiên** | **Mô tả tóm tắt** |
| :---: | :--- | :---: | :--- |
| **UC-81** | Tra cứu thông tin bảo hành | Must | Khách hàng hoặc nhân viên tra cứu danh sách các dịch vụ và phụ tùng đã sử dụng trên phương tiện để kiểm tra thời hạn và điều kiện bảo hành còn hiệu lực (số ngày còn lại, số km ODO còn lại). |
| **UC-82** | Đặt lịch hẹn bảo hành | Must | Khách hàng chủ động tạo lịch hẹn trực tuyến mang xe đến trung tâm để kiểm tra và khắc phục sự cố bảo hành đối với các dịch vụ hoặc phụ tùng còn trong thời hạn cam kết. |
| **UC-83** | Tiếp nhận bảo hành | Must | Nhân viên quầy dịch vụ tiếp nhận phương tiện mang đến xưởng theo diện bảo hành, ghi nhận số km ODO thực tế, đối chiếu điều kiện bảo hành với phiếu dịch vụ gốc và chuyển tiếp hồ sơ sang hàng đợi của Cố vấn dịch vụ. |
| **UC-84** | Tạo phiếu công việc bảo hành | Must | Cố vấn dịch vụ lập phiếu công việc chuyên biệt cho xe bảo hành; thẩm định tình trạng xe, gắn cờ bảo hành cho các hạng mục công việc và phụ tùng thay thế để áp dụng chính sách miễn phí 100% (đơn giá 0 đồng), tạo báo giá 0 đồng và chuyển sang điều phối thi công. |
| **UC-85** | Xử lý hóa đơn bảo hành | Must | Nhân viên quầy dịch vụ hoặc thu ngân lập và phát hành hóa đơn 0 đồng cho phiếu công việc bảo hành; hệ thống tự động xác nhận hoàn tất quyết toán tài chính (Financial Clearance) để xe đủ điều kiện làm thủ tục bàn giao xuất xưởng. |
| **UC-86** | Phê duyệt bảo hành thiện chí | Must | Quản lý dịch vụ xem xét và phê duyệt các yêu cầu bảo hành ngoại lệ (Goodwill Warranty) đối với trường hợp phương tiện hoặc phụ tùng đã hết hạn bảo hành tiêu chuẩn nhưng được hỗ trợ chi phí theo chính sách chăm sóc khách hàng đặc biệt của trung tâm. |
| **UC-87** | Xem báo cáo bảo hành | Must | Quản lý dịch vụ (hoặc Quản trị viên) theo dõi các chỉ số thống kê tài chính và kỹ thuật mật về hoạt động bảo hành: tỷ lệ xe bảo hành trên tổng lượt phục vụ, tổng chi phí vốn phụ tùng bảo hành xuất kho (tính theo giá vốn bình quân di động), danh sách phụ tùng lỗi lặp lại và nhà cung cấp bồi hoàn. |

## 2.4. Tiêu chí hoàn thành Tiểu luận

_Bảng 2-9: Tiêu chí nghiệm thu hệ thống MVP_

| **ID** | **Tiêu chí nghiệm thu cốt lõi** |
| :---: | :--- |
| **AC-01** | Trình diễn trọn vẹn luồng nghiệp vụ E2E thông suốt từ Đặt hẹn / Tiếp nhận xe → Khám xe chẩn đoán → Báo giá & Phê duyệt → Thi công & Nghiệm thu QC → Quyết toán hóa đơn Zero-Tax → Bàn giao xe xuất xưởng → Đóng hồ sơ Work Order. |
| **AC-02** | Khám xe trực quan trên sơ đồ 2D mô phỏng và tạo Inspection Finding; liên kết đa chiều linh hoạt giữa Finding và Job (một Finding có thể gắn 1 hoặc nhiều Job, hoặc không gắn Job nào). |
| **AC-03** | Duy trì tính toàn vẹn của chuỗi truy vết nghiệp vụ Finding → Job → Part: Một Job liên kết được nhiều Part/Material; theo dõi chính xác Planned Quantity, Used Quantity, giá vốn và đơn giá bán. |
| **AC-04** | Tính đúng đơn giá theo 3 mô hình định giá dịch vụ (`FIXED`, `BY_VEHICLE_SIZE`, `LABOUR_AND_PARTS`), thực thi nghiêm ngặt chính sách Zero-Tax ($GrandTotal = Subtotal - Discount$), và khóa cứng snapshot đơn giá khi báo giá được duyệt. |
| **AC-05** | Nhập kho trực tiếp cập nhật số lượng tồn thực tế (On-hand) và tự động tính lại giá vốn bình quân di động (Moving Weighted Average Cost); kiểm soát xuất/nhập trả phụ tùng theo đúng định mức Job. |
| **AC-06** | Hoạt động chính xác của các cổng kiểm soát (Gates): Check-in Gate, Quotation Gate, Execution Gate, QC Gate, Financial Gate, Release Gate (chặn xuất xưởng nếu chưa hoàn thành Job, chưa đạt QC Pass hoặc chưa thanh toán xong), và Closure Gate. |
| **AC-07** | Triển khai hoàn chỉnh Phân hệ Quản lý Bảo hành: Tra cứu hạn bảo hành theo ODO/ngày, Tiếp nhận bảo hành, Lập phiếu Work Order bảo hành 0đ, Phê duyệt bảo hành thiện chí (Goodwill) có giải trình bắt buộc, Phát hành hóa đơn 0đ và Báo cáo chi phí vốn bảo hành mật. |
| **AC-08** | Cung cấp Sổ bảo dưỡng điện tử 4 phần, tra cứu lịch sử sửa chữa và hỗ trợ trích xuất, tải xuống Biên bản bàn giao xe và Hóa đơn VAT dưới định dạng tệp PDF chuẩn. |
| **AC-09** | Tích hợp thành công tiến trình chạy ngầm (Background Job) tự động quét và gửi email nhắc hẹn cho khách hàng trước 24 giờ. |
| **AC-10** | Hệ thống vượt qua các bài kiểm thử tự động (Unit Test / API Test) bao phủ các logic trọng yếu: tính giá Zero-Tax, Finding–Job mapping, tồn kho không âm và cơ chế chốt chặn Release Gate. |

# KẾT LUẬN

Tài liệu này xác lập khung yêu cầu kỹ thuật và nghiệp vụ nền tảng (Baseline Requirements) hoàn chỉnh và thống nhất cho toàn bộ đề tài Nghiên cứu xây dựng Hệ thống Quản lý Trung tâm Dịch vụ Kỹ thuật Ô tô.

Trong phạm vi Tiểu luận chuyên ngành, hệ thống đã hiện thực hóa thành công một sản phẩm MVP full E2E mạnh mẽ, giải quyết triệt để bài toán kết nối dữ liệu liên phòng ban thông qua hồ sơ trung tâm Work Order và chuỗi truy vết Finding → Job → Part → QC → Release. Hệ thống chuẩn hóa cơ chế tài chính với chính sách Zero-Tax cốt lõi, tích hợp các chốt chặn kiểm soát vận hành an toàn và mở rộng phân hệ Quản lý Bảo hành khép kín nhằm bảo vệ tối đa quyền lợi khách hàng và kiểm soát chi phí của doanh nghiệp.

Các yêu cầu chức năng mở rộng nâng cao không nằm trong baseline này sẽ tiếp tục được kế thừa, hoàn thiện và phát triển chuyên sâu trong giai đoạn Khóa luận tốt nghiệp tiếp theo.
