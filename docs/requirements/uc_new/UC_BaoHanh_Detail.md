# ĐẶC TẢ USE CASE PHÂN HỆ BẢO HÀNH (WARRANTY MODULE)

> **Tài liệu đặc tả các Use Case mới liên quan đến nghiệp vụ bảo hành phương tiện, phụ tùng và dịch vụ.**  
> **Thư mục lưu trữ:** `docs/requirements/uc_new/UC_BaoHanh_Detail.md`  
> **Chuẩn định dạng:** Tuân thủ cấu trúc chuẩn đặc tả Use Case của hệ thống ([UC-17_rev.md](../rev_uc/UC-17_rev.md), [UC-58_rev.md](../rev_uc/UC-58_rev.md), [UC-43_UC-53_rev.md](../rev_uc/UC-43_UC-53_rev.md)).

---

## 1. BẢNG TỔNG HỢP DANH MỤC 07 USE CASES PHÂN HỆ BẢO HÀNH

| Mã UC | Tên Use Case | Đối tượng thực hiện (Actor) | Phạm vi & Nhu cầu người dùng |
| :---: | :--- | :--- | :--- |
| **UC-W01** | **Tra cứu thông tin bảo hành** | Khách hàng, Nhân viên quầy, Cố vấn | Khách hàng và nhân viên tra cứu hạn bảo hành còn lại của các phụ tùng, dịch vụ trên xe (số ngày, số km ODO). |
| **UC-W02** | **Đặt lịch hẹn bảo hành** | Khách hàng | Khách hàng chủ động đặt lịch hẹn kiểm tra sự cố bảo hành trực tuyến kèm mô tả hiện tượng và hình ảnh/video. |
| **UC-W03** | **Tiếp nhận bảo hành** | Nhân viên quầy dịch vụ | Nhân viên tiếp nhận xe đến xưởng, ghi nhận số km ODO hiện tại và liên kết với phiếu dịch vụ gốc. |
| **UC-W04** | **Tạo phiếu công việc bảo hành** | Cố vấn dịch vụ (SA) | Cố vấn lập phiếu công việc, đánh dấu cờ bảo hành cho các Job/Part để áp dụng đơn giá 0 đồng trên báo giá. |
| **UC-W05** | **Xử lý hóa đơn bảo hành** | Nhân viên quầy dịch vụ / Thu ngân | Nhân viên phát hành hóa đơn 0 đồng; hệ thống tự động xác nhận hoàn tất thanh toán để giải phóng xe bàn giao. |
| **UC-W06** | **Phê duyệt bảo hành thiện chí** | **Quản lý dịch vụ (Manager)** | Quản lý xem xét và phê duyệt hỗ trợ bảo hành ngoại lệ cho các trường hợp khách hàng quá hạn nhẹ. |
| **UC-W07** | **Xem báo cáo bảo hành** | **Chỉ dành riêng cho Quản lý dịch vụ (Manager)** | Quản lý dịch vụ xem số liệu bảo mật về tỷ lệ xe bảo hành, chi phí vốn phụ tùng thiệt hại và lỗi kỹ thuật lặp lại. Các vai trò khác hoàn toàn không được quyền truy cập. |

---

# 2. ĐẶC TẢ CHI TIẾT TỪNG USE CASE

---

## UC-W01 – Tra cứu thông tin bảo hành (Check Warranty Information)

