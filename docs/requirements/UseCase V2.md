# ĐẶC TẢ USE CASE – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ

> **Phiên bản:** 3.0 
> **Cập nhật:** 2026-09-15

---

## MỤC LỤC

| Nhóm | UC ID | Số lượng |
|------|-------|----------|
| **Khách vãng lai (Guest)** | UC-01 → UC-03 | 3 use case |
| **Khách hàng (Customer)** | UC-04 → UC-16 | 13 use case |
| **Nhân viên quầy dịch vụ (Front Desk Staff)** | UC-17 → UC-28 | 12 use case |
| **Cố vấn dịch vụ (Service Advisor)** | UC-29 → UC-46 | 18 use case |
| **Quản lý dịch vụ (Service Manager)** | UC-47 → UC-53 | 7 use case |
| **Quản trị viên (Administrator)** | UC-54 → UC-81 | 28 use case |
| **Tổng cộng** | **UC-01 → UC-81** | **81 use case** |

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
| **Mô tả**          | Khách hàng quên mật khẩu có thể yêu cầu đặt lại mật khẩu ngay tại trang đăng nhập. Hệ thống gửi mã xác thực OTP về địa chỉ email đã đăng ký để xác minh danh tính trước khi cho phép đặt mật khẩu mới. Chức năng này chỉ dành riêng cho Khách hàng; tài khoản nhân viên do Quản trị viên cấp và đặt lại mật khẩu thông qua UC-35. |
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
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý lịch hẹn và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin lịch hẹn.<br>3. Khách hàng nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu lịch hẹn mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
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
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và mở chi tiết bản ghi lịch hẹn cần chỉnh sửa.<br>2. Khách hàng chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Khách hàng thay đổi các trường thông tin cần thiết.<br>5. Khách hàng nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
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
| **Luồng cơ bản**   | 1. Khách hàng truy cập màn hình quản lý và chọn bản ghi lịch hẹn cần xử lý.<br>2. Khách hàng chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Khách hàng nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý lịch hẹn và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin lịch hẹn.<br>3. Nhân viên quầy dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu lịch hẹn mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi lịch hẹn cần chỉnh sửa.<br>2. Nhân viên quầy dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Nhân viên quầy dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và chọn bản ghi lịch hẹn cần xử lý.<br>2. Nhân viên quầy dịch vụ chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Nhân viên quầy dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, nhân viên quầy dịch vụ chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý hồ sơ khách hàng và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin hồ sơ khách hàng.<br>3. Nhân viên quầy dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu hồ sơ khách hàng mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi hồ sơ khách hàng cần chỉnh sửa.<br>2. Nhân viên quầy dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Nhân viên quầy dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Nhân viên quầy dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, nhân viên quầy dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
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
| **Luồng cơ bản**   | 1. Nhân viên quầy dịch vụ truy cập màn hình quản lý và chọn bản ghi hồ sơ khách hàng cần xử lý.<br>2. Nhân viên quầy dịch vụ chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Nhân viên quầy dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, nhân viên quầy dịch vụ chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

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
| **Mô tả**          | Sau khi nhận yêu cầu thanh toán từ Cố vấn dịch vụ, nhân viên quầy tạo hóa đơn tổng hợp từ các hạng mục đã được duyệt và phát hành hóa đơn chính thức cho khách hàng. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Cố vấn dịch vụ đã gửi yêu cầu thanh toán với đầy đủ điều kiện: tất cả công việc hoàn thành, kiểm định chất lượng đạt và báo giá đã được khách hàng duyệt. |
| **Hậu điều kiện**  | Thành công: Hóa đơn được phát hành, sẵn sàng để khách hàng thanh toán.<br>Thất bại: Hệ thống thông báo lỗi, hóa đơn chưa được tạo. |
| **Luồng cơ bản**   | 1. Nhân viên quầy nhận thông báo có yêu cầu thanh toán mới và mở phiếu tương ứng.<br>2. Hệ thống hiển thị danh sách hạng mục từ báo giá đã được duyệt (dịch vụ, nhân công, phụ tùng, phí).<br>3. Nhân viên kiểm tra lại các dòng chi phí và tạo **Hóa đơn nháp**.<br>4. Nhân viên nhấn **Phát hành hóa đơn**.<br>5. Hệ thống tạo hóa đơn chính thức và gửi thông báo cho khách hàng. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 1, nếu yêu cầu thanh toán chưa đủ điều kiện (công việc chưa xong hoặc kiểm định chưa đạt), hệ thống thông báo lý do và không cho phép tạo hóa đơn. |

---

---

## UC-28 – Xử lý thanh toán (Process Payment)

| **Mã Use case**    | UC-28 |
| ------------------ | ------ |
| **Tên Use case**   | Xử lý thanh toán (Process Payment) |
| **Mô tả**          | Nhân viên quầy ghi nhận khoản thanh toán của khách hàng. Hệ thống hỗ trợ hai hình thức: ghi nhận thủ công (tiền mặt, thẻ) hoặc tạo mã QR để khách quét qua ứng dụng thanh toán điện tử. Sau khi thanh toán thành công, hệ thống tự động ghi nhận điều kiện tài chính đã đạt và thông báo cho Cố vấn dịch vụ để tiến hành bàn giao xe. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Hóa đơn đã được phát hành và đang ở trạng thái **Chưa thanh toán**. |
| **Hậu điều kiện**  | Thành công: Hóa đơn chuyển sang trạng thái **Đã thanh toán**; hệ thống tự động thông báo cho Cố vấn dịch vụ rằng xe sẵn sàng để bàn giao.<br>Thất bại: Hệ thống thông báo lỗi, trạng thái thanh toán không thay đổi. |
| **Luồng cơ bản**   | 1. Nhân viên mở hóa đơn của khách hàng và chọn **Ghi nhận thanh toán**.<br>2. Nhân viên chọn hình thức thanh toán thủ công (tiền mặt hoặc thẻ ngân hàng).<br>3. Nhân viên nhập số tiền thanh toán.<br>4. Nhân viên nhấn **Xác nhận thanh toán**.<br>5. Hệ thống ghi nhận khoản thanh toán và cập nhật trạng thái hóa đơn thành **Đã thanh toán**.<br>6. Hệ thống tự động ghi nhận điều kiện tài chính đã đạt và gửi thông báo cho Cố vấn dịch vụ rằng xe sẵn sàng để bàn giao. |
| **Luồng thay thế** | **[Thanh toán qua mã QR]** Tại bước 2, thay vì chọn hình thức thủ công:<br>2a. Nhân viên chọn **Tạo mã QR thanh toán**.<br>3a. Hệ thống tạo mã QR liên kết với hóa đơn và hiển thị trên màn hình quầy.<br>4a. Khách hàng dùng ứng dụng điện thoại quét mã QR.<br>5a. Khách hàng xác nhận thanh toán trên ứng dụng.<br>6a. Hệ thống nhận xác nhận từ cổng thanh toán và tự động cập nhật hóa đơn sang **Đã thanh toán**.<br>7a. Hệ thống tự động ghi nhận điều kiện tài chính đã đạt và gửi thông báo cho Cố vấn dịch vụ rằng xe sẵn sàng để bàn giao. |
| **Luồng ngoại lệ** | Tại bước 6a của luồng QR, nếu giao dịch thất bại hoặc hết thời gian chờ, hệ thống thông báo và cho phép thử lại hoặc chuyển sang thanh toán thủ công. |

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
| **Luồng cơ bản**   | 1. Cố vấn mở phiếu công việc và chọn **Ghi nhận tình trạng xe**.<br>2. Cố vấn điền thông tin bắt buộc: số km hiện tại, mức xăng, nội dung phàn nàn / yêu cầu của khách và tình trạng xe quan sát bên ngoài.<br>3. Cố vấn ghi thêm tài sản trong xe nếu có.<br>4. Cố vấn chụp hoặc đính kèm hình ảnh minh chứng tình trạng xe.<br>5. Cố vấn nhấn **Lưu**.<br>6. Hệ thống lưu thông tin và gửi thông báo xác nhận cho khách hàng (UC-09). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 5, nếu thiếu thông tin bắt buộc (km, xăng, phàn nàn hoặc tình trạng xe), hệ thống từ chối lưu và hiển thị các trường còn thiếu. |

---

---


## UC-31 – Thêm hạng mục dịch vụ (Add Service)

| **Mã Use case**    | UC-31 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm hạng mục dịch vụ (Add Service) |
| **Mô tả**          | Thêm hạng mục dịch vụ vào Work Order. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Work Order đang mở. |
| **Hậu điều kiện**  | Thành công: Hệ thống xử lý đúng yêu cầu. Thất bại: Giữ nguyên trạng thái. |
| **Luồng cơ bản**   | 1. Mở Work Order.<br>2. Nhấn Thêm dịch vụ.<br>3. Chọn dịch vụ từ danh mục.<br>4. Hệ thống lưu vào WO. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Hệ thống thông báo lỗi nếu dữ liệu không hợp lệ. |


---

## UC-32 – Xóa hạng mục dịch vụ (Remove Service)

| **Mã Use case**    | UC-32 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa hạng mục dịch vụ (Remove Service) |
| **Mô tả**          | Xóa hạng mục dịch vụ khỏi Work Order. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Work Order đang mở. |
| **Hậu điều kiện**  | Thành công: Hệ thống xử lý đúng yêu cầu. Thất bại: Giữ nguyên trạng thái. |
| **Luồng cơ bản**   | 1. Mở Work Order.<br>2. Chọn dịch vụ cần xóa.<br>3. Nhấn Xóa.<br>4. Hệ thống loại bỏ khỏi WO. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Hệ thống thông báo lỗi nếu dữ liệu không hợp lệ. |


---

## UC-33 – Kiểm tra xe (Inspect Vehicle)

