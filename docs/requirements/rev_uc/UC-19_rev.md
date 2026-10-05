## UC-19 – Dời lịch hẹn (Reschedule Appointment)

| **Mã Use case**    | UC-19 |
| ------------------ | ------ |
| **Tên Use case**   | Dời lịch hẹn (Reschedule Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ chỉnh sửa và cập nhật lại thông tin của lịch hẹn hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi lịch hẹn cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của lịch hẹn được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi lịch hẹn cần chỉnh sửa.<br>2. Nhân viên quầy dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Nhân viên quầy dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, gửi email thông báo dời lịch cho khách hàng, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |
