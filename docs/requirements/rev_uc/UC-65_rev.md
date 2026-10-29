# UC-65 – Xóa danh mục dịch vụ (Delete Service Category)

> **Phiên bản:** Sửa đổi  
> **Lý do sửa:** (1) Loại bỏ từ ngữ kỹ thuật `is_active = false` trong luồng cơ bản. (2) Mô tả đúng hành vi thực tế: hệ thống tự xử lý 2 trường hợp (xóa hẳn hoặc vô hiệu hóa) thay vì từ chối và báo lỗi. (3) Sửa lại luồng ngoại lệ cho khớp với hành vi thực tế.

---

## Nội dung sửa đổi

| **Mã Use case**    | UC-65 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa danh mục dịch vụ (Delete Service Category) |
| **Mô tả**          | Quản trị viên xóa danh mục dịch vụ khi không còn nhu cầu sử dụng. Nếu danh mục chưa có dịch vụ nào phụ thuộc, hệ thống sẽ xóa hẳn. Nếu đã có dịch vụ phụ thuộc, hệ thống sẽ vô hiệu hóa danh mục thay vì xóa để bảo toàn dữ liệu liên quan. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập và danh mục dịch vụ cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Danh mục được xóa hẳn hoặc chuyển sang trạng thái **Ngừng hoạt động** tùy theo điều kiện.<br>Thất bại: Hệ thống thông báo lỗi, danh mục được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên chọn danh mục cần xóa.<br>2. Quản trị viên chọn hành động **Xóa**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra xem danh mục đã có dịch vụ nào phụ thuộc chưa.<br>6. **Nếu chưa có dịch vụ phụ thuộc:** Hệ thống xóa hẳn danh mục khỏi hệ thống, hiển thị thông báo thành công và cập nhật lại danh sách.<br>6a. **Nếu đã có dịch vụ phụ thuộc:** Hệ thống chuyển danh mục sang trạng thái **Ngừng hoạt động**, hiển thị thông báo giải thích và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6a, nếu danh mục đã ở trạng thái **Ngừng hoạt động** trước đó và vẫn còn dịch vụ phụ thuộc, hệ thống hiển thị thông báo lỗi giải thích rằng danh mục không thể xóa do còn dịch vụ đang sử dụng. |

---

## So sánh với phiên bản gốc

| Vị trí | Nội dung gốc | Nội dung mới |
|--------|-------------|--------------|
| **Mô tả** | "Quản trị viên xóa hoặc vô hiệu hóa danh mục dịch vụ khi không còn sử dụng." | Bổ sung giải thích cụ thể về 2 trường hợp xử lý (xóa hẳn / vô hiệu hóa). |
| **Tiền điều kiện** | "Danh mục dịch vụ tồn tại." | Bổ sung yêu cầu Quản trị viên đã đăng nhập (nhất quán với các UC khác). |
| **Hậu điều kiện** | "Danh mục bị vô hiệu hóa hoặc xóa." | Làm rõ 2 trường hợp: "xóa hẳn hoặc chuyển sang Ngừng hoạt động tùy theo điều kiện." |
| **Luồng cơ bản – bước 5** | "Hệ thống kiểm tra ràng buộc (nếu danh mục đã có dịch vụ phụ thuộc thì **không cho phép xóa cứng**)." | Bỏ từ "xóa cứng", sửa thành ngôn ngữ hành vi rõ ràng. |
| **Luồng cơ bản – bước 6** | "Hệ thống thực hiện xóa mềm (**chuyển is_active = false**) và cập nhật danh sách." | Xóa hoàn toàn thuật ngữ kỹ thuật. Tách thành bước 6 và bước 6a mô tả 2 nhánh hành vi. |
| **Luồng ngoại lệ** | "hệ thống từ chối và **yêu cầu gỡ bỏ dịch vụ thuộc danh mục trước**." | Sửa lại: hệ thống không yêu cầu người dùng gỡ bỏ thủ công mà chỉ thông báo lỗi khi đã vô hiệu hóa trước đó. |