| **Mã Use case**    | UC-33 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm tra xe (Inspect Vehicle) |
| **Mô tả**          | Cố vấn dịch vụ mở giao diện kiểm tra xe (Vehicle Inspection), chọn loại dấu vết (Damage / Rust / Missing / Dent / Scratch,...) và nhấp chọn trực tiếp trên hình ảnh sơ đồ thân xe (Car Diagram UI) để đặt marker tại vị trí phát hiện hư hỏng (ví dụ: Driver side - Front door, Driver side - Front bumper,...). Hệ thống tự động ghi nhận vị trí và tạo dòng vấn đề phát hiện (Finding / Issue) tương ứng, cho phép cố vấn ghi chú, đính kèm hình ảnh và liên kết với công việc (Job). |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-17). Cố vấn đã ghi nhận tình trạng tiếp nhận xe (UC-18). Xe đang ở trong xưởng, chưa thực hiện sửa chữa. |
| **Hậu điều kiện**  | Thành công: Danh sách các vấn đề phát hiện (Finding) kèm vị trí marker trên sơ đồ xe được lưu vào phiếu công việc, sẵn sàng để lên kế hoạch tạo Job xử lý.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn mở mục **Kiểm tra xe (Vehicle Inspection)** trong phiếu công việc.<br>2. Hệ thống hiển thị sơ đồ 2D mô phỏng hình ảnh thân xe (Front, Rear, Left, Right) và thanh công cụ chứa các loại marker (Damage, Rust, Missing, Dent, Scratch,...).<br>3. Cố vấn chọn một loại marker trên thanh công cụ và nhấp chuột vào bộ phận tương ứng trên sơ đồ xe (ví dụ: nhấp chọn Driver side - Front door).<br>4. Hệ thống đặt đánh dấu (marker) lên sơ đồ xe tại vị trí vừa nhấp và tự động tạo một dòng thông tin phát hiện (Finding).<br>5. Cố vấn nhập thêm ghi chú chi tiết và đính kèm hình ảnh thực tế (Photo) cho Finding nếu có.<br>6. Cố vấn nhấn **Lưu kết quả kiểm tra**.<br>7. Hệ thống lưu toàn bộ danh sách Finding và vị trí các marker trên sơ đồ xe vào phiếu công việc. |
| **Luồng thay thế** | **[Xóa vấn đề phát hiện / Marker]** Tại bước 4, cố vấn muốn xóa một Finding không chính xác:<br>4a. Cố vấn nhấp biểu tượng xóa (X) tại dòng Finding tương ứng trong bảng hoặc nhấp trực tiếp vào marker trên sơ đồ xe.<br>5a. Hệ thống kiểm tra: nếu Finding chưa được liên kết với Job nào, hệ thống xóa dòng Finding và gỡ bỏ marker khỏi sơ đồ xe.<br><br>**[Chỉnh sửa ghi chú / Đổi ảnh Finding]** Tại bước 5, cố vấn nhấp vào ô Note để sửa nội dung ghi chú hoặc tải lên hình ảnh minh chứng khác. |
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
| **Mô tả**          | Cố vấn dịch vụ tạo báo giá từ các hạng mục dịch vụ, nhân công và phụ tùng đã được chọn trong phiếu công việc. Báo giá này sẽ được gửi cho khách hàng duyệt. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc có ít nhất một hạng mục dịch vụ/phụ tùng đã được khai báo. |
| **Hậu điều kiện**  | Thành công: Báo giá được tạo ở trạng thái **Chờ phản hồi**.<br>Thất bại: Hệ thống thông báo lỗi. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Tạo báo giá**.<br>2. Hệ thống tự động tổng hợp chi phí: nhân công theo đơn giá và số giờ, phụ tùng / vật tư và phí phụ trợ.<br>3. Cố vấn kiểm tra các dòng chi phí và điều chỉnh chiết khấu (nếu có).<br>4. Cố vấn nhấn **Lưu báo giá**.<br>5. Hệ thống tạo báo giá mới ở trạng thái **Chờ phản hồi** và khóa tạm các hạng mục trong báo giá. |
| **Luồng thay thế** | **[Tạo báo giá bổ sung]** Nếu trong quá trình sửa chữa phát sinh thêm hạng mục, cố vấn có thể tạo **Báo giá bổ sung** (Supplementary Quotation). Báo giá bổ sung sẽ cần khách hàng phê duyệt tương tự báo giá gốc. |
| **Luồng ngoại lệ** | Tại bước 4, nếu không có hạng mục nào có chi phí, hệ thống thông báo báo giá trống và không cho tạo. |

---

## UC-38 – Xem báo giá (View Quotation)

| **Mã Use case**    | UC-38 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo giá (View Quotation) |
| **Mô tả**          | Cố vấn dịch vụ hoặc khách hàng xem chi tiết báo giá đã tạo, bao gồm các hạng mục, chi phí và trạng thái duyệt. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor), Khách hàng (Customer) |
| **Tiền điều kiện** | Báo giá đã được tạo và tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Chi tiết báo giá được hiển thị chính xác. |
| **Luồng cơ bản**   | 1. Người dùng chọn mục **Báo giá** trong phiếu công việc.<br>2. Hệ thống hiển thị danh sách các phiên bản báo giá.<br>3. Người dùng chọn phiên bản báo giá cần xem.<br>4. Hệ thống hiển thị chi tiết hạng mục, tổng tiền và trạng thái (Chờ phản hồi, Đã duyệt, Đã từ chối). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-39 – Cập nhật báo giá (Update Quotation)

| **Mã Use case**    | UC-39 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật báo giá (Update Quotation) |
| **Mô tả**          | Cố vấn dịch vụ cập nhật lại các chi phí, chiết khấu hoặc ghi nhận kết quả duyệt của khách hàng (Đồng ý/Từ chối) cho một báo giá đang ở trạng thái Chờ phản hồi. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái **Chờ phản hồi**. |
| **Hậu điều kiện**  | Thành công: Báo giá được cập nhật, hoặc chuyển trạng thái thành **Đã duyệt** / **Đã từ chối**.<br>Thất bại: Giữ nguyên trạng thái. |
| **Luồng cơ bản**   | 1. Cố vấn mở báo giá đang chờ phản hồi.<br>2. Cố vấn trao đổi với khách hàng (ngoài hệ thống).<br>3. Nếu khách hàng đồng ý, cố vấn nhấn **Duyệt báo giá**.<br>4. Hệ thống khóa báo giá, lưu snapshot đơn giá và chuyển trạng thái sang **Đã duyệt**. |
| **Luồng thay thế** | **[Khách hàng từ chối]** Tại bước 3, nếu khách hàng không đồng ý:<br>3a. Cố vấn nhấn **Từ chối báo giá** và ghi lý do.<br>4a. Hệ thống chuyển trạng thái sang **Đã từ chối**, mở khóa các hạng mục để cố vấn sửa và tạo báo giá mới.<br><br>**[Chỉnh sửa chiết khấu]** Tại bước 3, cố vấn chọn **Chỉnh sửa**:<br>3b. Cố vấn thay đổi chiết khấu hoặc thông tin phụ.<br>4b. Cố vấn nhấn **Lưu**.<br>5b. Hệ thống cập nhật thông tin báo giá. |
| **Luồng ngoại lệ** | Nếu báo giá đã Đã duyệt, hệ thống ẩn nút Chỉnh sửa/Duyệt/Từ chối, ngăn chặn việc cập nhật. |

---

## UC-40 – Hủy báo giá (Cancel Quotation)

| **Mã Use case**    | UC-40 |
| ------------------ | ------ |
| **Tên Use case**   | Hủy báo giá (Cancel Quotation) |
| **Mô tả**          | Cố vấn dịch vụ hủy bỏ một báo giá đang chờ nếu phát hiện sai sót trước khi gửi khách hàng duyệt. Báo giá sau khi bị hủy sẽ không còn hiệu lực. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái **Chờ phản hồi**. |
| **Hậu điều kiện**  | Thành công: Báo giá chuyển trạng thái thành **Đã hủy**.<br>Thất bại: Hệ thống báo lỗi. |
| **Luồng cơ bản**   | 1. Cố vấn mở báo giá đang chờ phản hồi.<br>2. Cố vấn chọn **Hủy báo giá**.<br>3. Hệ thống hiển thị cảnh báo xác nhận.<br>4. Cố vấn nhấn **Xác nhận**.<br>5. Hệ thống cập nhật trạng thái báo giá thành **Đã hủy** và giải phóng các hạng mục bị khóa tạm. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu báo giá đã ở trạng thái Đã duyệt, hệ thống không cho phép hủy và thông báo lỗi. |

---


---


---

## UC-41 – Kiểm định chất lượng (Quality Inspection)

| **Mã Use case**    | UC-41 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm định chất lượng (Quality Inspection) |
| **Mô tả**          | Sau khi các job hoàn thành, cố vấn dịch vụ thực hiện kiểm định chất lượng theo danh sách hạng mục. Nếu đạt, dịch vụ được đánh dấu hoàn thành. Nếu không đạt, cố vấn tạo job sửa lại và thực hiện lại trước khi kiểm định lần nữa. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Toàn bộ job trong dịch vụ đã ở trạng thái **Hoàn thành**. |
| **Hậu điều kiện**  | Thành công – Đạt: Dịch vụ được đánh dấu hoàn thành, sẵn sàng cho bước tiếp theo.<br>Thành công – Không đạt: Job sửa lại được tạo để xử lý vấn đề phát sinh. |
| **Luồng cơ bản**   | 1. Cố vấn vào mục **Kiểm định chất lượng** của dịch vụ.<br>2. Cố vấn đi qua từng hạng mục kiểm định theo danh sách mẫu và đánh dấu **Đạt** hoặc **Không đạt**.<br>3. Cố vấn nhấn **Xác nhận kết quả kiểm định**.<br>4. Hệ thống ghi nhận toàn bộ hạng mục đều Đạt và đánh dấu dịch vụ hoàn thành. |
| **Luồng thay thế** | **[Kiểm định không đạt]** Tại bước 3, khi có ít nhất một hạng mục Không đạt:<br>3a. Cố vấn nhấn **Xác nhận kết quả kiểm định** với ghi nhận hạng mục không đạt.<br>4a. Cố vấn mô tả chi tiết vấn đề cần sửa lại.<br>5a. Cố vấn nhấn **Tạo job sửa lại**.<br>6a. Hệ thống tạo job Rework và liên kết với hạng mục không đạt.<br>7a. Cố vấn thực hiện lại từ UC-25 cho job Rework.<br>8a. Sau khi Rework hoàn thành, cố vấn quay lại bước 1 để kiểm định lại. |
| **Luồng ngoại lệ** | Tại bước 3, hệ thống không cho phép xác nhận nếu còn hạng mục chưa được đánh giá. |

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

## UC-43 – Theo dõi hoạt động xưởng (Monitor Workshop)

| **Mã Use case**    | UC-43 |
| ------------------ | ------ |
| **Tên Use case**   | Theo dõi hoạt động xưởng (Monitor Workshop) |
| **Mô tả**          | Quản lý xem bảng tổng quan để nắm bắt tình hình vận hành: số xe đang trong xưởng, từng xe đang ở bước nào và job nào đang chờ xử lý. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Quản lý xem được tổng quan tình hình vận hành hiện tại. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Bảng điều hành**.<br>2. Hệ thống hiển thị danh sách phiếu công việc đang hoạt động cùng trạng thái từng dịch vụ và từng job.<br>3. Quản lý lọc theo trạng thái, nhân viên thực hiện hoặc loại dịch vụ để tập trung theo dõi.<br>4. Quản lý chọn một phiếu để xem chi tiết nếu cần. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

---

## UC-44 – Thêm phụ tùng (Create Part Catalog)

| **Mã Use case**    | UC-44 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm phụ tùng (Create Part Catalog) |
| **Mô tả**          | Quản lý dịch vụ tạo mới dữ liệu phụ tùng vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu phụ tùng mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý phụ tùng và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin phụ tùng.<br>3. Quản lý dịch vụ nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu phụ tùng mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-45 – Xem phụ tùng (View Part Catalog)

| **Mã Use case**    | UC-45 |
| ------------------ | ------ |
| **Tên Use case**   | Xem phụ tùng (View Part Catalog) |
| **Mô tả**          | Quản lý dịch vụ tra cứu, tìm kiếm và xem chi tiết thông tin của phụ tùng đã có trong hệ thống. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết phụ tùng được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý phụ tùng.<br>2. Hệ thống tải và hiển thị danh sách phụ tùng hiện có.<br>3. Quản lý dịch vụ có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản lý dịch vụ chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản lý dịch vụ không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-46 – Cập nhật phụ tùng (Update Part Catalog)

| **Mã Use case**    | UC-46 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật phụ tùng (Update Part Catalog) |
| **Mô tả**          | Quản lý dịch vụ chỉnh sửa và cập nhật lại thông tin của phụ tùng hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền cập nhật và bản ghi phụ tùng cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của phụ tùng được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và mở chi tiết bản ghi phụ tùng cần chỉnh sửa.<br>2. Quản lý dịch vụ chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản lý dịch vụ thay đổi các trường thông tin cần thiết.<br>5. Quản lý dịch vụ nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản lý dịch vụ chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-47 – Xóa phụ tùng (Delete Part Catalog)

| **Mã Use case**    | UC-47 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa phụ tùng (Delete Part Catalog) |
| **Mô tả**          | Quản lý dịch vụ thực hiện xóa hoặc vô hiệu hóa bản ghi phụ tùng khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản lý dịch vụ |
| **Tiền điều kiện** | Quản lý dịch vụ đã đăng nhập, có quyền xóa và bản ghi phụ tùng cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi phụ tùng bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản lý dịch vụ truy cập màn hình quản lý và chọn bản ghi phụ tùng cần xử lý.<br>2. Quản lý dịch vụ chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản lý dịch vụ nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản lý dịch vụ chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

---

## UC-48 – Nhập kho (Receive Inventory)

| **Mã Use case**    | UC-48 |
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

## UC-49 – Xem báo cáo vận hành (View Operational Report)

| **Mã Use case**    | UC-49 |
| ------------------ | ------ |
| **Tên Use case**   | Xem báo cáo vận hành (View Operational Report) |
| **Mô tả**          | Quản lý xem các báo cáo cơ bản: số lượng dịch vụ theo loại, doanh thu theo khoảng thời gian và tình trạng tồn kho hiện tại để nắm bắt hiệu quả kinh doanh. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý đã đăng nhập. Có dữ liệu giao dịch trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Quản lý xem được báo cáo theo bộ lọc đã chọn. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Báo cáo**.<br>2. Quản lý chọn loại báo cáo: Dịch vụ / Doanh thu / Tồn kho.<br>3. Quản lý chọn khoảng thời gian cần xem và nhấn **Xem báo cáo**.<br>4. Hệ thống tổng hợp dữ liệu từ các giao dịch trong khoảng thời gian đã chọn và hiển thị kết quả. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

# PHẦN 6 – QUẢN TRỊ VIÊN (ADMINISTRATOR)

---

---

## UC-50 – Thêm tài khoản (Create Account)

| **Mã Use case**    | UC-50 |
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

## UC-51 – Xem tài khoản (View Account)

| **Mã Use case**    | UC-51 |
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

## UC-52 – Cập nhật tài khoản (Update Account)

| **Mã Use case**    | UC-52 |
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

## UC-53 – Xóa tài khoản (Delete Account)

| **Mã Use case**    | UC-53 |
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

## UC-54 – Thêm nhân viên (Create Employee)

| **Mã Use case**    | UC-54 |
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

## UC-55 – Xem nhân viên (View Employee)

| **Mã Use case**    | UC-55 |
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

## UC-56 – Cập nhật nhân viên (Update Employee)

| **Mã Use case**    | UC-56 |
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

## UC-57 – Xóa nhân viên (Delete Employee)

| **Mã Use case**    | UC-57 |
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

## UC-58 – Thêm dịch vụ (Create Service)

| **Mã Use case**    | UC-58 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm dịch vụ (Create Service) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu dịch vụ vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu dịch vụ mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý dịch vụ và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin dịch vụ.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu dịch vụ mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-59 – Xem dịch vụ (View Service)

| **Mã Use case**    | UC-59 |
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

## UC-60 – Cập nhật dịch vụ (Update Service)

| **Mã Use case**    | UC-60 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật dịch vụ (Update Service) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của dịch vụ hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi dịch vụ cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của dịch vụ được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi dịch vụ cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-61 – Xóa dịch vụ (Delete Service)

| **Mã Use case**    | UC-61 |
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

## UC-62 – Thêm danh mục dịch vụ (Create Service Category)

| **Mã Use case**    | UC-62 |
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

## UC-63 – Xem danh mục dịch vụ (View Service Category)

| **Mã Use case**    | UC-63 |
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

## UC-64 – Cập nhật danh mục dịch vụ (Update Service Category)

| **Mã Use case**    | UC-64 |
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

## UC-65 – Xóa danh mục dịch vụ (Delete Service Category)

| **Mã Use case**    | UC-65 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa danh mục dịch vụ (Delete Service Category) |
| **Mô tả**          | Quản trị viên xóa hoặc vô hiệu hóa danh mục dịch vụ khi không còn sử dụng. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Danh mục dịch vụ tồn tại. |
| **Hậu điều kiện**  | Thành công: Danh mục bị vô hiệu hóa hoặc xóa.<br>Thất bại: Hệ thống báo lỗi nếu có ràng buộc dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên chọn danh mục cần xóa.<br>2. Quản trị viên chọn hành động **Xóa**.<br>3. Hệ thống yêu cầu xác nhận.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra ràng buộc (nếu danh mục đã có dịch vụ phụ thuộc thì không cho phép xóa cứng).<br>6. Hệ thống thực hiện xóa mềm (chuyển is_active = false) và cập nhật danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, chọn **Hủy**: Hủy bỏ thao tác xóa. |
| **Luồng ngoại lệ** | Tại bước 5, nếu có ràng buộc dữ liệu, hệ thống từ chối và yêu cầu gỡ bỏ dịch vụ thuộc danh mục trước. |

---

## UC-66 – Thêm loại công việc (Create Job Type)

| **Mã Use case**    | UC-66 |
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

## UC-67 – Xem loại công việc (View Job Type)

| **Mã Use case**    | UC-67 |
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

## UC-68 – Cập nhật loại công việc (Update Job Type)

| **Mã Use case**    | UC-68 |
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

## UC-69 – Xóa loại công việc (Delete Job Type)

| **Mã Use case**    | UC-69 |
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

## UC-70 – Thêm chính sách tính giá (Create Pricing Policy)

| **Mã Use case**    | UC-70 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm chính sách tính giá (Create Pricing Policy) |
| **Mô tả**          | Quản trị viên tạo mới dữ liệu chính sách tính giá vào hệ thống để lưu trữ và quản lý. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Dữ liệu chính sách tính giá mới được lưu vào hệ thống và hiển thị trong danh sách.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được thêm. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý chính sách tính giá và chọn **Thêm mới**.<br>2. Hệ thống hiển thị biểu mẫu nhập thông tin chính sách tính giá.<br>3. Quản trị viên nhập đầy đủ các thông tin bắt buộc và các thông tin tùy chọn khác.<br>4. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>5. Hệ thống kiểm tra tính hợp lệ của dữ liệu và đảm bảo không có sự trùng lặp (nếu có yêu cầu).<br>6. Hệ thống lưu dữ liệu chính sách tính giá mới, hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu dữ liệu không hợp lệ, thiếu thông tin bắt buộc, hoặc vi phạm ràng buộc dữ liệu (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi chi tiết tại các trường tương ứng. Use case quay lại bước 3. |

---

---

## UC-71 – Xem chính sách tính giá (View Pricing Policy)

| **Mã Use case**    | UC-71 |
| ------------------ | ------ |
| **Tên Use case**   | Xem chính sách tính giá (View Pricing Policy) |
| **Mô tả**          | Quản trị viên tra cứu, tìm kiếm và xem chi tiết thông tin của chính sách tính giá đã có trong hệ thống. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống và được cấp quyền thực hiện chức năng này. |
| **Hậu điều kiện**  | Thành công: Danh sách và chi tiết chính sách tính giá được hiển thị chính xác theo yêu cầu.<br>Thất bại: Hệ thống thông báo lỗi nếu không thể tải dữ liệu. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý chính sách tính giá.<br>2. Hệ thống tải và hiển thị danh sách chính sách tính giá hiện có.<br>3. Quản trị viên có thể nhập từ khóa vào ô tìm kiếm hoặc sử dụng các bộ lọc để thu hẹp kết quả.<br>4. Hệ thống cập nhật danh sách dựa trên tiêu chí tìm kiếm/lọc.<br>5. Quản trị viên chọn một bản ghi cụ thể trong danh sách.<br>6. Hệ thống hiển thị màn hình chi tiết của bản ghi đó với toàn bộ thông tin liên quan. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2 hoặc 4, nếu không có dữ liệu nào khớp với tiêu chí, hệ thống hiển thị thông báo "Không tìm thấy dữ liệu phù hợp".<br><br>Tại bước 6, nếu bản ghi không tồn tại hoặc quản trị viên không có quyền xem, hệ thống hiển thị thông báo lỗi từ chối truy cập. |

---

---

## UC-72 – Cập nhật chính sách tính giá (Update Pricing Policy)

| **Mã Use case**    | UC-72 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật chính sách tính giá (Update Pricing Policy) |
| **Mô tả**          | Quản trị viên chỉnh sửa và cập nhật lại thông tin của chính sách tính giá hiện có trong hệ thống để đảm bảo dữ liệu luôn chính xác. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền cập nhật và bản ghi chính sách tính giá cần chỉnh sửa đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin mới của chính sách tính giá được lưu và cập nhật trong hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu được giữ nguyên trạng thái cũ. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và mở chi tiết bản ghi chính sách tính giá cần chỉnh sửa.<br>2. Quản trị viên chọn **Cập nhật** hoặc **Chỉnh sửa**.<br>3. Hệ thống hiển thị biểu mẫu với các thông tin hiện tại của bản ghi.<br>4. Quản trị viên thay đổi các trường thông tin cần thiết.<br>5. Quản trị viên nhấn **Lưu** hoặc **Xác nhận**.<br>6. Hệ thống kiểm tra tính hợp lệ của dữ liệu mới.<br>7. Hệ thống lưu thay đổi, hiển thị thông báo cập nhật thành công và hiển thị lại thông tin đã được làm mới. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại màn hình nhập liệu, quản trị viên chọn **Hủy**:<br>Hệ thống đóng biểu mẫu và quay lại màn hình trước đó mà không lưu thay đổi dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 6, nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc hệ thống (ví dụ: trùng mã), hệ thống hiển thị thông báo lỗi tương ứng và yêu cầu chỉnh sửa lại. Use case quay lại bước 4.<br><br>Tại bước 7, nếu bản ghi đã bị người dùng khác thay đổi (conflict) hoặc xóa trước đó, hệ thống thông báo lỗi đồng bộ dữ liệu. |

---

---

## UC-73 – Xóa chính sách tính giá (Delete Pricing Policy)

| **Mã Use case**    | UC-73 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa chính sách tính giá (Delete Pricing Policy) |
| **Mô tả**          | Quản trị viên thực hiện xóa hoặc vô hiệu hóa bản ghi chính sách tính giá khỏi hệ thống khi không còn nhu cầu sử dụng hoặc lưu trữ. |
| **Đối tượng**      | Quản trị viên |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập, có quyền xóa và bản ghi chính sách tính giá cần xử lý đang tồn tại trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Bản ghi chính sách tính giá bị vô hiệu hóa hoặc xóa thành công khỏi hệ thống.<br>Thất bại: Hệ thống thông báo lỗi, bản ghi được giữ nguyên. |
| **Luồng cơ bản**   | 1. Quản trị viên truy cập màn hình quản lý và chọn bản ghi chính sách tính giá cần xử lý.<br>2. Quản trị viên chọn hành động **Xóa** hoặc **Hủy**.<br>3. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận thao tác.<br>4. Quản trị viên nhấn **Xác nhận**.<br>5. Hệ thống kiểm tra các ràng buộc dữ liệu liên quan đến bản ghi (ví dụ: dữ liệu có đang được sử dụng ở chức năng khác không).<br>6. Hệ thống thực hiện xóa mềm (chuyển trạng thái sang Ngừng hoạt động/Đã hủy) hoặc xóa cứng bản ghi tùy theo quy định.<br>7. Hệ thống hiển thị thông báo thành công và cập nhật lại danh sách. |
| **Luồng thay thế** | **[Hủy thao tác]** Tại bước 3, quản trị viên chọn **Hủy**:<br>3a. Hệ thống đóng hộp thoại cảnh báo và hủy bỏ thao tác xóa, giữ nguyên dữ liệu. |
| **Luồng ngoại lệ** | Tại bước 5, nếu bản ghi đang có ràng buộc dữ liệu với các nghiệp vụ khác (ví dụ: đã phát sinh giao dịch, hóa đơn), hệ thống từ chối xóa và hiển thị thông báo lỗi giải thích lý do không thể xóa. |

---

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



## UC-78 – Xem mẫu kiểm tra (View Inspection Template)

| **Mã Use case**    | UC-78 |
| ------------------ | ------ |
| **Tên Use case**   | Xem mẫu kiểm tra (View Inspection Template) |
| **Mô tả**          | Quản trị viên xem danh sách và chi tiết các mẫu kiểm tra cấu hình sẵn. |
| **Đối tượng**      | Quản trị viên (Admin) / Quản lý (Manager) |
| **Tiền điều kiện** | Người dùng đã đăng nhập và có quyền tương ứng. |
| **Hậu điều kiện**  | Thành công: Hệ thống hiển thị danh sách các mẫu. |
| **Luồng cơ bản**   | 1. Người dùng vào trang quản lý Mẫu kiểm tra.<br>2. Hệ thống hiển thị danh sách các mẫu.<br>3. Người dùng có thể nhấn vào một mẫu để xem chi tiết. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-79 – Thêm mẫu kiểm tra (Create Inspection Template)

| **Mã Use case**    | UC-79 |
| ------------------ | ------ |
| **Tên Use case**   | Thêm mẫu kiểm tra (Create Inspection Template) |
| **Mô tả**          | Quản trị viên tạo mới một mẫu kiểm tra xe (gồm nhiều hạng mục) để kỹ thuật viên sử dụng. |
| **Đối tượng**      | Quản trị viên (Admin) / Quản lý (Manager) |
| **Tiền điều kiện** | Người dùng đã đăng nhập và có quyền tương ứng. |
| **Hậu điều kiện**  | Thành công: Mẫu kiểm tra mới được lưu vào hệ thống. |
| **Luồng cơ bản**   | 1. Người dùng nhấn **Thêm mới** trên trang quản lý Mẫu kiểm tra.<br>2. Hệ thống hiển thị form nhập liệu.<br>3. Người dùng nhập tên mẫu, mô tả và thêm các hạng mục kiểm tra cần thiết.<br>4. Người dùng nhấn **Lưu**.<br>5. Hệ thống lưu mẫu và hiển thị lại danh sách. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Hệ thống báo lỗi nếu thiếu trường thông tin bắt buộc. |

---

## UC-80 – Cập nhật mẫu kiểm tra (Update Inspection Template)

| **Mã Use case**    | UC-80 |
| ------------------ | ------ |
| **Tên Use case**   | Cập nhật mẫu kiểm tra (Update Inspection Template) |
| **Mô tả**          | Quản trị viên chỉnh sửa nội dung mẫu kiểm tra đã có. |
| **Đối tượng**      | Quản trị viên (Admin) / Quản lý (Manager) |
| **Tiền điều kiện** | Mẫu kiểm tra đã tồn tại. |
| **Hậu điều kiện**  | Thành công: Mẫu kiểm tra được cập nhật. |
| **Luồng cơ bản**   | 1. Người dùng chọn một mẫu kiểm tra và nhấn **Sửa**.<br>2. Hệ thống hiển thị form với dữ liệu cũ.<br>3. Người dùng thay đổi thông tin (tên, thêm/xóa hạng mục).<br>4. Người dùng nhấn **Lưu**.<br>5. Hệ thống cập nhật dữ liệu. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Hệ thống báo lỗi nếu thiếu trường thông tin bắt buộc. |

---

## UC-81 – Xóa mẫu kiểm tra (Delete Inspection Template)

| **Mã Use case**    | UC-81 |
| ------------------ | ------ |
| **Tên Use case**   | Xóa mẫu kiểm tra (Delete Inspection Template) |
| **Mô tả**          | Quản trị viên xóa một mẫu kiểm tra không còn sử dụng. |
| **Đối tượng**      | Quản trị viên (Admin) / Quản lý (Manager) |
| **Tiền điều kiện** | Mẫu kiểm tra đã tồn tại và chưa được sử dụng trong phiếu công việc nào. |
| **Hậu điều kiện**  | Thành công: Mẫu kiểm tra bị xóa khỏi hệ thống. |
| **Luồng cơ bản**   | 1. Người dùng chọn một mẫu kiểm tra và nhấn **Xóa**.<br>2. Hệ thống yêu cầu xác nhận.<br>3. Người dùng xác nhận xóa.<br>4. Hệ thống xóa mẫu và cập nhật danh sách. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Nếu mẫu kiểm tra đã từng được sử dụng (ràng buộc khóa ngoại), hệ thống báo lỗi không thể xóa, chỉ có thể vô hiệu hóa. |

---
