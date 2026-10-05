# UC-60 – Cập nhật dịch vụ (Update Service)

> **Phiên bản:** Sửa đổi  
> **Lý do sửa:** Bổ sung nội dung cho phép cập nhật kiểu tính giá và mức giá – thông tin bắt buộc chưa được đặc tả mô tả.

---

## Nội dung sửa đổi

| **Mã Use case**    | UC-60 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật dịch vụ (Update Service) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của dịch vụ hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi dịch vụ cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của dịch vụ được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi dịch vụ cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết, bao gồm tên, mô tả, danh mục, kiểu tính giá và mức giá tương ứng.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng tên), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi hoặc xóa trước đó, hệ thống thông báo lỗi và yêu cầu tải lại dữ liệu. |

---

## So sánh với phiên bản gốc

| Vị trí | Nội dung gốc | Nội dung mới |
|--------|-------------|--------------|
| Luồng cơ bản – bước 4 | "Quản trị viên thay đổi các trường thông tin cần thiết." | Bổ sung liệt kê cụ thể: "bao gồm tên, mô tả, danh mục, kiểu tính giá và mức giá tương ứng." |
| Luồng ngoại lệ – bước 7 | "nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu." | Bỏ từ kỹ thuật "conflict", sửa thành ngôn ngữ hành vi: "hệ thống thông báo lỗi và yêu cầu tải lại dữ liệu." |
