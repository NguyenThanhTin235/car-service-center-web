## UC-43 – Theo dõi hoạt động xưởng (Monitor Workshop)

| **Mã Use case**    | UC-43 |
| ------------------ | ------ |
| **Tên Use case**   | Theo dõi hoạt động xưởng (Monitor Workshop) |
| **Mô tả**          | Quản lý dịch vụ theo dõi trực quan tình hình hoạt động của xưởng, tiến độ các phiếu dịch vụ đang xử lý và các công việc bị chậm trễ để kịp thời điều phối. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị các chỉ số vận hành và danh sách phiếu dịch vụ đang xử lý tại xưởng.<br>Thất bại: Hệ thống thông báo lỗi nếu không tải được dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình **Bảng điều hành xưởng**.<br>2. Hệ thống tải và hiển thị 4 chỉ số KPI vận hành:<br>- Tổng số phiếu đang xử lý tại xưởng.<br>- Số phiếu chờ khách hàng phê duyệt báo giá.<br>- Số phiếu chờ thanh toán.<br>- Số công việc bị chậm tiến độ (quá 8 giờ từ khi bắt đầu).<br>3. Hệ thống hiển thị danh sách các phiếu dịch vụ đang hoạt động dưới dạng các thẻ thông tin (mã phiếu, biển số xe, dòng xe, cố vấn phụ trách, các dịch vụ thực hiện và cảnh báo quá hạn).<br>4. Quản lý dịch vụ có thể lọc danh sách theo trạng thái phiếu để kiểm tra từng nhóm xe.<br>5. Quản lý dịch vụ nhấn **Làm mới** để cập nhật dữ liệu tức thời khi cần.<br>6. Quản lý dịch vụ có thể chọn một phiếu cụ thể để chuyển sang màn hình xem chi tiết phiếu dịch vụ. |
| **Luồng thay thế** | **[Xưởng không có xe xử lý]** Tại bước 3, nếu xưởng chưa có xe nào đang thực hiện, hệ thống hiển thị thông báo "Hiện tại xưởng chưa có xe nào đang xử lý" và các chỉ số KPI hiển thị giá trị 0. |
| **Luồng ngoại lệ** | Tại bước 4, nếu không có phiếu nào khớp với bộ lọc trạng thái đã chọn, hệ thống thông báo "Không tìm thấy phiếu dịch vụ nào ở trạng thái đã chọn".<br><br>Tại bước 2, nếu mất kết nối máy chủ hoặc lỗi tải dữ liệu, hệ thống hiển thị thông báo lỗi và cho phép thử lại. |

---

---

## UC-53 – Xem báo cáo vận hành (View Operational Report)

| **Mã Use case**    | UC-53 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo cáo vận hành (View Operational Report) |
| **Mô tả**          | Quản lý dịch vụ tra cứu các báo cáo tổng hợp về doanh thu, tần suất dịch vụ và cảnh báo tồn kho phụ tùng để phục vụ quản lý và lập kế hoạch. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị số liệu thống kê, biểu đồ phân tích và bảng dữ liệu chi tiết theo loại báo cáo đã chọn.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình **Báo cáo vận hành**.<br>2. Quản lý dịch vụ chọn loại báo cáo cần xem (Báo cáo Doanh thu, Báo cáo Dịch vụ phổ biến hoặc Báo cáo Cảnh báo tồn kho).<br>3. Với báo cáo Doanh thu hoặc Dịch vụ, Quản lý dịch vụ chọn khoảng thời gian (Từ ngày - Đến ngày) và nhấn **Xem báo cáo** (mặc định từ đầu tháng đến ngày hiện tại). Với báo cáo Tồn kho, hệ thống tự động tải dữ liệu tồn kho hiện tại.<br>4. Hệ thống xử lý dữ liệu và hiển thị kết quả tương ứng:<br>- **Báo cáo Doanh thu:** Hiển thị tổng doanh thu, tổng số hóa đơn đã thanh toán, biểu đồ doanh thu theo ngày và bảng chi tiết từng ngày.<br>- **Báo cáo Dịch vụ:** Hiển thị tổng lượt dịch vụ, biểu đồ xếp hạng dịch vụ phổ biến nhất và bảng thống kê số lượt.<br>- **Báo cáo Tồn kho:** Hiển thị số lượng phụ tùng chạm/dưới mức an toàn và bảng chi tiết các phụ tùng cần bổ sung (mã SKU, tên, tồn thực tế, mức an toàn, số lượng thiếu hụt). |
| **Luồng thay thế** | **[Kho phụ tùng an toàn]** Tại bước 4 với báo cáo tồn kho, nếu tất cả phụ tùng đều đạt số lượng an toàn, hệ thống thông báo kho đang ở trạng thái đảm bảo, không có mã hàng nào dưới ngưỡng cảnh báo. |
| **Luồng ngoại lệ** | Tại bước 4 với báo cáo Doanh thu hoặc Dịch vụ, nếu không có giao dịch nào trong khoảng thời gian đã chọn, hệ thống thông báo "Không có dữ liệu trong khoảng thời gian đã chọn" và các chỉ số hiển thị bằng 0.<br><br>Tại bước 3, nếu khoảng thời gian không hợp lệ (ngày bắt đầu lớn hơn ngày kết thúc), hệ thống hiển thị thông báo lỗi yêu cầu chọn lại. |