| **Mã Use case**    | UC-W01 |
| ------------------ | ------ |
| **Tên Use case**   | Tra cứu thông tin bảo hành (Check Warranty Information) |
| **Mô tả**          | Khách hàng hoặc nhân viên tra cứu danh sách các dịch vụ và phụ tùng đã sử dụng trên phương tiện để kiểm tra thời hạn và điều kiện bảo hành còn hiệu lực. |
| **Đối tượng**      | Khách hàng, Nhân viên quầy dịch vụ, Cố vấn dịch vụ |
| **Tiền điều kiện** | Người dùng đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Phương tiện đã từng hoàn thành dịch vụ tại trung tâm. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị danh sách các hạng mục dịch vụ, phụ tùng kèm trạng thái còn hoặc hết hạn bảo hành.<br>Thất bại: Hệ thống thông báo không tìm thấy dữ liệu hoặc thông báo lỗi. |
| **Luồng cơ bản**   | 1. Người dùng truy cập màn hình tra cứu bảo hành.<br>2. Người dùng chọn phương tiện (đối với Khách hàng) hoặc nhập biển số xe / số điện thoại khách hàng (đối với Nhân viên) và nhấn **Tìm kiếm**.<br>3. Hệ thống kiểm tra dữ liệu lịch sử sửa chữa của phương tiện.<br>4. Hệ thống hiển thị danh sách các dịch vụ và phụ tùng đã từng thực hiện, bao gồm: tên hạng mục, ngày hoàn thành, số km tại thời điểm làm dịch vụ, thời hạn bảo hành (số tháng, số km quy định), thời gian còn lại và số km còn lại.<br>5. Hệ thống hiển thị rõ trạng thái của từng hạng mục: **Còn bảo hành** hoặc **Hết hạn bảo hành**.<br>6. Người dùng xem chi tiết hoặc chọn hạng mục còn bảo hành để chuyển sang bước đặt lịch hẹn hoặc tạo hồ sơ tiếp nhận. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình tra cứu, người dùng chọn **Đóng** hoặc **Quay lại**:<br>Hệ thống đóng màn hình tra cứu và quay lại màn hình trước đó. |
| **Luồng ngoại lệ** | Tại bước 3, nếu phương tiện không tồn tại hoặc chưa từng có dữ liệu sửa chữa hoàn tất tại hệ thống, hệ thống hiển thị thông báo: *"Không tìm thấy lịch sử dịch vụ của phương tiện"*. Use case quay lại bước 2. |

---

## UC-W02 – Đặt lịch hẹn bảo hành (Create Warranty Appointment)

| **Mã Use case**    | UC-W02 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lịch hẹn bảo hành (Create Warranty Appointment) |
| **Mô tả**          | Khách hàng tạo mới dữ liệu lịch hẹn mang xe đến kiểm tra và xử lý sự cố bảo hành vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và phương tiện có ít nhất một hạng mục dịch vụ hoặc phụ tùng còn trong thời hạn bảo hành. |
| **Hậu điều kiện**  | Thành công: Dữ liệu lịch hẹn bảo hành được lưu vào hệ thống, hiển thị trong danh sách lịch hẹn và gửi thông báo xác nhận.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu lịch hẹn không được thêm. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình đặt lịch hẹn và chọn loại lịch hẹn là **Bảo hành**.<br>2. Hệ thống hiển thị biểu mẫu đặt lịch hẹn bảo hành kèm danh sách các hạng mục còn hiệu lực bảo hành của xe.<br>3. Khách hàng tích chọn một hoặc nhiều hạng mục cần kiểm tra bảo hành.<br>4. Khách hàng nhập mô tả hiện tượng sự cố gặp phải và đính kèm hình ảnh hoặc video (nếu có).<br>5. Khách hàng chọn ngày hẹn và khung giờ hẹn mong muốn trong danh sách các khung giờ còn trống.<br>6. Khách hàng nhấn **Xác nhận đặt lịch**.<br>7. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo thời gian hẹn thuộc khung giờ làm việc của trung tâm.<br>8. Hệ thống lưu dữ liệu lịch hẹn bảo hành mới, gửi email thông báo xác nhận cho khách hàng, hiển thị thông báo thành công và cập nhật lại danh sách lịch hẹn. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu.<br><br>**[Khách hàng kết hợp dịch vụ khác]** Tại bước 3, nếu khách hàng muốn làm thêm dịch vụ bảo dưỡng thông thường ngoài bảo hành, khách hàng chọn **Thêm dịch vụ khác**: Hệ thống hiển thị danh mục dịch vụ tiêu chuẩn để khách hàng lựa chọn bổ sung vào lịch hẹn. |
| **Luồng ngoại lệ** | Tại bước 7, nếu khung giờ đã chọn bị trùng lịch hoặc dữ liệu không hợp lệ (thiếu mô tả sự cố, chưa chọn hạng mục bảo hành), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

## UC-W03 – Tiếp nhận bảo hành (Create Warranty Intake)

| **Mã Use case**    | UC-W03 |
| ------------------ | ------ |
| **Tên Use case**   | Tiếp nhận bảo hành (Create Warranty Intake) |
| **Mô tả**          | Nhân viên quầy dịch vụ tạo mới dữ liệu tiếp nhận xe đến bảo hành vào hệ thống để ghi nhận hiện trạng và chuyển tiếp cho Cố vấn dịch vụ xử lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Xe có mặt tại trung tâm theo lịch hẹn hoặc khách mang đến trực tiếp. |
| **Hậu điều kiện**  | Thành công: Dữ liệu tiếp nhận xe bảo hành được lưu vào hệ thống, phiếu tiếp nhận được in và thông tin chuyển sang hàng đợi của Cố vấn dịch vụ.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu tiếp nhận không được lưu. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình tiếp nhận xe và chọn **Tiếp nhận bảo hành**.<br>2. Hệ thống hiển thị biểu mẫu tiếp nhận bảo hành.<br>3. Nhân viên quầy dịch vụ nhập biển số xe (hoặc chọn từ danh sách lịch hẹn bảo hành trong ngày).<br>4. Hệ thống hiển thị thông tin phương tiện, chủ xe và danh sách các hạng mục dịch vụ/phụ tùng đã làm trước đó.<br>5. Nhân viên quầy dịch vụ nhập số km hiện tại của xe, mức nhiên liệu, ghi nhận tình trạng thân vỏ và chọn phiếu dịch vụ gốc cần bảo hành.<br>6. Nhân viên quầy dịch vụ chọn các hạng mục cần bảo hành và nhập mô tả sự cố do khách hàng phản ánh.<br>7. Nhân viên quầy dịch vụ nhấn **Lưu tiếp nhận**.<br>8. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đối chiếu điều kiện bảo hành (thời gian và số km quy định).<br>9. Hệ thống lưu dữ liệu tiếp nhận bảo hành mới, hiển thị thông báo thành công, in phiếu tiếp nhận và cập nhật trạng thái chờ xử lý cho Cố vấn dịch vụ. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại danh sách tiếp nhận mà không lưu dữ liệu.<br><br>**[Yêu cầu bảo hành thiện chí]** Tại bước 8, nếu hạng mục đã quá hạn bảo hành nhưng nhân viên muốn gửi xét duyệt hỗ trợ, nhân viên chọn **Yêu cầu bảo hành thiện chí**: Hệ thống ghi nhận yêu cầu và chuyển sang trạng thái chờ Quản lý dịch vụ phê duyệt (UC-W06). |
| **Luồng ngoại lệ** | Tại bước 8, nếu số km nhập vào nhỏ hơn số km của lần sửa chữa trước đó hoặc thiếu thông tin bắt buộc, hệ thống hiển thị thông báo lỗi tại trường tương ứng. Use case quay lại bước 5. |

---

## UC-W04 – Tạo phiếu công việc bảo hành (Create Warranty Work Order)

| **Mã Use case**    | UC-W04 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo phiếu công việc bảo hành (Create Warranty Work Order) |
| **Mô tả**          | Cố vấn dịch vụ lập phiếu công việc mới để sửa chữa hoặc thay thế phụ tùng theo diện bảo hành, thiết lập mức đơn giá 0 đồng cho các hạng mục bảo hành để lưu trữ và quản lý. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Xe đã hoàn tất bước tiếp nhận bảo hành. |
| **Hậu điều kiện**  | Thành công: Phiếu công việc bảo hành được tạo mới, báo giá mức phí 0 đồng được phê duyệt và chuyển sang giai đoạn thi công.<br>Thất bại: Hệ thống thông báo lỗi, phiếu công việc không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ truy cập danh sách chờ xử lý và chọn hồ sơ tiếp nhận bảo hành mục tiêu.<br>2. Cố vấn dịch vụ chọn **Tạo phiếu công việc**.<br>3. Hệ thống hiển thị biểu mẫu tạo phiếu công việc với phân loại đơn là **Bảo hành** và liên kết với phiếu dịch vụ gốc.<br>4. Cố vấn dịch vụ nhập kết quả kiểm tra, thêm các công việc kỹ thuật cần xử lý và chọn phụ tùng thay thế (nếu có).<br>5. Cố vấn dịch vụ đánh dấu cờ bảo hành cho các công việc và phụ tùng thuộc diện bảo hành.<br>6. Cố vấn dịch vụ nhấn **Tạo báo giá**.<br>7. Hệ thống tự động áp dụng đơn giá 0 đồng cho toàn bộ các hạng mục công việc và phụ tùng có đánh dấu bảo hành; tổng chi phí thanh toán được tính bằng 0 đồng.<br>8. Cố vấn dịch vụ kiểm tra lại nội dung báo giá và nhấn **Xác nhận duyệt báo giá**.<br>9. Hệ thống lưu phiếu công việc và báo giá ở trạng thái đã duyệt, kích hoạt quyền xuất kho phụ tùng bảo hành, hiển thị thông báo thành công và chuyển phiếu sang danh sách chờ phân công kỹ thuật viên. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, cố vấn dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu dữ liệu.<br><br>**[Phiếu dịch vụ kết hợp có thu phí]** Tại bước 4, nếu khách hàng yêu cầu làm thêm các dịch vụ phát sinh khác ngoài bảo hành, cố vấn dịch vụ thêm các dịch vụ/phụ tùng đó nhưng không đánh dấu cờ bảo hành. Hệ thống tự động tính tiền các hạng mục phát sinh theo bảng giá niêm yết và giữ nguyên mức giá 0 đồng cho các mục bảo hành. |
| **Luồng ngoại lệ** | Tại bước 6, nếu phụ tùng chọn thay thế có số lượng tồn kho bằng 0, hệ thống cảnh báo phụ tùng không đủ tồn kho để xuất dùng. Cố vấn dịch vụ cần chọn phụ tùng thay thế tương đương hoặc tạo yêu cầu đặt hàng. |

---

## UC-W05 – Xử lý hóa đơn bảo hành (Process Warranty Invoice)

| **Mã Use case**    | UC-W05 |
| ------------------ | ------ |
| **Tên Use case**   | Xử lý hóa đơn bảo hành (Process Warranty Invoice) |
| **Mô tả**          | Nhân viên quầy dịch vụ lập và phát hành hóa đơn với số tiền 0 đồng cho phiếu dịch vụ bảo hành; hệ thống tự động xác nhận hoàn tất thanh toán để giải phóng phương tiện xuất xưởng. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Phiếu công việc bảo hành đã hoàn thành thi công và đạt kiểm định chất lượng (QC Đạt). |
| **Hậu điều kiện**  | Thành công: Hóa đơn 0 đồng được phát hành và chuyển trạng thái đã thanh toán; phiếu công việc chuyển trạng thái sẵn sàng bàn giao xe.<br>Thất bại: Hệ thống thông báo lỗi, hóa đơn không được phát hành. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý hóa đơn và chọn phiếu công việc bảo hành đang chờ lập hóa đơn.<br>2. Nhân viên quầy dịch vụ nhấn **Tạo hóa đơn**.<br>3. Hệ thống hiển thị bảng xem trước hóa đơn, tự động trích xuất các dòng chi phí từ báo giá bảo hành đã duyệt với đơn giá 0 đồng và tổng tiền phải trả bằng 0 đồng.<br>4. Nhân viên quầy dịch vụ kiểm tra thông tin và nhấn **Phát hành hóa đơn**.<br>5. Hệ thống kiểm tra tổng tiền của hóa đơn. Khi tổng tiền bằng 0 đồng, hệ thống tự động đánh dấu hóa đơn ở trạng thái **Đã thanh toán** mà không yêu cầu tạo giao dịch thu tiền.<br>6. Hệ thống tự động cập nhật trạng thái phiếu công việc sang **Đã hoàn tất thanh toán (Sẵn sàng giao xe)**.<br>7. Hệ thống tạo tệp hóa đơn điện tử 0 đồng, gửi email thông báo cho khách hàng, hiển thị thông báo thành công và cập nhật lại danh sách hóa đơn. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình xem trước hóa đơn, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng màn hình xem trước và quay lại danh sách chờ lập hóa đơn mà không tạo dữ liệu mới. |
| **Luồng ngoại lệ** | Tại bước 5, nếu phiếu công việc có bao gồm dịch vụ phát sinh ngoài bảo hành dẫn đến tổng tiền lớn hơn 0 đồng, hệ thống chuyển sang quy trình thu tiền thông thường (UC-28) để thu phần tiền phát sinh trước khi xác nhận hoàn tất thanh toán. |

---

## UC-W06 – Phê duyệt bảo hành thiện chí (Approve Goodwill Warranty)

| **Mã Use case**    | UC-W06 |
| ------------------ | ------ |
| **Tên Use case**   | Phê duyệt bảo hành thiện chí (Approve Goodwill Warranty) |
| **Mô tả**          | Quản lý dịch vụ xem xét và phê duyệt các yêu cầu bảo hành ngoại lệ đối với trường hợp phương tiện hoặc phụ tùng đã hết hạn bảo hành tiêu chuẩn nhưng được hỗ trợ theo chính sách chăm sóc khách hàng. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống với vai trò `MANAGER` và được cấp quyền thực hiện chức năng này. Có yêu cầu bảo hành thiện chí đang ở trạng thái chờ duyệt. |
| **Hậu điều kiện**  | Thành công: Yêu cầu bảo hành thiện chí được phê duyệt (hoặc từ chối), hệ thống mở quyền tạo phiếu bảo hành cho Cố vấn dịch vụ.<br>Thất bại: Hệ thống thông báo lỗi, trạng thái yêu cầu không thay đổi. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình danh sách yêu cầu phê duyệt bảo hành thiện chí.<br>2. Quản lý dịch vụ chọn một yêu cầu cần xử lý và nhấn **Xem chi tiết**.<br>3. Hệ thống hiển thị thông tin chi tiết: thông tin phương tiện, lịch sử bảo dưỡng, hạng mục yêu cầu, số ngày hoặc số km đã vượt quá hạn, và lý do đề xuất của nhân viên.<br>4. Quản lý dịch vụ chọn tỷ lệ hỗ trợ (Hỗ trợ 100% chi phí / Hỗ trợ tiền công, tính tiền phụ tùng / Hoặc mức hỗ trợ khác) và nhập ghi chú phê duyệt.<br>5. Quản lý dịch vụ nhấn **Phê duyệt**.<br>6. Hệ thống kiểm tra dữ liệu và cập nhật trạng thái yêu cầu thành **Đã duyệt**.<br>7. Hệ thống hiển thị thông báo thành công, gửi thông báo đến Cố vấn dịch vụ để tiến hành lập phiếu công việc bảo hành và cập nhật lại danh sách chờ duyệt. |
| **Luồng thay thế** | **[Từ chối phê duyệt]** Tại bước 5, nếu không chấp thuận hỗ trợ, Quản lý dịch vụ nhập lý do từ chối và nhấn **Từ chối**:<br>Hệ thống cập nhật trạng thái yêu cầu thành **Bị từ chối**, gửi thông báo đến Cố vấn dịch vụ để giải thích và chuyển sang phương án sửa chữa có tính phí thông thường.<br><br>**[Hủy thao tác]** Tại màn hình xem chi tiết, quản lý dịch vụ chọn **Đóng**:<br>Hệ thống đóng màn hình chi tiết và giữ nguyên trạng thái chờ duyệt của yêu cầu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu quản lý dịch vụ không nhập ghi chú giải trình khi phê duyệt hoặc từ chối, hệ thống hiển thị thông báo yêu cầu nhập đầy đủ nội dung. Use case quay lại bước 4. |

