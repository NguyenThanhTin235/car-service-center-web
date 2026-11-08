# ĐẶC TẢ USE CASE – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ

> **Phiên bản:** 3.1
> **Cập nhật:** 2026-10-10

---

## MỤC LỤC

| Nhóm | UC ID | Số lượng |
|------|-------|----------|
| **Khách vãng lai (Guest)** | UC-01 → UC-03 | 3 use case |
| **Khách hàng (Customer)** | UC-04 → UC-16, UC-80 | 14 use case |
| **Nhân viên quầy dịch vụ (Front Desk Staff)** | UC-17 → UC-28 | 12 use case |
| **Cố vấn dịch vụ** | UC-29 → UC-43 | 15 use case |
| **Quản lý dịch vụ & Kho (Service Manager)** | UC-44 → UC-54 | 11 use case |
| **Quản trị viên (Administrator)** | UC-55 → UC-78 | 24 use case |
| **Hệ thống tự động (Background Jobs)** | UC-79 | 1 use case |
| **Phân hệ quản lý bảo hành** | UC-81 → UC-87 | 7 use case |
| **Tổng cộng** | **UC-01 → UC-87** | **87 use case** |

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
| **Mô tả**          | Khách hàng quên mật khẩu có thể yêu cầu đặt lại mật khẩu ngay tại trang đăng nhập. Hệ thống gửi mã xác thực OTP về địa chỉ email đã đăng ký để xác minh danh tính trước khi cho phép đặt mật khẩu mới. Chức năng này chỉ dành riêng cho Khách hàng; tài khoản nhân viên do Quản trị viên cấp và đặt lại mật khẩu thông qua UC-57. |
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

# PHẦN 4 – CỐ VẤN DỊCH VỤ

---

## UC-29 – Tạo phiếu công việc

| **Mã Use case**    | UC-29 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo phiếu công việc |
| **Mô tả**          | Cố vấn dịch vụ xem danh sách xe đang chờ tiếp nhận tại xưởng và tiến hành tạo phiếu công việc – hồ sơ trung tâm theo dõi toàn bộ chu trình khám xe, báo giá, thi công, kiểm định và bàn giao xe. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Xe đã được nhân viên quầy đưa vào hàng đợi tiếp nhận ở trạng thái Chờ tiếp nhận từ nguồn lịch hẹn đã đến, xe vãng lai hoặc xe cứu hộ kéo về xưởng. |
| **Hậu điều kiện**  | Thành công: Phiếu công việc được tạo ở trạng thái Bản nháp, liên kết chặt chẽ với khách hàng, phương tiện và nguồn tiếp nhận; bản ghi tiếp nhận chuyển sang trạng thái Đã tiếp nhận vào xưởng. Hệ thống tự động chuyển hướng đến màn hình chi tiết phiếu công việc mới.<br>Thất bại: Hệ thống thông báo lỗi, phiếu không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn truy cập màn hình **Hàng đợi tiếp nhận** để xem danh sách xe đang chờ.<br>2. Cố vấn có thể nhấp vào dòng xe để mở ngăn chi tiết bên phải hoặc nhấn trực tiếp nút biểu tượng **Tạo phiếu công việc** tại cột thao tác.<br>3. Tại ngăn chi tiết hoặc bảng danh sách, cố vấn nhấn nút **Tạo phiếu công việc ngay**.<br>4. Hệ thống kiểm tra dữ liệu, tạo phiếu công việc mới với mã phiếu tự động (ví dụ: WO26090001), gán cố vấn phụ trách và liên kết thông tin khách hàng, xe và nguồn tiếp nhận.<br>5. Hệ thống hiển thị thông báo: *"Tạo phiếu thành công!"* và tự động chuyển hướng màn hình đến trang chi tiết phiếu công việc. |
| **Luồng thay thế** | **[Chỉnh sửa thông tin khách hàng & xe]** Tại thanh tiêu đề trên cùng của màn hình chi tiết phiếu công việc bất cứ lúc nào:<br>1a. Cố vấn nhấn nút biểu tượng bút chì (**Sửa thông tin xe**) để mở hộp thoại **Chỉnh sửa thông tin xe** $	o$ Điều chỉnh số khung VIN, màu sơn, năm sản xuất $	o$ Nhấn **Lưu thay đổi** (hoặc **Hủy**).<br>2a. Cố vấn nhấn nút biểu tượng bút chì (**Sửa thông tin khách**) để mở hộp thoại **Chỉnh sửa thông tin khách hàng** $	o$ Điều chỉnh họ tên, số điện thoại, email liên hệ $	o$ Nhấn **Lưu thay đổi** (hoặc **Hủy**).<br><br>**[Xem lại phiếu đã tạo từ hàng đợi]** Đối với xe đã được tạo phiếu (trạng thái Đã tiếp nhận vào xưởng), cố vấn có thể nhấn **Xem phiếu công việc** để mở trực tiếp hồ sơ công việc đang xử lý. |
| **Luồng ngoại lệ** | Tại bước 3, nếu bản ghi tiếp nhận bị thiếu thông tin bắt buộc (chưa chọn khách hàng hoặc phương tiện), hệ thống từ chối tạo phiếu và hiển thị thông báo lỗi cụ thể. |

---

## UC-30 – Ghi nhận tình trạng xe

| **Mã Use case**    | UC-30 |
| ------------------ | ------ |
| **Tên Use case**   | Ghi nhận tình trạng xe |
| **Mô tả**          | Cố vấn dịch vụ ghi nhận chi tiết hiện trạng xe tại thời điểm bàn giao tiếp nhận vào xưởng: số công-tơ-mét (ODO), mức xăng, các phản ánh/yêu cầu của khách hàng, tình trạng ngoại quan quan sát được, tài sản khách để trên xe và hình ảnh chụp hiện trường. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-29) và đang ở trạng thái Bản nháp hoặc Đang lập kế hoạch. |
| **Hậu điều kiện**  | Thành công: Thông tin tiếp nhận được lưu thành công, phiếu công việc hoàn tất bước tiếp nhận ban đầu và chuyển sang trạng thái Đang lập kế hoạch, sẵn sàng cho việc kiểm tra xe và lên kế hoạch dịch vụ.<br>Thất bại: Hệ thống thông báo lỗi nếu thiếu các trường thông tin bắt buộc. |
| **Luồng cơ bản**   | 1. Cố vấn mở màn hình chi tiết phiếu công việc và truy cập tab **Tiếp nhận & Kiểm tra** (Tab 1).<br>2. Tại khung **TÌNH TRẠNG XE LÚC TIẾP NHẬN**, cố vấn (nhấn **Chỉnh sửa** nếu phiếu đã có dữ liệu trước đó) tiến hành nhập các thông tin:<br>- **Số ODO (km):** Nhập số km hiện tại trên đồng hồ xe.<br>- **Mức nhiên liệu:** Nhấp chọn 1 trong 5 mức xăng chuẩn hóa (**Bình cạn E**, **1/4**, **1/2**, **3/4**, **Đầy bình F**).<br>- **Vấn đề khách phản ánh:** Nhấp chọn các thẻ triệu chứng nhanh hoặc nhấn **+ Thêm phàn nàn** để nhập nội dung khách yêu cầu.<br>- **Tình trạng xe quan sát bên ngoài:** Ghi chú hiện trạng ngoại thất tổng thể.<br>- **Tài sản để trên xe:** Ghi nhận các vật phẩm giá trị khách để lại trong xe (ví dụ: Thẻ từ, USB, Kính râm...).<br>- **Hình ảnh minh chứng:** Nhấp tải lên hoặc chụp các bức ảnh ghi nhận tổng quan góc xe.<br>3. Cố vấn nhấn nút **Lưu Thông Tin**.<br>4. Hệ thống kiểm tra dữ liệu hợp lệ, lưu thông tin tiếp nhận, chuyển trạng thái phiếu sang **Đang lập kế hoạch** và hiển thị thông báo: *"Lưu ghi nhận tình trạng xe thành công"*. |
| **Luồng thay thế** | **[Hủy thao tác chỉnh sửa]** Cố vấn có thể nhấn nút **Hủy** để khôi phục lại các giá trị ban đầu trước khi lưu. |
| **Luồng ngoại lệ** | Tại bước 3, nếu số km ODO bị bỏ trống hoặc nhỏ hơn hoặc bằng 0, hoặc chưa chọn mức nhiên liệu, hệ thống từ chối lưu và hiển thị cảnh báo các trường thông tin còn thiếu. |

---

## UC-31 – Thêm hạng mục dịch vụ

| **Mã Use case**    | UC-31 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm hạng mục dịch vụ |
| **Mô tả**          | Cố vấn dịch vụ chọn và thêm các gói/hạng mục dịch vụ từ danh mục dịch vụ chuẩn của trung tâm vào phiếu công việc để định hình các khối công việc sửa chữa hoặc bảo dưỡng cho khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập và phiếu công việc đang ở trạng thái cho phép lập kế hoạch (Bản nháp hoặc Đang lập kế hoạch). |
| **Hậu điều kiện**  | Thành công: Hạng mục dịch vụ được lưu vào phiếu công việc và tự động hiển thị đồng bộ ở cả tab Tiếp nhận & Kiểm tra và tab Hạng mục sửa chữa.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu phiếu giữ nguyên. |
| **Luồng cơ bản**   | 1. Tại tab **Tiếp nhận & Kiểm tra** (hoặc tab **Hạng mục sửa chữa**), cố vấn nhấn nút **Thêm dịch vụ**.<br>2. Hệ thống hiển thị hộp thoại tìm kiếm danh mục các dịch vụ hiện có của trung tâm.<br>3. (Tùy chọn) Cố vấn nhập từ khóa vào ô tìm kiếm để lọc dịch vụ theo tên.<br>4. Cố vấn nhấp chọn dịch vụ mong muốn từ danh sách kết quả.<br>5. Hệ thống thêm dịch vụ vào phiếu công việc, khởi tạo cấu trúc dịch vụ và tự động lưu thay đổi. |
| **Luồng thay thế** | **[Không tìm thấy dịch vụ]** Tại bước 3, nếu không có dịch vụ nào khớp với từ khóa:<br>3a. Hệ thống hiển thị thông báo "Không tìm thấy dịch vụ phù hợp". Cố vấn có thể đổi từ khóa hoặc đóng danh mục. |
| **Luồng ngoại lệ** | Tại bước 4, nếu dịch vụ đã tồn tại trong phiếu công việc, hệ thống tự động ẩn hoặc cảnh báo dịch vụ này đã có trong phiếu để tránh thêm trùng lặp. |

---

## UC-32 – Xóa hạng mục dịch vụ

| **Mã Use case**    | UC-32 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa hạng mục dịch vụ |
| **Mô tả**          | Cố vấn dịch vụ loại bỏ một hạng mục dịch vụ đã thêm khỏi phiếu công việc khi khách hàng không có nhu cầu hoặc chuyển đổi phương án sửa chữa. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đang ở trạng thái cho phép lập kế hoạch (Bản nháp hoặc Đang lập kế hoạch) và đã có ít nhất một hạng mục dịch vụ. |
| **Hậu điều kiện**  | Thành công: Hạng mục dịch vụ và các công việc phụ thuộc chưa thi công được loại bỏ hoàn toàn khỏi phiếu công việc.<br>Thất bại: Hệ thống từ chối xóa và hiển thị thông báo lỗi. |
| **Luồng cơ bản**   | 1. Cố vấn truy cập tab **Tiếp nhận & Kiểm tra** hoặc tab **Hạng mục sửa chữa**.<br>2. Cố vấn tìm đến thẻ dịch vụ cần loại bỏ và nhấp vào biểu tượng dấu nhân (**Xóa dịch vụ**) trên góc thẻ.<br>3. Hệ thống kiểm tra điều kiện xóa hợp lệ và tiến hành loại bỏ dịch vụ khỏi phiếu công việc.<br>4. Hệ thống cập nhật lại danh sách hiển thị và tính toán lại chi phí ước tính. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu báo giá chứa dịch vụ này đã được khách hàng phê duyệt, hoặc dịch vụ đã có công việc bắt đầu thi công trong xưởng, hệ thống khóa nút xóa và thông báo lỗi: *"Không thể xóa dịch vụ khi báo giá đã được phê duyệt hoặc dịch vụ đang thực hiện."* |

---

## UC-33 – Kiểm tra xe

| **Mã Use case**    | UC-33 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm tra xe |
| **Mô tả**          | Cố vấn dịch vụ sử dụng sơ đồ tương tác thân xe để đánh dấu chính xác vị trí và loại khuyết tật ngoại quan quan sát được trên xe (móp méo, trầy xước, nứt vỡ, rỉ sét, thiếu chi tiết). Mỗi điểm đánh dấu tự động sinh một bản ghi vết lỗi phát hiện kèm ghi chú, ảnh chụp hiện trường và cho phép tạo ngay công việc xử lý tương ứng. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-29) và đã lưu thông tin tiếp nhận (UC-30). Xe đang ở xưởng và chưa duyệt thi công. |
| **Hậu điều kiện**  | Thành công: Các điểm đánh dấu được lưu trên sơ đồ xe kèm danh sách vết lỗi phát hiện chi tiết, sẵn sàng liên kết tạo việc xử lý (UC-34).<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Tại tab **Tiếp nhận & Kiểm tra**, cố vấn cuộn đến khu vực **SƠ ĐỒ KIỂM TRA XE & VẾT LỖI**.<br>2. Cố vấn chọn góc nhìn xe phù hợp (**Trước**, **Sau**, **Trái**, **Phải**).<br>3. Cố vấn chọn một loại đánh dấu khuyết tật trên thanh công cụ:<br>- **Móp méo**<br>- **Trầy xước**<br>- **Hư hỏng bể vỡ**<br>- **Rỉ sét**<br>- **Thiếu phụ tùng**<br>4. Cố vấn nhấp chuột trực tiếp vào bộ phận bị lỗi trên sơ đồ xe.<br>5. Hệ thống đặt điểm đánh dấu lên xe và tự động thêm một dòng vết lỗi vào bảng danh sách bên phải.<br>6. Cố vấn nhập trực tiếp nội dung mô tả lỗi vào ô ghi chú của dòng vết lỗi.<br>7. (Tùy chọn) Cố vấn nhấp biểu tượng máy ảnh (**Tải ảnh minh chứng**) để đính kèm ảnh chụp hiện trường (ảnh được tự động nén dung lượng trước khi tải lên).<br>8. (Tùy chọn) Cố vấn nhấn nút **+ Job** tại dòng vết lỗi để mở hộp thoại tạo ngay công việc xử lý cho vết lỗi này (chuyển tiếp sang UC-34). |
| **Luồng thay thế** | **[Xóa đánh dấu vết lỗi]** Tại bảng danh sách vết lỗi bên phải, cố vấn nhấp vào biểu tượng thùng rác (**Xóa đánh dấu**) trên dòng cần xóa:<br>Hệ thống xóa bản ghi vết lỗi và tự động gỡ điểm đánh dấu tương ứng khỏi sơ đồ xe.<br><br>**[Chỉnh sửa thông tin vết lỗi]** Cố vấn có thể sửa đổi nội dung ghi chú trực tiếp hoặc tải ảnh thay thế bất kỳ lúc nào khi phiếu chưa duyệt. |
| **Luồng ngoại lệ** | Tại luồng Xóa, nếu vết lỗi đã được liên kết với một công việc thi công, hệ thống từ chối xóa và hiển thị thông báo lỗi: *"Vấn đề phát hiện đã được liên kết với công việc, không thể xóa trực tiếp. Vui lòng hủy liên kết công việc trước."*<br><br>Khi báo giá đã được duyệt hoặc phương tiện đang thi công sửa chữa, toàn bộ sơ đồ xe và danh sách vết lỗi tự động khóa chuyển sang chế độ chỉ đọc để bảo toàn hiện trạng ban đầu. |

---

## UC-34 – Lên kế hoạch công việc

| **Mã Use case**    | UC-34 |
| ------------------ | ------ |
| **Tên Use case**   | Lên kế hoạch công việc |
| **Mô tả**          | Cố vấn dịch vụ tạo và tổ chức các hạng mục công việc cần thực hiện trong phiếu công việc. Hệ thống hỗ trợ tạo công việc trực tiếp từ vết lỗi phát hiện lúc kiểm tra xe (nút **+ Job** tại bảng danh sách vết lỗi), tạo công việc thủ công từ tab Hạng mục sửa chữa (nút **Thêm việc** / **Thêm dịch vụ**), hoặc sử dụng trợ lý AI phân tích vết lỗi và đề xuất tự động (nút **Đề xuất bằng AI**). |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-29) và đã ghi nhận tình trạng xe (UC-30). Phiếu đang ở trạng thái cho phép lập kế hoạch (Đang lập kế hoạch hoặc Bản nháp). |
| **Hậu điều kiện**  | Thành công: Đầu việc mới được khởi tạo với mã tự động (ví dụ: JOB26090001), liên kết với dịch vụ và vết lỗi tương ứng, sẵn sàng cho bước khai báo phụ tùng và báo giá.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu phiếu giữ nguyên. |
| **Luồng cơ bản**   | **[Trường hợp 1 – Tạo công việc trực tiếp từ Vết lỗi phát hiện]**<br>1. Cố vấn mở màn hình chi tiết phiếu công việc và chọn tab **Tiếp nhận & Kiểm tra** (khu vực bảng danh sách vết lỗi phát hiện sau khi cắm đánh dấu trên sơ đồ xe).<br>2. Cố vấn tìm đến dòng vết lỗi cần xử lý và nhấn nút **+ Job**.<br>3. Hệ thống hiển thị hộp thoại **Thêm công việc mới** và tự động gán liên kết với vết lỗi đang chọn.<br>4. Cố vấn điền thông tin công việc:<br>- **Tên công việc:** Nhập tên đầu việc kỹ thuật cần làm (hệ thống tự gợi ý tên theo vết lỗi).<br>- **Hạng mục dịch vụ:** Chọn dịch vụ cha hiện có trong phiếu hoặc chọn **+ Hạng mục dịch vụ mới** và nhập tên dịch vụ mới.<br>- **Loại công việc:** Chọn loại việc từ danh mục (Bảo dưỡng, Sửa chữa chung, Đồng sơn, Điện - Điện lạnh...).<br>- **Kỹ thuật viên đảm nhận:** Chọn thợ chính thực hiện từ danh sách kỹ thuật viên đang hoạt động.<br>- **Số giờ dự kiến & Đơn giá:** Khai báo định mức giờ công và đơn giá nhân công (mặc định 1.0 giờ và 150.000 đ/giờ).<br>- **Mô tả công việc:** Ghi chú quy trình xử lý, lưu ý tháo lắp hoặc tiêu chuẩn kiểm tra.<br>5. Cố vấn nhấn **Lưu công việc**.<br>6. Hệ thống khởi tạo công việc mới với mã tự động, lưu thông tin phân công và cập nhật mã công việc lên dòng vết lỗi để xác nhận liên kết thành công. |
| **Luồng thay thế** | **[Trường hợp 2 – Tạo công việc thủ công độc lập]**<br>1a. Cố vấn chuyển sang tab **Hạng mục sửa chữa**.<br>2a. Cố vấn nhấn **Thêm dịch vụ** (chọn dịch vụ từ danh mục mẫu) hoặc nhấn **Thêm việc** tại thẻ dịch vụ mong muốn (hoặc nhấn **Thêm dịch vụ thủ công**).<br>3a. Hệ thống mở hộp thoại **Thêm công việc mới**.<br>4a. Cố vấn nhập đầy đủ các trường thông tin (tên việc, dịch vụ, loại việc, thợ kỹ thuật, giờ công, mô tả) và không liên kết với vết lỗi nào.<br>5a. Cố vấn nhấn **Lưu công việc**.<br><br>**[Trường hợp 3 – Đề xuất kế hoạch công việc tự động bằng AI]**<br>1b. Tại tab **Hạng mục sửa chữa**, cố vấn nhấn nút **Đề xuất bằng AI**.<br>2b. Hệ thống kích hoạt trợ lý AI phân tích các triệu chứng khách báo và toàn bộ vết lỗi chưa xử lý, tổng hợp thành danh sách các hạng mục dịch vụ và công việc tối ưu.<br>3b. Cố vấn tích chọn các công việc phù hợp và nhấn **Áp dụng kế hoạch**.<br>4b. Hệ thống tự động tạo các dịch vụ và công việc tương ứng vào phiếu công việc.<br><br>**[Chỉnh sửa công việc]**<br>1c. Tại tab **Hạng mục sửa chữa**, cố vấn nhấp vào thẻ công việc cần chỉnh sửa.<br>2c. Hệ thống hiển thị hộp thoại **Chỉnh sửa công việc** với thông tin hiện tại.<br>3c. Cố vấn điều chỉnh tên, thợ phân công, giờ công hoặc mô tả và nhấn **Cập nhật**.<br><br>**[Xóa công việc]**<br>1d. Tại hộp thoại **Chỉnh sửa công việc**, cố vấn nhấn nút **Xóa việc** (biểu tượng thùng rác màu đỏ).<br>2d. Hệ thống hiển thị câu hỏi xác nhận **Xác nhận xóa?**.<br>3d. Cố vấn nhấn **Xóa ngay** (hoặc nhấn nút hủy dấu X để bỏ qua).<br>4d. Hệ thống xóa công việc khỏi phiếu và giải phóng liên kết vết lỗi (nếu có) về trạng thái ban đầu. |
| **Luồng ngoại lệ** | Tại bước 1d của luồng Chỉnh sửa/Xóa, nếu báo giá của phiếu đã được khách hàng phê duyệt, phương tiện đang thi công hoặc công việc đã có phụ tùng xuất kho thi công, hệ thống khóa tính năng chỉnh sửa/xóa, chuyển hộp thoại sang chế độ chỉ đọc (**Chi tiết công việc**) và thông báo lỗi: *"Không thể xóa công việc khi báo giá đã được khách hàng phê duyệt. Mọi điều chỉnh công việc sau khi duyệt cần thông qua quy trình Báo giá bổ sung."* |

---

## UC-35 – Khai báo nhân công

| **Mã Use case**    | UC-35 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo nhân công |
| **Mô tả**          | Cố vấn dịch vụ khai báo chi tiết nhân công thi công cho từng đầu việc: loại công việc kỹ thuật, kỹ thuật viên đảm nhận, định mức giờ công ước tính và đơn giá nhân công. Dữ liệu này dùng để phân công công việc thực tế trong xưởng và tự động tính toán tổng chi phí nhân công trong bản báo giá gửi khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-29) và đã tạo ít nhất một công việc (UC-34). Phiếu đang ở trạng thái cho phép lập kế hoạch (Đang lập kế hoạch hoặc báo giá chưa duyệt). |
| **Hậu điều kiện**  | Thành công: Thông tin nhân công được liên kết với công việc, tự động tính thành tiền (*Giờ công × Đơn giá*) và cập nhật vào bảng chiết tính báo giá.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu giữ nguyên. |
| **Luồng cơ bản**   | 1. Khi tạo mới hoặc chỉnh sửa công việc (tại hộp thoại **Thêm công việc mới** / **Chỉnh sửa công việc** của UC-34):<br>2. Cố vấn chọn **Loại công việc** từ danh mục phân loại kỹ thuật (Bảo dưỡng, Sửa chữa chung, Đồng sơn, Điện - Điện lạnh...).<br>3. Cố vấn chọn **Kỹ thuật viên đảm nhận** từ danh sách nhân viên kỹ thuật đang hoạt động trong xưởng.<br>4. Cố vấn nhập **Số giờ dự kiến** cần thiết để hoàn thành công việc (định mức giờ chuẩn theo phân loại việc).<br>5. Cố vấn nhập hoặc kiểm tra **Đơn giá nhân công (VNĐ)** theo đơn giá niêm yết (mặc định 150.000 đ/giờ).<br>6. Hệ thống tự động tính thành tiền nhân công dự kiến.<br>7. Cố vấn nhấn **Lưu công việc** (khi tạo mới) hoặc **Cập nhật** (khi chỉnh sửa).<br>8. Hệ thống ghi nhận bản ghi nhân công cho công việc và hiển thị tên kỹ thuật viên cùng định mức giờ trực tiếp trên thẻ công việc tại tab **Hạng mục sửa chữa**. |
| **Luồng thay thế** | **[Phân công lại kỹ thuật viên hoặc điều chỉnh giờ công]**<br>1a. Tại tab **Hạng mục sửa chữa**, cố vấn nhấp vào thẻ công việc cần điều chỉnh.<br>2a. Hệ thống mở hộp thoại **Chỉnh sửa công việc**.<br>3a. Cố vấn chọn lại **Kỹ thuật viên đảm nhận** khác hoặc cập nhật lại **Số giờ dự kiến** / **Đơn giá nhân công**.<br>4a. Cố vấn nhấn **Cập nhật**.<br>5a. Hệ thống cập nhật phân công công việc mới và tính toán lại chi phí nhân công tương ứng. |
| **Luồng ngoại lệ** | Nếu báo giá của phiếu đã được khách hàng phê duyệt, đơn giá và giờ công nhân công bị khóa cố định. Hệ thống ngăn chặn việc chỉnh sửa trực tiếp và thông báo: *"Báo giá đã được phê duyệt, không thể thay đổi nhân công trực tiếp. Vui lòng tạo Báo giá bổ sung (UC-37) nếu có phát sinh công việc mới."*<br><br>Nếu cố vấn nhập số giờ dự kiến hoặc đơn giá nhỏ hơn hoặc bằng 0, hệ thống báo lỗi: *"Số giờ công và đơn giá nhân công phải lớn hơn 0."* |

---

## UC-36 – Khai báo phụ tùng

| **Mã Use case**    | UC-36 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo phụ tùng |
| **Mô tả**          | Cố vấn dịch vụ khai báo danh mục phụ tùng, linh kiện và vật tư phụ dự kiến cần dùng cho từng công việc cụ thể của xe. Hệ thống hỗ trợ tìm kiếm phụ tùng trong kho, trợ lý AI đề xuất phụ tùng phù hợp theo dòng xe, cảnh báo thiếu hàng tồn kho, và đồng bộ trạng thái phụ tùng xuyên suốt chu trình sửa chữa. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã có ít nhất một công việc (UC-34). Phiếu đang ở trạng thái cho phép lập kế hoạch (Đang lập kế hoạch). |
| **Hậu điều kiện**  | Thành công: Phụ tùng được lưu vào công việc với trạng thái Kế hoạch, hiển thị trên bảng danh sách phụ tùng của phiếu và tự động tính vào tổng tiền báo giá.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn mở phiếu công việc và chuyển sang tab **Phụ tùng & Vật tư**.<br>2. Cố vấn nhấn nút **Khai báo phụ tùng** (hoặc **Khai báo phụ tùng ngay** ở giữa màn hình nếu danh sách đang trống).<br>3. Hệ thống hiển thị hộp thoại **Khai báo phụ tùng & vật tư**.<br>4. Cố vấn nhấp vào menu chọn **Công việc áp dụng** và chọn đúng đầu việc cần cấp phụ tùng.<br>5. Cố vấn tìm kiếm và chọn phụ tùng:<br>- Nhập tên phụ tùng hoặc mã quản lý kho vào ô tìm kiếm.<br>- Danh sách phụ tùng trong kho hiển thị thông tin: Mã linh kiện, Tên linh kiện, Đơn vị tính, Đơn giá niêm yết, và Số lượng tồn kho thực tế.<br>- Cố vấn nhấp chọn mặt hàng mong muốn.<br>- *(Tùy chọn trợ lý AI)*: Cố vấn có thể nhấn **Nhận gợi ý** tại khung "Trợ lý AI gợi ý phụ tùng" $	o$ Hệ thống phân tích đề xuất phụ tùng chính xác $	o$ Cố vấn nhấn **Áp dụng** để điền tự động.<br>6. Cố vấn nhập **Số lượng dự kiến** và kiểm tra **Đơn giá dự kiến (VNĐ)**.<br>- *Cảnh báo thiếu kho*: Nếu số lượng dự kiến lớn hơn tồn kho khả dụng, hệ thống hiển thị dòng cảnh báo màu vàng: *"Số lượng dự kiến vượt quá số lượng tồn thực tế... Cần thông báo bộ phận kho chuẩn bị hoặc nhập thêm hàng."* nhưng vẫn cho phép khai báo kế hoạch.<br>7. Cố vấn nhấn nút **Khai báo phụ tùng**.<br>8. Hệ thống lưu phụ tùng vào công việc với trạng thái Kế hoạch, cập nhật lên bảng danh sách phụ tùng và tự động tính tổng tiền phụ tùng vào báo giá của phiếu. |
| **Luồng thay thế** | **[Chỉnh sửa phụ tùng đã khai báo]**<br>1a. Tại bảng danh sách phụ tùng ở tab **Phụ tùng & Vật tư**, cố vấn nhấn nút biểu tượng bút chì (**Chỉnh sửa số lượng / đơn giá**) tại dòng phụ tùng cần sửa.<br>2a. Hệ thống mở hộp thoại **Chỉnh sửa phụ tùng & vật tư** với thông tin hiện có.<br>3a. Cố vấn điều chỉnh lại số lượng dự kiến hoặc đơn giá.<br>4a. Cố vấn nhấn **Lưu thay đổi**.<br>5a. Hệ thống lưu thông tin mới và cập nhật lại chi phí.<br><br>**[Xóa phụ tùng khỏi công việc]**<br>1b. Tại bảng danh sách phụ tùng, cố vấn tìm đến dòng phụ tùng không còn nhu cầu sử dụng.<br>2b. Cố vấn nhấn nút biểu tượng thùng rác (**Xóa phụ tùng khỏi công việc**).<br>3b. Hệ thống tiến hành xóa phụ tùng khỏi công việc, tính toán lại tổng tiền báo giá và hiển thị thông báo: *"Đã xóa phụ tùng khỏi công việc"*. |
| **Luồng ngoại lệ** | Tại bước 4, nếu phiếu công việc chưa tạo bất kỳ công việc nào, hệ thống khóa menu chọn công việc và hiển thị cảnh báo: *"⚠️ Cần tạo ít nhất một công việc trong tab 'Hạng mục sửa chữa' trước khi thêm phụ tùng."* Cố vấn buộc phải quay lại tab Hạng mục sửa chữa tạo công việc trước.<br><br>Tại luồng Xóa, nếu phụ tùng đã được xuất kho thi công cho thợ, nút xóa bị khóa kèm chú thích *"Không thể xóa phụ tùng đã xuất kho"*. Hệ thống từ chối xóa và hiển thị thông báo: *"Phụ tùng này đã được xuất kho thi công, không thể xóa trực tiếp. Vui lòng hoàn trả kho trước."*<br><br>Tại bước 6, nếu cố vấn nhập số lượng dự kiến nhỏ hơn hoặc bằng 0, hệ thống cảnh báo: *"Số lượng dự kiến phải lớn hơn 0."* và không cho phép gửi biểu mẫu. |

---

## UC-37 – Tạo báo giá

| **Mã Use case**    | UC-37 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo báo giá |
| **Mô tả**          | Cố vấn dịch vụ tổng hợp toàn bộ các dịch vụ, công việc kỹ thuật và phụ tùng đã lập kế hoạch trong phiếu công việc thành bản báo giá chi tiết để gửi khách hàng. Hệ thống tự động tính toán chi phí theo kiểu tính giá tương ứng của từng dịch vụ, áp dụng thuế VAT 0% và thực hiện cơ chế chống tạo báo giá trùng lặp. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Cố vấn dịch vụ đã đăng nhập hệ thống; Phiếu công việc đang ở trạng thái Đang lập kế hoạch hoặc Bản nháp và có ít nhất một hạng mục có chi phí lớn hơn 0 đồng. |
| **Hậu điều kiện**  | Thành công: Bản báo giá mới được tạo ở trạng thái Bản nháp kèm bảng chi tiết đầy đủ các khoản chi phí nhân công và vật tư.<br>Thất bại: Hệ thống hiển thị thông báo lỗi cụ thể, không tạo bản báo giá. |
| **Luồng cơ bản**   | 1. Cố vấn mở màn hình chi tiết phiếu công việc và chuyển sang tab **Báo giá** (Tab 4).<br>2. Nếu phiếu chưa từng tạo báo giá nào, cố vấn nhấn nút **Tạo Báo giá từ kế hoạch**.<br>3. Hệ thống quét toàn bộ danh mục công việc và phụ tùng đã khai báo trong phiếu, tự động tính toán chi phí theo đúng kiểu giá dịch vụ:<br>- Dịch vụ trọn gói cố định: Áp dụng đơn giá cố định của gói.<br>- Dịch vụ tính theo kích cỡ xe: Tự động xác định phân khúc kích thước xe (nhỏ, vừa, lớn, SUV, bán tải) và áp dụng đúng đơn giá quy định.<br>- Dịch vụ tính theo nhân công và phụ tùng: Tính tiền nhân công theo giờ định mức × đơn giá và tiền phụ tùng theo số lượng × đơn giá niêm yết.<br>4. Hệ thống áp dụng mức thuế VAT 0% theo quy định tài chính của trung tâm.<br>5. Hệ thống thực hiện kiểm tra chống trùng lặp:<br>- Nếu danh mục dịch vụ và phụ tùng hoàn toàn trùng khớp với bản báo giá đã lập trước đó: Hệ thống không tạo mới mà hiển thị lại bản báo giá cũ kèm thông báo: *"Kế hoạch dịch vụ và phụ tùng không có thay đổi so với báo giá đã lập. Hệ thống tự động mở lại bản báo giá này."* (Kết thúc use case).<br>- Nếu có thay đổi: Chuyển sang bước 6.<br>6. Hệ thống tự động cấp mã báo giá chuẩn hóa (ví dụ: QUO26090001-V1), lưu bản ghi ở trạng thái Bản nháp và hiển thị bảng chiết tính chi phí lên màn hình. |
| **Luồng thay thế** | **[Tạo báo giá bổ sung]** Khi phương tiện đang trong quá trình thi công sửa chữa mà phát sinh hư hỏng mới:<br>2a. Cố vấn khai báo các hạng mục công việc hoặc phụ tùng phát sinh ở các tab tương ứng.<br>3a. Tại tab Báo giá, cố vấn nhấn nút **+ Bổ sung** (tiêu đề: *Tạo báo giá bổ sung cho các hạng mục phát sinh*).<br>4a. Hệ thống khởi tạo báo giá bổ sung, tự động liên kết với báo giá gốc và chỉ tính toán các chi phí mới phát sinh để trình khách hàng duyệt.<br><br>**[Tạo báo giá mới khi báo giá cũ bị từ chối]**<br>2b. Nếu khách hàng từ chối báo giá trước đó, tại tab Báo giá, cố vấn nhấn nút **Tạo báo giá mới** để khởi tạo phiên bản báo giá điều chỉnh tiếp theo. |
| **Luồng ngoại lệ** | Tại bước 2, nếu phiếu công việc chưa có bất kỳ hạng mục công việc hoặc phụ tùng nào có chi phí, hệ thống thông báo lỗi: *"Phiếu dịch vụ chưa có hạng mục dịch vụ hoặc phụ tùng nào có chi phí. Vui lòng lập kế hoạch trước khi tạo báo giá."*<br><br>Nếu phiếu công việc đã đóng, đã hủy hoặc xe đã bàn giao xong, hệ thống khóa nút tạo báo giá và từ chối thao tác. |

---

## UC-38 – Xem báo giá

| **Mã Use case**    | UC-38 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo giá |
| **Mô tả**          | Cố vấn dịch vụ, nhân viên liên quan hoặc khách hàng xem chi tiết bảng chiết tính chi phí của báo giá (công thợ, phụ tùng, giảm giá), theo dõi lịch sử các phiên bản báo giá, và xuất file tài liệu báo giá gửi khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ, Khách hàng, Thu ngân, Quản lý dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã có ít nhất một bản báo giá được tạo (UC-37). |
| **Hậu điều kiện**  | Thành công: Người dùng xem được đầy đủ chi tiết bảng báo giá, tải file PDF hoặc theo dõi được trạng thái phản hồi của khách hàng.<br>Thất bại: Hệ thống thông báo lỗi nếu không tìm thấy dữ liệu báo giá. |
| **Luồng cơ bản**   | 1. Người dùng mở tab **Báo giá** trong phiếu công việc (hoặc khách hàng mở liên kết báo giá trực tuyến gửi qua tin nhắn/email).<br>2. Hệ thống hiển thị giao diện báo giá với các thông tin chi tiết:<br>- **Thanh điều hướng phiên bản:** Liệt kê các phiên bản báo giá kèm huy hiệu trạng thái (Bản nháp, Đã gửi khách, Đã duyệt, Bị từ chối).<br>- **Thông tin khách hàng & xe:** Họ tên, số điện thoại, biển số xe, số ODO tiếp nhận.<br>- **Bảng kê chi tiết chi phí:** Phân tách rõ ràng tiền nhân công theo từng đầu việc và tiền phụ tùng/vật tư thay thế.<br>- **Tổng kết tài chính:** Tổng tiền dịch vụ, tổng tiền phụ tùng, số tiền giảm giá chiết khấu, thuế VAT và Tổng thanh toán cuối cùng.<br>3. (Tùy chọn) Người dùng nhấn nút **Tải báo giá (PDF)** để xuất và tải file báo giá dạng tài liệu in ấn chuẩn của xưởng. |
| **Luồng thay thế** | **[Khách hàng xem báo giá trên cổng thông tin trực tuyến]**<br>1a. Khách hàng nhấp vào đường dẫn nhận được trong tin nhắn hoặc email thông báo báo giá.<br>2a. Hệ thống hiển thị trang xem báo giá trực tuyến dành riêng cho khách hàng với đầy đủ chi tiết các hạng mục và hai nút hành động: **Đồng ý báo giá** hoặc **Từ chối báo giá** (chuyển tiếp sang UC-40). |
| **Luồng ngoại lệ** | Tại bước 1, nếu đường dẫn xem báo giá không tồn tại hoặc đã hết hạn truy cập, hệ thống hiển thị thông báo lỗi: *"Báo giá không tồn tại hoặc phiên làm việc đã hết hạn. Vui lòng liên hệ cố vấn dịch vụ để được hỗ trợ."* |

---

## UC-39 – Cập nhật báo giá

| **Mã Use case**    | UC-39 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật báo giá |
| **Mô tả**          | Cố vấn dịch vụ điều chỉnh các thông tin tài chính trên bản báo giá đang ở trạng thái Bản nháp (hoặc Đã gửi khách) trước khi khách hàng chốt duyệt, bao gồm áp dụng chính sách chiết khấu giảm giá (theo số tiền VNĐ hoặc theo tỷ lệ phần trăm %), bổ sung lý do ưu đãi, cập nhật ghi chú báo giá hoặc đồng bộ lại các dòng chiết tính chi phí khi kế hoạch dịch vụ và phụ tùng có sự thay đổi. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã có bản báo giá được tạo (UC-37); Báo giá đang ở trạng thái Bản nháp (`DRAFT`) hoặc Đã gửi khách (`SENT`). Tuyệt đối không áp dụng cho báo giá đã ở trạng thái Đã duyệt (`APPROVED` - Đã khóa). |
| **Hậu điều kiện**  | Thành công: Số tiền chiết khấu, lý do giảm giá, ghi chú và tổng thanh toán cuối cùng của báo giá được cập nhật chính xác vào hệ thống và hiển thị trên giao diện.<br>Thất bại: Hệ thống hiển thị thông báo lỗi, dữ liệu báo giá được giữ nguyên. |
| **Luồng cơ bản**   | **[Áp dụng chiết khấu / Điều chỉnh giảm giá]**<br>1. Tại tab **Báo giá**, cố vấn mở bản báo giá cần điều chỉnh và nhấn nút **Chỉnh sửa chiết khấu** (hoặc nút **(Sửa)** cạnh dòng *Chiết khấu / Giảm giá* tại khung tóm tắt tài chính Bento Box).<br>2. Hệ thống hiển thị hộp thoại **Áp dụng chiết khấu / Giảm giá**.<br>3. Cố vấn chọn hình thức giảm giá: theo số tiền trực tiếp (**VNĐ**) hoặc theo tỷ lệ phần trăm (**%**).<br>4. Cố vấn nhập giá trị giảm giá và ghi rõ lý do ưu đãi (chương trình khuyến mãi tháng, tri ân khách hàng thân thiết, hỗ trợ sự cố...).<br>5. Hệ thống tự động tính toán lại số tiền giảm và tổng thanh toán sau thuế (Grand Total = Subtotal - DiscountAmount, áp dụng VAT 0%).<br>6. Cố vấn nhấn nút **Lưu chiết khấu** (hoặc **Hủy** để bỏ qua).<br>7. Hệ thống gọi API cập nhật báo giá (`PATCH /api/quotations/:id`), ghi nhận giá trị chiết khấu mới, cập nhật lại bảng chiết tính chi phí trên màn hình và hiển thị thông báo: *"Đã cập nhật chiết khấu thành công"*. |
| **Luồng thay thế** | **[Cập nhật ghi chú báo giá]**<br>1a. Tại bản báo giá nháp, cố vấn mở khung nhập ghi chú hoặc điều khoản thanh toán bổ sung.<br>2a. Cố vấn nhập các lưu ý kỹ thuật hoặc dặn dò dành riêng cho khách hàng.<br>3a. Cố vấn nhấn **Lưu ghi chú**.<br>4a. Hệ thống cập nhật nội dung ghi chú vào bản ghi báo giá.<br><br>**[Đồng bộ lại số liệu khi kế hoạch dịch vụ thay đổi]**<br>1b. Khi cố vấn bổ sung hoặc xóa bớt hạng mục công việc (UC-34), phụ tùng (UC-36) ở các tab trước trong lúc báo giá vẫn ở trạng thái Bản nháp.<br>2b. Cố vấn mở lại tab Báo giá, hệ thống kiểm tra và cho phép cập nhật lại danh mục các dòng chi phí (`lines`) tương ứng với kế hoạch mới nhất trước khi trình khách duyệt. |
| **Luồng ngoại lệ** | Nếu báo giá đã ở trạng thái Đã duyệt (`APPROVED`), hệ thống ẩn hoàn toàn nút Chỉnh sửa chiết khấu và các chức năng sửa đổi; nếu phát sinh yêu cầu can thiệp trái phép, hệ thống từ chối và thông báo lỗi: *"Báo giá đã được phê duyệt, không thể chỉnh sửa."*<br><br>Tại bước 4 của luồng chiết khấu, nếu số tiền giảm giá lớn hơn tổng tiền hạng mục ban đầu (Subtotal) hoặc có giá trị âm, hoặc tỷ lệ phần trăm lớn hơn 100%, hệ thống hiển thị cảnh báo: *"Mức chiết khấu không hợp lệ (không được vượt quá 100% hoặc tổng chi phí ban đầu)."* và khóa nút lưu. |

---

## UC-40 – Duyệt báo giá

| **Mã Use case**    | UC-40 |
| ------------------ | ------ |
| **Tên Use case**   | Duyệt báo giá |
| **Mô tả**          | Cố vấn dịch vụ gửi báo giá cho khách hàng, ghi nhận quyết định phê duyệt hoặc từ chối của khách hàng (hoặc khách hàng tự duyệt/từ chối trực tuyến qua liên kết theo dõi). Khi khách hàng phê duyệt, hệ thống khóa cố định (freeze snapshot) toàn bộ nội dung và chi phí báo giá, đồng bộ trạng thái phiếu công việc và tự động chuyển trạng thái phụ tùng sang diện giữ chỗ trong kho (`RESERVED`) để chuẩn bị thi công. |
| **Đối tượng**      | Cố vấn dịch vụ, Khách hàng |
| **Tiền điều kiện** | Báo giá đang ở trạng thái Bản nháp (`DRAFT`) hoặc Đã gửi khách (`SENT`), chưa được chốt duyệt trước đó. |
| **Hậu điều kiện**  | - Khi duyệt: Báo giá chuyển sang trạng thái Đã duyệt (`APPROVED`), toàn bộ đơn giá và danh mục bị khóa cố định; phiếu công việc chuyển sang trạng thái Đã duyệt (`APPROVED`); các phụ tùng trong báo giá tự động chuyển sang trạng thái Giữ chỗ trong kho (`RESERVED`); hệ thống kích hoạt quyền phân công điều phối thợ thi công.<br>- Khi từ chối: Báo giá chuyển sang trạng thái Bị từ chối (`REJECTED`), ghi nhận lý do từ chối để cố vấn tạo phiên bản báo giá điều chỉnh tiếp theo (UC-37).<br>- Thất bại: Hệ thống thông báo lỗi, trạng thái dữ liệu giữ nguyên. |
| **Luồng cơ bản**   | 1. Tại tab **Báo giá**, cố vấn xem lại bản báo giá cần phê duyệt (hoặc khách hàng xem trên trang báo giá trực tuyến).<br>2. (Tùy chọn gửi khách) Cố vấn nhấn nút **Gửi khách hàng** để chuyển trạng thái báo giá sang Đã gửi khách (`SENT`) và tự động gửi thông báo qua tin nhắn/email cho khách.<br>3. Khi khách hàng xác nhận đồng ý phương án sửa chữa:<br>- Nếu khách tự duyệt trực tuyến: Khách nhấn nút **Đồng ý báo giá**.<br>- Nếu khách xác nhận trực tiếp hoặc qua điện thoại: Cố vấn nhấn nút **Khách đã đồng ý (Duyệt báo giá)**.<br>4. Hệ thống hiển thị hộp thoại xác nhận phê duyệt báo giá.<br>5. Người dùng nhấn **Xác nhận**.<br>6. Hệ thống thực hiện một chuỗi xử lý tự động đồng bộ:<br>- Cập nhật trạng thái báo giá thành Đã duyệt (`APPROVED`) và khóa toàn bộ nội dung chi phí (freeze snapshot).<br>- Cập nhật trạng thái phiếu công việc thành Đã duyệt (`APPROVED`) (sẵn sàng chuyển sang Đang thi công khi thợ bắt đầu nhận việc).<br>- Tự động cập nhật trạng thái các phụ tùng trong phiếu từ Kế hoạch (`PLANNED`) sang Giữ chỗ trong kho (`RESERVED`) để đảm bảo đủ vật tư thi công.<br>- Gửi thông báo đến Cố vấn dịch vụ và Tổ điều phối để phân công kỹ thuật viên bắt đầu sửa chữa.<br>7. Màn hình tab Báo giá cập nhật giao diện đã duyệt với huy hiệu màu xanh lá cây (*Đã phê duyệt (Đã khóa)*). |
| **Luồng thay thế** | **[Khách hàng từ chối báo giá]**<br>3a. Khách hàng hoặc Cố vấn nhấn nút **Từ chối**.<br>4a. Hệ thống hiển thị hộp thoại nhập lý do từ chối (ví dụ: Chi phí vượt ngân sách, muốn hoãn sửa chữa một số hạng mục...).<br>5a. Người dùng nhập lý do và nhấn **Xác nhận từ chối**.<br>6a. Hệ thống cập nhật trạng thái báo giá thành Bị từ chối (`REJECTED`) và ghi lại lý do phản hồi.<br>7a. Cố vấn trao đổi lại với khách hàng:<br>- Nếu khách đồng ý điều chỉnh: Cố vấn nhấn **Tạo báo giá mới** (UC-37) để lập phương án điều chỉnh giá hoặc rút gọn hạng mục phù hợp.<br>- Nếu khách hủy dịch vụ để lấy lại xe: Cố vấn chuyển sang tab Giao xe để thực hiện thủ tục xuất trả xe sớm (UC-43). |
| **Luồng ngoại lệ** | Tại bước 5, nếu báo giá đã ở trạng thái Đã duyệt, hệ thống khóa các nút duyệt và từ chối, hiển thị dòng thông báo: *"Báo giá này đã được chốt và khóa cố định. Để thay đổi, vui lòng lập Báo giá bổ sung."*<br><br>Nếu phương tiện đã bắt đầu bước thi công sửa chữa trong xưởng, hệ thống ngăn chặn việc từ chối báo giá để bảo vệ chi phí vật tư và công thợ. |

---

## UC-41 – Hủy báo giá

