# ĐẶC TẢ USE CASE – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ

> **Phiên bản:** 3.1
> **Cập nhật:** 2026-10-10

---

## MỤC LỤC

| Nhóm | UC ID | Số lượng |
|------|-------|----------|
| **Khách vãng lai (Guest)** | UC-01 → UC-03 | 3 use case |
| **Khách hàng (Customer)** | UC-04 → UC-16, UC-79 | 14 use case |
| **Nhân viên quầy dịch vụ (Front Desk Staff)** | UC-17 → UC-28 | 12 use case |
| **Cố vấn dịch vụ (Service Advisor)** | UC-29 → UC-42 | 14 use case |
| **Quản lý dịch vụ & Kho (Service Manager)** | UC-43 → UC-53 | 11 use case |
| **Quản trị viên (Administrator)** | UC-54 → UC-77 | 24 use case |
| **Hệ thống tự động (Background Jobs)** | UC-78 | 1 use case |
| **Tổng cộng** | **UC-01 → UC-79** | **79 use case** |

---

# PHẦN 1 – KHÁCH VÃNG LAI (GUEST)

---


## UC-01 – Xem thông tin website

| **Mã Use case**    | UC-01 |
| ------------------ | ------ |
| **Tên Use case**   | Xem thông tin website |
| **Mô tả**          | Mọi người dùng kể cả chưa đăng nhập đều có thể xem thông tin công khai: trang chủ, danh mục và chi tiết các dịch vụ, bảng giá tham khảo và câu hỏi thường gặp (FAQ). |
| **Đối tượng**      | Khách vãng lai (Guest) / Khách hàng (Customer) |
| **Tiền điều kiện** | Không có. Người dùng truy cập trực tiếp từ trình duyệt. |
| **Hậu điều kiện**  | Thành công: Người dùng xem được thông tin công khai và danh mục dịch vụ mong muốn. |
| **Luồng cơ bản**   | 1. Người dùng truy cập địa chỉ website của trung tâm.<br>2. Hệ thống hiển thị trang chủ với thông tin giới thiệu, dịch vụ nổi bật và lời mời đặt lịch.<br>3. Người dùng vào trang **Dịch vụ** để xem danh mục phân theo nhóm (Sửa chữa, Bảo dưỡng, Rửa xe, Detailing).<br>4. Người dùng chọn một dịch vụ để xem chi tiết mô tả và giá tham khảo. |
| **Luồng thay thế** | **[Xem FAQ]** Tại bước 2, người dùng điều hướng đến trang **FAQ** thay vì trang **Dịch vụ**:<br>2a. Hệ thống hiển thị danh sách câu hỏi thường gặp và câu trả lời tương ứng. |
| **Luồng ngoại lệ** | Không có. |

---

---

## UC-02 – Đăng ký tài khoản (Register)

| **Mã Use case**    | UC-02 |
| ------------------ | ------ |
| **Tên Use case**   | Đăng ký tài khoản (Register) |
| **Mô tả**          | Khách vãng lai tự tạo tài khoản mới trên hệ thống bằng cách cung cấp thông tin cá nhân và mật khẩu. Hệ thống gửi mã xác thực OTP về email để xác minh danh tính trước khi hoàn tất đăng ký. |
| **Đối tượng**      | Khách vãng lai (Guest) |
| **Tiền điều kiện** | Khách vãng lai chưa có tài khoản và có địa chỉ email hợp lệ chưa được đăng ký trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Tài khoản được tạo, khách hàng được tự động đăng nhập và chuyển đến trang chủ.<br>Thất bại: Hệ thống thông báo lỗi, tài khoản không được tạo. |
| **Luồng cơ bản**   | 1. Khách vãng lai truy cập trang đăng ký.<br>2. Khách vãng lai điền đầy đủ thông tin: họ tên, số điện thoại, địa chỉ email và mật khẩu.<br>3. Khách vãng lai nhấn nút **Đăng ký**.<br>4. Hệ thống kiểm tra email và số điện thoại chưa tồn tại trong hệ thống.<br>5. Hệ thống gửi mã OTP có hiệu lực 5 phút về địa chỉ email đã nhập.<br>6. Khách vãng lai mở email và nhập mã OTP nhận được vào ô xác thực.<br>7. Khách vãng lai nhấn **Xác thực mã**.<br>8. Hệ thống xác minh mã OTP còn hiệu lực, tạo tài khoản, tự động đăng nhập và chuyển khách hàng đến trang chủ. |
| **Luồng thay thế** | **[Gửi lại mã OTP]** Tại bước 6, nếu khách vãng lai chưa nhận được mã hoặc mã đã hết hiệu lực:<br>6a. Khách vãng lai chọn **Gửi lại mã**.<br>7a. Hệ thống gửi mã OTP mới và tính lại 5 phút hiệu lực.<br>8a. Quay lại bước 6. |
| **Luồng ngoại lệ** | Tại bước 4, nếu email hoặc số điện thoại đã tồn tại trong hệ thống, hệ thống hiển thị thông báo yêu cầu dùng thông tin khác. Use case quay lại bước 2.<br><br>Tại bước 8, nếu mã OTP không đúng hoặc đã hết hiệu lực, hệ thống thông báo lỗi và cho phép nhập lại hoặc gửi lại mã. |

---

---

## UC-03 – Đăng nhập (Login)

| **Mã Use case**    | UC-03 |
| ------------------ | ------ |
| **Tên Use case**   | Đăng nhập (Login) |
| **Mô tả**          | Người dùng đăng nhập vào hệ thống bằng email và mật khẩu để truy cập các chức năng tương ứng với vai trò của mình. |
| **Đối tượng**      | Tất cả người dùng đã có tài khoản. |
| **Tiền điều kiện** | Người dùng đã có tài khoản và chưa đăng nhập. |
| **Hậu điều kiện**  | Thành công: Phiên làm việc được mở, người dùng được chuyển đến trang chủ tương ứng với vai trò.<br>Thất bại: Hệ thống thông báo lỗi, phiên không được mở. |
| **Luồng cơ bản**   | 1. Người dùng truy cập trang đăng nhập.<br>2. Người dùng nhập địa chỉ email và mật khẩu.<br>3. Người dùng nhấn **Đăng nhập**.<br>4. Hệ thống xác thực thông tin và mở phiên làm việc.<br>5. Hệ thống chuyển người dùng đến trang chủ tương ứng với vai trò. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu email không tồn tại hoặc mật khẩu không đúng, hệ thống hiển thị thông báo lỗi xác thực. Use case quay lại bước 2. |

---

# PHẦN 2 – KHÁCH HÀNG (CUSTOMER)

---

---

## UC-04 – Đăng xuất (Logout)

| **Mã Use case**    | UC-04 |
| ------------------ | ------ |
| **Tên Use case**   | Đăng xuất (Logout) |
| **Mô tả**          | Người dùng kết thúc phiên làm việc hiện tại trên hệ thống. Thao tác này áp dụng cho tất cả các vai trò trong hệ thống. |
| **Đối tượng**      | Tất cả người dùng đã đăng nhập |
| **Tiền điều kiện** | Người dùng đang trong phiên đăng nhập. |
| **Hậu điều kiện**  | Thành công: Phiên làm việc kết thúc, hệ thống chuyển người dùng về trang đăng nhập. |
| **Luồng cơ bản**   | 1. Người dùng chọn **Đăng xuất** từ menu góc trên bên phải.<br>2. Hệ thống hiển thị hộp xác nhận.<br>3. Người dùng nhấn **Xác nhận**.<br>4. Hệ thống hủy phiên làm việc hiện tại và xóa dữ liệu phiên khỏi bộ nhớ.<br>5. Hệ thống chuyển người dùng về trang đăng nhập. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

---

## UC-05 – Khôi phục mật khẩu

| **Mã Use case**    | UC-05 |
| ------------------ | ------ |
| **Tên Use case**   | Khôi phục mật khẩu |
| **Mô tả**          | Khách hàng quên mật khẩu có thể yêu cầu đặt lại mật khẩu ngay tại trang đăng nhập. Hệ thống gửi mã xác thực OTP về địa chỉ email đã đăng ký để xác minh danh tính trước khi cho phép đặt mật khẩu mới. Chức năng này chỉ dành riêng cho Khách hàng; tài khoản nhân viên do Quản trị viên cấp và đặt lại mật khẩu thông qua UC-56. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng có tài khoản trong hệ thống và có quyền truy cập vào hộp thư email đã đăng ký. |
| **Hậu điều kiện**  | Thành công: Mật khẩu mới được cập nhật; khách hàng được chuyển đến trang đăng nhập.<br>Thất bại: Hệ thống thông báo lỗi, mật khẩu không thay đổi. |
| **Luồng cơ bản**   | 1. Tại trang đăng nhập, khách hàng chọn **Quên mật khẩu**.<br>2. Khách hàng nhập địa chỉ email đã đăng ký và nhấn **Gửi mã OTP**.<br>3. Hệ thống kiểm tra email tồn tại và gửi mã OTP có hiệu lực 5 phút về hộp thư email.<br>4. Khách hàng mở email và nhập mã OTP nhận được vào ô xác thực.<br>5. Khách hàng nhấn **Xác thực mã**.<br>6. Hệ thống xác minh mã OTP còn hiệu lực và cho phép đặt mật khẩu mới.<br>7. Khách hàng nhập mật khẩu mới và nhập lại để xác nhận.<br>8. Khách hàng nhấn **Xác nhận**.<br>9. Hệ thống cập nhật mật khẩu mới và chuyển khách hàng về trang đăng nhập. |
| **Luồng thay thế** | **[Gửi lại mã OTP]** Tại bước 4, nếu khách hàng chưa nhận được mã hoặc mã đã hết hiệu lực:<br>4a. Khách hàng chọn **Gửi lại mã**.<br>5a. Hệ thống gửi mã OTP mới và tính lại 5 phút hiệu lực.<br>6a. Khách hàng quay lại bước 4. |
| **Luồng ngoại lệ** | Tại bước 3, nếu email không tồn tại trong hệ thống, hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại từ bước 2.<br>Tại bước 5, nếu mã OTP không đúng, hệ thống thông báo lỗi; khách hàng có thể thử lại hoặc chọn Gửi lại mã.<br>Tại bước 8, nếu mật khẩu mới và mật khẩu xác nhận không khớp, hệ thống thông báo lỗi và yêu cầu nhập lại từ bước 7. |

---

---

## UC-06 – Cập nhật hồ sơ cá nhân (Update Profile)

| **Mã Use case**    | UC-06 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật hồ sơ cá nhân (Update Profile) |
| **Mô tả**          | Khách hàng xem và cập nhật thông tin cá nhân của mình trong hệ thống, bao gồm họ tên, số điện thoại và địa chỉ. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin cá nhân được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, thông tin không thay đổi. |
| **Luồng cơ bản**   | 1. Khách hàng chọn mục **Hồ sơ cá nhân** trên menu.<br>2. Hệ thống hiển thị thông tin hiện tại của khách hàng.<br>3. Khách hàng chỉnh sửa các thông tin cần cập nhật: họ tên, số điện thoại, địa chỉ.<br>4. Khách hàng nhấn **Lưu**.<br>5. Hệ thống lưu thông tin mới và hiển thị thông báo cập nhật thành công. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

---

## UC-07 – Thêm phương tiện (Create Vehicle)

| **Mã Use case**    | UC-07 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm phương tiện (Create Vehicle) |
| **Mô tả**          | Khách hàng tạo mới dữ liệu phương tiện vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu phương tiện mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý phương tiện và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin phương tiện.<br>3. Khách hàng nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu phương tiện mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-08 – Xem phương tiện (View Vehicle)

| **Mã Use case**    | UC-08 |
| ------------------ | ------ |
| **Tên Use case**   | Xem phương tiện (View Vehicle) |
| **Mô tả**          | Khách hàng tra cứu, tìm kiếm và xem chi tiết thông tin của phương tiện đã có trong hệ thống. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết phương tiện được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý phương tiện.<br>2. Hệ thống tải và hiển thị danh sách phương tiện hiện có.<br>3. Khách hàng có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Khách hàng chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc khách hàng không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-09 – Cập nhật phương tiện (Update Vehicle)

| **Mã Use case**    | UC-09 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật phương tiện (Update Vehicle) |
| **Mô tả**          | Khách hàng chỉnh sửa và cập nhật lại thông tin của phương tiện hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập, có quyền cập nhật và bản ghi phương tiện cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của phương tiện được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và mở chi tiết bản ghi phương tiện cần chỉnh sửa.<br>2. Khách hàng chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Khách hàng thay đổi các trường thông tin cần thiết.<br>5. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-10 – Xóa phương tiện (Delete Vehicle)

| **Mã Use case**    | UC-10 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa phương tiện (Delete Vehicle) |
| **Mô tả**          | Khách hàng thực hiện xóa hoặc vô hiệu hóa bản ghi phương tiện khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập, có quyền xóa và bản ghi phương tiện cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi phương tiện bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và chọn bản ghi phương tiện cần xử lý.<br>2. Khách hàng chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Khách hàng nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, khách hàng chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-11 – Đặt lịch hẹn (Create Appointment)

| **Mã Use case**    | UC-11 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lịch hẹn (Create Appointment) |
| **Mô tả**          | Khách hàng tạo mới dữ liệu lịch hẹn vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu lịch hẹn mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý lịch hẹn và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin lịch hẹn.<br>3. Khách hàng nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu lịch hẹn mới, gửi email thông báo đặt lịch thành công, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-12 – Xem lịch hẹn (View Appointment)

| **Mã Use case**    | UC-12 |
| ------------------ | ------ |
| **Tên Use case**   | Xem lịch hẹn (View Appointment) |
| **Mô tả**          | Khách hàng tra cứu, tìm kiếm và xem chi tiết thông tin của lịch hẹn đã có trong hệ thống. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết lịch hẹn được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý lịch hẹn.<br>2. Hệ thống tải và hiển thị danh sách lịch hẹn hiện có.<br>3. Khách hàng có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Khách hàng chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc khách hàng không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-13 – Dời lịch hẹn (Reschedule Appointment)

| **Mã Use case**    | UC-13 |
| ------------------ | ------ |
| **Tên Use case**   | Dời lịch hẹn (Reschedule Appointment) |
| **Mô tả**          | Khách hàng chỉnh sửa và cập nhật lại thông tin của lịch hẹn hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập, có quyền cập nhật và bản ghi lịch hẹn cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của lịch hẹn được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và mở chi tiết bản ghi lịch hẹn cần chỉnh sửa.<br>2. Khách hàng chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Khách hàng thay đổi các trường thông tin cần thiết.<br>5. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, gửi email thông báo dời lịch, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

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

---

---

## UC-15 – Theo dõi tiến độ sửa chữa (Track Repair Progress)

| **Mã Use case**    | UC-15 |
| ------------------ | ------ |
| **Tên Use case**   | Theo dõi tiến độ sửa chữa (Track Repair Progress) |
| **Mô tả**          | Khách hàng xem trạng thái tổng quát của xe đang được xử lý: đang ở bước nào, hạng mục nào đã xong, hạng mục nào đang thực hiện và các vấn đề phát hiện trên xe mà nhân viên đã chia sẻ. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Xe của khách hàng đang có phiếu công việc hoạt động trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Khách hàng xem được trạng thái tiến độ theo từng dịch vụ. |
| **Luồng cơ bản**   | 1. Khách hàng vào mục **Theo dõi tiến độ**.<br>2. Hệ thống hiển thị danh sách các phiếu công việc đang hoạt động.<br>3. Khách hàng chọn phiếu muốn xem.<br>4. Hệ thống hiển thị trạng thái tổng quát (Đang kiểm tra, Đang sửa chữa, Chờ phụ tùng, Hoàn thành) và danh sách từng dịch vụ kèm trạng thái.<br>5. Khách hàng có thể xem chi tiết các vấn đề phát hiện mà nhân viên đã công khai. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-16 – Xem hóa đơn (View Invoice)

| **Mã Use case**    | UC-16 |
| ------------------ | ------ |
| **Tên Use case**   | Xem hóa đơn (View Invoice) |
| **Mô tả**          | Khách hàng xem hóa đơn của phiếu công việc để biết số tiền cần thanh toán, kiểm tra chi tiết các hạng mục và trạng thái đã thanh toán hay chưa. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Phiếu công việc của khách hàng đã có hóa đơn được phát hành. |
| **Hậu điều kiện**  | Thành công: Khách hàng xem được chi tiết hóa đơn và trạng thái thanh toán. |
| **Luồng cơ bản**   | 1. Khách hàng vào mục **Hóa đơn** hoặc từ trang **Theo dõi tiến độ** chọn **Xem hóa đơn**.<br>2. Hệ thống hiển thị danh sách hạng mục hóa đơn (dịch vụ, nhân công, phụ tùng, phí), tổng tiền và trạng thái thanh toán (**Chưa thanh toán** hoặc **Đã thanh toán**).<br>3. Khách hàng xem thông tin chi tiết và có thể tải xuống hóa đơn dưới dạng PDF. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |



# PHẦN 3 – NHÂN VIÊN QUẦY DỊCH VỤ (FRONT DESK STAFF)

---

---

## UC-17 – Đặt lịch hẹn (Create Appointment)

| **Mã Use case**    | UC-17 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lịch hẹn (Create Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ tạo mới dữ liệu lịch hẹn vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu lịch hẹn mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý lịch hẹn và chọn **Thêm lịch hẹn mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin lịch hẹn.<br>3. Nhân viên quầy dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Nhân viên quầy dịch vụ nhấn **Lưu lịch hẹn**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu lịch hẹn mới, gửi email xác nhận đặt lịch cho khách hàng, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

## UC-18 – Xem lịch hẹn (View Appointment)

| **Mã Use case**    | UC-18 |
| ------------------ | ------ |
| **Tên Use case**   | Xem lịch hẹn (View Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin của lịch hẹn đã có trong hệ thống. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết lịch hẹn được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý lịch hẹn.<br>2. Hệ thống tải và hiển thị danh sách lịch hẹn hiện có.<br>3. Nhân viên quầy dịch vụ có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Nhân viên quầy dịch vụ chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc nhân viên quầy dịch vụ không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-19 – Dời lịch hẹn (Reschedule Appointment)

| **Mã Use case**    | UC-19 |
| ------------------ | ------ |
| **Tên Use case**   | Dời lịch hẹn (Reschedule Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ chỉnh sửa và cập nhật lại thông tin của lịch hẹn hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi lịch hẹn cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của lịch hẹn được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi lịch hẹn cần chỉnh sửa.<br>2. Nhân viên quầy dịch vụ chọn **Đổi giờ hẹn**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Nhân viên quầy dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Nhân viên quầy dịch vụ nhấn **Cập nhật**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, gửi email thông báo dời lịch cho khách hàng, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-20 – Hủy lịch hẹn (Cancel Appointment)

| **Mã Use case**    | UC-20 |
| ------------------ | ------ |
| **Tên Use case**   | Hủy lịch hẹn (Cancel Appointment) |
| **Mô tả**          | Nhân viên quầy dịch vụ thực hiện xóa hoặc vô hiệu hóa bản ghi lịch hẹn khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập, có quyền xóa và bản ghi lịch hẹn cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi lịch hẹn bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và chọn bản ghi lịch hẹn cần xử lý.<br>2. Nhân viên quầy dịch vụ chọn hành động **Hủy hẹn**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo, yêu cầu chọn lý do hủy và xác nhận thao tác.<br>4. Nhân viên quầy dịch vụ chọn lý do hủy và nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện cập nhật lý do, xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống gửi email thông báo hủy lịch cho khách hàng, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, nhân viên quầy dịch vụ chọn **Quay lại**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-21 – Tiếp nhận xe (Receive Vehicle)

| **Mã Use case**    | UC-21 |
| ------------------ | ------ |
| **Tên Use case**   | Tiếp nhận xe (Receive Vehicle) |
| **Mô tả**          | Nhân viên quầy đánh dấu khách có lịch hẹn đã đến, hoặc tạo phiếu tiếp nhận cho khách đến không có lịch (Walk-in) và xe được kéo đến (Tow-in). Mọi xe sau tiếp nhận đều vào hàng đợi để Cố vấn dịch vụ xử lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Với Đánh dấu đã đến: Lịch hẹn đã ở trạng thái **Đã xác nhận**.<br>Với Walk-in / Tow-in: Khách hàng và xe đã có hoặc được tạo mới trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Xe được đưa vào hàng đợi tiếp nhận, sẵn sàng để Cố vấn dịch vụ tạo phiếu công việc.<br>Thất bại: Hệ thống thông báo lỗi, xe không được tiếp nhận. |
| **Luồng cơ bản**   | 1. Nhân viên tìm lịch hẹn của khách trong danh sách **Lịch hẹn hôm nay**.<br>2. Nhân viên chọn đúng lịch hẹn của khách hàng vừa đến.<br>3. Nhân viên nhấn **Đánh dấu đã đến**.<br>4. Hệ thống cập nhật trạng thái lịch hẹn thành **Đã đến** và đưa xe vào hàng đợi tiếp nhận. |
| **Luồng thay thế** | **[Tiếp nhận Walk-in]** Tại bước 1, thay vì tìm lịch hẹn, nhân viên tiếp nhận khách không có lịch:<br>1a. Nhân viên chọn **Tiếp nhận Walk-in**.<br>2a. Nhân viên tìm hoặc tạo mới khách hàng và xe (UC-13).<br>3a. Nhân viên ghi nhận thời điểm đến và nhu cầu dịch vụ.<br>4a. Nhân viên nhấn **Lưu**.<br>5a. Hệ thống tạo phiếu tiếp nhận và đưa xe vào hàng đợi.<br><br>**[Tiếp nhận Tow-in]** Tại bước 1, nhân viên tiếp nhận xe kéo đến:<br>1b. Nhân viên chọn **Tiếp nhận Tow-in**.<br>2b. Nhân viên tìm hoặc tạo mới khách hàng và xe.<br>3b. Nhân viên nhập thời điểm đến và tên người / đơn vị bàn giao xe.<br>4b. Nhân viên nhấn **Lưu**.<br>5b. Hệ thống tạo phiếu tiếp nhận và đưa xe vào hàng đợi. |
| **Luồng ngoại lệ** | Tại bước 3 của luồng cơ bản, nếu lịch hẹn chưa được xác nhận, hệ thống thông báo và yêu cầu xác nhận lịch trước (UC-11). |

---

---

## UC-22 – Thêm hồ sơ khách hàng (Create Customer Profile)

| **Mã Use case**    | UC-22 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm hồ sơ khách hàng (Create Customer Profile) |
| **Mô tả**          | Nhân viên quầy dịch vụ tạo mới dữ liệu hồ sơ khách hàng vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu hồ sơ khách hàng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý hồ sơ khách hàng và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin hồ sơ khách hàng.<br>3. Nhân viên quầy dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Nhân viên quầy dịch vụ nhấn **Lưu khách hàng**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu hồ sơ khách hàng mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy bỏ**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---


---

## UC-23 – Xem hồ sơ khách hàng (View Customer Profile)

| **Mã Use case**    | UC-23 |
| ------------------ | ------ |
| **Tên Use case**   | Xem hồ sơ khách hàng (View Customer Profile) |
| **Mô tả**          | Nhân viên quầy dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin của hồ sơ khách hàng đã có trong hệ thống. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết hồ sơ khách hàng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý hồ sơ khách hàng.<br>2. Hệ thống tải và hiển thị danh sách hồ sơ khách hàng hiện có.<br>3. Nhân viên quầy dịch vụ có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Nhân viên quầy dịch vụ chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc nhân viên quầy dịch vụ không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-24 – Cập nhật hồ sơ khách hàng (Update Customer Profile)

| **Mã Use case**    | UC-24 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật hồ sơ khách hàng (Update Customer Profile) |
| **Mô tả**          | Nhân viên quầy dịch vụ chỉnh sửa và cập nhật lại thông tin của hồ sơ khách hàng hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi hồ sơ khách hàng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của hồ sơ khách hàng được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi hồ sơ khách hàng cần chỉnh sửa.<br>2. Nhân viên quầy dịch vụ chọn **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Nhân viên quầy dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Nhân viên quầy dịch vụ nhấn **Lưu thay đổi**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy bỏ**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-25 – Xóa hồ sơ khách hàng (Delete Customer Profile)

| **Mã Use case**    | UC-25 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa hồ sơ khách hàng (Delete Customer Profile) |
| **Mô tả**          | Nhân viên quầy dịch vụ thực hiện xóa hoặc vô hiệu hóa bản ghi hồ sơ khách hàng khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy dịch vụ đã đăng nhập, có quyền xóa và bản ghi hồ sơ khách hàng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi hồ sơ khách hàng bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | **[Vô hiệu hóa khách hàng]**<br>1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và chọn bản ghi hồ sơ khách hàng cần xử lý.<br>2. Nhân viên quầy dịch vụ chọn hành động **Vô hiệu hóa**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Nhân viên quầy dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra khách hàng có phiếu công việc chưa hoàn thành, hóa đơn chưa thanh toán hoặc lịch hẹn đang mở hay không.<br>6. Hệ thống thực hiện vô hiệu hóa (chuyển trạng thái hoạt động sang false).<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Xóa vĩnh viễn khách hàng]** Tại bước 2, nhân viên chọn **Xóa vĩnh viễn**:<br>2a. Hệ thống hiển thị cảnh báo không thể khôi phục và yêu cầu xác nhận.<br>3a. Nhân viên nhấn **Xác nhận**.<br>4a. Hệ thống kiểm tra khách hàng không có dữ liệu giao dịch liên quan.<br>5a. Hệ thống tiến hành xóa dữ liệu phương tiện, vai trò và xóa vĩnh viễn hồ sơ khách hàng khỏi hệ thống.<br>6a. Hệ thống hiển thị thông báo thành công và cập nhật danh sách.<br><br>**[Hủy thao tác]** Tại bước 3 hoặc 3a, nhân viên chọn **Hủy bỏ**:<br>Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | **[Vô hiệu hóa thất bại]** Tại bước 5 của luồng cơ bản, nếu khách hàng đang có phiếu công việc chưa hoàn thành, hóa đơn chưa thanh toán hoặc lịch hẹn đang mở, hệ thống từ chối vô hiệu hóa và hiển thị thông báo lỗi cụ thể (ví dụ: Không thể xóa do khách hàng đang có hóa đơn chưa thanh toán).<br><br>**[Xóa vĩnh viễn thất bại]** Tại bước 4a của luồng thay thế, nếu có dữ liệu liên quan không thể xóa, hệ thống từ chối xóa và hiển thị thông báo lỗi "Không thể xóa vĩnh viễn khách hàng vì có dữ liệu liên quan". |

---


---

## UC-26 – Xem phiếu công việc (View Work Order)

| **Mã Use case**    | UC-26 |
| ------------------ | ------ |
| **Tên Use case**   | Xem phiếu công việc (View Work Order) |
| **Mô tả**          | Nhân viên quầy tra cứu trạng thái tổng quát của phiếu công việc để trả lời thắc mắc của khách hàng, ví dụ xe xong chưa, đang làm đến bước nào. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Nhân viên đã đăng nhập. Phiếu công việc cần tra cứu đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Nhân viên xem được thông tin tóm tắt cần thiết. |
| **Luồng cơ bản**   | 1. Nhân viên nhập tên khách hàng, biển số xe hoặc mã phiếu vào ô tìm kiếm.<br>2. Hệ thống hiển thị danh sách kết quả phù hợp.<br>3. Nhân viên chọn phiếu cần xem.<br>4. Hệ thống hiển thị thông tin tóm tắt: trạng thái tổng thể, danh sách dịch vụ và trạng thái từng dịch vụ, tình trạng hóa đơn. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu không tìm thấy kết quả, hệ thống thông báo không có phiếu phù hợp. |

---

---

## UC-27 – Xử lý hóa đơn (Process Invoice)

| **Mã Use case**    | UC-27 |
| ------------------ | ------ |
| **Tên Use case**   | Xử lý hóa đơn (Process Invoice) |
| **Mô tả**          | Sau khi phiếu dịch vụ hoàn thành kiểm tra chất lượng và có yêu cầu thanh toán, nhân viên quầy dịch vụ xem trước các khoản chi phí, đối soát số lượng phụ tùng thực tế, tạo hóa đơn nháp, điều chỉnh chiết khấu (nếu có chính sách ưu đãi) và phát hành hóa đơn chính thức gửi đến khách hàng qua email và ứng dụng. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff / Thu ngân) |
| **Tiền điều kiện** | Nhân viên quầy đã đăng nhập vào hệ thống. Phiếu dịch vụ tương ứng đã hoàn thành toàn bộ công việc, đạt kiểm định chất lượng và đang ở trạng thái **Chờ thanh toán**. |
| **Hậu điều kiện**  | Thành công: Hóa đơn được tạo ở trạng thái **Bản nháp** và sau đó chuyển sang trạng thái **Đã phát hành**. Thông báo và hóa đơn điện tử được gửi tự động đến khách hàng.<br>Thất bại: Hệ thống thông báo lỗi, hóa đơn chưa được tạo hoặc chưa được phát hành. |
| **Luồng cơ bản**   | 1. Nhân viên quầy truy cập danh sách phiếu dịch vụ cần thanh toán.<br>2. Hệ thống hiển thị danh sách các phiếu dịch vụ đang chờ lập hóa đơn cùng các chỉ số tổng quan trong ngày.<br>3. Tại phiếu dịch vụ cần xử lý, nhân viên nhấn **Xem trước hóa đơn**.<br>4. Hệ thống hiển thị bảng chi tiết các khoản chi phí, tự động tổng hợp từ báo giá ban đầu và các báo giá bổ sung đã được khách hàng duyệt, đối soát số lượng phụ tùng thực tế sử dụng (số lượng xuất kho trừ số lượng trả lại kho) và áp dụng mức thuế theo quy định.<br>5. Nhân viên kiểm tra thông tin chi phí và nhấn **Tạo hóa đơn nháp**.<br>6. Hệ thống tạo hóa đơn ở trạng thái **Bản nháp** và ghi nhận vào lịch sử hệ thống.<br>7. Tại màn hình chi tiết hóa đơn nháp, nếu có chính sách ưu đãi, nhân viên nhấn **Điều chỉnh chiết khấu**, nhập số tiền hoặc tỷ lệ giảm giá kèm lý do bắt buộc. Hệ thống cập nhật lại số tiền cần thanh toán.<br>8. Nhân viên nhấn **Phát hành hóa đơn**.<br>9. Hệ thống chuyển trạng thái hóa đơn sang **Đã phát hành**, khóa cố định các khoản chi phí và mức giảm giá, tự động gửi hóa đơn điện tử qua email cho khách hàng và gửi thông báo lên ứng dụng của khách hàng. |
| **Luồng thay thế** | **[Hủy hóa đơn để lập lại]** Tại bước 7 hoặc khi hóa đơn đã phát hành nhưng khách hàng chưa thanh toán, nếu phát hiện có sai sót:<br>1a. Nhân viên quầy nhấn **Hủy hóa đơn** và nhập lý do hủy bắt buộc.<br>2a. Hệ thống chuyển trạng thái hóa đơn sang **Đã hủy**, ghi nhận lịch sử và đưa phiếu dịch vụ trở lại danh sách chờ lập hóa đơn để tạo lại hóa đơn mới thay thế. |
| **Luồng ngoại lệ** | Tại bước 4 hoặc 5, nếu phiếu dịch vụ chưa hoàn tất công việc thi công hoặc chưa đạt kiểm định chất lượng, hệ thống từ chối tạo hóa đơn và thông báo: *"Phiếu dịch vụ chưa sẵn sàng để lập hóa đơn do chưa đạt kiểm định chất lượng hoặc còn công việc chưa hoàn thành."*<br><br>Tại bước 7, nếu nhân viên nhập số tiền chiết khấu vượt quá tổng tiền dịch vụ hoặc để trống lý do giải trình, hệ thống hiển thị cảnh báo lỗi và không cho phép lưu thay đổi.<br><br>Tại bước 8, nếu phiếu dịch vụ đã có hóa đơn khác đang hoạt động hoặc đã thanh toán, hệ thống cảnh báo xung đột dữ liệu và ngăn chặn phát hành trùng lặp. |

---

---

## UC-28 – Xử lý thanh toán (Process Payment)

| **Mã Use case**    | UC-28 |
| ------------------ | ------ |
| **Tên Use case**   | Xử lý thanh toán (Process Payment) |
| **Mô tả**          | Nhân viên quầy dịch vụ thu tiền cho hóa đơn đã phát hành bằng hình thức Tiền mặt, Thẻ ngân hàng (qua máy quẹt thẻ POS) hoặc Mã QR thanh toán trực tuyến. Sau khi thanh toán thành công 100%, hệ thống tự động ghi nhận hoàn tất nghĩa vụ tài chính, chuyển phiếu dịch vụ sang trạng thái đủ điều kiện xuất xưởng, thông báo cho Cố vấn dịch vụ sẵn sàng bàn giao xe và gửi biên lai xác nhận thanh toán cho khách hàng. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff / Thu ngân) |
| **Tiền điều kiện** | Hóa đơn tương ứng đang ở trạng thái **Đã phát hành** với số tiền còn phải trả lớn hơn 0 đồng. |
| **Hậu điều kiện**  | Thành công: Giao dịch thanh toán được ghi nhận thành công, hóa đơn chuyển sang trạng thái **Đã thanh toán**, phiếu dịch vụ chuyển sang trạng thái **Đã hoàn tất thanh toán (Đủ điều kiện xuất xưởng)**. Hệ thống gửi email biên lai và thông báo đến khách hàng, đồng thời thông báo cho Cố vấn dịch vụ xe đã sẵn sàng bàn giao.<br>Thất bại: Giao dịch thất bại hoặc bị hủy, hóa đơn giữ nguyên trạng thái **Đã phát hành** để thực hiện lại. |
| **Luồng cơ bản**   | 1. Nhân viên quầy mở hóa đơn cần thu tiền và nhấn **Thanh toán**.<br>2. Hệ thống hiển thị hộp thoại thanh toán với 3 phương thức lựa chọn: **Tiền mặt**, **Thẻ ngân hàng**, và **Quét mã QR trực tuyến**.<br>3. **Trường hợp A – Tiền mặt:**<br>- Nhân viên chọn phương thức Tiền mặt.<br>- Hệ thống tự động điền số tiền cần thanh toán theo hóa đơn.<br>- Nhân viên nhập số tiền khách hàng đưa. Hệ thống tự động tính và hiển thị số tiền thừa cần trả lại khách.<br>- Nhân viên nhấn **Xác nhận đã thu tiền**.<br>4. **Trường hợp B – Quẹt thẻ ngân hàng (POS):**<br>- Nhân viên chọn phương thức Thẻ ngân hàng.<br>- Nhân viên tiến hành quẹt thẻ của khách trên máy POS ngân hàng.<br>- Nhân viên nhập mã giao dịch tham chiếu từ hóa đơn in ra của máy POS.<br>- Nhân viên nhấn **Xác nhận thanh toán thẻ**.<br>5. **Trường hợp C – Cổng thanh toán qua mã QR trực tuyến:**<br>- Nhân viên chọn phương thức Mã QR và nhấn **Tạo mã QR**.<br>- Hệ thống tạo mã QR thanh toán động có hiệu lực trong 15 phút và hiển thị đồng hồ đếm ngược.<br>- Khách hàng sử dụng ứng dụng ngân hàng trên điện thoại quét mã QR để chuyển khoản.<br>- Hệ thống tự động nhận kết quả xác nhận từ cổng thanh toán trực tuyến ngay khi giao dịch hoàn tất.<br>6. Khi thanh toán hoàn tất (xác nhận thủ công đối với tiền mặt/thẻ hoặc nhận xác nhận tự động từ cổng thanh toán):<br>- Hệ thống ghi nhận giao dịch thành công, lưu thời điểm thanh toán và mã giao dịch đối soát.<br>- Chuyển trạng thái hóa đơn sang **Đã thanh toán**.<br>- Chuyển trạng thái phiếu dịch vụ sang **Đã hoàn tất thanh toán (Đủ điều kiện xuất xưởng)**.<br>- Tự động gửi thông báo đến Cố vấn dịch vụ: *"Phương tiện đã thanh toán xong, sẵn sàng lập biên bản bàn giao xe cho khách hàng"*; đồng thời gửi thông báo và biên lai thu tiền điện tử đến khách hàng.<br>- Cập nhật giao diện tức thời và hiển thị thông báo thành công. |
| **Luồng thay thế** | **[Hủy giao dịch mã QR để đổi hình thức khác]** Tại bước 5 (Trường hợp C), nếu khách hàng đổi ý muốn chuyển sang trả bằng tiền mặt/thẻ hoặc mã QR hết thời gian hiệu lực 15 phút:<br>5a. Nhân viên nhấn **Hủy mã QR này**.<br>5b. Hệ thống hủy giao dịch chờ và cho phép chọn lại hình thức thanh toán khác. |
| **Luồng ngoại lệ** | Tại bước 3, nếu nhân viên nhập số tiền khách đưa nhỏ hơn tổng số tiền cần thanh toán của hóa đơn, hệ thống hiển thị thông báo chưa đủ tiền và khóa nút xác nhận.<br><br>Tại bước 4, nếu mã giao dịch từ máy POS bị để trống hoặc không hợp lệ, hệ thống yêu cầu nhập đúng mã giao dịch trước khi hoàn tất.<br><br>Tại bước 5, nếu kết quả xác thực từ cổng thanh toán trực tuyến báo không thành công hoặc sai lệch thông tin xác thực, hệ thống từ chối cập nhật trạng thái thanh toán và hiển thị thông báo lỗi để nhân viên kiểm tra lại. |

---

# PHẦN 4 – CỐ VẤN DỊCH VỤ (SERVICE ADVISOR)

---

---

## UC-29 – Tạo phiếu công việc (Create Work Order)

| **Mã Use case**    | UC-29 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo phiếu công việc (Create Work Order) |
| **Mô tả**          | Cố vấn dịch vụ xem danh sách xe đang chờ xử lý và tạo phiếu công việc – hồ sơ trung tâm theo dõi toàn bộ quá trình sửa chữa / bảo dưỡng – cho từng xe trong hàng đợi. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Xe đã được nhân viên quầy đưa vào hàng đợi tiếp nhận (từ lịch hẹn đã đến, Walk-in hoặc Tow-in). |
| **Hậu điều kiện**  | Thành công: Phiếu công việc được tạo và liên kết với xe, khách hàng và nguồn tiếp nhận tương ứng.<br>Thất bại: Hệ thống thông báo lỗi, phiếu không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn vào mục **Hàng đợi tiếp nhận** và xem danh sách xe đang chờ.<br>2. Cố vấn chọn một xe trong danh sách.<br>3. Cố vấn nhấn **Tạo phiếu công việc**.<br>4. Hệ thống tạo phiếu công việc mới và liên kết với khách hàng, xe và nguồn tiếp nhận (lịch hẹn / Walk-in / Tow-in). |
| **Luồng thay thế** | **[Cập nhật thông tin phiếu công việc]** Tại bất kỳ thời điểm nào khi phiếu chưa đóng, cố vấn có thể chọn **Cập nhật thông tin** để chỉnh sửa các trường chung (Biển số xe, Ghi chú, Số km, v.v.). Hệ thống lưu thông tin mới. |
| **Luồng ngoại lệ** | Tại bước 3, nếu thông tin tiếp nhận không đầy đủ (thiếu khách hàng, thiếu xe hoặc thiếu nguồn tiếp nhận hợp lệ), hệ thống không cho phép tạo phiếu và thông báo thông tin còn thiếu. |

---

---


## UC-30 – Ghi nhận tình trạng xe (Record Vehicle Condition)

| **Mã Use case**    | UC-30 |
| ------------------ | ------ |
| **Tên Use case**   | Ghi nhận tình trạng xe (Record Vehicle Condition) |
| **Mô tả**          | Cố vấn dịch vụ ghi lại tình trạng xe tại thời điểm tiếp nhận: đồng hồ km, mức xăng, vấn đề khách phản ánh, tài sản để trong xe, hư hỏng hiển nhiên quan sát được và hình ảnh minh chứng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-17). |
| **Hậu điều kiện**  | Thành công: Thông tin tiếp nhận được lưu và khách hàng được thông báo để xác nhận (UC-09).<br>Thất bại: Hệ thống thông báo lỗi nếu thiếu thông tin bắt buộc. |
| **Luồng cơ bản**   | 1. Cố vấn mở phiếu công việc và chọn **Ghi nhận tình trạng xe**.<br>2. Cố vấn điền thông tin bắt buộc: số km hiện tại, mức xăng, nội dung phàn nàn / yêu cầu của khách và tình trạng xe quan sát bên ngoài.<br>3. Cố vấn ghi thêm tài sản trong xe nếu có.<br>4. Cố vấn chụp hoặc đính kèm hình ảnh minh chứng tình trạng xe.<br>5. Cố vấn nhấn **Lưu Thông Tin**.<br>6. Hệ thống lưu thông tin và gửi thông báo xác nhận cho khách hàng (UC-09). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 5, nếu thiếu thông tin bắt buộc (km, xăng, phàn nàn hoặc tình trạng xe), hệ thống từ chối lưu và hiển thị các trường còn thiếu. |

---

---

## UC-31 – Thêm hạng mục dịch vụ (Add Service)

| **Mã Use case**    | UC-31 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm hạng mục dịch vụ (Add Service) |
| **Mô tả**          | Cố vấn dịch vụ thêm hạng mục dịch vụ mới vào phiếu công việc để lên kế hoạch sửa chữa/bảo dưỡng cho khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập và phiếu công việc (Work Order) đang ở trạng thái cho phép chỉnh sửa. |
| **Hậu điều kiện**  | Thành công: Hạng mục dịch vụ mới được lưu thành công vào phiếu công việc.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu phiếu công việc giữ nguyên. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ truy cập màn hình chi tiết phiếu công việc.<br>2. Cố vấn nhấn nút **Thêm dịch vụ**.<br>3. Hệ thống hiển thị danh mục các dịch vụ hiện có.<br>4. (Tùy chọn) Cố vấn nhập từ khóa vào ô tìm kiếm để lọc dịch vụ mong muốn.<br>5. Cố vấn chọn dịch vụ từ danh sách.<br>6. Hệ thống thêm dịch vụ vào danh sách của phiếu công việc và tự động lưu. |
| **Luồng thay thế** | **[Không tìm thấy dịch vụ]** Tại bước 4, nếu không có dịch vụ nào khớp với từ khóa tìm kiếm:<br>4a. Hệ thống hiển thị thông báo "Không tìm thấy dịch vụ phù hợp". |
| **Luồng ngoại lệ** | Tại bước 6, nếu kết nối lỗi hoặc dịch vụ không hợp lệ, hệ thống hiển thị thông báo lỗi cụ thể và từ chối lưu. |


---

## UC-32 – Xóa hạng mục dịch vụ (Remove Service)

| **Mã Use case**    | UC-32 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa hạng mục dịch vụ (Remove Service) |
| **Mô tả**          | Cố vấn dịch vụ xóa hạng mục dịch vụ khỏi phiếu công việc khi khách hàng không đồng ý hoặc không còn nhu cầu. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập, phiếu công việc đang mở và đã có ít nhất một hạng mục dịch vụ. |
| **Hậu điều kiện**  | Thành công: Hạng mục dịch vụ được loại bỏ khỏi phiếu công việc.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ truy cập màn hình chi tiết phiếu công việc.<br>2. (Tùy chọn) Cố vấn nhập từ khóa vào ô tìm kiếm để lọc dịch vụ cần xóa khỏi danh sách.<br>3. Cố vấn chọn hạng mục dịch vụ cần xóa và nhấn **Xóa**.<br>4. Hệ thống hiển thị hộp thoại xác nhận thao tác.<br>5. Cố vấn nhấn **Xác nhận**.<br>6. Hệ thống tiến hành loại bỏ hạng mục dịch vụ đó khỏi phiếu công việc và cập nhật danh sách. |
| **Luồng thay thế** | **[Không tìm thấy dịch vụ]** Tại bước 2, nếu không có dịch vụ nào khớp với từ khóa tìm kiếm:<br>2a. Hệ thống hiển thị thông báo "Không tìm thấy dịch vụ phù hợp". |
| **Luồng ngoại lệ** | Tại bước 6, nếu dịch vụ đã bắt đầu thực hiện hoặc đã thanh toán, hệ thống từ chối xóa và hiển thị thông báo lỗi (ví dụ: Không thể xóa dịch vụ đang thực hiện). |


---

## UC-33 – Kiểm tra xe (Inspect Vehicle)

| **Mã Use case**    | UC-33 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm tra xe (Inspect Vehicle) |
| **Mô tả**          | Cố vấn dịch vụ mở giao diện kiểm tra xe (Vehicle Inspection), chọn loại dấu vết (Damage / Rust / Missing / Dent / Scratch,...) và nhấp chọn trực tiếp trên hình ảnh sơ đồ thân xe (Car Diagram UI) để đặt marker tại vị trí phát hiện hư hỏng (ví dụ: Driver side - Front door, Driver side - Front bumper,...). Hệ thống tự động ghi nhận vị trí và tạo dòng vấn đề phát hiện (Finding / Issue) tương ứng, cho phép cố vấn ghi chú, đính kèm hình ảnh và liên kết với công việc (Job). |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-17). Cố vấn đã ghi nhận tình trạng tiếp nhận xe (UC-18). Xe đang ở trong xưởng, chưa thực hiện sửa chữa. |
| **Hậu điều kiện**  | Thành công: Danh sách các vấn đề phát hiện (Finding) kèm vị trí marker trên sơ đồ xe được lưu vào phiếu công việc, sẵn sàng để lên kế hoạch tạo Job xử lý.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn cuộn đến phần **Kiểm tra xe** trong phiếu công việc.<br>2. Hệ thống hiển thị sơ đồ thân xe và thanh công cụ chứa các loại marker (Damage, Rust, Missing, Dent, Scratch).<br>3. Cố vấn chọn một loại marker trên thanh công cụ và nhấp chuột vào bộ phận tương ứng trên sơ đồ xe.<br>4. Hệ thống đặt đánh dấu (marker) lên sơ đồ xe và tự động thêm một dòng thông tin phát hiện (Finding) vào danh sách bên phải.<br>5. Cố vấn nhập trực tiếp nội dung ghi chú (Note) vào ô nhập liệu của dòng Finding.<br>6. (Tùy chọn) Cố vấn nhấp vào biểu tượng tải lên để đính kèm hình ảnh minh chứng (Photo).<br>7. (Tùy chọn) Cố vấn chọn công việc (Job) từ danh sách hoặc nhấp **Thêm công việc** để liên kết với Finding.<br>8. Hệ thống tự động ghi nhận thay đổi (không cần nhấn nút lưu riêng biệt). |
| **Luồng thay thế** | **[Xóa vấn đề phát hiện]** Cố vấn nhấp vào biểu tượng xóa (dấu X) xuất hiện khi rê chuột vào dòng Finding trong danh sách: Hệ thống xóa Finding và gỡ marker khỏi sơ đồ xe.<br><br>**[Chỉnh sửa thông tin]** Cố vấn có thể sửa trực tiếp ghi chú (Note) trên ô nhập liệu hoặc tải lên lại ảnh ở bất kỳ thời điểm nào. |
| **Luồng ngoại lệ** | Tại bước 5a của luồng Xóa, nếu Finding đã được liên kết với một Job, hệ thống từ chối xóa và hiển thị thông báo yêu cầu hủy liên kết Job trước. |

---

---

## UC-34 – Lên kế hoạch công việc (Plan Jobs)

| **Mã Use case**    | UC-34 |
| ------------------ | ------ |
| **Tên Use case**   | Lên kế hoạch công việc (Plan Jobs) |
| **Mô tả**          | Cố vấn dịch vụ tạo các job (đầu công việc) cần thực hiện trong phiếu công việc. Hệ thống hỗ trợ tạo Job trực tiếp từ một Finding phát hiện khi kiểm tra xe (nhấn nút **+ New Job** tại dòng Finding), gán Finding vào Job đã có từ danh sách chọn (Select a job...), sinh Job từ mẫu dịch vụ (Service Template) hoặc tạo Job thủ công không qua Finding. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-17) và có ít nhất một dịch vụ (UC-19). |
| **Hậu điều kiện**  | Thành công: Job mới được tạo, lưu trong phiếu công việc và được liên kết trực tiếp với Finding/dịch vụ tương ứng.<br>Thất bại: Hệ thống thông báo lỗi, job không được tạo. |
| **Luồng cơ bản**   | **[Tạo Job trực tiếp từ Finding]**<br>1. Cố vấn vào màn hình kiểm tra xe hoặc danh sách Finding của phiếu công việc.<br>2. Tại bảng danh sách Finding, cố vấn tìm đến dòng Finding cần xử lý và nhấn nút thêm Job.<br>3. Hệ thống hiển thị cửa sổ hộp thoại **Tạo công việc (Create Dispatch Jobs)**.<br>4. Cố vấn điền thông tin chung cho Job: Tên job, Loại job (Type), Kỹ thuật viên đảm nhận (Technician) và Mô tả công việc.<br>5. Cố vấn nhấn **Lưu (Save)**.<br>6. Hệ thống khởi tạo Job mới với mã tự động (ví dụ: `JOB26090001`), lưu thông tin nhân công / phụ tùng đã khai báo, đồng thời cập nhật mã Job này vào ô `Job No.` của dòng Finding tương ứng để xác nhận liên kết. |
| **Luồng thay thế** | **[Tạo job từ mẫu dịch vụ]** Tại màn hình danh sách Job của phiếu:<br>1b. Cố vấn chọn một dịch vụ (ví dụ: Bảo dưỡng 10.000 km) và nhấn **Sinh job từ mẫu**.<br>2b. Hệ thống tự động sinh danh sách các Job mặc định kèm nhân công và phụ tùng theo mẫu đã cấu hình.<br>3b. Cố vấn kiểm tra, chỉnh sửa nếu cần và nhấn **Xác nhận**.<br><br>**[Tạo job thủ công độc lập (không từ Finding)]** Tại màn hình danh sách Job:<br>1c. Cố vấn chọn **Thêm job thủ công**.<br>2c. Cố vấn nhập tên, loại job, nhân công, phụ tùng và không chọn liên kết với Finding nào.<br>3c. Cố vấn nhấn **Lưu**.<br><br>**[Chỉnh sửa / Xóa job]**:<br>1d. Cố vấn chọn Job từ danh sách để xem/chỉnh sửa thông tin ở các tab hoặc nhấn **Xóa** (nếu Job chưa thực hiện/chưa xuất kho). |
| **Luồng ngoại lệ** | Tại bước 1d của luồng Xóa, nếu Job đã có phụ tùng được xuất kho hoặc đã bắt đầu thực hiện, hệ thống từ chối xóa và hiển thị lý do cụ thể. |

---

---

## UC-35 – Khai báo nhân công (Declare Labour)

| **Mã Use case**    | UC-35 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo nhân công (Declare Labour) |
| **Mô tả**          | Cố vấn dịch vụ khai báo các labour lines cho từng job: loại nhân công, mô tả chi tiết task cần thực hiện, kỹ thuật viên đảm nhận và số lượng giờ / đơn vị ước tính. Thông tin này được dùng để tính chi phí nhân công trong báo giá. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Job đã được tạo trong phiếu công việc (UC-33). |
| **Hậu điều kiện**  | Thành công: Labour line được ghi nhận và liên kết với job, sẵn sàng tính vào báo giá.<br>Thất bại: Hệ thống thông báo lỗi, labour line không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn mở một job và chọn **Thêm nhân công**.<br>2. Hệ thống hiển thị danh mục loại nhân công đã được cấu hình (UC-36).<br>3. Cố vấn chọn loại nhân công và nhập mô tả chi tiết task cần thực hiện.<br>4. Cố vấn chọn kỹ thuật viên thực hiện từ danh sách nhân viên đang hoạt động.<br>5. Cố vấn nhập số lượng giờ / đơn vị ước tính.<br>6. Cố vấn nhấn **Lưu**.<br>7. Hệ thống ghi nhận labour line và tự động tính chi phí nhân công theo đơn giá đã cấu hình. |
| **Luồng thay thế** | **[Chỉnh sửa labour line]** Tại bước 1, thay vì chọn **Thêm nhân công**, cố vấn chọn dòng đã có:<br>1a. Cố vấn chọn labour line cần chỉnh sửa từ danh sách.<br>2a. Cố vấn nhấn **Chỉnh sửa**.<br>3a. Cố vấn thay đổi loại nhân công, mô tả, kỹ thuật viên hoặc số lượng giờ.<br>4a. Cố vấn nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới và tính lại chi phí nhân công.<br><br>**[Xóa labour line]** Tại bước 1, cố vấn chọn dòng cần xóa:<br>1b. Cố vấn chọn labour line cần xóa từ danh sách.<br>2b. Cố vấn nhấn **Xóa** và xác nhận.<br>3b. Hệ thống xóa labour line khỏi job. |
| **Luồng ngoại lệ** | Tại bước 3b của luồng Xóa, nếu báo giá đã được khách hàng duyệt, hệ thống không cho phép xóa và yêu cầu tạo báo giá bổ sung để điều chỉnh (UC-24). |

---

---

## UC-36 – Khai báo phụ tùng (Declare Parts)

| **Mã Use case**    | UC-36 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo phụ tùng (Declare Parts) |
| **Mô tả**          | Cố vấn dịch vụ khai báo danh sách phụ tùng và vật tư dự kiến cần dùng cho từng job. Sau khi thực hiện xong, cố vấn cập nhật số lượng thực tế đã sử dụng để truy vết chi phí. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Job đã được tạo trong phiếu công việc (UC-33). |
| **Hậu điều kiện**  | Thành công: Danh sách phụ tùng / vật tư được lưu theo từng job và có thể truy vết.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn mở một job và chọn **Thêm phụ tùng / vật tư**.<br>2. Cố vấn tìm kiếm mặt hàng từ danh mục kho và chọn phụ tùng / vật tư cần dùng.<br>3. Cố vấn nhập số lượng dự kiến cần sử dụng.<br>4. Cố vấn nhấn **Lưu**.<br>5. Hệ thống ghi nhận phụ tùng / vật tư và số lượng kế hoạch cho job. |
| **Luồng thay thế** | **[Cập nhật số lượng thực tế]** Sau khi job hoàn thành (UC-25), tại bước 1:<br>1a. Cố vấn mở job đã hoàn thành.<br>2a. Cố vấn chọn phụ tùng cần cập nhật số lượng thực tế.<br>3a. Cố vấn nhấn **Cập nhật số lượng thực tế**.<br>4a. Cố vấn nhập số lượng thực tế đã sử dụng.<br>5a. Cố vấn nhấn **Lưu**.<br>6a. Hệ thống ghi nhận số lượng thực tế.<br><br>**[Xóa phụ tùng / vật tư]** Tại bước 1, cố vấn chọn xóa mặt hàng không còn cần thiết:<br>1b. Cố vấn mở job có phụ tùng cần xóa.<br>2b. Cố vấn chọn dòng phụ tùng cần xóa.<br>3b. Cố vấn nhấn **Xóa** và xác nhận.<br>4b. Hệ thống xóa dòng đó khỏi danh sách job. |
| **Luồng ngoại lệ** | Tại bước 4b của luồng Xóa, nếu phụ tùng đã được xuất kho cho job, hệ thống từ chối xóa và yêu cầu thực hiện nhập trả kho trước (UC-29). |

---

---

## UC-37 – Tạo báo giá (Create Quotation)

| **Mã Use case**    | UC-37 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo báo giá (Create Quotation) |
| **Mô tả**          | Cố vấn dịch vụ tổng hợp toàn bộ các dịch vụ, công việc kỹ thuật và phụ tùng đã lập kế hoạch trong phiếu dịch vụ thành bản báo giá hoàn chỉnh để gửi khách hàng. Hệ thống tự động tính toán chi phí theo kiểu tính giá tương ứng của từng dịch vụ và cho phép áp dụng chiết khấu ưu đãi. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập hệ thống; Phiếu dịch vụ đang ở trạng thái **Đang lập kế hoạch** (hoặc **Bản nháp**) và có ít nhất một hạng mục có chi phí lớn hơn 0 đồng. |
| **Hậu điều kiện**  | Thành công: Bản báo giá mới được tạo ở trạng thái **Bản nháp** kèm đầy đủ danh sách các khoản chi phí chi tiết.<br>Thất bại: Hệ thống hiển thị thông báo lỗi cụ thể, không tạo bản báo giá. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ mở phiếu dịch vụ cần xử lý và chọn mục **Báo giá**.<br>2. Hệ thống kiểm tra kế hoạch công việc và vật tư trong phiếu dịch vụ.<br>3. Cố vấn dịch vụ nhấn **Tạo báo giá tự động**.<br>4. Hệ thống tự động tính toán chi phí theo đúng kiểu tính giá của từng hạng mục:<br>- Dịch vụ trọn gói cố định: Áp dụng đơn giá cố định của gói, không cộng lẻ từng công việc bên trong.<br>- Dịch vụ tính theo kích cỡ xe: Tự động xác định phân khúc kích thước xe (xe nhỏ, xe vừa, xe lớn, xe đa dụng, xe bán tải) và áp dụng đúng đơn giá quy định cho phân khúc đó.<br>- Dịch vụ tính theo nhân công và phụ tùng: Tính tiền nhân công theo giờ định mức và tiền phụ tùng theo số lượng nhân với đơn giá niêm yết.<br>5. Hệ thống tính tổng tiền dịch vụ, áp dụng thuế giá trị gia tăng 0% theo quy định của trung tâm.<br>6. Hệ thống thực hiện kiểm tra chống trùng lặp: So sánh chi tiết từng dòng chi phí và tổng tiền với các bản báo giá đã lập trước đó của phiếu:<br>- Nếu dữ liệu hoàn toàn trùng khớp: Hệ thống không tạo mới mà hiển thị lại bản báo giá cũ kèm thông báo: *"Kế hoạch dịch vụ và phụ tùng không có thay đổi so với báo giá đã lập. Hệ thống tự động mở lại bản báo giá này."* (Kết thúc use case).<br>- Nếu có thay đổi: Hệ thống chuyển sang bước 7.<br>7. Hệ thống tự động cấp mã báo giá theo quy chuẩn và hiển thị bảng chi tiết.<br>8. Cố vấn dịch vụ có thể nhập thêm số tiền hoặc tỷ lệ chiết khấu giảm giá (nếu có chính sách ưu đãi).<br>9. Cố vấn dịch vụ nhấn **Lưu báo giá**.<br>10. Hệ thống lưu bản báo giá ở trạng thái **Bản nháp** và hiển thị đầy đủ chi tiết lên màn hình để cố vấn kiểm tra trước khi gửi khách hàng. |
| **Luồng thay thế** | **[Tạo báo giá bổ sung]** Khi phương tiện đang trong quá trình sửa chữa mà phát hiện hư hỏng phát sinh:<br>3a. Cố vấn dịch vụ thêm các hạng mục công việc hoặc phụ tùng phát sinh vào phiếu dịch vụ và chọn **Tạo báo giá bổ sung**.<br>4a. Hệ thống ghi nhận đây là báo giá bổ sung, tự động liên kết với báo giá ban đầu và chỉ tính toán các chi phí mới phát sinh để trình khách hàng phê duyệt. |
| **Luồng ngoại lệ** | Tại bước 2, nếu phiếu dịch vụ chưa có bất kỳ hạng mục nào có chi phí, hệ thống thông báo: *"Phiếu dịch vụ chưa có hạng mục dịch vụ hoặc phụ tùng nào có chi phí. Vui lòng lập kế hoạch trước khi tạo báo giá."*<br><br>Tại bước 2, nếu phiếu dịch vụ đã đóng, đã hủy hoặc xe đã bàn giao xong, hệ thống thông báo lỗi: *"Phiếu dịch vụ đã hoàn tất hoặc đã kết thúc, không thể tạo báo giá mới."* |

---

## UC-38 – Xem báo giá (View Quotation)

| **Mã Use case**    | UC-38 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo giá (View Quotation) |
| **Mô tả**          | Cố vấn dịch vụ, nhân viên liên quan hoặc khách hàng xem chi tiết bảng chiết tính chi phí của báo giá (công thợ, phụ tùng, giảm giá), theo dõi lịch sử các phiên bản báo giá và in/xuất tệp báo giá khi cần. |
| **Đối tượng**      | Cố vấn dịch vụ, Khách hàng, Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Người dùng đã đăng nhập hệ thống và có quyền xem thông tin (khách hàng chỉ được xem báo giá của xe mình sở hữu). |
| **Hậu điều kiện**  | Hệ thống hiển thị đầy đủ, rõ ràng các khoản chi phí và trạng thái của báo giá. |
| **Luồng cơ bản**   | 1. Người dùng mở phiếu dịch vụ và chọn mục **Báo giá** (hoặc khách hàng chọn xem báo giá từ màn hình theo dõi tiến độ xe trên ứng dụng khách hàng).<br>2. Hệ thống tải toàn bộ danh sách báo giá của phiếu và tự động hiển thị bản báo giá mới nhất được gửi cho khách hàng.<br>3. Hệ thống hiển thị giao diện báo giá trực quan gồm các khu vực:<br>- Thông tin tổng quan: Mã số báo giá, ngày lập, ngày gửi, người lập, và trạng thái hiện tại (Bản nháp, Chờ khách duyệt, Đã duyệt, Đã từ chối, Đã hủy).<br>- Chi tiết dịch vụ và công việc: Tên công việc, định mức giờ công, đơn giá và thành tiền.<br>- Chi tiết phụ tùng và vật tư: Tên phụ tùng, xuất xứ/hãng sản xuất, số lượng, đơn vị tính, đơn giá niêm yết và thành tiền.<br>- Tổng kết tài chính: Tổng tiền dịch vụ ban đầu, số tiền chiết khấu (nếu có), thuế suất (0%) và tổng tiền thanh toán cuối cùng.<br>4. Người dùng có thể nhấn **Lịch sử báo giá** để xem lại các phiên bản báo giá trước đó kèm ghi chú lý do khách hàng từ chối ở các lần trước (nếu có).<br>5. Người dùng nhấn **Xuất tệp / In** để xuất bản báo giá chuẩn hóa phục vụ lưu trữ hoặc in ra giấy gửi khách hàng. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 1, nếu khách hàng cố tình xem báo giá của phương tiện khác không thuộc quyền sở hữu của mình, hệ thống từ chối truy cập và thông báo: *"Bạn không có quyền xem thông tin báo giá này."*<br><br>Tại bước 1, nếu phiếu dịch vụ chưa từng tạo bản báo giá nào, hệ thống hiển thị thông báo: *"Chưa có bản báo giá nào được tạo cho phiếu dịch vụ này."* |

---

## UC-39 – Cập nhật và duyệt báo giá (Approve & Update Quotation)

| **Mã Use case**    | UC-39 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật và duyệt báo giá (Approve & Update Quotation) |
| **Mô tả**          | Cố vấn dịch vụ gửi báo giá cho khách hàng qua ứng dụng và email. Khách hàng xem xét và thực hiện phê duyệt (hoặc cố vấn ghi nhận phê duyệt theo ủy quyền của khách). Trường hợp khách hàng không đồng ý, hệ thống xử lý phân nhánh theo yêu cầu (điều chỉnh lại báo giá hoặc hủy dịch vụ để lấy lại xe). Khi duyệt, hệ thống tự động khóa đơn giá và giữ chỗ phụ tùng trong kho. |
| **Đối tượng**      | Khách hàng (Customer), Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái **Bản nháp** hoặc **Chờ khách duyệt**. |
| **Hậu điều kiện**  | - Nếu phê duyệt: Báo giá chuyển sang trạng thái **Đã duyệt**; phiếu dịch vụ chuyển sang trạng thái **Đã duyệt**; phụ tùng trong kho chuyển sang trạng thái **Đã giữ chỗ**; biên bản tiếp nhận xe được xác nhận chính thức.<br>- Nếu từ chối (yêu cầu điều chỉnh): Báo giá chuyển sang trạng thái **Đã từ chối**; phiếu dịch vụ quay về trạng thái **Đang lập kế hoạch** để cố vấn chỉnh sửa.<br>- Nếu từ chối (hủy dịch vụ lấy lại xe): Báo giá chuyển sang trạng thái **Đã từ chối**; hệ thống chuyển sang thủ tục xuất trả xe cho khách hàng.<br>- Thất bại: Hệ thống thông báo lỗi, trạng thái dữ liệu giữ nguyên. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ kiểm tra bản báo giá nháp và nhấn **Gửi cho khách hàng**.<br>2. Hệ thống chuyển trạng thái báo giá sang **Chờ khách duyệt**, chuyển phiếu dịch vụ sang trạng thái **Chờ duyệt báo giá**, đồng thời tự động gửi email và thông báo lên ứng dụng của khách hàng kèm bảng tóm tắt chi phí và liên kết truy cập nhanh.<br>3. Khách hàng đăng nhập vào ứng dụng hoặc nhấp vào liên kết trong email để xem chi tiết báo giá.<br>4. Khách hàng (hoặc cố vấn dịch vụ ghi nhận sau khi trao đổi xác nhận trực tiếp với khách) nhấn **Phê duyệt báo giá**.<br>5. Hệ thống hiển thị hộp thoại xác nhận cam kết chi phí. Người dùng nhấn **Xác nhận duyệt**.<br>6. Hệ thống thực hiện chuỗi xử lý tự động:<br>- Chuyển trạng thái báo giá sang **Đã duyệt** và khóa cố định toàn bộ đơn giá tại thời điểm phê duyệt.<br>- Tự động chuyển trạng thái các phụ tùng trong báo giá sang **Đã giữ chỗ trong kho** để đảm bảo linh kiện sẵn sàng và không bị phân bổ cho xe khác.<br>- Chuyển trạng thái phiếu dịch vụ sang **Đã duyệt**, sẵn sàng cho việc phân công kỹ thuật viên bắt đầu sửa chữa.<br>- Chuyển trạng thái biên bản kiểm tra ban đầu sang **Đã xác nhận**.<br>7. Hệ thống hiển thị thông báo phê duyệt thành công và cập nhật trạng thái hiển thị trên màn hình. |
| **Luồng thay thế** | **[Khách hàng từ chối báo giá]** Tại bước 4, khách hàng nhấn nút **Từ chối báo giá**:<br>4a. Hệ thống hiển thị biểu mẫu yêu cầu chọn phân loại lý do từ chối:<br>- *Trường hợp 1 - Yêu cầu điều chỉnh lại chi phí:* Khách hàng nêu lý do (vượt ngân sách, bỏ bớt hạng mục chưa cần thiết, đổi loại phụ tùng,...). Hệ thống chuyển trạng thái báo giá sang **Đã từ chối**, đưa phiếu dịch vụ quay về trạng thái **Đang lập kế hoạch** để cố vấn dịch vụ điều chỉnh lại kế hoạch và lập báo giá mới.<br>- *Trường hợp 2 - Hủy dịch vụ và nhận lại xe:* Khách hàng không đồng ý làm dịch vụ và yêu cầu nhận lại xe ngay. Hệ thống chuyển trạng thái báo giá sang **Đã từ chối**, ghi nhận lý do và kích hoạt thủ tục chuẩn bị xuất trả xe sớm cho khách hàng. |
| **Luồng ngoại lệ** | Tại bước 4, nếu báo giá đã ở trạng thái **Đã duyệt**, hệ thống khóa nút duyệt và thông báo báo giá đã được phê duyệt trước đó.<br><br>Nếu phương tiện đã bắt đầu bước thi công sửa chữa, hệ thống ngăn chặn việc từ chối báo giá để bảo vệ chi phí và vật tư của xưởng. |

---

## UC-40 – Hủy báo giá (Cancel Quotation)

| **Mã Use case**    | UC-40 |
| ------------------ | ------ |
| **Tên Use case**   | Hủy báo giá (Cancel Quotation) |
| **Mô tả**          | Cố vấn dịch vụ áp dụng chính sách giảm giá, chiết khấu trực tiếp trên báo giá trước khi khách hàng duyệt, hoặc hủy bỏ một bản báo giá bị lập sai sót để giải phóng dữ liệu và lập lại kế hoạch. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái **Bản nháp** hoặc **Chờ khách duyệt**. Tuyệt đối không áp dụng cho báo giá đã ở trạng thái **Đã duyệt**. |
| **Hậu điều kiện**  | - Nếu điều chỉnh chiết khấu: Mức chiết khấu và tổng tiền thanh toán của báo giá được cập nhật chính xác.<br>- Nếu hủy: Báo giá chuyển sang trạng thái **Đã hủy**, phiếu dịch vụ quay về trạng thái **Đang lập kế hoạch**.<br>- Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên. |
| **Luồng cơ bản**   | 1. **Áp dụng chiết khấu / Điều chỉnh giảm giá:**<br>- Cố vấn dịch vụ mở bản báo giá đang xử lý và chọn **Áp dụng chiết khấu**.<br>- Cố vấn chọn hình thức giảm giá: theo số tiền trực tiếp hoặc theo tỷ lệ phần trăm (%).<br>- Cố vấn nhập mức giảm giá và ghi rõ lý do ưu đãi (chương trình khuyến mãi, khách hàng thân thiết,...).<br>- Hệ thống tự động tính lại số tiền giảm và tổng tiền thanh toán cuối cùng của báo giá.<br>- Cố vấn nhấn **Lưu thay đổi**. Hệ thống lưu lại thông tin và cập nhật giao diện.<br>2. **Hủy bản báo giá sai sót:**<br>- Khi phát hiện bản báo giá bị sai sót, cố vấn mở báo giá và chọn **Hủy báo giá**.<br>- Hệ thống hiển thị hộp thoại cảnh báo: *"Bạn có chắc chắn muốn hủy bản báo giá này? Thao tác này không thể hoàn tác."*<br>- Cố vấn nhấn **Xác nhận hủy**.<br>- Hệ thống cập nhật trạng thái báo giá thành **Đã hủy**, đồng thời đưa phiếu dịch vụ quay lại trạng thái **Đang lập kế hoạch** để cố vấn tiếp tục hiệu chỉnh danh mục dịch vụ. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 1 hoặc 2, nếu báo giá đã ở trạng thái **Đã duyệt**, hệ thống ẩn hoàn toàn chức năng chỉnh sửa và hủy; nếu phát sinh yêu cầu can thiệp trái phép, hệ thống từ chối và thông báo: *"Báo giá đã được phê duyệt, không thể chỉnh sửa hoặc hủy bỏ."*<br><br>Tại bước 1, nếu số tiền giảm giá lớn hơn tổng tiền dịch vụ ban đầu, hệ thống cảnh báo mức chiết khấu không hợp lệ và không cho phép lưu. |

---

## UC-41 – Kiểm định chất lượng (Quality Inspection)

| **Mã Use case**    | UC-41 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm định chất lượng (Quality Inspection) |
| **Mô tả**          | Cố vấn dịch vụ hoặc nhân viên kiểm tra chất lượng thực hiện thẩm định tình trạng kỹ thuật của xe sau khi thợ thi công xong theo danh mục tiêu chuẩn. Nếu tất cả hạng mục đạt yêu cầu, hệ thống cho phép chuyển phiếu dịch vụ sang bước thanh toán và phát hành chứng nhận kiểm định chất lượng cho khách hàng. Nếu phát hiện có hạng mục chưa đạt, hệ thống tự động tạo công việc sửa lại để kỹ thuật viên khắc phục trước khi kiểm tra lại. |
| **Đối tượng**      | Cố vấn dịch vụ, Nhân viên kiểm tra chất lượng |
| **Tiền điều kiện** | Phiếu dịch vụ đang ở trạng thái **Đang sửa chữa**; toàn bộ các công việc thi công ban đầu của kỹ thuật viên đã hoàn thành (không còn công việc nào đang làm dở). |
| **Hậu điều kiện**  | Thành công – Đạt 100%: Biên bản kiểm định ghi nhận kết quả **Đạt**, mở khóa để chuyển phiếu dịch vụ sang trạng thái **Chờ thanh toán**, khách hàng có thể xem chứng nhận kiểm định chất lượng trên ứng dụng.<br>Thành công – Có mục Không đạt: Biên bản ghi nhận kết quả **Không đạt**, hệ thống tự động tạo công việc sửa lại tương ứng, giữ phiếu dịch vụ ở trạng thái **Đang sửa chữa** và khóa bước chuyển sang thanh toán.<br>Thất bại: Hệ thống thông báo lỗi, kết quả kiểm định không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn dịch vụ hoặc nhân viên kiểm tra chất lượng mở phiếu dịch vụ và chọn mục **Kiểm tra chất lượng**.<br>2. Hệ thống kiểm tra tiến độ thi công của phương tiện: xác nhận 100% công việc sửa chữa ban đầu đã hoàn thành và hiển thị danh sách các tiêu chí kiểm định kỹ thuật chuẩn hóa (An toàn phanh và lái; Động cơ và vận hành; Hệ thống điện và đèn; Khung gầm và lốp xe; Chạy thử thực tế trên đường; Vệ sinh xe trước khi giao).<br>3. Người kiểm tra tiến hành kiểm tra thực tế xe và chọn kết quả **Đạt** cho từng tiêu chí (hoặc nhấn **Đánh dấu tất cả đạt** nếu xe đã qua chạy thử hoàn hảo), kèm ghi chú nghiệm thu thực tế.<br>4. Người kiểm tra nhấn **Xác nhận kết quả kiểm định**.<br>5. Hệ thống ghi nhận biên bản kiểm định với kết quả **Đạt** 100% và mở khóa tính năng chuyển sang thanh toán.<br>6. Cố vấn dịch vụ nhấn **Yêu cầu tính tiền**.<br>7. Hệ thống chuyển trạng thái phiếu dịch vụ sang **Chờ thanh toán**, gửi thông báo cho bộ phận thu ngân chuẩn bị lập hóa đơn, đồng thời cấp giấy chứng nhận kiểm định chất lượng điện tử để khách hàng có thể tra cứu và xem trực tiếp trên ứng dụng. |
| **Luồng thay thế** | **[Phát hiện lỗi kỹ thuật – Kiểm định không đạt và sửa lại]** Tại bước 3, nếu phát hiện có hạng mục kỹ thuật chưa đạt yêu cầu:<br>3a. Người kiểm tra chọn kết quả **Không đạt** tại tiêu chí tương ứng và chọn mức độ nghiêm trọng (Nghiêm trọng, Nặng, hoặc Nhẹ).<br>3b. Người kiểm tra nhập mô tả chi tiết lỗi, hướng dẫn kỹ thuật cần khắc phục và chọn kỹ thuật viên chịu trách nhiệm sửa lại.<br>3c. Người kiểm tra nhấn **Xác nhận kiểm định và yêu cầu sửa lại**.<br>3d. Hệ thống lưu kết quả kiểm định là **Không đạt**, tự động tạo công việc sửa lại tương ứng (tránh tạo trùng lặp nếu công việc sửa lại cho lỗi này đã được tạo trước đó), giữ phiếu dịch vụ ở trạng thái **Đang sửa chữa** và khóa chặt nút yêu cầu tính tiền.<br>3e. Kỹ thuật viên nhận thông báo, tiến hành khắc phục lỗi theo đúng hướng dẫn và xác nhận hoàn thành công việc sửa lại.<br>3f. Người kiểm tra mở lại mục Kiểm tra chất lượng để thẩm định lại các tiêu chí lỗi. Nếu đạt chuẩn, tiếp tục thực hiện từ bước 4 của luồng cơ bản. |
| **Luồng ngoại lệ** | Tại bước 2, nếu còn công việc thi công chưa hoàn thành, hệ thống hiển thị cảnh báo và khóa chức năng xác nhận kiểm định chất lượng.<br><br>Tại bước 3, nếu người kiểm tra bỏ sót chưa đánh giá một trong các tiêu chí bắt buộc, hệ thống yêu cầu đánh giá đầy đủ trước khi lưu kết quả.<br><br>Tại bước 6, nếu xe chưa hoàn tất kiểm định chất lượng hoặc còn công việc sửa lại chưa hoàn thành, hệ thống từ chối yêu cầu tính tiền và thông báo lý do phương tiện chưa đủ điều kiện xuất xưởng. |

---

---


---

## UC-42 – Bàn giao xe (Release Vehicle)

| **Mã Use case**    | UC-42 |
| ------------------ | ------ |
| **Tên Use case**   | Bàn giao xe (Release Vehicle) |
| **Mô tả**          | Cố vấn dịch vụ kiểm tra toàn bộ điều kiện bàn giao (job xong, kiểm định đạt, hóa đơn đã thanh toán) và thực hiện thủ tục bàn giao xe chính thức cho khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Tất cả job đã hoàn thành, kiểm định chất lượng đạt và hóa đơn đã được thanh toán đầy đủ (hệ thống đã tự động xác nhận qua UC-16). |
| **Hậu điều kiện**  | Thành công: Xe được bàn giao, phiếu công việc chuyển sang trạng thái **Đã bàn giao** và khách hàng nhận thông báo.<br>Thất bại: Hệ thống từ chối nếu chưa đủ điều kiện. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Bàn giao xe**.<br>2. Hệ thống tự động kiểm tra: job hoàn thành, kiểm định đạt và hóa đơn đã thanh toán.<br>3. Nếu đủ điều kiện, cố vấn ghi chú bàn giao nếu cần.<br>4. Cố vấn nhấn **Xác nhận bàn giao**.<br>5. Hệ thống cập nhật trạng thái phiếu thành **Đã bàn giao** và gửi thông báo cho khách hàng. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu bất kỳ điều kiện nào chưa đạt, hệ thống không cho phép bàn giao và hiển thị danh sách điều kiện còn thiếu cụ thể. |

---


---

# PHẦN 5 – QUẢN LÝ DỊCH VỤ & KHO (SERVICE MANAGER)

---

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

## UC-44 – Thêm danh mục phụ tùng (Create Part Category)

| **Mã Use case**    | UC-44 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm danh mục phụ tùng (Create Part Category) |
| **Mô tả**          | Quản lý dịch vụ tạo mới dữ liệu danh mục phụ tùng vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu danh mục phụ tùng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý danh mục phụ tùng và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin danh mục phụ tùng.<br>3. Quản lý dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu danh mục phụ tùng mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-45 – Xem danh mục phụ tùng (View Part Category)

| **Mã Use case**    | UC-45 |
| ------------------ | ------ |
| **Tên Use case**   | Xem danh mục phụ tùng (View Part Category) |
| **Mô tả**          | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin của danh mục phụ tùng đã có trong hệ thống. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết danh mục phụ tùng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý danh mục phụ tùng.<br>2. Hệ thống tải và hiển thị danh sách danh mục phụ tùng hiện có.<br>3. Quản lý dịch vụ có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản lý dịch vụ chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản lý dịch vụ không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-46 – Cập nhật danh mục phụ tùng (Update Part Category)

| **Mã Use case**    | UC-46 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật danh mục phụ tùng (Update Part Category) |
| **Mô tả**          | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của danh mục phụ tùng hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền cập nhật và danh mục phụ tùng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của danh mục phụ tùng được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và mở chi tiết danh mục phụ tùng cần chỉnh sửa.<br>2. Quản lý dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản lý dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-47 – Xóa danh mục phụ tùng (Delete Part Category)

| **Mã Use case**    | UC-47 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa danh mục phụ tùng (Delete Part Category) |
| **Mô tả**          | Quản lý dịch vụ thực hiện xóa hoặc vô hiệu hóa danh mục phụ tùng khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền xóa và danh mục phụ tùng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi danh mục phụ tùng bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và chọn danh mục phụ tùng cần xử lý.<br>2. Quản lý dịch vụ chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản lý dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản lý dịch vụ chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-48 – Thêm phụ tùng (Create Inventory Item)

| **Mã Use case**    | UC-48 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm phụ tùng (Create Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ tạo mới dữ liệu phụ tùng thực tế (Variant/SKU) theo từng hãng vào hệ thống để theo dõi tồn kho và định giá. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. Danh mục phụ tùng tương ứng phải tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Dữ liệu phụ tùng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình kho phụ tùng và chọn hành động **Thêm phụ tùng**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin chi tiết cho phụ tùng.<br>3. Quản lý dịch vụ chọn danh mục phụ tùng, chọn thương hiệu, điền mã SKU, giá bán dự kiến và mức cảnh báo tồn kho an toàn.<br>4. Quản lý dịch vụ nhấn **Lưu lại**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu (không được bỏ trống các trường bắt buộc, mã SKU phải là duy nhất).<br>6. Hệ thống tiến hành lưu dữ liệu, hiển thị thông báo thành công và cập nhật danh sách hiển thị. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình danh sách mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu mã SKU đã tồn tại hoặc thiếu các trường thông tin bắt buộc, hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-49 – Xem phụ tùng (View Inventory Item)

| **Mã Use case**    | UC-49 |
| ------------------ | ------ |
| **Tên Use case**   | Xem phụ tùng (View Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin, giá bán, cùng số lượng tồn kho của các mã phụ tùng đã có trong hệ thống. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và thông tin chi tiết của phụ tùng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý kho phụ tùng.<br>2. Hệ thống tải và hiển thị danh sách các mã phụ tùng hiện có.<br>3. Quản lý dịch vụ nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc (như phân loại, danh mục, trạng thái tồn kho) để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên các tiêu chí tìm kiếm/lọc tương ứng.<br>5. Quản lý dịch vụ chọn một bản ghi cụ thể để xem thêm thông tin chi tiết. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí tìm kiếm, hệ thống hiển thị thông báo "Không có dữ liệu". |

---

---

## UC-50 – Cập nhật phụ tùng (Update Inventory Item)

| **Mã Use case**    | UC-50 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật phụ tùng (Update Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của một mã phụ tùng hiện có trong hệ thống (như giá bán, mức tồn kho cảnh báo) để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi phụ tùng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của phụ tùng được cập nhật và lưu trữ trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập danh sách kho phụ tùng và chọn hành động **Chỉnh sửa** trên bản ghi phụ tùng mong muốn.<br>2. Hệ thống hiển thị biểu mẫu cập nhật với các thông tin hiện tại của bản ghi (mã SKU không cho phép chỉnh sửa).<br>3. Quản lý dịch vụ thay đổi các trường thông tin cần thiết như giá bán, thương hiệu, mức cảnh báo tồn kho.<br>4. Quản lý dịch vụ nhấn **Lưu lại**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới nhập.<br>6. Hệ thống tiến hành lưu các thay đổi, hiển thị thông báo cập nhật thành công và làm mới danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình danh sách mà không lưu thay đổi. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ hoặc thiếu thông tin bắt buộc, hệ thống hiển thị thông báo lỗi chi tiết. Use case quay lại bước 3.<br><br>Tại bước 6, nếu bản ghi đã bị vô hiệu hóa hoặc thay đổi bởi phiên làm việc khác, hệ thống thông báo lỗi xung đột dữ liệu. |

---

---

## UC-51 – Ngừng kinh doanh/Xóa phụ tùng (Delete/Deactivate Inventory Item)

| **Mã Use case**    | UC-51 |
| ------------------ | ------ |
| **Tên Use case**   | Ngừng kinh doanh/Xóa phụ tùng (Delete/Deactivate Inventory Item) |
| **Mô tả**          | Quản lý dịch vụ thực hiện thay đổi trạng thái hoạt động (ngừng kinh doanh hoặc kích hoạt lại) đối với một bản ghi phụ tùng khi không còn nhu cầu kinh doanh mã hàng này. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền xóa/thay đổi trạng thái và bản ghi phụ tùng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Trạng thái của bản ghi phụ tùng được cập nhật thành công (Ngừng hoạt động hoặc Đang hoạt động).<br>Thất bại: Hệ thống thông báo lỗi, trạng thái bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập danh sách kho phụ tùng và xác định bản ghi cần xử lý.<br>2. Quản lý dịch vụ chọn hành động **Ngừng kinh doanh** (hoặc Kích hoạt lại).<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản lý dịch vụ nhấn **Đồng ý** xác nhận.<br>5. Hệ thống kiểm tra các điều kiện (nếu có) và cập nhật trạng thái hoạt động của mã phụ tùng.<br>6. Hệ thống hiển thị thông báo thao tác thành công và cập nhật lại danh sách hiển thị. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác, giữ nguyên trạng thái dữ liệu. |
| **Luồng ngoại lệ** | Không có. |

---

---

## UC-52 – Nhập kho (Receive Inventory)

| **Mã Use case**    | UC-52 |
| ------------------ | ------ |
| **Tên Use case**   | Nhập kho (Receive Inventory) |
| **Mô tả**          | Quản lý ghi nhận hàng nhập từ nhà cung cấp hoặc nhập tồn đầu kỳ. Sau mỗi lần nhập, hệ thống tự động tính lại giá vốn bình quân theo phương pháp bình quân gia quyền di động. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Mặt hàng đã có trong danh mục (UC-31). Nhà cung cấp đã được đăng ký nếu nhập từ nhà cung cấp. |
| **Hậu điều kiện**  | Thành công: Số lượng tồn kho tăng, giá vốn bình quân được tính lại và phiếu nhập kho được lưu lại.<br>Thất bại: Hệ thống thông báo lỗi, tồn kho không thay đổi. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Nhập kho** và chọn **Tạo phiếu nhập**.<br>2. Quản lý chọn nhà cung cấp và ngày nhập hàng.<br>3. Quản lý thêm từng mặt hàng: chọn tên hàng, nhập số lượng nhận và đơn giá mua vào.<br>4. Quản lý nhấn **Xác nhận nhập kho**.<br>5. Hệ thống tăng số lượng tồn kho, tự động tính lại giá vốn bình quân và ghi phiếu nhập. |
| **Luồng thay thế** | **[Nhập tồn đầu kỳ]** Tại bước 1, thay vì chọn **Tạo phiếu nhập** thông thường:<br>1a. Quản lý chọn **Nhập tồn đầu kỳ**.<br>2a. Quản lý chọn từng mặt hàng cần nhập tồn ban đầu.<br>3a. Quản lý nhập số lượng và giá vốn ban đầu cho từng mặt hàng.<br>4a. Quản lý nhấn **Xác nhận nhập tồn**.<br>5a. Hệ thống ghi nhận tồn kho ban đầu và thiết lập giá vốn. |
| **Luồng ngoại lệ** | Tại bước 4, nếu thiếu thông tin bắt buộc (nhà cung cấp, ngày, mặt hàng hoặc số lượng), hệ thống từ chối và hiển thị các trường cần bổ sung. |

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

---

# PHẦN 6 – QUẢN TRỊ VIÊN (ADMINISTRATOR)

---

---

## UC-54 – Thêm tài khoản (Create Account)

| **Mã Use case**    | UC-54 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm tài khoản (Create Account) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu tài khoản vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu tài khoản mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý tài khoản và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin tài khoản.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu tài khoản mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-55 – Xem tài khoản (View Account)

| **Mã Use case**    | UC-55 |
| ------------------ | ------ |
| **Tên Use case**   | Xem tài khoản (View Account) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của tài khoản đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết tài khoản được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý tài khoản.<br>2. Hệ thống tải và hiển thị danh sách tài khoản hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-56 – Cập nhật tài khoản (Update Account)

| **Mã Use case**    | UC-56 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật tài khoản (Update Account) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của tài khoản hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi tài khoản cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của tài khoản được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi tài khoản cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-57 – Xóa tài khoản (Delete Account)

| **Mã Use case**    | UC-57 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa tài khoản (Delete Account) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi tài khoản khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi tài khoản cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi tài khoản bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi tài khoản cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-58 – Thêm nhân viên (Create Employee)

| **Mã Use case**    | UC-58 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm nhân viên (Create Employee) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu nhân viên vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu nhân viên mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý nhân viên và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin nhân viên.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu nhân viên mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-59 – Xem nhân viên (View Employee)

| **Mã Use case**    | UC-59 |
| ------------------ | ------ |
| **Tên Use case**   | Xem nhân viên (View Employee) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của nhân viên đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết nhân viên được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý nhân viên.<br>2. Hệ thống tải và hiển thị danh sách nhân viên hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-60 – Cập nhật nhân viên (Update Employee)

| **Mã Use case**    | UC-60 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật nhân viên (Update Employee) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của nhân viên hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi nhân viên cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của nhân viên được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi nhân viên cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-61 – Xóa nhân viên (Delete Employee)

| **Mã Use case**    | UC-61 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa nhân viên (Delete Employee) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi nhân viên khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi nhân viên cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi nhân viên bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi nhân viên cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-62 – Thêm dịch vụ (Create Service)

| **Mã Use case**    | UC-62 |
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

---

## UC-63 – Xem dịch vụ (View Service)

| **Mã Use case**    | UC-63 |
| ------------------ | ------ |
| **Tên Use case**   | Xem dịch vụ (View Service) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của dịch vụ đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết dịch vụ được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý dịch vụ.<br>2. Hệ thống tải và hiển thị danh sách dịch vụ hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-64 – Cập nhật dịch vụ (Update Service)

| **Mã Use case**    | UC-64 |
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

---

## UC-65 – Xóa dịch vụ (Delete Service)

| **Mã Use case**    | UC-65 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa dịch vụ (Delete Service) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi dịch vụ khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi dịch vụ cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi dịch vụ bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi dịch vụ cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-66 – Thêm danh mục dịch vụ (Create Service Category)

| **Mã Use case**    | UC-66 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm danh mục dịch vụ (Create Service Category) |
| **Mô tả**          | Quản trị viên tạo mới nhóm/danh mục dịch vụ vào hệ thống để phân loại các dịch vụ. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu danh mục mới được lưu vào hệ thống.<br>Thất bại: Hệ thống thông báo lỗi. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý danh mục và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin danh mục.<br>3. Quản trị viên nhập tên danh mục và mô tả.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống kiểm tra hợp lệ, lưu danh mục mới và hiển thị thông báo thành công. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và không lưu thay đổi. |
| **Luồng ngoại lệ** | Tại bước 5, nếu thiếu thông tin bắt buộc, hệ thống hiển thị thông báo lỗi. |

---

## UC-67 – Xem danh mục dịch vụ (View Service Category)

| **Mã Use case**    | UC-67 |
| ------------------ | ------ |
| **Tên Use case**   | Xem danh mục dịch vụ (View Service Category) |
| **Mô tả**          | Quản trị viên xem danh sách và chi tiết các danh mục dịch vụ đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết danh mục được hiển thị chính xác. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý danh mục.<br>2. Hệ thống tải và hiển thị danh sách danh mục dịch vụ hiện có.<br>3. Quản trị viên chọn một danh mục cụ thể để xem chi tiết. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-68 – Cập nhật danh mục dịch vụ (Update Service Category)

| **Mã Use case**    | UC-68 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật danh mục dịch vụ (Update Service Category) |
| **Mô tả**          | Quản trị viên chỉnh sửa thông tin của danh mục dịch vụ hiện có. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập và bản ghi danh mục đang tồn tại. |
| **Hậu điều kiện**  | Thành công: Thông tin mới được cập nhật.<br>Thất bại: Hệ thống báo lỗi. |
| **Luồng cơ bản**   | 1. Quản trị viên mở danh mục cần chỉnh sửa và chọn **Cập nhật**.<br>2. Hệ thống hiển thị biểu mẫu với thông tin hiện tại.<br>3. Quản trị viên thay đổi tên hoặc mô tả.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống kiểm tra, lưu thay đổi và thông báo thành công. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, chọn **Hủy**: Đóng biểu mẫu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, hệ thống báo lỗi. |

---

## UC-69 – Xóa danh mục dịch vụ (Delete Service Category)

| **Mã Use case**    | UC-69 |
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

## UC-70 – Thêm loại công việc (Create Job Type)

| **Mã Use case**    | UC-70 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm loại công việc (Create Job Type) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu loại công việc vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu loại công việc mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý loại công việc và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin loại công việc.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu loại công việc mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-71 – Xem loại công việc (View Job Type)

| **Mã Use case**    | UC-71 |
| ------------------ | ------ |
| **Tên Use case**   | Xem loại công việc (View Job Type) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của loại công việc đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết loại công việc được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý loại công việc.<br>2. Hệ thống tải và hiển thị danh sách loại công việc hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-72 – Cập nhật loại công việc (Update Job Type)

| **Mã Use case**    | UC-72 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật loại công việc (Update Job Type) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của loại công việc hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi loại công việc cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của loại công việc được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi loại công việc cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-73 – Xóa loại công việc (Delete Job Type)

| **Mã Use case**    | UC-73 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa loại công việc (Delete Job Type) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi loại công việc khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi loại công việc cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi loại công việc bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi loại công việc cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---
## UC-74 – Thêm danh mục chung (Create System Catalog)

| **Mã Use case**    | UC-74 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm danh mục chung (Create System Catalog) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu danh mục chung vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu danh mục chung mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý danh mục chung và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin danh mục chung.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu danh mục chung mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-75 – Xem danh mục chung (View System Catalog)

| **Mã Use case**    | UC-75 |
| ------------------ | ------ |
| **Tên Use case**   | Xem danh mục chung (View System Catalog) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của danh mục chung đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết danh mục chung được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý danh mục chung.<br>2. Hệ thống tải và hiển thị danh sách danh mục chung hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-76 – Cập nhật danh mục chung (Update System Catalog)

| **Mã Use case**    | UC-76 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật danh mục chung (Update System Catalog) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của danh mục chung hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi danh mục chung cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của danh mục chung được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi danh mục chung cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-77 – Xóa danh mục chung (Delete System Catalog)

| **Mã Use case**    | UC-77 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa danh mục chung (Delete System Catalog) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi danh mục chung khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi danh mục chung cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi danh mục chung bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi danh mục chung cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

# PHẦN 7 – HỆ THỐNG TỰ ĐỘNG (BACKGROUND JOBS)

---

## UC-78 – Gửi email nhắc hẹn tự động (Auto Reminder)

| **Mã Use case**    | UC-78 |
| ------------------ | ------ |
| **Tên Use case**   | Gửi email nhắc hẹn tự động (Auto Reminder) |
| **Mô tả**          | Hệ thống tự động quét các lịch hẹn sắp diễn ra trong vòng 24 giờ tới và gửi email nhắc nhở cho khách hàng. |
| **Đối tượng**      | Hệ thống (System / Background Job) |
| **Tiền điều kiện** | Hệ thống đang hoạt động. Có lịch hẹn ở trạng thái REQUESTED, CONFIRMED hoặc RESCHEDULED chuẩn bị diễn ra trong 24h tới. Khách hàng có địa chỉ email hợp lệ. |
| **Hậu điều kiện**  | Thành công: Email nhắc nhở được gửi tới khách hàng.<br>Thất bại: Hệ thống ghi log lỗi (nếu lỗi gửi mail), không làm gián đoạn hệ thống. |
| **Luồng cơ bản**   | 1. Đến chu kỳ định kỳ (ví dụ mỗi giờ 1 lần), hệ thống tự động kích hoạt Job nhắc hẹn.<br>2. Hệ thống tìm kiếm các lịch hẹn thỏa mãn điều kiện thời gian (còn 23.5h - 24.5h nữa là đến giờ hẹn).<br>3. Hệ thống tạo nội dung email nhắc nhở (thời gian, ngày tháng, biển số xe).<br>4. Hệ thống gọi dịch vụ gửi email để gửi thư cho khách hàng.<br>5. Hệ thống ghi nhận log kết quả gửi (Thành công/Thất bại). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu dịch vụ SMTP/Email lỗi mạng hoặc từ chối kết nối, hệ thống sẽ ghi log lỗi và tiếp tục xử lý các lịch hẹn tiếp theo (bỏ qua lịch bị lỗi). |

---

## UC-79 – Xem lịch sử sửa chữa (View Repair History)

| **Mã Use case**    | UC-79 |
| ------------------ | ------ |
| **Tên Use case**   | Xem lịch sử sửa chữa (View Repair History) |
| **Mô tả**          | Khách hàng tra cứu sổ bảo dưỡng điện tử và lịch sử sửa chữa của các phương tiện thuộc sở hữu của mình đã hoàn tất chu trình dịch vụ hoặc đã hủy. Khách hàng có thể lọc theo phương tiện, khoảng thời gian, trạng thái hồ sơ, xem chi tiết kết quả sửa chữa, kiểm định chất lượng, chính sách bảo hành và tải xuống Biên bản bàn giao xe hoặc Hóa đơn điện tử dưới dạng PDF. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Danh sách lịch sử sửa chữa và chi tiết sổ bảo dưỡng điện tử được hiển thị chính xác theo yêu cầu; khách hàng tải được chứng từ PDF (nếu có).<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu hoặc hồ sơ không tồn tại. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập mục **Lịch sử sửa chữa** (Sổ bảo dưỡng & Lịch sử sửa chữa).<br>2. Hệ thống tải và hiển thị thống kê tổng quan (tổng lượt hoàn tất, tổng chi phí đã quyết toán, lần xuất xưởng gần nhất) cùng danh sách các hồ sơ sửa chữa ở trạng thái **Hoàn tất & Lưu trữ**, **Đã giao xe** hoặc **Đã hủy dịch vụ**.<br>3. Khách hàng có thể tìm kiếm nhanh theo mã phiếu, biển số, tên dịch vụ hoặc lọc theo phương tiện, trạng thái và khoảng thời gian (Từ ngày – Đến ngày).<br>4. Hệ thống cập nhật lại danh sách hồ sơ theo tiêu chí tìm kiếm và bộ lọc đã chọn.<br>5. Khách hàng nhấn **Xem sổ bảo dưỡng** trên một hồ sơ cụ thể.<br>6. Hệ thống hiển thị cửa sổ chi tiết **Sổ bảo dưỡng điện tử** gồm 4 mục: **Tổng quan & Tiếp nhận** (tình trạng ban đầu, số km lúc vào, yêu cầu của khách), **Hạng mục & Phụ tùng** (danh sách dịch vụ đã thực hiện), **Kiểm định QC & Tiến trình** (kết quả nghiệm thu chất lượng và mốc thời gian), và **Bàn giao & Bảo hành** (số km xuất xưởng, thời gian bàn giao, chính sách bảo hành). |
| **Luồng thay thế** | **[Tải chứng từ PDF]** Tại danh sách lịch sử (bước 2) hoặc trong cửa sổ chi tiết sổ bảo dưỡng (bước 6):<br>6a. Khách hàng nhấn **Biên bản bàn giao (PDF)** hoặc **Hóa đơn VAT**.<br>6b. Hệ thống trích xuất và tải xuống tệp PDF tương ứng về thiết bị của khách hàng.<br><br>**[Xóa bộ lọc]** Tại bước 3, khách hàng nhấn **Xóa bộ lọc**:<br>3a. Hệ thống đặt lại toàn bộ điều kiện lọc và hiển thị lại danh sách lịch sử sửa chữa mặc định. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu khách hàng chưa có lịch sử sửa chữa hoặc không có hồ sơ nào khớp với điều kiện lọc, hệ thống hiển thị thông báo "Không tìm thấy hồ sơ nào".<br><br>Tại bước 6, nếu hồ sơ không tồn tại hoặc không thuộc quyền sở hữu của khách hàng, hệ thống từ chối truy cập và hiển thị thông báo lỗi. |
