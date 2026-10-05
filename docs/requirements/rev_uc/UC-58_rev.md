# UC-58 – Thêm dịch vụ (Create Service)

> **Phiên bản:** Sửa đổi  
> **Lý do sửa:** Bổ sung bước người dùng chọn kiểu tính giá – thông tin bắt buộc chưa được đặc tả mô tả.

---

## Nội dung sửa đổi

| **Mã Use case**    | UC-58 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm dịch vụ (Create Service) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu dịch vụ vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu dịch vụ mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý dịch vụ và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin dịch vụ.<br>3. Quản trị viên nhập tên, mô tả dịch vụ, chọn danh mục và chọn **kiểu tính giá** (Giá cố định / Theo kích thước xe / Theo nhân công và phụ tùng thực tế).<br>4. Hệ thống hiển thị trường nhập giá tương ứng với kiểu tính giá đã chọn. Quản trị viên nhập mức giá.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>7. Hệ thống lưu dữ liệu dịch vụ mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc (tên, kiểu tính giá, mức giá), hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng tên), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

## So sánh với phiên bản gốc

| Vị trí | Nội dung gốc | Nội dung mới |
|--------|-------------|--------------|
| Luồng cơ bản – bước 3 | "Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác." | Tách thành bước 3 và bước 4: chọn kiểu tính giá → hệ thống hiển thị trường giá tương ứng → nhập giá. |
| Luồng cơ bản – bước 4 | "Quản trị viên nhấn **Lưu** hoặc **Xác nhận**." | Dời thành bước 5. |
| Luồng cơ bản – bước 5 | "Hệ thống kiểm tra..." | Dời thành bước 6. |
| Luồng cơ bản – bước 6 | "Hệ thống lưu..." | Dời thành bước 7. |
| Luồng ngoại lệ | "thiếu thông tin bắt buộc" (chung chung) | Bổ sung ví dụ cụ thể: tên, kiểu tính giá, mức giá. |
