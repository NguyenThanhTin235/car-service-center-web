## UC-17 – Đặt lịch hẹn (Create Appointment)

| **Mã Use case**    | UC-17 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lịch hẹn (Create Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ tạo mới dữ liệu lịch hẹn vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu lịch hẹn mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý lịch hẹn và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin lịch hẹn.<br>3. Nhân viên quầy dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu lịch hẹn mới, gửi email xác nhận đặt lịch cho khách hàng, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |
