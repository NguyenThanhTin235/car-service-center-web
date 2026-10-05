## UC-14 – Hủy lịch hẹn (Cancel Appointment)

| **Mã Use case**    | UC-14 |
| ------------------ | ------ |
| **Tên Use case**   | Hủy lịch hẹn (Cancel Appointment) |
| **Mô tả**          | Khách hàng thực hiện xóa hoặc vô hiệu hóa bản ghi lịch hẹn khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập, có quyền xóa và bản ghi lịch hẹn cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi lịch hẹn bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và chọn bản ghi lịch hẹn cần xử lý.<br>2. Khách hàng chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Khách hàng nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống gửi email thông báo hủy lịch, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, khách hàng chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |
