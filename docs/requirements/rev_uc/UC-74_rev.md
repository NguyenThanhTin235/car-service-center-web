## UC-74 – Gửi email nhắc hẹn tự động (Auto Reminder)

| **Mã Use case**    | UC-74 |
| ------------------ | ------ |
| **Tên Use case**   | Gửi email nhắc hẹn tự động (Auto Reminder) |
| **Mô tả**          | Hệ thống tự động quét các lịch hẹn sắp diễn ra trong vòng 24 giờ tới và gửi email nhắc nhở cho khách hàng. |
| **Đối tượng**      | Hệ thống (System / Background Job) |
| **Tiền điều kiện** | Hệ thống đang hoạt động. Có lịch hẹn ở trạng thái REQUESTED, CONFIRMED hoặc RESCHEDULED chuẩn bị diễn ra trong 24h tới. Khách hàng có địa chỉ email hợp lệ. |
| **Hậu điều kiện**  | Thành công: Email nhắc nhở được gửi tới khách hàng.<br>Thất bại: Hệ thống ghi log lỗi (nếu lỗi gửi mail), không làm gián đoạn hệ thống. |
| **Luồng cơ bản**   | 1. Đến chu kỳ định kỳ (ví dụ mỗi giờ 1 lần), hệ thống tự động kích hoạt Job nhắc hẹn.<br>2. Hệ thống tìm kiếm các lịch hẹn thỏa mãn điều kiện thời gian (còn 23.5h - 24.5h nữa là đến giờ hẹn).<br>3. Hệ thống tạo nội dung email nhắc nhở (thời gian, ngày tháng, biển số xe).<br>4. Hệ thống gọi dịch vụ gửi email để gửi thư cho khách hàng.<br>5. Hệ thống ghi nhận log kết quả gửi (Thành công/Thất bại). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu dịch vụ SMTP/Email lỗi mạng hoặc từ chối kết nối, hệ thống sẽ ghi log lỗi và tiếp tục xử lý các lịch hẹn tiếp theo (bỏ qua lịch bị lỗi). |