| **Mã Use case**    | UC-41 |
| ------------------ | ------ |
| **Tên Use case**   | Hủy báo giá |
| **Mô tả**          | Cố vấn dịch vụ hủy bỏ một bản báo giá bị lập sai sót hoặc không còn phù hợp trước khi khách hàng duyệt, nhằm giải phóng dữ liệu và đưa phiếu công việc quay lại màn hình lập kế hoạch dịch vụ. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Báo giá đang ở trạng thái Bản nháp (`DRAFT`) hoặc Đã gửi khách (`SENT`). Tuyệt đối không áp dụng cho báo giá đã ở trạng thái Đã duyệt (`APPROVED` - Đã khóa). |
| **Hậu điều kiện**  | Thành công: Báo giá chuyển sang trạng thái Đã hủy (`CANCELLED`), phiếu công việc quay về trạng thái Đang lập kế hoạch (`PLANNING`).<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên. |
| **Luồng cơ bản**   | 1. Tại tab **Báo giá**, khi phát hiện bản báo giá bị sai sót, cố vấn nhấn nút **Hủy báo giá nháp** (hoặc biểu tượng thùng rác **Hủy báo giá**).<br>2. Hệ thống hiển thị hộp thoại cảnh báo: **Xác nhận hủy báo giá nháp?** (*"Bản ghi báo giá này sẽ bị xóa khỏi hệ thống. Bạn có thể tạo lại báo giá mới bất cứ lúc nào."*).<br>3. Cố vấn nhấn **Xác nhận xóa / Hủy báo giá** (hoặc nút **Hủy** để bỏ qua).<br>4. Hệ thống gọi API hủy báo giá (`POST /api/quotations/:id/cancel`), cập nhật trạng thái báo giá thành **Đã hủy** (`CANCELLED`), đồng thời đưa phiếu công việc quay lại trạng thái **Đang lập kế hoạch** (`PLANNING`).<br>5. Hệ thống hiển thị thông báo: *"Đã hủy báo giá nháp thành công"* và làm mới giao diện tab Báo giá, hiển thị lại nút **Tạo Báo giá từ kế hoạch** (UC-37). |
| **Luồng thay thế** | **[Khách hàng yêu cầu nhận lại xe sớm khi hủy dịch vụ]** Nếu khách hàng không đồng ý sửa chữa và muốn nhận lại xe ngay sau khi hủy báo giá, cố vấn chuyển sang tab Giao xe để thực hiện thủ tục xuất trả xe sớm (UC-43). |
| **Luồng ngoại lệ** | Nếu báo giá đã ở trạng thái Đã duyệt (`APPROVED` - Đã khóa), hệ thống ẩn hoàn toàn nút Hủy báo giá nháp; nếu phát sinh yêu cầu can thiệp trái phép, hệ thống từ chối và thông báo lỗi: *"Báo giá đã được phê duyệt, không thể chỉnh sửa hoặc hủy bỏ."*<br><br>Nếu phương tiện đang trong quá trình thi công thực tế hoặc đã có phụ tùng xuất kho, hệ thống khóa chức năng hủy báo giá. |

---

## UC-42 – Kiểm định chất lượng

| **Mã Use case**    | UC-42 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm định chất lượng |
| **Mô tả**          | Cố vấn dịch vụ hoặc nhân viên kiểm định chất lượng (KCS) thẩm định tình trạng kỹ thuật của xe sau khi thợ thi công xong theo danh mục tiêu chuẩn nghiệm thu. Nếu tất cả hạng mục đạt yêu cầu, hệ thống mở khóa chức năng gửi yêu cầu thanh toán để chuyển sang lập hóa đơn. Nếu phát hiện có hạng mục chưa đạt, hệ thống tự động tạo công việc sửa lại để kỹ thuật viên khắc phục trước khi kiểm định lại. |
| **Đối tượng**      | Cố vấn dịch vụ, Nhân viên kiểm định chất lượng (KCS) |
| **Tiền điều kiện** | Phiếu công việc đang ở trạng thái Đang thi công; 100% các công việc kỹ thuật ban đầu của thợ đã hoàn thành (không còn công việc nào đang thi công dở dang). |
| **Hậu điều kiện**  | Thành công – Đạt 100%: Biên bản kiểm định ghi nhận kết quả ĐẠT toàn diện, xuất hiện thông báo mở khóa nút Gửi yêu cầu lập hóa đơn, chuyển phiếu công việc sang trạng thái Chờ thanh toán.<br>Thành công – Có mục Lỗi: Biên bản ghi nhận kết quả LỖI / SỬA LẠI, hệ thống tự động tạo công việc sửa lại tương ứng, giữ phiếu công việc ở trạng thái Đang thi công và khóa chức năng thanh toán.<br>Thất bại: Hệ thống thông báo lỗi, kết quả kiểm định không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn hoặc nhân viên kiểm định mở màn hình chi tiết phiếu công việc và chọn tab **Kiểm tra chất lượng** (Tab 5).<br>2. Hệ thống kiểm tra tiến độ thi công của phương tiện: xác nhận 100% công việc sửa chữa ban đầu đã hoàn thành và hiển thị danh sách các tiêu chí kiểm định kỹ thuật chuẩn hóa theo từng dịch vụ.<br>3. Người kiểm tra tiến hành kiểm tra thực tế xe và có thể nhấn nút **Đạt tất cả ({count})** để đánh dấu nhanh toàn bộ danh mục, hoặc trên từng dòng tiêu chí nhấn chọn nút **ĐẠT** (màu xanh lá) và nhập ghi chú nghiệm thu thực tế.<br>4. Người kiểm tra nhấn nút **Lưu đánh giá KCS**.<br>5. Hệ thống ghi nhận biên bản kiểm định với kết quả Đạt 100%, tự động hiển thị thông báo nổi bật: *"Toàn bộ dịch vụ đã hoàn tất & Vượt qua kiểm định KCS! Chất lượng kỹ thuật xe đã đạt 100%."* kèm nút hành động kích hoạt thanh toán.<br>6. Cố vấn dịch vụ nhấn nút **Gửi yêu cầu lập hóa đơn**.<br>7. Hệ thống chuyển trạng thái phiếu công việc sang **Chờ thanh toán**, gửi thông báo tức thời cho bộ phận Thu ngân quầy dịch vụ chuẩn bị lập hóa đơn, đồng thời cấp chứng nhận kiểm định chất lượng điện tử cho khách hàng. |
| **Luồng thay thế** | **[Phát hiện lỗi kỹ thuật – Kiểm định không đạt và sửa lại]** Tại bước 3, nếu phát hiện có hạng mục kỹ thuật chưa đạt yêu cầu:<br>3a. Người kiểm tra nhấp chọn nút **LỖI / SỬA LẠI** (màu đỏ) tại tiêu chí tương ứng.<br>3b. Hệ thống tự động mở rộng khung nhập liệu bắt buộc: **"Yêu cầu sửa lại:"**.<br>3c. Người kiểm tra nhập mô tả chi tiết nguyên nhân lỗi và hướng dẫn kỹ thuật cần khắc phục để thợ thi công.<br>3d. Người kiểm tra nhấn nút **Lưu đánh giá KCS**.<br>3e. Hệ thống ghi nhận kết quả kiểm định là Không đạt, tự động tạo một công việc sửa lại tương ứng có tên dạng `[Sửa lại - KCS] ...` với trạng thái Sửa lại, giữ phiếu công việc ở trạng thái **Đang thi công** và khóa nút gửi yêu cầu thanh toán.<br>3f. Kỹ thuật viên nhận thông báo công việc sửa lại, tiến hành khắc phục và xác nhận hoàn thành.<br>3g. Người kiểm tra mở lại tab Kiểm tra chất lượng để thẩm định lại các tiêu chí lỗi. Khi đạt chuẩn 100%, tiếp tục thực hiện từ bước 5 của luồng cơ bản. |
| **Luồng ngoại lệ** | Tại bước 2, nếu còn công việc thi công chưa hoàn thành, hệ thống hiển thị trạng thái cảnh báo và khóa chức năng nghiệm thu KCS.<br><br>Tại bước 3a, nếu chọn LỖI / SỬA LẠI mà để trống ô mô tả yêu cầu sửa lại, hệ thống hiển thị thông báo lỗi: *"Vui lòng nhập lý do sửa lại cho mục..."* và không cho phép lưu.<br><br>Tại bước 6, nếu xe chưa hoàn tất kiểm định chất lượng hoặc còn công việc sửa lại chưa hoàn thành, hệ thống từ chối yêu cầu thanh toán và thông báo lý do phương tiện chưa đủ điều kiện xuất xưởng. |

---

## UC-43 – Bàn giao xe

| **Mã Use case**    | UC-43 |
| ------------------ | ------ |
| **Tên Use case**   | Bàn giao xe |
| **Mô tả**          | Cố vấn dịch vụ hoàn tất thủ tục bàn giao phương tiện cho khách hàng khi xe đã thỏa mãn đầy đủ các điều kiện xuất xưởng: toàn bộ công việc hoàn tất, kiểm định chất lượng đạt chuẩn và tài chính đã quyết toán xong. Cố vấn đối chiếu ODO, nhiên liệu thực tế, thu thập chữ ký điện tử xác nhận của khách hàng, xuất biên bản bàn giao điện tử và thực hiện đóng hồ sơ lưu trữ lịch sử sửa chữa. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Phiếu công việc đã thỏa mãn đầy đủ các điều kiện xuất xưởng: Tất cả các công việc đã hoàn thành, kiểm định chất lượng đạt 100% và hóa đơn dịch vụ đã được thanh toán đầy đủ (Phiếu công việc ở trạng thái Đã quyết toán tài chính). |
| **Hậu điều kiện**  | Thành công: Phương tiện được bàn giao chính thức cho khách hàng, phiếu công việc chuyển sang trạng thái ĐÃ XUẤT XƯỞNG, biên bản bàn giao xe điện tử được khởi tạo (có thể xuất file PDF) và gửi thông báo hoàn tất đến khách hàng.<br>Thất bại: Hệ thống từ chối bàn giao nếu vi phạm bất kỳ điều kiện nào của quy định xuất xưởng. |
| **Luồng cơ bản**   | 1. Cố vấn mở màn hình chi tiết phiếu công việc và chuyển sang tab **Giao xe** (Tab 6).<br>2. Hệ thống kiểm tra trạng thái phiếu xác nhận đã ở mức Đã quyết toán tài chính và hiển thị thông báo sẵn sàng bàn giao.<br>3. Cố vấn nhấn nút **Bàn giao xe cho khách**.<br>4. Hệ thống hiển thị hộp thoại **Biên bản bàn giao xe xuất xưởng**.<br>5. Cố vấn tiến hành kiểm tra thực tế và điền các thông tin xuất xưởng:<br>- **Số ODO lúc giao xe (km):** Nhập số ODO thực tế trên đồng hồ xe khi xuất xưởng (phải lớn hơn hoặc bằng ODO lúc tiếp nhận).<br>- **Mức nhiên liệu lúc giao xe:** Chọn từ danh sách mức xăng (Bình cạn E, 1/4 bình, 1/2 bình, 3/4 bình, Đầy bình F).<br>- **Danh mục kiểm tra bàn giao:** Tích chọn xác nhận các mục `Rửa xe và dọn vệ sinh nội thất hoàn tất` và `Kiểm tra và hoàn trả đầy đủ tài sản để trên xe`.<br>- **Xử lý phụ tùng cũ thay ra:** Chọn 1 trong 2 hình thức: *Bàn giao lại toàn bộ cho khách mang về* hoặc *Khách nhờ xưởng tiêu hủy giúp*.<br>- **Điều khoản bảo hành:** Kiểm tra nội dung cam kết bảo hành dịch vụ và phụ tùng.<br>- **Ghi chú bàn giao:** Ghi nhận thêm các căn dặn hoặc lưu ý vận hành cho khách.<br>- **Chữ ký điện tử của khách hàng:** Khách hàng kiểm tra xe và ký tên trực tiếp lên khung vẽ chữ ký điện tử (có nút **Ký lại** nếu cần xóa vẽ lại).<br>6. Cố vấn nhấn nút **Xác nhận bàn giao & Xuất xưởng**.<br>7. Hệ thống kiểm tra tính hợp lệ của toàn bộ thông tin, lưu biên bản bàn giao, cập nhật trạng thái phiếu công việc thành **ĐÃ XUẤT XƯỞNG**, đồng thời tự động gửi thông báo xác nhận và biên bản bàn giao điện tử cho khách hàng.<br>8. Màn hình tab Giao xe cập nhật giao diện đã xuất xưởng, hiển thị nút **Tải biên bản bàn giao (PDF)** và nút **Đóng hồ sơ**. |
| **Luồng thay thế** | **[Đóng hồ sơ sửa chữa và lưu trữ lịch sử]** Sau khi xe đã xuất xưởng:<br>1a. Cố vấn nhấn nút **Đóng hồ sơ** trên thanh thông báo trạng thái xuất xưởng.<br>2a. Hệ thống hiển thị hộp thoại **Đóng hồ sơ sửa chữa**.<br>3a. Cố vấn kiểm tra thông tin và nhấn nút **Xác nhận đóng hồ sơ** (hoặc **Hủy**).<br>4a. Hệ thống cập nhật trạng thái phiếu công việc sang **ĐÃ ĐÓNG HỒ SƠ**, chính thức khóa lưu trữ toàn bộ hồ sơ và đồng bộ dữ liệu vào Lịch sử sửa chữa của phương tiện (UC-80).<br><br>**[Xuất trả xe khi khách hủy dịch vụ hoặc từ chối báo giá]**<br>1b. Nếu khách hàng từ chối làm dịch vụ và yêu cầu nhận lại xe sớm, tại tab Giao xe hệ thống hiển thị nút xuất trả xe sớm.<br>2b. Cố vấn mở hộp thoại **Xuất trả xe**, kiểm tra hoàn trả tài sản, đối chiếu phụ tùng kho và nhấn **Xác nhận xuất trả xe** để bàn giao xe về cho khách. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 6, nếu xe chưa hoàn tất quyết toán tài chính, còn công việc chưa hoàn thành, hoặc kiểm định chất lượng chưa đạt, hệ thống từ chối mở hộp thoại hoặc từ chối lưu và thông báo: *"Phương tiện chưa hoàn tất quyết toán tài chính. Vui lòng hoàn tất thanh toán hóa đơn trước khi bàn giao xe."*<br><br>Tại bước 5, nếu số ODO xuất xưởng nhỏ hơn số ODO lúc tiếp nhận xe, hệ thống báo lỗi: *"Số ODO xuất xưởng không được nhỏ hơn ODO tiếp nhận."* và không cho phép xác nhận xuất xưởng. |

---


---

# PHẦN 5 – QUẢN LÝ DỊCH VỤ & KHO (SERVICE MANAGER)

---

## UC-44 – Theo dõi hoạt động xưởng (Monitor Workshop)

| **Mã Use case**    | UC-44 |
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

## UC-45 – Thêm danh mục phụ tùng (Create Part Category)

| **Mã Use case**    | UC-45 |
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

## UC-46 – Xem danh mục phụ tùng (View Part Category)

| **Mã Use case**    | UC-46 |
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

## UC-47 – Cập nhật danh mục phụ tùng (Update Part Category)

| **Mã Use case**    | UC-47 |
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

## UC-48 – Xóa danh mục phụ tùng (Delete Part Category)

| **Mã Use case**    | UC-48 |
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

## UC-49 – Thêm phụ tùng (Create Inventory Item)

| **Mã Use case**    | UC-49 |
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

## UC-50 – Xem phụ tùng (View Inventory Item)

| **Mã Use case**    | UC-50 |
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

## UC-51 – Cập nhật phụ tùng (Update Inventory Item)

| **Mã Use case**    | UC-51 |
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

## UC-52 – Ngừng kinh doanh/Xóa phụ tùng (Delete/Deactivate Inventory Item)

| **Mã Use case**    | UC-52 |
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

## UC-53 – Nhập kho (Receive Inventory)

| **Mã Use case**    | UC-53 |
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

## UC-54 – Xem báo cáo vận hành (View Operational Report)

| **Mã Use case**    | UC-54 |
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

## UC-55 – Thêm tài khoản (Create Account)

| **Mã Use case**    | UC-55 |
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

## UC-56 – Xem tài khoản (View Account)

| **Mã Use case**    | UC-56 |
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

## UC-57 – Cập nhật tài khoản (Update Account)

| **Mã Use case**    | UC-57 |
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

## UC-58 – Xóa tài khoản (Delete Account)

| **Mã Use case**    | UC-58 |
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

## UC-59 – Thêm nhân viên (Create Employee)

| **Mã Use case**    | UC-59 |
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

## UC-60 – Xem nhân viên (View Employee)

| **Mã Use case**    | UC-60 |
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

## UC-61 – Cập nhật nhân viên (Update Employee)

| **Mã Use case**    | UC-61 |
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

## UC-62 – Xóa nhân viên (Delete Employee)

| **Mã Use case**    | UC-62 |
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

## UC-63 – Thêm dịch vụ (Create Service)

| **Mã Use case**    | UC-63 |
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

## UC-64 – Xem dịch vụ (View Service)

| **Mã Use case**    | UC-64 |
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

## UC-65 – Cập nhật dịch vụ (Update Service)

| **Mã Use case**    | UC-65 |
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

## UC-66 – Xóa dịch vụ (Delete Service)

| **Mã Use case**    | UC-66 |
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

## UC-67 – Thêm danh mục dịch vụ (Create Service Category)

| **Mã Use case**    | UC-67 |
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

## UC-68 – Xem danh mục dịch vụ (View Service Category)

| **Mã Use case**    | UC-68 |
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

## UC-69 – Cập nhật danh mục dịch vụ (Update Service Category)

| **Mã Use case**    | UC-69 |
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

## UC-70 – Xóa danh mục dịch vụ (Delete Service Category)

| **Mã Use case**    | UC-70 |
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

## UC-71 – Thêm loại công việc (Create Job Type)

| **Mã Use case**    | UC-71 |
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

## UC-72 – Xem loại công việc (View Job Type)

| **Mã Use case**    | UC-72 |
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

## UC-73 – Cập nhật loại công việc (Update Job Type)

| **Mã Use case**    | UC-73 |
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

## UC-74 – Xóa loại công việc (Delete Job Type)

| **Mã Use case**    | UC-74 |
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
## UC-75 – Thêm danh mục chung (Create System Catalog)

| **Mã Use case**    | UC-75 |
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

## UC-76 – Xem danh mục chung (View System Catalog)

| **Mã Use case**    | UC-76 |
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

## UC-77 – Cập nhật danh mục chung (Update System Catalog)

| **Mã Use case**    | UC-77 |
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

## UC-78 – Xóa danh mục chung (Delete System Catalog)

| **Mã Use case**    | UC-78 |
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

## UC-79 – Gửi email nhắc hẹn tự động (Auto Reminder)

| **Mã Use case**    | UC-79 |
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

## UC-80 – Xem lịch sử sửa chữa (View Repair History)

| **Mã Use case**    | UC-80 |
| ------------------ | ------ |
| **Tên Use case**   | Xem lịch sử sửa chữa (View Repair History) |
| **Mô tả**          | Khách hàng tra cứu sổ bảo dưỡng điện tử và lịch sử sửa chữa của các phương tiện thuộc sở hữu của mình đã hoàn tất chu trình dịch vụ hoặc đã hủy. Khách hàng có thể lọc theo phương tiện, khoảng thời gian, trạng thái hồ sơ, xem chi tiết kết quả sửa chữa, kiểm định chất lượng, chính sách bảo hành và tải xuống Biên bản bàn giao xe hoặc Hóa đơn điện tử dưới dạng PDF. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Danh sách lịch sử sửa chữa và chi tiết sổ bảo dưỡng điện tử được hiển thị chính xác theo yêu cầu; khách hàng tải được chứng từ PDF (nếu có).<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu hoặc hồ sơ không tồn tại. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập mục **Lịch sử sửa chữa** (Sổ bảo dưỡng & Lịch sử sửa chữa).<br>2. Hệ thống tải và hiển thị thống kê tổng quan (tổng lượt hoàn tất, tổng chi phí đã quyết toán, lần xuất xưởng gần nhất) cùng danh sách các hồ sơ sửa chữa ở trạng thái **Hoàn tất & Lưu trữ**, **Đã giao xe** hoặc **Đã hủy dịch vụ**.<br>3. Khách hàng có thể tìm kiếm nhanh theo mã phiếu, biển số, tên dịch vụ hoặc lọc theo phương tiện, trạng thái và khoảng thời gian (Từ ngày – Đến ngày).<br>4. Hệ thống cập nhật lại danh sách hồ sơ theo tiêu chí tìm kiếm và bộ lọc đã chọn.<br>5. Khách hàng nhấn **Xem sổ bảo dưỡng** trên một hồ sơ cụ thể.<br>6. Hệ thống hiển thị cửa sổ chi tiết **Sổ bảo dưỡng điện tử** gồm 4 mục: **Tổng quan & Tiếp nhận** (tình trạng ban đầu, số km lúc vào, yêu cầu của khách), **Hạng mục & Phụ tùng** (danh sách dịch vụ đã thực hiện), **Kiểm định QC & Tiến trình** (kết quả nghiệm thu chất lượng và mốc thời gian), và **Bàn giao & Bảo hành** (số km xuất xưởng, thời gian bàn giao, chính sách bảo hành). |
| **Luồng thay thế** | **[Tải chứng từ PDF]** Tại danh sách lịch sử (bước 2) hoặc trong cửa sổ chi tiết sổ bảo dưỡng (bước 6):<br>6a. Khách hàng nhấn **Biên bản bàn giao (PDF)** hoặc **Hóa đơn VAT**.<br>6b. Hệ thống trích xuất và tải xuống tệp PDF tương ứng về thiết bị của khách hàng.<br><br>**[Xóa bộ lọc]** Tại bước 3, khách hàng nhấn **Xóa bộ lọc**:<br>3a. Hệ thống đặt lại toàn bộ điều kiện lọc và hiển thị lại danh sách lịch sử sửa chữa mặc định. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu khách hàng chưa có lịch sử sửa chữa hoặc không có hồ sơ nào khớp với điều kiện lọc, hệ thống hiển thị thông báo "Không tìm thấy hồ sơ nào".<br><br>Tại bước 6, nếu hồ sơ không tồn tại hoặc không thuộc quyền sở hữu của khách hàng, hệ thống từ chối truy cập và hiển thị thông báo lỗi. |

---

# PHẦN 8 – PHÂN HỆ QUẢN LÝ BẢO HÀNH

---

> **Phân hệ quản lý toàn diện quy trình bảo hành phương tiện, phụ tùng và dịch vụ kỹ thuật.**  
> - **Kế thừa quy trình cốt lõi:** Lấy Phiếu công việc làm hồ sơ trung tâm, vận hành xuyên suốt chu trình quản lý chuẩn 10 bước (Bản nháp $
ightarrow$ Đang lập kế hoạch $
ightarrow$ Chờ khách duyệt $
ightarrow$ Đã duyệt $
ightarrow$ Đang thi công $
ightarrow$ Chờ thanh toán $
ightarrow$ Đã quyết toán tài chính $
ightarrow$ Đã xuất xưởng $
ightarrow$ Đã đóng hồ sơ).  
> - **Chính sách 0 đồng & Quyết toán tự động:** Áp dụng đơn giá bán 0 đồng cho khách hàng đối với các hạng mục bảo hành hợp lệ; khi phát hành hóa đơn 0 đồng, hệ thống tự động hoàn tất quyết toán tài chính, giúp xe đủ điều kiện xuất xưởng nhanh chóng mà không bị ách tắc tại quầy thu ngân.  
> - **Hạch toán chi phí nội bộ:** Phụ tùng bảo hành xuất kho làm giảm số lượng tồn kho vật lý thực tế, chi phí vốn phụ tùng được hạch toán theo phương pháp Giá vốn bình quân di động vào chi phí quản lý chất lượng của xưởng.  
> - **Bảo mật báo cáo quản trị:** Báo cáo chi phí và tỷ lệ lỗi bảo hành được phân quyền nghiêm ngặt, chỉ duy nhất Quản lý dịch vụ hoặc Quản trị viên hệ thống mới có quyền truy cập.

---

## BẢNG TỔNG HỢP USE CASE PHÂN HỆ BẢO HÀNH

| Mã UC | Tên Use Case | Đối tượng thực hiện | Phạm vi & Nghiệp vụ cốt lõi |
| :---: | :--- | :--- | :--- |
| **UC-81** | **Tra cứu thông tin bảo hành** | Khách hàng, Nhân viên quầy, Cố vấn | Tra cứu thời hạn và số km bảo hành còn lại của các dịch vụ, phụ tùng đã làm trên xe. |
| **UC-82** | **Đặt lịch hẹn bảo hành** | Khách hàng | Khách hàng chủ động đặt lịch hẹn mang xe đến xử lý bảo hành trực tuyến kèm ảnh/video mô tả sự cố. |
| **UC-83** | **Tiếp nhận bảo hành** | Nhân viên quầy dịch vụ | Tiếp nhận xe đến xưởng, ghi nhận ODO hiện tại, kiểm tra điều kiện và liên kết với phiếu dịch vụ gốc. |
| **UC-84** | **Tạo phiếu công việc bảo hành** | Cố vấn dịch vụ | Lập phiếu công việc bảo hành, đánh dấu các công việc và phụ tùng bảo hành để áp dụng đơn giá 0 đồng. |
| **UC-85** | **Xử lý hóa đơn bảo hành** | Nhân viên quầy dịch vụ, Thu ngân | Phát hành hóa đơn 0 đồng; hệ thống tự động ghi nhận đã thanh toán và chuyển trạng thái hoàn tất quyết toán tài chính để xuất xưởng. |
| **UC-86** | **Phê duyệt bảo hành thiện chí** | Quản lý dịch vụ | Quản lý xem xét và phê duyệt hỗ trợ bảo hành ngoại lệ cho các trường hợp khách hàng quá hạn nhẹ hoặc khách hàng thân thiết. |
| **UC-87** | **Xem báo cáo bảo hành** | Quản lý dịch vụ | Quản lý xem thống kê mật về tỷ lệ xe bảo hành, chi phí vốn phụ tùng bảo hành và các lỗi kỹ thuật lặp lại. |

---

## UC-81 – Tra cứu thông tin bảo hành

| **Mã Use case**    | UC-81 |
| ------------------ | ------ |
| **Tên Use case**   | Tra cứu thông tin bảo hành |
| **Mô tả**          | Khách hàng hoặc nhân viên tra cứu danh sách các dịch vụ và phụ tùng đã sử dụng trên phương tiện để kiểm tra thời hạn và điều kiện bảo hành còn hiệu lực (số ngày còn lại, số km ODO còn lại). |
| **Đối tượng**      | Khách hàng, Nhân viên quầy dịch vụ, Cố vấn dịch vụ |
| **Tiền điều kiện** | Người dùng đã đăng nhập vào hệ thống. Phương tiện đã từng hoàn thành chu trình dịch vụ tại trung tâm (phiếu công việc cũ đã xuất xưởng hoặc đã đóng hồ sơ). |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị danh sách các hạng mục dịch vụ, phụ tùng kèm trạng thái còn hạn hoặc hết hạn bảo hành rõ ràng.<br>Thất bại: Hệ thống thông báo không tìm thấy dữ liệu hoặc thông báo lỗi. |
| **Luồng cơ bản**   | 1. Người dùng truy cập màn hình tra cứu bảo hành (hoặc chọn mục **Bảo hành** trong Sổ bảo dưỡng điện tử).<br>2. Người dùng chọn phương tiện cần tra cứu theo biển số xe hoặc số khung VIN.<br>3. Hệ thống tải toàn bộ lịch sử các dịch vụ đã thi công và phụ tùng đã lắp đặt trên xe từ các phiếu công việc đã hoàn tất trước đây.<br>4. Hệ thống tự động đối chiếu số km ODO và số ngày sử dụng hiện tại với chính sách bảo hành:<br>- **Mục còn hạn bảo hành:** Hiển thị nhãn màu xanh lá *"Còn bảo hành"*, số ngày bảo hành còn lại và số km còn lại.<br>- **Mục đã hết hạn:** Hiển thị nhãn màu xám *"Hết hạn bảo hành"* và thời điểm hết hạn.<br>5. Người dùng xem chi tiết các điều khoản cam kết bảo hành và phạm vi áp dụng cho từng hạng mục.<br>6. (Đối với khách hàng) Nếu phát hiện hạng mục gặp sự cố còn hạn bảo hành, khách hàng có thể nhấn nút **Đặt lịch hẹn bảo hành ngay** để chuyển tiếp sang UC-82. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 3, nếu phương tiện chưa từng làm dịch vụ tại trung tâm hoặc chưa có phiếu sửa chữa nào hoàn thành, hệ thống hiển thị thông báo: *"Xe chưa có lịch sử dịch vụ hoặc phụ tùng bảo hành tại trung tâm."* |

---

## UC-82 – Đặt lịch hẹn bảo hành

| **Mã Use case**    | UC-82 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lịch hẹn bảo hành |
| **Mô tả**          | Khách hàng chủ động tạo lịch hẹn trực tuyến mang xe đến trung tâm để kiểm tra và khắc phục sự cố bảo hành đối với các dịch vụ hoặc phụ tùng còn trong thời hạn cam kết. |
| **Đối tượng**      | Khách hàng |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống và phương tiện sở hữu có ít nhất một hạng mục dịch vụ hoặc phụ tùng còn hiệu lực bảo hành. |
| **Hậu điều kiện**  | Thành công: Dữ liệu lịch hẹn bảo hành (phân loại là Bảo hành) được lưu vào hệ thống, hiển thị trong danh sách lịch hẹn của khách và gửi thông báo xác nhận.<br>Thất bại: Hệ thống thông báo lỗi, lịch hẹn không được tạo. |
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình đặt lịch hẹn và chọn loại lịch hẹn là **Bảo hành**.<br>2. Hệ thống hiển thị biểu mẫu đặt lịch hẹn bảo hành kèm danh sách các hạng mục phụ tùng/dịch vụ còn hiệu lực bảo hành của xe.<br>3. Khách hàng tích chọn một hoặc nhiều hạng mục cần đưa vào diện kiểm tra bảo hành.<br>4. Khách hàng nhập nội dung mô tả chi tiết hiện tượng sự cố gặp phải (tiếng kêu lạ, chảy dầu, rung lắc...) và tải lên hình ảnh hoặc video minh chứng hiện trường.<br>5. Khách hàng chọn ngày hẹn và khung giờ hẹn mong muốn từ danh sách khung giờ còn chỗ trống.<br>6. Khách hàng nhấn **Xác nhận đặt lịch**.<br>7. Hệ thống kiểm tra tính hợp lệ của dữ liệu, đảm bảo khung giờ hẹn hợp lệ và không bị trùng tải xưởng.<br>8. Hệ thống lưu lịch hẹn bảo hành mới, gửi email xác nhận cho khách hàng, gửi thông báo đẩy đến quầy dịch vụ và cập nhật vào danh sách lịch hẹn của khách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, khách hàng chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu dữ liệu.<br><br>**[Khách hàng kết hợp làm thêm dịch vụ thông thường]** Tại bước 3, nếu khách hàng muốn làm thêm dịch vụ bảo dưỡng/sửa chữa có thu phí, khách hàng nhấn **Thêm dịch vụ khác**:<br>Hệ thống hiển thị danh mục dịch vụ tiêu chuẩn để khách chọn bổ sung. Lịch hẹn được đánh dấu là loại kết hợp bảo hành và dịch vụ tính phí. |
| **Luồng ngoại lệ** | Tại bước 7, nếu khung giờ đã chọn vừa hết chỗ hoặc dữ liệu bị thiếu (chưa tích chọn hạng mục bảo hành hoặc để trống mô tả sự cố), hệ thống hiển thị thông báo lỗi chi tiết tại trường tương ứng và yêu cầu hoàn thiện trước khi xác nhận. |

---

## UC-83 – Tiếp nhận bảo hành

| **Mã Use case**    | UC-83 |
| ------------------ | ------ |
| **Tên Use case**   | Tiếp nhận bảo hành |
| **Mô tả**          | Nhân viên quầy dịch vụ tiếp nhận phương tiện mang đến xưởng theo diện bảo hành, ghi nhận số km ODO thực tế, đối chiếu điều kiện bảo hành với phiếu dịch vụ gốc và chuyển tiếp hồ sơ sang hàng đợi của Cố vấn dịch vụ. |
| **Đối tượng**      | Nhân viên quầy dịch vụ |
| **Tiền điều kiện** | Nhân viên quầy đã đăng nhập hệ thống. Phương tiện có mặt tại trung tâm theo lịch hẹn bảo hành trước đó hoặc khách mang xe đến trực tiếp. |
| **Hậu điều kiện**  | Thành công: Hồ sơ tiếp nhận bảo hành được lưu ở trạng thái Chờ tiếp nhận với nguồn Bảo hành, liên kết với phiếu dịch vụ gốc; hiển thị trên hàng đợi tiếp nhận của Cố vấn dịch vụ.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu tiếp nhận không được lưu. |
| **Luồng cơ bản**   | 1. Nhân viên quầy truy cập màn hình tiếp nhận và chọn **Tiếp nhận bảo hành** (hoặc chọn từ danh sách lịch hẹn bảo hành đến xưởng hôm nay).<br>2. Hệ thống hiển thị biểu mẫu tiếp nhận bảo hành.<br>3. Nhân viên nhập biển số xe (hoặc số điện thoại khách hàng).<br>4. Hệ thống tải thông tin phương tiện, chủ xe và danh sách các phiếu dịch vụ đã thực hiện trước đây.<br>5. Nhân viên quầy nhập số km ODO hiện tại của xe và chọn phiếu dịch vụ gốc liên quan đến khiếu nại bảo hành.<br>6. Hệ thống đối chiếu số km ODO và thời hạn bảo hành của các hạng mục trong phiếu gốc:<br>- Nếu hạng mục còn hạn hợp lệ: Hệ thống đánh dấu hợp lệ và hiển thị thông tin chi tiết.<br>- Nếu hạng mục đã quá hạn nhẹ: Hệ thống hiển thị tùy chọn *"Gửi yêu cầu bảo hành thiện chí"* (chuyển tiếp sang UC-85).<br>7. Nhân viên ghi nhận các triệu chứng khách mô tả và đính kèm ảnh chụp hiện trạng xe (nếu có).<br>8. Nhân viên nhấn **Lưu tiếp nhận**.<br>9. Hệ thống khởi tạo bản ghi tiếp nhận bảo hành ở trạng thái Chờ tiếp nhận, liên kết chặt chẽ với phiếu dịch vụ cũ và hiển thị ngay trên hàng đợi tiếp nhận của Cố vấn dịch vụ. |
| **Luồng thay thế** | **[Tiếp nhận xe bảo hành thiện chí đã được duyệt trước]** Nếu yêu cầu bảo hành thiện chí cho xe đã được Quản lý dịch vụ phê duyệt (UC-85):<br>6a. Hệ thống tự động nhận diện quyết định phê duyệt và gắn thông tin bảo hành thiện chí vào hồ sơ tiếp nhận.<br>7a. Nhân viên tiếp tục quy trình tiếp nhận bình thường mà không bị hệ thống chặn hết hạn. |
| **Luồng ngoại lệ** | Tại bước 5, nếu số km ODO nhập vào nhỏ hơn số ODO ghi nhận tại lần xuất xưởng của phiếu dịch vụ gốc, hệ thống báo lỗi: *"Số ODO tiếp nhận không được nhỏ hơn ODO xuất xưởng của phiếu dịch vụ trước."* và yêu cầu kiểm tra lại đồng hồ công-tơ-mét. |

---

## UC-84 – Tạo phiếu công việc bảo hành

| **Mã Use case**    | UC-84 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo phiếu công việc bảo hành |
| **Mô tả**          | Cố vấn dịch vụ lập phiếu công việc chuyên biệt cho xe bảo hành; thẩm định tình trạng xe, gắn cờ bảo hành cho các hạng mục công việc và phụ tùng thay thế để áp dụng chính sách miễn phí 100% (đơn giá 0 đồng), tạo báo giá 0 đồng và chuyển sang điều phối thi công. |
| **Đối tượng**      | Cố vấn dịch vụ |
| **Tiền điều kiện** | Hồ sơ tiếp nhận bảo hành đang ở trạng thái Chờ tiếp nhận trên hàng đợi tiếp nhận của Cố vấn dịch vụ. |
| **Hậu điều kiện**  | Thành công: Phiếu công việc bảo hành được tạo với phân loại là Bảo hành, liên kết với phiếu dịch vụ gốc; các công việc và phụ tùng bảo hành được áp dụng đơn giá 0 đồng; báo giá được duyệt và chuyển sang cho điều phối kỹ thuật viên thi công.<br>Thất bại: Hệ thống thông báo lỗi, phiếu không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn mở màn hình Hàng đợi tiếp nhận và chọn hồ sơ xe bảo hành đang chờ.<br>2. Cố vấn nhấn **Tạo phiếu công việc ngay**.<br>3. Hệ thống tạo phiếu công việc mới với phân loại là Bảo hành, tự động kế thừa thông tin khách hàng, xe và liên kết với phiếu dịch vụ gốc.<br>4. Cố vấn tiến hành khám xe và lập kế hoạch các hạng mục xử lý sự cố (UC-33, UC-34).<br>5. Tại tab **Hạng mục sửa chữa** và tab **Phụ tùng & Vật tư**, cố vấn tích chọn cờ **Bảo hành** cho các công việc và linh kiện thuộc diện bảo hành miễn phí.<br>6. Cố vấn chuyển sang tab **Báo giá** và nhấn nút **Tạo Báo giá từ kế hoạch**.<br>7. Hệ thống tự động áp dụng đơn giá 0 đồng cho toàn bộ các công việc và phụ tùng có đánh dấu bảo hành; tổng thanh toán báo giá được tính bằng 0 đồng.<br>8. Cố vấn kiểm tra nội dung và nhấn nút **Khách đã đồng ý (Duyệt báo giá)**.<br>9. Hệ thống chuyển trạng thái báo giá sang Đã duyệt, phiếu công việc chuyển sang Đã duyệt, tự động giữ chỗ phụ tùng bảo hành trong kho và chuyển sang danh sách điều phối kỹ thuật viên thi công. |
| **Luồng thay thế** | **[Phiếu công việc kết hợp bảo hành và dịch vụ tính phí]** Tại bước 4, nếu khách hàng yêu cầu làm thêm các hạng mục dịch vụ/bảo dưỡng thông thường phát sinh ngoài diện bảo hành:<br>4a. Cố vấn thêm các dịch vụ và phụ tùng đó nhưng không đánh dấu cờ bảo hành.<br>4b. Hệ thống tự động tính tiền các hạng mục phát sinh theo bảng giá niêm yết chuẩn, đồng thời giữ nguyên đơn giá 0 đồng cho các hạng mục bảo hành. Phiếu công việc được chuyển sang phân loại kết hợp bảo hành và dịch vụ tính phí. |
| **Luồng ngoại lệ** | Tại bước 6, nếu phụ tùng thay thế bảo hành trong kho có số lượng tồn khả dụng bằng 0, hệ thống hiển thị cảnh báo thiếu kho. Cố vấn dịch vụ cần phối hợp với bộ phận kho tạo phiếu đặt hàng phụ tùng bảo hành hoặc chọn linh kiện thay thế tương đương. |

---

## UC-85 – Xử lý hóa đơn bảo hành

| **Mã Use case**    | UC-85 |
| ------------------ | ------ |
| **Tên Use case**   | Xử lý hóa đơn bảo hành |
| **Mô tả**          | Nhân viên quầy dịch vụ hoặc thu ngân lập và phát hành hóa đơn 0 đồng cho phiếu công việc bảo hành; hệ thống tự động xác nhận hoàn tất quyết toán tài chính để xe đủ điều kiện làm thủ tục bàn giao xuất xưởng. |
| **Đối tượng**      | Nhân viên quầy dịch vụ, Thu ngân |
| **Tiền điều kiện** | Phiếu công việc bảo hành đã hoàn thành thi công 100% và vượt qua kiểm định chất lượng (Phiếu công việc ở trạng thái Chờ thanh toán). |
| **Hậu điều kiện**  | Thành công: Hóa đơn 0 đồng được phát hành và tự động chuyển trạng thái Đã thanh toán; phiếu công việc tự động chuyển sang trạng thái Đã quyết toán tài chính, sẵn sàng cho thủ tục bàn giao xe xuất xưởng.<br>Thất bại: Hệ thống thông báo lỗi, hóa đơn không được phát hành. |
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ hoặc thu ngân mở danh sách hàng chờ lập hóa đơn và chọn phiếu công việc bảo hành đang chờ tính tiền.<br>2. Nhân viên nhấn **Tạo hóa đơn**.<br>3. Hệ thống hiển thị bảng xem trước hóa đơn, tự động trích xuất các dòng chi phí từ báo giá bảo hành với đơn giá 0 đồng và tổng tiền thanh toán bằng 0 đồng.<br>4. Nhân viên kiểm tra tính chuẩn xác và nhấn **Phát hành hóa đơn**.<br>5. Hệ thống kiểm tra tổng tiền hóa đơn: Nhận diện tổng tiền bằng 0 đồng, hệ thống tự động chuyển trạng thái hóa đơn sang **Đã thanh toán** mà không yêu cầu mở hộp thoại thu tiền mặt/thẻ/chuyển khoản QR.<br>6. Hệ thống tự động chuyển trạng thái phiếu công việc sang **Đã quyết toán tài chính**, mở khóa điều kiện xuất xưởng.<br>7. Hệ thống tạo hóa đơn điện tử 0 đồng, gửi email biên lai điện tử cho khách hàng và thông báo cho Cố vấn dịch vụ xe đã sẵn sàng làm thủ tục xuất xưởng (UC-43). |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình xem trước hóa đơn, nhân viên chọn **Hủy**:<br>Hệ thống đóng màn hình xem trước và quay lại danh sách chờ lập hóa đơn mà không phát sinh dữ liệu mới. |
| **Luồng ngoại lệ** | Tại bước 5, nếu phiếu công việc là loại kết hợp có các hạng mục dịch vụ phát sinh ngoài bảo hành dẫn đến tổng thanh toán lớn hơn 0 đồng, hệ thống chuyển sang quy trình thu tiền chuẩn (UC-28) để thu phần tiền phát sinh trước khi kích hoạt trạng thái Đã quyết toán tài chính. |

---

## UC-86 – Phê duyệt bảo hành thiện chí

| **Mã Use case**    | UC-86 |
| ------------------ | ------ |
| **Tên Use case**   | Phê duyệt bảo hành thiện chí |
| **Mô tả**          | Quản lý dịch vụ xem xét và phê duyệt các yêu cầu bảo hành ngoại lệ đối với trường hợp phương tiện hoặc phụ tùng đã hết hạn bảo hành tiêu chuẩn nhưng được hỗ trợ chi phí theo chính sách chăm sóc khách hàng đặc biệt của trung tâm. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Người dùng đăng nhập tài khoản có vai trò Quản lý dịch vụ (hoặc Quản trị viên hệ thống). Có yêu cầu đề xuất bảo hành thiện chí đang ở trạng thái chờ duyệt. |
| **Hậu điều kiện**  | Thành công: Yêu cầu bảo hành thiện chí được phê duyệt (hoặc từ chối), hệ thống mở quyền tạo phiếu công việc bảo hành cho Cố vấn dịch vụ và lưu vết thông tin người phê duyệt.<br>Thất bại: Hệ thống thông báo lỗi, trạng thái yêu cầu giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình **Phê duyệt bảo hành thiện chí**.<br>2. Quản lý chọn một hồ sơ đề xuất cần thẩm định và nhấn **Xem chi tiết**.<br>3. Hệ thống hiển thị hồ sơ thẩm định toàn diện: Thông tin khách hàng, số lần làm dịch vụ tại xưởng, lịch sử tuân thủ bảo dưỡng, hạng mục sự cố, số ngày hoặc số km đã vượt quá hạn cam kết, và lý do giải trình đề xuất của nhân viên.<br>4. Quản lý dịch vụ chọn mức độ hỗ trợ thiện chí:<br>- **Hỗ trợ 100%:** Miễn phí toàn bộ cả tiền công và tiền phụ tùng.<br>- **Hỗ trợ tiền công:** Miễn phí 100% tiền công, tính tiền phụ tùng theo giá vốn hoặc giá niêm yết.<br>- **Hỗ trợ tỷ lệ phần trăm (%):** Giảm trừ một tỷ lệ chi phí nhất định.<br>5. Quản lý dịch vụ nhập bắt buộc nội dung ghi chú phê duyệt (căn cứ duyệt, lưu ý kỹ thuật).<br>6. Quản lý dịch vụ nhấn **Phê duyệt**.<br>7. Hệ thống cập nhật trạng thái yêu cầu thành **Đã duyệt**, lưu thông tin người phê duyệt vào hồ sơ, gửi thông báo đến Cố vấn dịch vụ để tiến hành tạo phiếu công việc bảo hành và hiển thị thông báo thành công. |
| **Luồng thay thế** | **[Từ chối phê duyệt]** Tại bước 6, nếu không chấp thuận hỗ trợ ngoại lệ:<br>6a. Quản lý dịch vụ nhập lý do từ chối cụ thể và nhấn **Từ chối**.<br>6b. Hệ thống cập nhật trạng thái yêu cầu thành **Bị từ chối**, gửi thông báo đến Cố vấn dịch vụ để giải thích cho khách hàng và chuyển sang phương án sửa chữa có thu phí thông thường.<br><br>**[Hủy thao tác]** Quản lý nhấn **Đóng** để thoát khỏi màn hình xem chi tiết và giữ nguyên trạng thái chờ duyệt. |
| **Luồng ngoại lệ** | Tại bước 6, nếu quản lý dịch vụ để trống ô ghi chú giải trình khi nhấn Phê duyệt hoặc Từ chối, hệ thống ngăn chặn xử lý và hiển thị thông báo: *"Vui lòng nhập lý do giải trình phê duyệt/từ chối"*. |

---

## UC-87 – Xem báo cáo bảo hành

| **Mã Use case**    | UC-87 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo cáo bảo hành |
| **Mô tả**          | Quản lý dịch vụ theo dõi các chỉ số thống kê tài chính và kỹ thuật mật về hoạt động bảo hành: tỷ lệ xe bảo hành trên tổng lượt phục vụ, tổng chi phí vốn phụ tùng bảo hành xuất kho (tính theo giá vốn bình quân di động), danh sách phụ tùng lỗi lặp lại và nhà cung cấp bồi hoàn. Chức năng này được bảo vệ phân quyền nghiêm ngặt, các vai trò khác không được quyền truy cập. |
| **Đối tượng**      | **Chỉ duy nhất Quản lý dịch vụ** *(hoặc Quản trị viên hệ thống)* |
| **Tiền điều kiện** | Người dùng đã đăng nhập với vai trò Quản lý dịch vụ (hoặc Quản trị viên) và được cấp quyền xem dữ liệu tài chính của xưởng. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị bảng chỉ số, biểu đồ phân tích và bảng kê chi phí bảo hành theo tiêu chí đã lọc; cho phép xuất file báo cáo.<br>Thất bại: Hệ thống báo lỗi hoặc từ chối truy cập nếu không đủ quyền hạn. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập phân hệ Báo cáo thống kê và chọn mục **Báo cáo bảo hành**.<br>2. Hệ thống kiểm tra quyền hạn tài khoản và tải màn hình báo cáo kèm các bộ lọc mặc định (theo tháng hiện tại).<br>3. Quản lý dịch vụ chọn khoảng thời gian cần thống kê (Từ ngày – Đến ngày) và chọn tiêu chí phân tích (theo nhóm dịch vụ, theo danh mục phụ tùng, hoặc theo kỹ thuật viên thi công).<br>4. Quản lý dịch vụ nhấn **Xem báo cáo**.<br>5. Hệ thống kết xuất dữ liệu và hiển thị các khối chỉ số quản trị cốt lõi:<br>- **Chỉ số vận hành:** Tổng số lượt xe tiếp nhận bảo hành, tỷ lệ xe bảo hành trên tổng số xe phục vụ.<br>- **Chi phí vốn thiệt hại:** Tổng giá vốn phụ tùng đã xuất kho phục vụ bảo hành trong kỳ (tính theo phương pháp giá vốn bình quân di động).<br>- **Danh sách phụ tùng hư hỏng nhiều nhất:** Thống kê mã linh kiện, tên phụ tùng, số lượng lỗi, tỷ lệ lỗi và thông tin nhà cung cấp tương ứng để xưởng thực hiện thủ tục đòi bồi hoàn phụ tùng lỗi.<br>- **Phân tích lỗi kỹ thuật lặp lại:** Thống kê các lỗi phát sinh theo thợ thi công hoặc nhóm dịch vụ để nâng cao chất lượng tay nghề.<br>6. Quản lý dịch vụ có thể nhấn **Xuất file** (Excel / PDF) để tải báo cáo phân tích về máy tính. |
| **Luồng thay thế** | **[Đặt lại bộ lọc]** Tại bước 3, quản lý nhấn **Đặt lại**:<br>Hệ thống xóa các điều kiện lọc tùy chỉnh và đưa thời gian về mặc định tháng hiện tại. |
| **Luồng ngoại lệ** | Tại bước 1, nếu tài khoản không có vai trò Quản lý dịch vụ hoặc Quản trị viên hệ thống (ví dụ: Nhân viên quầy, Cố vấn hoặc Kỹ thuật viên), hệ thống chặn truy cập ngay lập tức, ghi log bảo mật và hiển thị cảnh báo: *"Bạn không có quyền truy cập dữ liệu báo cáo tài chính và chất lượng của xưởng."*<br><br>Tại bước 4, nếu khoảng thời gian chọn không hợp lệ (ngày bắt đầu lớn hơn ngày kết thúc), hệ thống báo lỗi: *"Khoảng thời gian không hợp lệ. Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc."* |