---

## UC-W07 – Xem báo cáo bảo hành (View Warranty Report)

| **Mã Use case**    | UC-W07 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo cáo bảo hành (View Warranty Report) |
| **Mô tả**          | Quản lý dịch vụ xem số liệu thống kê, phân tích mật về tình hình tiếp nhận bảo hành, tổng chi phí vốn phụ tùng bảo hành và các lỗi kỹ thuật phát sinh để đánh giá chất lượng dịch vụ và đòi nhà cung cấp bồi hoàn. Chức năng này được bảo vệ phân quyền nghiêm ngặt, các vai trò tác nghiệp khác không được quyền truy cập. |
| **Đối tượng**      | **Chỉ duy nhất Quản lý dịch vụ (Service Manager)** |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống với vai trò `MANAGER` (hoặc Quản trị viên hệ thống) và được cấp quyền xem dữ liệu tài chính của xưởng. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị bảng thống kê, biểu đồ phân tích và số liệu chi phí bảo hành theo tiêu chí đã chọn.<br>Thất bại: Hệ thống thông báo lỗi hoặc từ chối truy cập. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình báo cáo thống kê và chọn **Báo cáo bảo hành**.<br>2. Hệ thống kiểm tra quyền hạn của tài khoản và hiển thị màn hình báo cáo kèm các bộ lọc mặc định (theo tháng hiện tại).<br>3. Quản lý dịch vụ chọn khoảng thời gian cần xem (từ ngày đến ngày) và chọn tiêu chí lọc (theo loại dịch vụ, theo danh mục phụ tùng, hoặc theo kỹ thuật viên).<br>4. Quản lý dịch vụ nhấn **Xem báo cáo**.<br>5. Hệ thống trích xuất dữ liệu và hiển thị các thông tin tổng hợp:<br>- Tổng số lượt xe bảo hành và tỷ lệ xe bảo hành trên tổng số xe phục vụ.<br>- Tổng chi phí vốn phụ tùng đã xuất dùng cho bảo hành.<br>- Danh sách phụ tùng hư hỏng nhiều nhất và thông tin nhà cung cấp phụ tùng tương ứng.<br>- Danh sách các lỗi kỹ thuật lặp lại theo nhóm công việc.<br>6. Quản lý dịch vụ xem số liệu trên giao diện hoặc nhấn **Xuất file** (Excel / PDF) để tải báo cáo về máy tính. |
| **Luồng thay thế** | **[Đặt lại bộ lọc]** Tại bước 3, quản lý dịch vụ nhấn **Đặt lại**:<br>Hệ thống xóa các điều kiện lọc tùy chỉnh và đưa về khoảng thời gian mặc định của tháng hiện tại. |
| **Luồng ngoại lệ** | Tại bước 1, nếu người dùng không thuộc vai trò Quản lý dịch vụ (ví dụ: Lễ tân, Cố vấn hoặc Kỹ thuật viên cố tình truy cập đường dẫn này), hệ thống từ chối truy cập, hiển thị thông báo lỗi: *"Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng"* và chuyển hướng về trang làm việc tương ứng.<br><br>Tại bước 4, nếu khoảng thời gian chọn không hợp lệ (ngày bắt đầu lớn hơn ngày kết thúc), hệ thống hiển thị thông báo lỗi: *"Khoảng thời gian không hợp lệ"*. Use case quay lại bước 3. |
