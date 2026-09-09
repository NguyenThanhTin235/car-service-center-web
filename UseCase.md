# ĐẶC TẢ USE CASE – HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ

> **Phiên bản:** 1.8 – Baseline Tiểu luận chuyên ngành  
> **Cập nhật:** 2026-09-08

---

## MỤC LỤC

| Nhóm | UC ID | Số lượng |
|------|-------|----------|
| **Khách vãng lai (Guest)** | UC-01 → UC-03 | 3 use case |
| **Khách hàng (Customer)** | UC-04 → UC-13 | 10 use case |
| **Nhân viên quầy dịch vụ (Front Desk Staff)** | UC-14 → UC-19 | 6 use case |
| **Cố vấn dịch vụ (Service Advisor)** | UC-20 → UC-31 | 12 use case |
| **Quản lý dịch vụ (Service Manager)** | UC-32 → UC-38 | 7 use case |
| **Quản trị viên (Administrator)** | UC-39 → UC-45 | 7 use case |
| **Tổng cộng** | **UC-01 → UC-45** | **45 use case** |

---

# PHẦN 1 – KHÁCH VÃNG LAI (GUEST)

---

## UC-01 – Xem thông tin và danh mục dịch vụ (Browse Website)

| **Mã Use case**    | UC-01 |
| ------------------ | ------ |
| **Tên Use case**   | Xem thông tin và danh mục dịch vụ (Browse Website) |
| **Mô tả**          | Mọi người dùng kể cả chưa đăng nhập đều có thể xem thông tin công khai: trang chủ, danh mục và chi tiết các dịch vụ, bảng giá tham khảo và câu hỏi thường gặp (FAQ). |
| **Đối tượng**      | Khách vãng lai (Guest) / Khách hàng (Customer) |
| **Tiền điều kiện** | Không có. Người dùng truy cập trực tiếp từ trình duyệt. |
| **Hậu điều kiện**  | Thành công: Người dùng xem được thông tin công khai và danh mục dịch vụ mong muốn. |
| **Luồng cơ bản**   | 1. Người dùng truy cập địa chỉ website của trung tâm.<br>2. Hệ thống hiển thị trang chủ với thông tin giới thiệu, dịch vụ nổi bật và lời mời đặt lịch.<br>3. Người dùng vào trang **Dịch vụ** để xem danh mục phân theo nhóm (Sửa chữa, Bảo dưỡng, Rửa xe, Detailing).<br>4. Người dùng chọn một dịch vụ để xem chi tiết mô tả và giá tham khảo. |
| **Luồng thay thế** | **[Xem FAQ]** Tại bước 2, người dùng điều hướng đến trang **FAQ** thay vì trang **Dịch vụ**:<br>2a. Hệ thống hiển thị danh sách câu hỏi thường gặp và câu trả lời tương ứng. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-02 – Đăng ký tài khoản (Register)

| **Mã Use case**    | UC-02 |
| ------------------ | ------ |
| **Tên Use case**   | Đăng ký tài khoản (Register) |
| **Mô tả**          | Khách vãng lai tự tạo tài khoản mới trên hệ thống bằng cách cung cấp thông tin cá nhân và mật khẩu để có thể sử dụng các dịch vụ trực tuyến của trung tâm với tư cách Khách hàng. |
| **Đối tượng**      | Khách vãng lai (Guest) |
| **Tiền điều kiện** | Khách vãng lai chưa có tài khoản và có địa chỉ email hợp lệ chưa được đăng ký trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Tài khoản được tạo, khách hàng được tự động đăng nhập và chuyển đến trang chủ.<br>Thất bại: Hệ thống thông báo lỗi, tài khoản không được tạo. |
| **Luồng cơ bản**   | 1. Khách vãng lai truy cập trang đăng ký.<br>2. Khách vãng lai điền đầy đủ thông tin: họ tên, số điện thoại, địa chỉ email và mật khẩu.<br>3. Khách vãng lai nhấn nút **Đăng ký**.<br>4. Hệ thống kiểm tra email và số điện thoại chưa tồn tại trong hệ thống.<br>5. Hệ thống tạo tài khoản, tự động đăng nhập và chuyển khách hàng đến trang chủ. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu email hoặc số điện thoại đã tồn tại trong hệ thống, hệ thống hiển thị thông báo yêu cầu dùng thông tin khác. Use case quay lại bước 2. |

---

## UC-03 – Đăng nhập (Login)

| **Mã Use case**    | UC-03 |
| ------------------ | ------ |
| **Tên Use case**   | Đăng nhập (Login) |
| **Mô tả**          | Người dùng đăng nhập vào hệ thống bằng email và mật khẩu để truy cập các chức năng tương ứng với vai trò của mình. |
| **Đối tượng**      | Khách vãng lai (Guest) |
| **Tiền điều kiện** | Người dùng đã có tài khoản và chưa đăng nhập. |
| **Hậu điều kiện**  | Thành công: Phiên làm việc được mở, người dùng được chuyển đến trang chủ tương ứng với vai trò.<br>Thất bại: Hệ thống thông báo lỗi, phiên không được mở. |
| **Luồng cơ bản**   | 1. Người dùng truy cập trang đăng nhập.<br>2. Người dùng nhập địa chỉ email và mật khẩu.<br>3. Người dùng nhấn **Đăng nhập**.<br>4. Hệ thống xác thực thông tin và mở phiên làm việc.<br>5. Hệ thống chuyển người dùng đến trang chủ tương ứng với vai trò. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu email không tồn tại hoặc mật khẩu không đúng, hệ thống hiển thị thông báo lỗi xác thực. Use case quay lại bước 2. |

---

# PHẦN 2 – KHÁCH HÀNG (CUSTOMER)

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

## UC-05 – Đặt lại mật khẩu (Reset Password)

| **Mã Use case**    | UC-05 |
| ------------------ | ------ |
| **Tên Use case**   | Đặt lại mật khẩu (Reset Password) |
| **Mô tả**          | Khách hàng quên mật khẩu có thể yêu cầu đặt lại mật khẩu ngay tại trang đăng nhập. Hệ thống gửi mã xác thực OTP về địa chỉ email đã đăng ký để xác minh danh tính trước khi cho phép đặt mật khẩu mới. Chức năng này chỉ dành riêng cho Khách hàng; tài khoản nhân viên do Quản trị viên cấp và đặt lại mật khẩu thông qua UC-41. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng có tài khoản trong hệ thống và có quyền truy cập vào hộp thư email đã đăng ký. |
| **Hậu điều kiện**  | Thành công: Mật khẩu mới được cập nhật; khách hàng được chuyển đến trang đăng nhập.<br>Thất bại: Hệ thống thông báo lỗi, mật khẩu không thay đổi. |
| **Luồng cơ bản**   | 1. Tại trang đăng nhập, khách hàng chọn **Quên mật khẩu**.<br>2. Khách hàng nhập địa chỉ email đã đăng ký và nhấn **Gửi mã OTP**.<br>3. Hệ thống kiểm tra email tồn tại và gửi mã OTP có hiệu lực 5 phút về hộp thư email.<br>4. Khách hàng mở email và nhập mã OTP nhận được vào ô xác thực.<br>5. Khách hàng nhấn **Xác thực mã**.<br>6. Hệ thống xác minh mã OTP còn hiệu lực và cho phép đặt mật khẩu mới.<br>7. Khách hàng nhập mật khẩu mới và nhập lại để xác nhận.<br>8. Khách hàng nhấn **Xác nhận**.<br>9. Hệ thống cập nhật mật khẩu mới và chuyển khách hàng về trang đăng nhập. |
| **Luồng thay thế** | **[Gửi lại mã OTP]** Tại bước 4, nếu khách hàng chưa nhận được mã hoặc mã đã hết hiệu lực:<br>4a. Khách hàng chọn **Gửi lại mã**.<br>5a. Hệ thống gửi mã OTP mới và tính lại 5 phút hiệu lực.<br>6a. Khách hàng quay lại bước 4. |
| **Luồng ngoại lệ** | Tại bước 3, nếu email không tồn tại trong hệ thống, hệ thống hiển thị thông báo lỗi và yêu cầu nhập lại từ bước 2.<br>Tại bước 5, nếu mã OTP không đúng, hệ thống thông báo lỗi; khách hàng có thể thử lại hoặc chọn Gửi lại mã.<br>Tại bước 8, nếu mật khẩu mới và mật khẩu xác nhận không khớp, hệ thống thông báo lỗi và yêu cầu nhập lại từ bước 7. |

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

## UC-07 – Quản lý phương tiện (Manage Vehicles)

| **Mã Use case**    | UC-07 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý phương tiện (Manage Vehicles) |
| **Mô tả**          | Khách hàng thêm xe của mình vào hệ thống để sử dụng khi đặt lịch và theo dõi dịch vụ. Mỗi khách hàng có thể quản lý nhiều xe. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Xe mới được thêm vào danh sách phương tiện của khách hàng.<br>Thất bại: Hệ thống thông báo lỗi, xe không được thêm. |
| **Luồng cơ bản**   | 1. Khách hàng vào mục **Phương tiện của tôi** và chọn **Thêm xe**.<br>2. Khách hàng nhập thông tin xe: biển số, hãng xe, dòng xe, năm sản xuất, màu sắc và kích thước xe.<br>3. Khách hàng nhấn **Lưu**.<br>4. Hệ thống kiểm tra biển số chưa tồn tại trong hệ thống.<br>5. Hệ thống lưu xe mới và hiển thị trong danh sách phương tiện. |
| **Luồng thay thế** | **[Cập nhật thông tin xe]** Tại bước 1, thay vì chọn **Thêm xe**, khách hàng chọn xe đã có:<br>1a. Khách hàng chọn xe cần chỉnh sửa từ danh sách.<br>2a. Khách hàng nhấn **Chỉnh sửa**.<br>3a. Khách hàng thay đổi thông tin cần cập nhật.<br>4a. Khách hàng nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới và hiển thị thông báo thành công.<br><br>**[Vô hiệu hóa xe]** Tại bước 1, khách hàng chọn xe cần vô hiệu hóa:<br>1b. Khách hàng chọn xe từ danh sách.<br>2b. Khách hàng nhấn **Vô hiệu hóa**.<br>3b. Hệ thống yêu cầu xác nhận; khách hàng nhấn **Xác nhận**.<br>4b. Hệ thống kiểm tra xe không có phiếu công việc đang hoạt động.<br>5b. Hệ thống chuyển trạng thái xe sang Không hoạt động; lịch sử dịch vụ vẫn được giữ lại. |
| **Luồng ngoại lệ** | Tại bước 4, nếu biển số đã tồn tại trong hệ thống, hệ thống thông báo xe đã được đăng ký và yêu cầu kiểm tra lại. Use case quay lại bước 2.<br><br>Tại bước 4b của luồng Vô hiệu hóa, nếu xe đang có phiếu công việc chưa hoàn thành, hệ thống thông báo không thể vô hiệu hóa và yêu cầu hoàn tất dịch vụ trước. |

---

## UC-08 – Quản lý lịch hẹn (Manage Appointments)

| **Mã Use case**    | UC-08 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý lịch hẹn (Manage Appointments) |
| **Mô tả**          | Khách hàng tự đặt lịch hẹn đưa xe đến trung tâm, xem lại các lịch đã đặt, dời lịch hoặc hủy lịch khi cần thiết. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Khách hàng đã đăng nhập và có ít nhất một xe trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Lịch hẹn mới được tạo ở trạng thái **Đã gửi yêu cầu**, chờ nhân viên xác nhận.<br>Thất bại: Hệ thống thông báo lỗi, lịch hẹn không được tạo. |
| **Luồng cơ bản**   | 1. Khách hàng vào mục **Lịch hẹn** và chọn **Đặt lịch mới**.<br>2. Khách hàng chọn xe, loại dịch vụ mong muốn, ngày giờ đến và ghi chú thêm nếu có.<br>3. Khách hàng nhấn **Xác nhận đặt lịch**.<br>4. Hệ thống tạo lịch hẹn ở trạng thái **Đã gửi yêu cầu** và hiển thị thông báo đặt lịch thành công. |
| **Luồng thay thế** | **[Dời lịch]** Tại bước 1, thay vì chọn **Đặt lịch mới**, khách hàng chọn lịch hẹn đã có:<br>1a. Khách hàng chọn lịch hẹn cần dời từ danh sách.<br>2a. Khách hàng nhấn **Dời lịch**.<br>3a. Khách hàng chọn ngày giờ mới.<br>4a. Khách hàng nhấn **Xác nhận**.<br>5a. Hệ thống cập nhật lịch hẹn với thời gian mới và thông báo thành công.<br><br>**[Hủy lịch]** Tại bước 1, khách hàng chọn lịch hẹn cần hủy:<br>1b. Khách hàng chọn lịch hẹn từ danh sách.<br>2b. Khách hàng nhấn **Hủy lịch**.<br>3b. Khách hàng nhập lý do hủy.<br>4b. Khách hàng nhấn **Xác nhận**.<br>5b. Hệ thống cập nhật trạng thái lịch thành **Đã hủy** và ghi lý do. |
| **Luồng ngoại lệ** | Tại bước 2a của luồng Dời lịch hoặc bước 2b của luồng Hủy lịch, nếu xe đã đến trung tâm hoặc lịch hẹn đã được xử lý, hệ thống thông báo không thể thay đổi và không cho phép thực hiện. |

---

## UC-09 – Xác nhận tiếp nhận xe (Confirm Vehicle Check-in)

| **Mã Use case**    | UC-09 |
| ------------------ | ------ |
| **Tên Use case**   | Xác nhận tiếp nhận xe (Confirm Vehicle Check-in) |
| **Mô tả**          | Sau khi nhân viên ghi nhận tình trạng xe khi tiếp nhận, khách hàng xem lại thông tin và xác nhận đồng ý với nội dung đã ghi (tình trạng xe, hạng mục yêu cầu xử lý, tài sản trong xe). |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Xe đã đến trung tâm và nhân viên đã hoàn tất ghi nhận thông tin tiếp nhận, đang chờ khách hàng xác nhận. |
| **Hậu điều kiện**  | Thành công: Hệ thống ghi lại người xác nhận, thời điểm xác nhận và khóa nội dung tiếp nhận. |
| **Luồng cơ bản**   | 1. Hệ thống gửi thông báo cho khách hàng rằng xe đã được tiếp nhận và cần xác nhận.<br>2. Khách hàng mở thông báo hoặc vào mục **Theo dõi tiến độ**, chọn **Xem chi tiết tiếp nhận**.<br>3. Hệ thống hiển thị thông tin tình trạng xe: đồng hồ km, mức xăng, nội dung phàn nàn, tài sản trong xe và hình ảnh minh chứng.<br>4. Khách hàng đọc kỹ nội dung và nhấn **Xác nhận**.<br>5. Hệ thống ghi lại thời điểm và tên khách hàng xác nhận, khóa nội dung tiếp nhận. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-10 – Theo dõi tiến độ sửa chữa (Track Repair Progress)

| **Mã Use case**    | UC-10 |
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

## UC-11 – Phản hồi báo giá (Respond to Quotation)

| **Mã Use case**    | UC-11 |
| ------------------ | ------ |
| **Tên Use case**   | Phản hồi báo giá (Respond to Quotation) |
| **Mô tả**          | Khi nhân viên gửi báo giá, khách hàng xem chi tiết các hạng mục và chi phí, sau đó quyết định đồng ý (Duyệt) hoặc từ chối (Từ chối). Báo giá đã được duyệt sẽ bị khóa. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Nhân viên tư vấn dịch vụ đã gửi báo giá và đang chờ khách hàng phản hồi. |
| **Hậu điều kiện**  | Thành công – Duyệt: Báo giá được khóa, nhân viên có thể bắt đầu thực hiện công việc.<br>Thành công – Từ chối: Báo giá bị từ chối, nhân viên được thông báo để điều chỉnh. |
| **Luồng cơ bản**   | 1. Hệ thống gửi thông báo cho khách hàng có báo giá mới đang chờ phản hồi.<br>2. Khách hàng vào mục **Báo giá** và chọn báo giá cần xem.<br>3. Hệ thống hiển thị danh sách hạng mục (công việc, nhân công, phụ tùng, vật tư), chi phí từng hạng mục và tổng tiền.<br>4. Khách hàng đọc kỹ và nhấn **Duyệt** để đồng ý.<br>5. Hệ thống khóa báo giá, lưu snapshot đơn giá tại thời điểm duyệt và thông báo cho nhân viên. |
| **Luồng thay thế** | **[Từ chối báo giá]** Tại bước 4, thay vì nhấn **Duyệt**:<br>4a. Khách hàng nhấn **Từ chối**.<br>5a. Khách hàng ghi lý do từ chối (không bắt buộc).<br>6a. Khách hàng nhấn **Xác nhận**.<br>7a. Hệ thống cập nhật trạng thái báo giá thành **Từ chối**.<br>8a. Hệ thống thông báo cho nhân viên tư vấn để điều chỉnh lại. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-12 – Xem hóa đơn (View Invoice)

| **Mã Use case**    | UC-12 |
| ------------------ | ------ |
| **Tên Use case**   | Xem hóa đơn (View Invoice) |
| **Mô tả**          | Khách hàng xem hóa đơn của phiếu công việc để biết số tiền cần thanh toán, kiểm tra chi tiết các hạng mục và trạng thái đã thanh toán hay chưa. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Phiếu công việc của khách hàng đã có hóa đơn được phát hành. |
| **Hậu điều kiện**  | Thành công: Khách hàng xem được chi tiết hóa đơn và trạng thái thanh toán. |
| **Luồng cơ bản**   | 1. Khách hàng vào mục **Hóa đơn** hoặc từ trang **Theo dõi tiến độ** chọn **Xem hóa đơn**.<br>2. Hệ thống hiển thị danh sách hạng mục hóa đơn (dịch vụ, nhân công, phụ tùng, phí), tổng tiền và trạng thái thanh toán (**Chưa thanh toán** hoặc **Đã thanh toán**).<br>3. Khách hàng xem thông tin chi tiết và có thể tải xuống hóa đơn dưới dạng PDF. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-13 – Xác nhận nhận xe (Confirm Vehicle Release)

| **Mã Use case**    | UC-13 |
| ------------------ | ------ |
| **Tên Use case**   | Xác nhận nhận xe (Confirm Vehicle Release) |
| **Mô tả**          | Khách hàng xác nhận đã nhận lại xe sau khi trung tâm hoàn thành dịch vụ và thanh toán. Khách hàng cũng có thể xem lại toàn bộ lịch sử dịch vụ của từng xe. |
| **Đối tượng**      | Khách hàng (Customer) |
| **Tiền điều kiện** | Với Xác nhận nhận xe: Nhân viên đã thực hiện bàn giao xe, hóa đơn đã được thanh toán đầy đủ.<br>Với Xem lịch sử: Xe đã từng có phiếu công việc hoàn thành. |
| **Hậu điều kiện**  | Thành công – Nhận xe: Hệ thống ghi nhận thời điểm bàn giao, lịch sử dịch vụ được cập nhật.<br>Thành công – Lịch sử: Khách hàng xem được danh sách các lần sửa chữa và bảo dưỡng. |
| **Luồng cơ bản**   | 1. Hệ thống gửi thông báo cho khách hàng rằng xe đã sẵn sàng để nhận.<br>2. Khách hàng đến nhận xe và mở thông báo hoặc vào mục **Theo dõi tiến độ**.<br>3. Khách hàng nhấn **Xác nhận đã nhận xe**.<br>4. Hệ thống ghi lại thời điểm bàn giao và cập nhật lịch sử dịch vụ của xe. |
| **Luồng thay thế** | **[Xem lịch sử dịch vụ]** Thay cho luồng cơ bản, khi khách hàng muốn xem lại lịch sử xe:<br>1a. Khách hàng vào mục **Phương tiện của tôi**.<br>2a. Khách hàng chọn xe cần xem.<br>3a. Khách hàng chọn **Lịch sử dịch vụ**.<br>4a. Hệ thống hiển thị danh sách các lần dịch vụ đã hoàn thành: ngày thực hiện, hạng mục, phụ tùng đã thay và tổng chi phí. |
| **Luồng ngoại lệ** | Không có. |

---

# PHẦN 3 – NHÂN VIÊN QUẦY DỊCH VỤ (FRONT DESK STAFF)

---

## UC-14 – Quản lý lịch hẹn (Manage Appointments)

| **Mã Use case**    | UC-14 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý lịch hẹn (Manage Appointments) |
| **Mô tả**          | Nhân viên quầy tạo lịch hẹn thay cho khách hàng khi khách gọi điện hoặc đến trực tiếp, xác nhận lịch đã gửi, dời lịch hoặc hủy lịch theo yêu cầu. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Nhân viên đã đăng nhập. Khách hàng và xe đã tồn tại hoặc được tạo mới trong hệ thống (UC-16). |
| **Hậu điều kiện**  | Thành công: Lịch hẹn mới được tạo ở trạng thái **Đã gửi yêu cầu**.<br>Thất bại: Hệ thống thông báo lỗi, lịch hẹn không được tạo. |
| **Luồng cơ bản**   | 1. Nhân viên vào mục **Lịch hẹn** và chọn **Tạo lịch mới**.<br>2. Nhân viên tìm và chọn khách hàng, chọn xe và loại dịch vụ mong muốn.<br>3. Nhân viên chọn ngày giờ đến và ghi chú thêm nếu có.<br>4. Nhân viên nhấn **Lưu**.<br>5. Hệ thống tạo lịch hẹn ở trạng thái **Đã gửi yêu cầu**. |
| **Luồng thay thế** | **[Xác nhận lịch hẹn]** Tại bước 1, thay vì chọn **Tạo lịch mới**, nhân viên chọn lịch đang chờ xác nhận:<br>1a. Nhân viên chọn lịch hẹn ở trạng thái **Đã gửi yêu cầu** từ danh sách.<br>2a. Nhân viên kiểm tra thông tin lịch hẹn.<br>3a. Nhân viên nhấn **Xác nhận**.<br>4a. Hệ thống cập nhật trạng thái thành **Đã xác nhận**.<br><br>**[Dời lịch]** Tại bước 1, nhân viên chọn lịch hẹn cần dời:<br>1b. Nhân viên chọn lịch hẹn từ danh sách.<br>2b. Nhân viên nhấn **Dời lịch**.<br>3b. Nhân viên chọn ngày giờ mới.<br>4b. Nhân viên nhấn **Xác nhận**.<br>5b. Hệ thống cập nhật lịch hẹn với thời gian mới.<br><br>**[Hủy lịch]** Tại bước 1, nhân viên chọn lịch hẹn cần hủy:<br>1c. Nhân viên chọn lịch hẹn từ danh sách.<br>2c. Nhân viên nhấn **Hủy lịch**.<br>3c. Nhân viên nhập lý do hủy.<br>4c. Nhân viên nhấn **Xác nhận**.<br>5c. Hệ thống cập nhật trạng thái thành **Đã hủy** và lưu lý do. |
| **Luồng ngoại lệ** | Tại bước 2b của luồng Dời lịch hoặc bước 2c của luồng Hủy lịch, nếu lịch hẹn đã ở trạng thái xe đã đến hoặc đã hủy, hệ thống thông báo không thể thay đổi. |

---

## UC-15 – Tiếp nhận xe (Receive Vehicle)

| **Mã Use case**    | UC-15 |
| ------------------ | ------ |
| **Tên Use case**   | Tiếp nhận xe (Receive Vehicle) |
| **Mô tả**          | Nhân viên quầy đánh dấu khách có lịch hẹn đã đến, hoặc tạo phiếu tiếp nhận cho khách đến không có lịch (Walk-in) và xe được kéo đến (Tow-in). Mọi xe sau tiếp nhận đều vào hàng đợi để Cố vấn dịch vụ xử lý. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Với Đánh dấu đã đến: Lịch hẹn đã ở trạng thái **Đã xác nhận**.<br>Với Walk-in / Tow-in: Khách hàng và xe đã có hoặc được tạo mới trong hệ thống. |
| **Hậu điều kiện**  | Thành công: Xe được đưa vào hàng đợi tiếp nhận, sẵn sàng để Cố vấn dịch vụ tạo phiếu công việc.<br>Thất bại: Hệ thống thông báo lỗi, xe không được tiếp nhận. |
| **Luồng cơ bản**   | 1. Nhân viên tìm lịch hẹn của khách trong danh sách **Lịch hẹn hôm nay**.<br>2. Nhân viên chọn đúng lịch hẹn của khách hàng vừa đến.<br>3. Nhân viên nhấn **Đánh dấu đã đến**.<br>4. Hệ thống cập nhật trạng thái lịch hẹn thành **Đã đến** và đưa xe vào hàng đợi tiếp nhận. |
| **Luồng thay thế** | **[Tiếp nhận Walk-in]** Tại bước 1, thay vì tìm lịch hẹn, nhân viên tiếp nhận khách không có lịch:<br>1a. Nhân viên chọn **Tiếp nhận Walk-in**.<br>2a. Nhân viên tìm hoặc tạo mới khách hàng và xe (UC-16).<br>3a. Nhân viên ghi nhận thời điểm đến và nhu cầu dịch vụ.<br>4a. Nhân viên nhấn **Lưu**.<br>5a. Hệ thống tạo phiếu tiếp nhận và đưa xe vào hàng đợi.<br><br>**[Tiếp nhận Tow-in]** Tại bước 1, nhân viên tiếp nhận xe kéo đến:<br>1b. Nhân viên chọn **Tiếp nhận Tow-in**.<br>2b. Nhân viên tìm hoặc tạo mới khách hàng và xe.<br>3b. Nhân viên nhập thời điểm đến và tên người / đơn vị bàn giao xe.<br>4b. Nhân viên nhấn **Lưu**.<br>5b. Hệ thống tạo phiếu tiếp nhận và đưa xe vào hàng đợi. |
| **Luồng ngoại lệ** | Tại bước 3 của luồng cơ bản, nếu lịch hẹn chưa được xác nhận, hệ thống thông báo và yêu cầu xác nhận lịch trước (UC-14). |

---

## UC-16 – Quản lý hồ sơ khách hàng (Manage Customer Profile)

| **Mã Use case**    | UC-16 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý hồ sơ khách hàng (Manage Customer Profile) |
| **Mô tả**          | Nhân viên quầy tìm kiếm, thêm mới hoặc cập nhật thông tin khách hàng và xe khi tiếp nhận trực tiếp, đảm bảo không tạo trùng dữ liệu. |
| **Đối tượng**      | Nhân viên quầy dịch vụ (Front Desk Staff) |
| **Tiền điều kiện** | Nhân viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Khách hàng mới được tạo thành công.<br>Thất bại: Hệ thống thông báo lỗi (ví dụ: số điện thoại đã tồn tại). |
| **Luồng cơ bản**   | 1. Nhân viên nhập số điện thoại, email hoặc biển số xe vào ô tìm kiếm để kiểm tra dữ liệu đã có.<br>2. Hệ thống không tìm thấy kết quả trùng; nhân viên chọn **Tạo khách hàng mới**.<br>3. Nhân viên điền đầy đủ thông tin khách hàng: họ tên, số điện thoại, địa chỉ email.<br>4. Nhân viên nhấn **Lưu**.<br>5. Hệ thống kiểm tra không trùng số điện thoại / email và lưu khách hàng mới. |
| **Luồng thay thế** | **[Thêm xe mới cho khách hàng]** Sau bước 5, hoặc khi đã chọn được khách hàng từ kết quả tìm kiếm:<br>5a. Nhân viên chọn **Thêm xe** cho khách hàng vừa tạo / vừa chọn.<br>6a. Nhân viên nhập biển số, hãng xe, dòng xe và các thông tin cần thiết.<br>7a. Nhân viên nhấn **Lưu**.<br>8a. Hệ thống kiểm tra biển số chưa tồn tại và lưu xe mới.<br><br>**[Cập nhật thông tin]** Tại bước 1, nếu tìm thấy khách hàng / xe đã có:<br>1a. Nhân viên chọn khách hàng / xe từ kết quả tìm kiếm.<br>2a. Nhân viên chọn **Chỉnh sửa**.<br>3a. Nhân viên thay đổi thông tin cần cập nhật.<br>4a. Nhân viên nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới và hiển thị thông báo thành công. |
| **Luồng ngoại lệ** | Tại bước 5, nếu số điện thoại hoặc email đã tồn tại, hệ thống thông báo và gợi ý dùng thông tin có sẵn thay vì tạo mới.<br><br>Tại bước 8a của luồng Thêm xe, nếu biển số đã tồn tại, hệ thống thông báo xe đã được đăng ký và yêu cầu kiểm tra lại. |

---

## UC-17 – Xem phiếu công việc (View Work Order)

| **Mã Use case**    | UC-17 |
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

## UC-18 – Xử lý hóa đơn (Process Invoice)

| **Mã Use case**    | UC-18 |
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

## UC-19 – Xử lý thanh toán (Process Payment)

| **Mã Use case**    | UC-19 |
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

## UC-20 – Tạo phiếu công việc (Create Work Order)

| **Mã Use case**    | UC-20 |
| ------------------ | ------ |
| **Tên Use case**   | Tạo phiếu công việc (Create Work Order) |
| **Mô tả**          | Cố vấn dịch vụ xem danh sách xe đang chờ xử lý và tạo phiếu công việc – hồ sơ trung tâm theo dõi toàn bộ quá trình sửa chữa / bảo dưỡng – cho từng xe trong hàng đợi. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Xe đã được nhân viên quầy đưa vào hàng đợi tiếp nhận (từ lịch hẹn đã đến, Walk-in hoặc Tow-in). |
| **Hậu điều kiện**  | Thành công: Phiếu công việc được tạo và liên kết với xe, khách hàng và nguồn tiếp nhận tương ứng.<br>Thất bại: Hệ thống thông báo lỗi, phiếu không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn vào mục **Hàng đợi tiếp nhận** và xem danh sách xe đang chờ.<br>2. Cố vấn chọn một xe trong danh sách.<br>3. Cố vấn nhấn **Tạo phiếu công việc**.<br>4. Hệ thống tạo phiếu công việc mới và liên kết với khách hàng, xe và nguồn tiếp nhận (lịch hẹn / Walk-in / Tow-in). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 3, nếu thông tin tiếp nhận không đầy đủ (thiếu khách hàng, thiếu xe hoặc thiếu nguồn tiếp nhận hợp lệ), hệ thống không cho phép tạo phiếu và thông báo thông tin còn thiếu. |

---

## UC-21 – Ghi nhận tình trạng xe (Record Vehicle Condition)

| **Mã Use case**    | UC-21 |
| ------------------ | ------ |
| **Tên Use case**   | Ghi nhận tình trạng xe (Record Vehicle Condition) |
| **Mô tả**          | Cố vấn dịch vụ ghi lại tình trạng xe tại thời điểm tiếp nhận: đồng hồ km, mức xăng, vấn đề khách phản ánh, tài sản để trong xe, hư hỏng hiển nhiên quan sát được và hình ảnh minh chứng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-20). |
| **Hậu điều kiện**  | Thành công: Thông tin tiếp nhận được lưu và khách hàng được thông báo để xác nhận (UC-09).<br>Thất bại: Hệ thống thông báo lỗi nếu thiếu thông tin bắt buộc. |
| **Luồng cơ bản**   | 1. Cố vấn mở phiếu công việc và chọn **Ghi nhận tình trạng xe**.<br>2. Cố vấn điền thông tin bắt buộc: số km hiện tại, mức xăng, nội dung phàn nàn / yêu cầu của khách và tình trạng xe quan sát bên ngoài.<br>3. Cố vấn ghi thêm tài sản trong xe nếu có.<br>4. Cố vấn chụp hoặc đính kèm hình ảnh minh chứng tình trạng xe.<br>5. Cố vấn nhấn **Lưu**.<br>6. Hệ thống lưu thông tin và gửi thông báo xác nhận cho khách hàng (UC-09). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 5, nếu thiếu thông tin bắt buộc (km, xăng, phàn nàn hoặc tình trạng xe), hệ thống từ chối lưu và hiển thị các trường còn thiếu. |

---

## UC-22 – Quản lý dịch vụ (Manage Services)

| **Mã Use case**    | UC-22 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý dịch vụ (Manage Services) |
| **Mô tả**          | Cố vấn dịch vụ thêm một hoặc nhiều dịch vụ vào phiếu công việc dựa trên nhu cầu của khách hàng và kết quả kiểm tra xe, áp dụng mẫu dịch vụ có sẵn hoặc điều chỉnh chi tiết cho phù hợp. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-20). |
| **Hậu điều kiện**  | Thành công: Dịch vụ được thêm vào phiếu công việc và sẵn sàng để lên kế hoạch công việc.<br>Thất bại: Hệ thống thông báo lỗi, dịch vụ không được thêm. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Thêm dịch vụ**.<br>2. Hệ thống hiển thị danh mục dịch vụ đang hoạt động.<br>3. Cố vấn chọn loại dịch vụ và áp dụng mẫu dịch vụ có sẵn nếu phù hợp.<br>4. Cố vấn điều chỉnh thêm chi tiết nếu cần.<br>5. Cố vấn nhấn **Lưu**.<br>6. Hệ thống thêm dịch vụ vào phiếu công việc. |
| **Luồng thay thế** | **[Chỉnh sửa dịch vụ]** Tại bước 1, thay vì chọn **Thêm dịch vụ**, cố vấn chọn dịch vụ đã có:<br>1a. Cố vấn chọn dịch vụ cần chỉnh sửa trong danh sách.<br>2a. Cố vấn nhấn **Chỉnh sửa**.<br>3a. Cố vấn thay đổi chi tiết cần cập nhật.<br>4a. Cố vấn nhấn **Lưu**.<br>5a. Hệ thống cập nhật thông tin dịch vụ.<br><br>**[Xóa dịch vụ]** Tại bước 1, cố vấn chọn dịch vụ cần xóa:<br>1b. Cố vấn chọn dịch vụ từ danh sách.<br>2b. Cố vấn nhấn **Xóa**.<br>3b. Hệ thống yêu cầu xác nhận; cố vấn nhấn **Xác nhận**.<br>4b. Hệ thống xóa dịch vụ khỏi phiếu công việc. |
| **Luồng ngoại lệ** | Tại bước 3b của luồng Xóa, nếu dịch vụ đã có job đang thực hiện hoặc đã hoàn thành, hệ thống từ chối và thông báo không thể xóa. |

---

## UC-23 – Kiểm tra xe (Inspect Vehicle)

| **Mã Use case**    | UC-23 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm tra xe (Inspect Vehicle) |
| **Mô tả**          | Cố vấn dịch vụ mở giao diện kiểm tra xe (Vehicle Inspection), chọn loại dấu vết (Damage / Rust / Missing / Dent / Scratch,...) và nhấp chọn trực tiếp trên hình ảnh sơ đồ thân xe (Car Diagram UI) để đặt marker tại vị trí phát hiện hư hỏng (ví dụ: Driver side - Front door, Driver side - Front bumper,...). Hệ thống tự động ghi nhận vị trí và tạo dòng vấn đề phát hiện (Finding / Issue) tương ứng, cho phép cố vấn ghi chú, đính kèm hình ảnh và liên kết với công việc (Job). |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-20). Cố vấn đã ghi nhận tình trạng tiếp nhận xe (UC-21). Xe đang ở trong xưởng, chưa thực hiện sửa chữa. |
| **Hậu điều kiện**  | Thành công: Danh sách các vấn đề phát hiện (Finding) kèm vị trí marker trên sơ đồ xe được lưu vào phiếu công việc, sẵn sàng để lên kế hoạch tạo Job xử lý.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn mở mục **Kiểm tra xe (Vehicle Inspection)** trong phiếu công việc.<br>2. Hệ thống hiển thị sơ đồ 2D mô phỏng hình ảnh thân xe (Front, Rear, Left, Right) và thanh công cụ chứa các loại marker (Damage, Rust, Missing, Dent, Scratch,...).<br>3. Cố vấn chọn một loại marker trên thanh công cụ và nhấp chuột vào bộ phận tương ứng trên sơ đồ xe (ví dụ: nhấp chọn Driver side - Front door).<br>4. Hệ thống đặt đánh dấu (marker) lên sơ đồ xe tại vị trí vừa nhấp và tự động tạo một dòng thông tin phát hiện (Finding).<br>5. Cố vấn nhập thêm ghi chú chi tiết và đính kèm hình ảnh thực tế (Photo) cho Finding nếu có.<br>6. Cố vấn nhấn **Lưu kết quả kiểm tra**.<br>7. Hệ thống lưu toàn bộ danh sách Finding và vị trí các marker trên sơ đồ xe vào phiếu công việc. |
| **Luồng thay thế** | **[Xóa vấn đề phát hiện / Marker]** Tại bước 4, cố vấn muốn xóa một Finding không chính xác:<br>4a. Cố vấn nhấp biểu tượng xóa (X) tại dòng Finding tương ứng trong bảng hoặc nhấp trực tiếp vào marker trên sơ đồ xe.<br>5a. Hệ thống kiểm tra: nếu Finding chưa được liên kết với Job nào, hệ thống xóa dòng Finding và gỡ bỏ marker khỏi sơ đồ xe.<br><br>**[Chỉnh sửa ghi chú / Đổi ảnh Finding]** Tại bước 5, cố vấn nhấp vào ô Note để sửa nội dung ghi chú hoặc tải lên hình ảnh minh chứng khác. |
| **Luồng ngoại lệ** | Tại bước 5a của luồng Xóa, nếu Finding đã được liên kết với một Job, hệ thống từ chối xóa và hiển thị thông báo yêu cầu hủy liên kết Job trước. |

---

## UC-24 – Lên kế hoạch công việc (Plan Jobs)

| **Mã Use case**    | UC-24 |
| ------------------ | ------ |
| **Tên Use case**   | Lên kế hoạch công việc (Plan Jobs) |
| **Mô tả**          | Cố vấn dịch vụ tạo các job (đầu công việc) cần thực hiện trong phiếu công việc. Hệ thống hỗ trợ tạo Job trực tiếp từ một Finding phát hiện khi kiểm tra xe (nhấn nút **+ New Job** tại dòng Finding), gán Finding vào Job đã có từ danh sách chọn (Select a job...), sinh Job từ mẫu dịch vụ (Service Template) hoặc tạo Job thủ công không qua Finding. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã được tạo (UC-20) và có ít nhất một dịch vụ (UC-22). |
| **Hậu điều kiện**  | Thành công: Job mới được tạo, lưu trong phiếu công việc và được liên kết trực tiếp với Finding/dịch vụ tương ứng.<br>Thất bại: Hệ thống thông báo lỗi, job không được tạo. |
| **Luồng cơ bản**   | **[Tạo Job trực tiếp từ Finding]**<br>1. Cố vấn vào màn hình kiểm tra xe hoặc danh sách Finding của phiếu công việc.<br>2. Tại bảng danh sách Finding, cố vấn tìm đến dòng Finding cần xử lý và nhấn nút thêm Job.<br>3. Hệ thống hiển thị cửa sổ hộp thoại **Tạo công việc (Create Dispatch Jobs)**.<br>4. Cố vấn điền thông tin chung cho Job: Tên job, Loại job (Type), Kỹ thuật viên đảm nhận (Technician) và Mô tả công việc.<br>5. Cố vấn nhấn **Lưu (Save)**.<br>6. Hệ thống khởi tạo Job mới với mã tự động (ví dụ: `JOB26090001`), lưu thông tin nhân công / phụ tùng đã khai báo, đồng thời cập nhật mã Job này vào ô `Job No.` của dòng Finding tương ứng để xác nhận liên kết. |
| **Luồng thay thế** | **[Tạo job từ mẫu dịch vụ]** Tại màn hình danh sách Job của phiếu:<br>1b. Cố vấn chọn một dịch vụ (ví dụ: Bảo dưỡng 10.000 km) và nhấn **Sinh job từ mẫu**.<br>2b. Hệ thống tự động sinh danh sách các Job mặc định kèm nhân công và phụ tùng theo mẫu đã cấu hình.<br>3b. Cố vấn kiểm tra, chỉnh sửa nếu cần và nhấn **Xác nhận**.<br><br>**[Tạo job thủ công độc lập (không từ Finding)]** Tại màn hình danh sách Job:<br>1c. Cố vấn chọn **Thêm job thủ công**.<br>2c. Cố vấn nhập tên, loại job, nhân công, phụ tùng và không chọn liên kết với Finding nào.<br>3c. Cố vấn nhấn **Lưu**.<br><br>**[Chỉnh sửa / Xóa job]**:<br>1d. Cố vấn chọn Job từ danh sách để xem/chỉnh sửa thông tin ở các tab hoặc nhấn **Xóa** (nếu Job chưa thực hiện/chưa xuất kho). |
| **Luồng ngoại lệ** | Tại bước 1d của luồng Xóa, nếu Job đã có phụ tùng được xuất kho hoặc đã bắt đầu thực hiện, hệ thống từ chối xóa và hiển thị lý do cụ thể. |

---

## UC-25 – Khai báo nhân công (Declare Labour)

| **Mã Use case**    | UC-25 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo nhân công (Declare Labour) |
| **Mô tả**          | Cố vấn dịch vụ khai báo các labour lines cho từng job: loại nhân công, mô tả chi tiết task cần thực hiện, kỹ thuật viên đảm nhận và số lượng giờ / đơn vị ước tính. Thông tin này được dùng để tính chi phí nhân công trong báo giá. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Job đã được tạo trong phiếu công việc (UC-24). |
| **Hậu điều kiện**  | Thành công: Labour line được ghi nhận và liên kết với job, sẵn sàng tính vào báo giá.<br>Thất bại: Hệ thống thông báo lỗi, labour line không được tạo. |
| **Luồng cơ bản**   | 1. Cố vấn mở một job và chọn **Thêm nhân công**.<br>2. Hệ thống hiển thị danh mục loại nhân công đã được cấu hình (UC-42).<br>3. Cố vấn chọn loại nhân công và nhập mô tả chi tiết task cần thực hiện.<br>4. Cố vấn chọn kỹ thuật viên thực hiện từ danh sách nhân viên đang hoạt động.<br>5. Cố vấn nhập số lượng giờ / đơn vị ước tính.<br>6. Cố vấn nhấn **Lưu**.<br>7. Hệ thống ghi nhận labour line và tự động tính chi phí nhân công theo đơn giá đã cấu hình. |
| **Luồng thay thế** | **[Chỉnh sửa labour line]** Tại bước 1, thay vì chọn **Thêm nhân công**, cố vấn chọn dòng đã có:<br>1a. Cố vấn chọn labour line cần chỉnh sửa từ danh sách.<br>2a. Cố vấn nhấn **Chỉnh sửa**.<br>3a. Cố vấn thay đổi loại nhân công, mô tả, kỹ thuật viên hoặc số lượng giờ.<br>4a. Cố vấn nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới và tính lại chi phí nhân công.<br><br>**[Xóa labour line]** Tại bước 1, cố vấn chọn dòng cần xóa:<br>1b. Cố vấn chọn labour line cần xóa từ danh sách.<br>2b. Cố vấn nhấn **Xóa** và xác nhận.<br>3b. Hệ thống xóa labour line khỏi job. |
| **Luồng ngoại lệ** | Tại bước 3b của luồng Xóa, nếu báo giá đã được khách hàng duyệt, hệ thống không cho phép xóa và yêu cầu tạo báo giá bổ sung để điều chỉnh (UC-27). |

---

## UC-26 – Khai báo phụ tùng (Declare Parts)

| **Mã Use case**    | UC-26 |
| ------------------ | ------ |
| **Tên Use case**   | Khai báo phụ tùng (Declare Parts) |
| **Mô tả**          | Cố vấn dịch vụ khai báo danh sách phụ tùng và vật tư dự kiến cần dùng cho từng job. Sau khi thực hiện xong, cố vấn cập nhật số lượng thực tế đã sử dụng để truy vết chi phí. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Job đã được tạo trong phiếu công việc (UC-24). |
| **Hậu điều kiện**  | Thành công: Danh sách phụ tùng / vật tư được lưu theo từng job và có thể truy vết.<br>Thất bại: Hệ thống thông báo lỗi, dữ liệu không được lưu. |
| **Luồng cơ bản**   | 1. Cố vấn mở một job và chọn **Thêm phụ tùng / vật tư**.<br>2. Cố vấn tìm kiếm mặt hàng từ danh mục kho và chọn phụ tùng / vật tư cần dùng.<br>3. Cố vấn nhập số lượng dự kiến cần sử dụng.<br>4. Cố vấn nhấn **Lưu**.<br>5. Hệ thống ghi nhận phụ tùng / vật tư và số lượng kế hoạch cho job. |
| **Luồng thay thế** | **[Cập nhật số lượng thực tế]** Sau khi job hoàn thành (UC-28), tại bước 1:<br>1a. Cố vấn mở job đã hoàn thành.<br>2a. Cố vấn chọn phụ tùng cần cập nhật số lượng thực tế.<br>3a. Cố vấn nhấn **Cập nhật số lượng thực tế**.<br>4a. Cố vấn nhập số lượng thực tế đã sử dụng.<br>5a. Cố vấn nhấn **Lưu**.<br>6a. Hệ thống ghi nhận số lượng thực tế.<br><br>**[Xóa phụ tùng / vật tư]** Tại bước 1, cố vấn chọn xóa mặt hàng không còn cần thiết:<br>1b. Cố vấn mở job có phụ tùng cần xóa.<br>2b. Cố vấn chọn dòng phụ tùng cần xóa.<br>3b. Cố vấn nhấn **Xóa** và xác nhận.<br>4b. Hệ thống xóa dòng đó khỏi danh sách job. |
| **Luồng ngoại lệ** | Tại bước 4b của luồng Xóa, nếu phụ tùng đã được xuất kho cho job, hệ thống từ chối xóa và yêu cầu thực hiện nhập trả kho trước (UC-35). |

---

## UC-27 – Quản lý báo giá (Manage Quotation)

| **Mã Use case**    | UC-27 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý báo giá (Manage Quotation) |
| **Mô tả**          | Cố vấn dịch vụ tính tổng chi phí rồi tạo báo giá gửi khách hàng xem xét. Khi khách duyệt, báo giá được khóa lại. Nếu phát sinh thêm hạng mục, cố vấn tạo báo giá bổ sung. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Phiếu công việc đã có đầy đủ job, labour và phụ tùng / vật tư. |
| **Hậu điều kiện**  | Thành công – Gửi: Báo giá được tạo và gửi đến khách hàng, chờ phản hồi.<br>Thành công – Duyệt: Báo giá được khóa và snapshot đơn giá được lưu lại. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Tạo báo giá**.<br>2. Hệ thống tự động tổng hợp chi phí: nhân công theo đơn giá và số giờ, phụ tùng / vật tư và phí phụ trợ, tổng cộng trước / sau thuế.<br>3. Cố vấn kiểm tra các dòng chi phí và điều chỉnh nếu cần.<br>4. Cố vấn nhấn **Gửi báo giá**.<br>5. Hệ thống gửi thông báo cho khách hàng xem và phản hồi (UC-11).<br>6. Khi khách hàng Duyệt, hệ thống khóa báo giá và lưu snapshot đơn giá tại thời điểm đó. |
| **Luồng thay thế** | **[Báo giá bị từ chối – Tạo lại]** Sau bước 6, nếu khách hàng Từ chối báo giá (UC-11):<br>6a. Cố vấn nhận thông báo báo giá bị từ chối.<br>7a. Cố vấn vào phiếu công việc và điều chỉnh lại các hạng mục (thêm, sửa, xóa).<br>8a. Cố vấn nhấn **Gửi báo giá** để tạo và gửi báo giá mới.<br>9a. Hệ thống gửi thông báo cho khách hàng xem và phản hồi lại (UC-11).<br><br>**[Tạo báo giá bổ sung]** Tại bước 1, khi phát sinh thêm hạng mục sau khi báo giá gốc đã được duyệt:<br>1a. Cố vấn chọn **Tạo báo giá bổ sung** trong phiếu công việc.<br>2a. Cố vấn thêm các hạng mục mới vào báo giá bổ sung.<br>3a. Cố vấn nhấn **Gửi báo giá bổ sung**.<br>4a. Hệ thống gửi thông báo cho khách hàng xem và phản hồi (UC-11). |
| **Luồng ngoại lệ** | Không có. |

---

## UC-28 – Thực hiện công việc (Execute Job)

| **Mã Use case**    | UC-28 |
| ------------------ | ------ |
| **Tên Use case**   | Thực hiện công việc (Execute Job) |
| **Mô tả**          | Sau khi báo giá được duyệt và phụ tùng sẵn sàng, kỹ thuật viên được phân công bắt đầu thực hiện job, ghi lại kết quả và số lượng phụ tùng thực tế đã dùng khi hoàn thành. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đã được khách hàng duyệt. Phụ tùng cần thiết đã được xuất kho cho job (UC-35). |
| **Hậu điều kiện**  | Thành công: Job chuyển sang trạng thái **Hoàn thành**, sẵn sàng cho bước kiểm định chất lượng.<br>Thất bại: Hệ thống thông báo lỗi, trạng thái không thay đổi. |
| **Luồng cơ bản**   | 1. Cố vấn / kỹ thuật viên mở job được phân công và nhấn **Bắt đầu thực hiện**.<br>2. Hệ thống ghi lại thời điểm bắt đầu và cập nhật trạng thái job thành **Đang thực hiện**.<br>3. Kỹ thuật viên thực hiện công việc trên xe.<br>4. Sau khi xong, cố vấn ghi lại kết quả thực hiện và cập nhật số lượng phụ tùng thực tế đã sử dụng.<br>5. Cố vấn nhấn **Đánh dấu hoàn thành**.<br>6. Hệ thống cập nhật trạng thái job thành **Hoàn thành**. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 1, nếu báo giá chưa được duyệt hoặc phụ tùng chưa sẵn sàng, hệ thống không cho phép bắt đầu và hiển thị lý do cụ thể. |

---

## UC-29 – Kiểm định chất lượng (Quality Inspection)

| **Mã Use case**    | UC-29 |
| ------------------ | ------ |
| **Tên Use case**   | Kiểm định chất lượng (Quality Inspection) |
| **Mô tả**          | Sau khi các job hoàn thành, cố vấn dịch vụ thực hiện kiểm định chất lượng theo danh sách hạng mục. Nếu đạt, dịch vụ được đánh dấu hoàn thành. Nếu không đạt, cố vấn tạo job sửa lại và thực hiện lại trước khi kiểm định lần nữa. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Toàn bộ job trong dịch vụ đã ở trạng thái **Hoàn thành**. |
| **Hậu điều kiện**  | Thành công – Đạt: Dịch vụ được đánh dấu hoàn thành, sẵn sàng cho bước tiếp theo.<br>Thành công – Không đạt: Job sửa lại được tạo để xử lý vấn đề phát sinh. |
| **Luồng cơ bản**   | 1. Cố vấn vào mục **Kiểm định chất lượng** của dịch vụ.<br>2. Cố vấn đi qua từng hạng mục kiểm định theo danh sách mẫu và đánh dấu **Đạt** hoặc **Không đạt**.<br>3. Cố vấn nhấn **Xác nhận kết quả kiểm định**.<br>4. Hệ thống ghi nhận toàn bộ hạng mục đều Đạt và đánh dấu dịch vụ hoàn thành. |
| **Luồng thay thế** | **[Kiểm định không đạt]** Tại bước 3, khi có ít nhất một hạng mục Không đạt:<br>3a. Cố vấn nhấn **Xác nhận kết quả kiểm định** với ghi nhận hạng mục không đạt.<br>4a. Cố vấn mô tả chi tiết vấn đề cần sửa lại.<br>5a. Cố vấn nhấn **Tạo job sửa lại**.<br>6a. Hệ thống tạo job Rework và liên kết với hạng mục không đạt.<br>7a. Cố vấn thực hiện lại từ UC-28 cho job Rework.<br>8a. Sau khi Rework hoàn thành, cố vấn quay lại bước 1 để kiểm định lại. |
| **Luồng ngoại lệ** | Tại bước 3, hệ thống không cho phép xác nhận nếu còn hạng mục chưa được đánh giá. |

---

## UC-30 – Gửi yêu cầu thanh toán (Request Payment)

| **Mã Use case**    | UC-30 |
| ------------------ | ------ |
| **Tên Use case**   | Gửi yêu cầu thanh toán (Request Payment) |
| **Mô tả**          | Sau khi toàn bộ job hoàn thành và kiểm định đạt, cố vấn dịch vụ gửi yêu cầu thanh toán sang nhân viên quầy để tạo hóa đơn cho khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Tất cả job đã **Hoàn thành**, kiểm định chất lượng đã **Đạt** và báo giá đã được khách hàng duyệt. |
| **Hậu điều kiện**  | Thành công: Yêu cầu thanh toán được gửi đến nhân viên quầy và đang chờ xử lý hóa đơn (UC-18).<br>Thất bại: Hệ thống từ chối và thông báo điều kiện còn thiếu. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Gửi yêu cầu thanh toán**.<br>2. Hệ thống tự động kiểm tra: toàn bộ job bắt buộc đã hoàn thành, kiểm định đạt và báo giá đã được duyệt.<br>3. Nếu đủ điều kiện, hệ thống gửi thông báo và chuyển dữ liệu sang nhân viên quầy. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu còn job chưa hoàn thành, kiểm định chưa đạt hoặc báo giá chưa được duyệt, hệ thống từ chối và hiển thị danh sách điều kiện còn thiếu. |

---

## UC-31 – Bàn giao xe (Release Vehicle)

| **Mã Use case**    | UC-31 |
| ------------------ | ------ |
| **Tên Use case**   | Bàn giao xe (Release Vehicle) |
| **Mô tả**          | Cố vấn dịch vụ kiểm tra toàn bộ điều kiện bàn giao (job xong, kiểm định đạt, hóa đơn đã thanh toán) và thực hiện thủ tục bàn giao xe chính thức cho khách hàng. |
| **Đối tượng**      | Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Tất cả job đã hoàn thành, kiểm định chất lượng đạt và hóa đơn đã được thanh toán đầy đủ (hệ thống đã tự động xác nhận qua UC-19). |
| **Hậu điều kiện**  | Thành công: Xe được bàn giao, phiếu công việc chuyển sang trạng thái **Đã bàn giao** và khách hàng nhận thông báo.<br>Thất bại: Hệ thống từ chối nếu chưa đủ điều kiện. |
| **Luồng cơ bản**   | 1. Cố vấn vào phiếu công việc và chọn **Bàn giao xe**.<br>2. Hệ thống tự động kiểm tra: job hoàn thành, kiểm định đạt và hóa đơn đã thanh toán.<br>3. Nếu đủ điều kiện, cố vấn ghi chú bàn giao nếu cần.<br>4. Cố vấn nhấn **Xác nhận bàn giao**.<br>5. Hệ thống cập nhật trạng thái phiếu thành **Đã bàn giao** và gửi thông báo cho khách hàng (UC-13). |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 2, nếu bất kỳ điều kiện nào chưa đạt, hệ thống không cho phép bàn giao và hiển thị danh sách điều kiện còn thiếu cụ thể. |

---

# PHẦN 5 – QUẢN LÝ DỊCH VỤ (SERVICE MANAGER)

---

## UC-32 – Theo dõi hoạt động xưởng (Monitor Workshop)

| **Mã Use case**    | UC-32 |
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

## UC-33 – Quản lý danh mục phụ tùng (Manage Parts Catalog)

| **Mã Use case**    | UC-33 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý danh mục phụ tùng (Manage Parts Catalog) |
| **Mô tả**          | Quản lý thêm mới, chỉnh sửa và vô hiệu hóa các mặt hàng phụ tùng và vật tư trong kho: mã SKU, tên, loại hàng, đơn vị tính, giá vốn và giá bán. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Mặt hàng mới được thêm vào danh mục.<br>Thất bại: Hệ thống thông báo lỗi (ví dụ: mã SKU đã tồn tại). |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Danh mục phụ tùng** và chọn **Thêm mặt hàng mới**.<br>2. Quản lý điền đầy đủ thông tin: mã SKU, tên hàng, loại (Phụ tùng / Tiêu hao / Hóa chất / Phụ kiện), đơn vị tính, giá vốn và giá bán.<br>3. Quản lý nhấn **Lưu**.<br>4. Hệ thống kiểm tra mã SKU chưa tồn tại và lưu mặt hàng mới vào danh mục. |
| **Luồng thay thế** | **[Cập nhật thông tin mặt hàng]** Tại bước 1, thay vì chọn **Thêm mặt hàng mới**:<br>1a. Quản lý tìm kiếm mặt hàng cần cập nhật.<br>2a. Quản lý chọn mặt hàng và nhấn **Chỉnh sửa**.<br>3a. Quản lý thay đổi thông tin cần cập nhật.<br>4a. Quản lý nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới.<br><br>**[Vô hiệu hóa mặt hàng]** Tại bước 1, quản lý chọn mặt hàng cần vô hiệu hóa:<br>1b. Quản lý tìm kiếm và chọn mặt hàng.<br>2b. Quản lý nhấn **Vô hiệu hóa**.<br>3b. Hệ thống yêu cầu xác nhận; quản lý nhấn **Xác nhận**.<br>4b. Hệ thống chuyển trạng thái mặt hàng sang Không hoạt động; lịch sử giao dịch được giữ lại. |
| **Luồng ngoại lệ** | Tại bước 4, nếu mã SKU đã tồn tại, hệ thống thông báo trùng mã và yêu cầu dùng mã khác. |

---

## UC-34 – Nhập kho (Receive Inventory)

| **Mã Use case**    | UC-34 |
| ------------------ | ------ |
| **Tên Use case**   | Nhập kho (Receive Inventory) |
| **Mô tả**          | Quản lý ghi nhận hàng nhập từ nhà cung cấp hoặc nhập tồn đầu kỳ. Sau mỗi lần nhập, hệ thống tự động tính lại giá vốn bình quân theo phương pháp bình quân gia quyền di động. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Mặt hàng đã có trong danh mục (UC-33). Nhà cung cấp đã được đăng ký nếu nhập từ nhà cung cấp. |
| **Hậu điều kiện**  | Thành công: Số lượng tồn kho tăng, giá vốn bình quân được tính lại và phiếu nhập kho được lưu lại.<br>Thất bại: Hệ thống thông báo lỗi, tồn kho không thay đổi. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Nhập kho** và chọn **Tạo phiếu nhập**.<br>2. Quản lý chọn nhà cung cấp và ngày nhập hàng.<br>3. Quản lý thêm từng mặt hàng: chọn tên hàng, nhập số lượng nhận và đơn giá mua vào.<br>4. Quản lý nhấn **Xác nhận nhập kho**.<br>5. Hệ thống tăng số lượng tồn kho, tự động tính lại giá vốn bình quân và ghi phiếu nhập. |
| **Luồng thay thế** | **[Nhập tồn đầu kỳ]** Tại bước 1, thay vì chọn **Tạo phiếu nhập** thông thường:<br>1a. Quản lý chọn **Nhập tồn đầu kỳ**.<br>2a. Quản lý chọn từng mặt hàng cần nhập tồn ban đầu.<br>3a. Quản lý nhập số lượng và giá vốn ban đầu cho từng mặt hàng.<br>4a. Quản lý nhấn **Xác nhận nhập tồn**.<br>5a. Hệ thống ghi nhận tồn kho ban đầu và thiết lập giá vốn. |
| **Luồng ngoại lệ** | Tại bước 4, nếu thiếu thông tin bắt buộc (nhà cung cấp, ngày, mặt hàng hoặc số lượng), hệ thống từ chối và hiển thị các trường cần bổ sung. |

---

## UC-35 – Xuất kho theo công việc (Issue Stock by Job)

| **Mã Use case**    | UC-35 |
| ------------------ | ------ |
| **Tên Use case**   | Xuất kho theo công việc (Issue Stock by Job) |
| **Mô tả**          | Quản lý xuất phụ tùng / vật tư từ kho cho một job cụ thể và nhập trả lại phụ tùng chưa sử dụng sau khi job hoàn thành. Mọi thao tác đều được ghi lại lịch sử kho gắn với job tương ứng. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Với Xuất kho: Job đã có danh sách phụ tùng kế hoạch; tồn kho đủ số lượng cần xuất.<br>Với Nhập trả: Phụ tùng đã được xuất cho job và có số lượng chưa dùng cần trả lại. |
| **Hậu điều kiện**  | Thành công – Xuất: Tồn kho giảm đúng số lượng, lịch sử xuất kho được ghi theo job.<br>Thành công – Nhập trả: Tồn kho tăng lại theo đơn giá xuất gốc, lịch sử nhập trả được ghi lại. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Xuất kho** và tìm job cần xuất phụ tùng.<br>2. Quản lý chọn job từ danh sách.<br>3. Hệ thống hiển thị danh sách phụ tùng / vật tư theo kế hoạch của job.<br>4. Quản lý xác nhận số lượng cần xuất cho từng mặt hàng.<br>5. Quản lý nhấn **Xuất kho**.<br>6. Hệ thống kiểm tra tồn kho đủ, giảm số lượng tồn và ghi phiếu xuất gắn với job. |
| **Luồng thay thế** | **[Nhập trả phụ tùng từ job]** Tại bước 1, thay vì vào mục **Xuất kho**:<br>1a. Quản lý vào mục **Nhập trả**.<br>2a. Quản lý tìm và chọn job cần trả phụ tùng.<br>3a. Hệ thống hiển thị danh sách phụ tùng đã xuất cho job.<br>4a. Quản lý nhập số lượng chưa sử dụng cần trả lại cho từng mặt hàng.<br>5a. Quản lý nhấn **Nhập trả**.<br>6a. Hệ thống tăng tồn kho theo đơn giá xuất gốc và ghi phiếu nhập trả. |
| **Luồng ngoại lệ** | Tại bước 5 (Xuất kho), nếu tồn kho không đủ số lượng cần xuất, hệ thống thông báo và không thực hiện xuất.<br><br>Tại bước 5a của luồng Nhập trả, nếu số lượng trả vượt số đã xuất chưa dùng, hệ thống từ chối và yêu cầu nhập lại. |

---

## UC-36 – Phê duyệt điều chỉnh tồn kho (Approve Inventory Adjustment)

| **Mã Use case**    | UC-36 |
| ------------------ | ------ |
| **Tên Use case**   | Phê duyệt điều chỉnh tồn kho (Approve Inventory Adjustment) |
| **Mô tả**          | Khi phát sinh chênh lệch tồn kho cần điều chỉnh (ví dụ: hàng hỏng, kiểm kê lệch), quản lý xem xét và phê duyệt phiếu điều chỉnh. Tồn kho chỉ được cập nhật sau khi phiếu được duyệt. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Có phiếu điều chỉnh tồn kho đang chờ phê duyệt. |
| **Hậu điều kiện**  | Thành công – Duyệt: Tồn kho được điều chỉnh và lịch sử điều chỉnh được ghi lại.<br>Thành công – Từ chối: Phiếu bị từ chối, tồn kho không thay đổi. |
| **Luồng cơ bản**   | 1. Quản lý vào mục **Điều chỉnh tồn kho** và xem danh sách phiếu đang chờ duyệt.<br>2. Quản lý chọn một phiếu và xem chi tiết: mặt hàng, số lượng điều chỉnh, lý do và người thực hiện.<br>3. Quản lý nhấn **Phê duyệt**.<br>4. Hệ thống cập nhật tồn kho và ghi lịch sử điều chỉnh kèm thông tin người duyệt. |
| **Luồng thay thế** | **[Từ chối phiếu điều chỉnh]** Tại bước 3, thay vì nhấn **Phê duyệt**:<br>3a. Quản lý nhấn **Từ chối**.<br>4a. Quản lý nhập lý do từ chối.<br>5a. Quản lý nhấn **Xác nhận**.<br>6a. Hệ thống ghi nhận lý do và không thay đổi tồn kho. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-37 – Đóng phiếu công việc (Close Work Order)

| **Mã Use case**    | UC-37 |
| ------------------ | ------ |
| **Tên Use case**   | Đóng phiếu công việc (Close Work Order) |
| **Mô tả**          | Sau khi xe đã được bàn giao và mọi điều kiện đạt, quản lý đóng phiếu công việc để hoàn tất hồ sơ, đồng thời kích hoạt cập nhật lịch sử dịch vụ của xe. |
| **Đối tượng**      | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Xe đã được bàn giao (UC-31), không còn job hoặc job sửa lại nào đang mở và hóa đơn đã được thanh toán. |
| **Hậu điều kiện**  | Thành công: Phiếu công việc chuyển sang trạng thái **Đã đóng**, lịch sử dịch vụ của xe được cập nhật đầy đủ.<br>Thất bại: Hệ thống từ chối nếu chưa đủ điều kiện đóng. |
| **Luồng cơ bản**   | 1. Quản lý vào danh sách phiếu đang chờ đóng.<br>2. Quản lý chọn phiếu cần đóng và xem tóm tắt điều kiện.<br>3. Quản lý nhấn **Đóng phiếu công việc**.<br>4. Hệ thống kiểm tra: xe đã bàn giao, không còn job mở, hóa đơn đã thanh toán.<br>5. Hệ thống đóng phiếu và cập nhật lịch sử dịch vụ của xe. |
| **Luồng thay thế** | Không có. |
| **Luồng ngoại lệ** | Tại bước 4, nếu còn job chưa hoàn thành hoặc hóa đơn chưa thanh toán, hệ thống từ chối và hiển thị danh sách điều kiện còn thiếu. |

---

## UC-38 – Xem báo cáo vận hành (View Operational Report)

| **Mã Use case**    | UC-38 |
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

## UC-39 – Quản lý tài khoản (Manage Accounts)

| **Mã Use case**    | UC-39 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý tài khoản (Manage Accounts) |
| **Mô tả**          | Quản trị viên tạo tài khoản cho nhân viên, gán vai trò và khóa / mở khóa tài khoản khi cần. Quyền truy cập của mỗi tài khoản được kiểm soát theo vai trò được gán. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Tài khoản nhân viên mới được tạo với vai trò tương ứng.<br>Thất bại: Hệ thống thông báo lỗi, tài khoản không được tạo. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Quản lý người dùng** và chọn **Tạo tài khoản mới**.<br>2. Quản trị viên điền thông tin nhân viên: họ tên, email và mật khẩu tạm thời.<br>3. Quản trị viên chọn vai trò cho tài khoản (Nhân viên quầy / Cố vấn dịch vụ / Quản lý / Quản trị viên).<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống tạo tài khoản và thiết lập quyền truy cập theo vai trò đã chọn. |
| **Luồng thay thế** | **[Gán / Thay đổi vai trò]** Tại bước 1, thay vì chọn **Tạo tài khoản mới**:<br>1a. Quản trị viên tìm kiếm tài khoản cần thay đổi vai trò.<br>2a. Quản trị viên chọn tài khoản và nhấn **Chỉnh sửa vai trò**.<br>3a. Quản trị viên chọn vai trò mới.<br>4a. Quản trị viên nhấn **Lưu**.<br>5a. Hệ thống cập nhật quyền truy cập ngay lập tức.<br><br>**[Khóa tài khoản]** Tại bước 1, quản trị viên chọn tài khoản cần khóa:<br>1b. Quản trị viên tìm kiếm tài khoản cần khóa.<br>2b. Quản trị viên chọn tài khoản và nhấn **Khóa**.<br>3b. Hệ thống yêu cầu xác nhận; quản trị viên nhấn **Xác nhận**.<br>4b. Hệ thống vô hiệu hóa quyền đăng nhập của tài khoản đó.<br><br>**[Mở khóa tài khoản]** Tại bước 1, quản trị viên chọn tài khoản đang bị khóa:<br>1c. Quản trị viên tìm kiếm tài khoản đang bị khóa.<br>2c. Quản trị viên chọn tài khoản và nhấn **Mở khóa**.<br>3c. Hệ thống yêu cầu xác nhận; quản trị viên nhấn **Xác nhận**.<br>4c. Hệ thống khôi phục quyền đăng nhập cho tài khoản. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-40 – Quản lý nhân viên (Manage Employees)

| **Mã Use case**    | UC-40 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý nhân viên (Manage Employees) |
| **Mô tả**          | Quản trị viên thêm và cập nhật thông tin nhân viên trong hệ thống (kỹ thuật viên, nhân viên detailing, nhân viên kiểm định,...) và kỹ năng chuyên môn của họ để phục vụ khai báo nhân công. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Thông tin nhân viên mới được thêm vào hệ thống. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Quản lý nhân viên** và chọn **Thêm nhân viên**.<br>2. Quản trị viên điền thông tin: họ tên, vị trí công việc (kỹ thuật viên / nhân viên detailing / nhân viên kiểm định).<br>3. Quản trị viên chọn các kỹ năng chuyên môn từ danh sách.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống lưu thông tin nhân viên và danh sách kỹ năng. |
| **Luồng thay thế** | **[Cập nhật thông tin]** Tại bước 1, thay vì chọn **Thêm nhân viên**:<br>1a. Quản trị viên tìm kiếm nhân viên cần cập nhật.<br>2a. Quản trị viên chọn nhân viên và nhấn **Chỉnh sửa**.<br>3a. Quản trị viên thay đổi thông tin hoặc kỹ năng cần cập nhật.<br>4a. Quản trị viên nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới.<br><br>**[Đặt lại mật khẩu nhân viên]** Tại bước 1, quản trị viên chọn nhân viên cần đặt lại mật khẩu:<br>1b. Quản trị viên tìm kiếm và chọn nhân viên cần đặt lại mật khẩu.<br>2b. Quản trị viên nhấn **Đặt lại mật khẩu**.<br>3b. Hệ thống hiển thị hộp xác nhận; quản trị viên nhấn **Xác nhận**.<br>4b. Hệ thống tạo mật khẩu tạm thời và gửi về email của nhân viên.<br>5b. Nhân viên nhận email chứa mật khẩu tạm thời và đăng nhập để tiếp tục làm việc.<br><br>**[Vô hiệu hóa nhân viên]** Tại bước 1, quản trị viên chọn nhân viên cần vô hiệu hóa:<br>1c. Quản trị viên tìm kiếm và chọn nhân viên.<br>2c. Quản trị viên nhấn **Vô hiệu hóa**.<br>3c. Hệ thống yêu cầu xác nhận; quản trị viên nhấn **Xác nhận**.<br>4c. Hệ thống chuyển nhân viên sang trạng thái Không hoạt động; lịch sử công việc được giữ lại. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-41 – Quản lý danh mục dịch vụ (Manage Service Catalog)

| **Mã Use case**    | UC-41 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý danh mục dịch vụ (Manage Service Catalog) |
| **Mô tả**          | Quản trị viên tạo và quản lý các nhóm dịch vụ và các mẫu dịch vụ cụ thể. Chỉ mẫu dịch vụ đang hoạt động mới hiển thị cho khách hàng và được dùng khi tạo phiếu công việc. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Mẫu dịch vụ mới được tạo và hiển thị trong danh mục. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Danh mục dịch vụ** và chọn **Thêm mẫu dịch vụ mới**.<br>2. Quản trị viên chọn nhóm dịch vụ phù hợp (Sửa chữa / Bảo dưỡng / Rửa xe / Detailing).<br>3. Quản trị viên điền thông tin mẫu dịch vụ: tên, mô tả, chính sách tính giá và trạng thái Hoạt động.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống lưu mẫu dịch vụ mới và hiển thị trong danh mục. |
| **Luồng thay thế** | **[Cập nhật mẫu dịch vụ]** Tại bước 1, thay vì chọn **Thêm mẫu dịch vụ mới**:<br>1a. Quản trị viên tìm kiếm mẫu dịch vụ cần cập nhật.<br>2a. Quản trị viên chọn mẫu và nhấn **Chỉnh sửa**.<br>3a. Quản trị viên thay đổi thông tin cần thiết.<br>4a. Quản trị viên nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới.<br><br>**[Vô hiệu hóa mẫu dịch vụ]** Tại bước 1, quản trị viên chọn mẫu cần vô hiệu hóa:<br>1b. Quản trị viên tìm kiếm và chọn mẫu dịch vụ.<br>2b. Quản trị viên nhấn **Vô hiệu hóa**.<br>3b. Hệ thống yêu cầu xác nhận; quản trị viên nhấn **Xác nhận**.<br>4b. Hệ thống chuyển mẫu sang trạng thái Không hoạt động; các phiếu công việc đang dùng mẫu này không bị ảnh hưởng. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-42 – Cấu hình loại công việc (Configure Job Types)

| **Mã Use case**    | UC-42 |
| ------------------ | ------ |
| **Tên Use case**   | Cấu hình loại công việc (Configure Job Types) |
| **Mô tả**          | Quản trị viên định nghĩa các loại công việc, tạo mẫu job mặc định bao gồm thời gian ước tính và phụ tùng cần dùng, đồng thời thiết lập đơn giá nhân công theo giờ cho từng loại. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Loại công việc mới được tạo với đơn giá nhân công tương ứng. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Cấu hình công việc** và chọn **Thêm loại công việc**.<br>2. Quản trị viên nhập tên loại công việc, mô tả và đơn giá nhân công theo giờ.<br>3. Quản trị viên nhấn **Lưu**.<br>4. Hệ thống lưu loại công việc mới. |
| **Luồng thay thế** | **[Thêm mẫu job]** Sau bước 4, hoặc từ loại công việc đã có:<br>4a. Quản trị viên chọn loại công việc cần thêm mẫu.<br>5a. Quản trị viên nhấn **Thêm mẫu job**.<br>6a. Quản trị viên nhập thời gian dự kiến và danh sách phụ tùng / vật tư mặc định.<br>7a. Quản trị viên nhấn **Lưu**.<br>8a. Hệ thống lưu mẫu job và liên kết với loại công việc.<br><br>**[Cập nhật loại công việc / mẫu]** Tại bước 1, thay vì chọn **Thêm loại công việc**:<br>1a. Quản trị viên tìm kiếm loại công việc hoặc mẫu cần cập nhật.<br>2a. Quản trị viên chọn và nhấn **Chỉnh sửa**.<br>3a. Quản trị viên thay đổi thông tin cần thiết.<br>4a. Quản trị viên nhấn **Lưu**.<br>5a. Hệ thống lưu thông tin mới.<br><br>**[Vô hiệu hóa loại công việc]** Tại bước 1, quản trị viên chọn loại cần vô hiệu hóa:<br>1b. Quản trị viên tìm kiếm và chọn loại công việc.<br>2b. Quản trị viên nhấn **Vô hiệu hóa** và xác nhận.<br>3b. Hệ thống chuyển sang trạng thái Không hoạt động. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-43 – Quản lý chính sách tính giá (Manage Pricing Policies)

| **Mã Use case**    | UC-43 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý chính sách tính giá (Manage Pricing Policies) |
| **Mô tả**          | Quản trị viên thiết lập và cập nhật các chính sách tính giá cho từng loại dịch vụ: giá trọn gói cố định, giá theo kích thước xe hoặc tính theo nhân công và phụ tùng thực tế. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập. Danh mục dịch vụ (UC-41) và loại công việc (UC-42) đã được cấu hình. |
| **Hậu điều kiện**  | Thành công: Chính sách giá mới được thiết lập và áp dụng khi tính báo giá. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Chính sách tính giá** và chọn **Thêm chính sách**.<br>2. Quản trị viên chọn dịch vụ áp dụng và hình thức tính giá (Trọn gói cố định / Theo kích thước xe / Theo nhân công và phụ tùng).<br>3. Quản trị viên nhập các mức giá tương ứng.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống lưu chính sách giá và áp dụng khi tạo báo giá. |
| **Luồng thay thế** | **[Cập nhật chính sách giá]** Tại bước 1, thay vì chọn **Thêm chính sách**:<br>1a. Quản trị viên tìm kiếm chính sách giá cần cập nhật.<br>2a. Quản trị viên chọn chính sách và nhấn **Chỉnh sửa**.<br>3a. Quản trị viên thay đổi mức giá hoặc hình thức tính.<br>4a. Quản trị viên nhấn **Lưu**.<br>5a. Hệ thống lưu chính sách mới; chỉ áp dụng cho báo giá tạo sau thời điểm cập nhật, các báo giá đã duyệt không bị ảnh hưởng.<br><br>**[Vô hiệu hóa chính sách]** Tại bước 1, quản trị viên chọn chính sách cần vô hiệu hóa:<br>1b. Quản trị viên tìm kiếm và chọn chính sách giá.<br>2b. Quản trị viên nhấn **Vô hiệu hóa** và xác nhận.<br>3b. Hệ thống chuyển chính sách sang trạng thái Không hoạt động. |
| **Luồng ngoại lệ** | Không có. |

---

## UC-44 – Quản lý mẫu kiểm tra (Manage Inspection Templates)

| **Mã Use case**    | UC-44 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý mẫu kiểm tra (Manage Inspection Templates) |
| **Mô tả**          | Quản trị viên tạo và quản lý danh sách hạng mục kiểm tra xe ban đầu (khi tiếp nhận – UC-23) và hạng mục kiểm định chất lượng (sau khi hoàn thành job – UC-29) theo từng loại dịch vụ. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập. Danh mục dịch vụ đã được cấu hình (UC-41). |
| **Hậu điều kiện**  | Thành công: Mẫu kiểm tra mới được tạo và áp dụng cho dịch vụ tương ứng. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Mẫu kiểm tra** và chọn **Tạo mẫu mới**.<br>2. Quản trị viên chọn loại mẫu (Kiểm tra ban đầu / Kiểm định chất lượng) và dịch vụ áp dụng.<br>3. Quản trị viên thêm từng hạng mục: nhập tên, xác định có bắt buộc không và thứ tự hiển thị.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống lưu mẫu và áp dụng cho dịch vụ tương ứng. |
| **Luồng thay thế** | **[Cập nhật hạng mục]** Tại bước 3, thay vì thêm hạng mục mới, quản trị viên chọn hạng mục đã có:<br>3a. Quản trị viên chọn hạng mục cần cập nhật từ danh sách.<br>4a. Quản trị viên nhấn **Chỉnh sửa**.<br>5a. Quản trị viên thay đổi tên, tính bắt buộc hoặc thứ tự hiển thị.<br>6a. Quản trị viên nhấn **Lưu**.<br>7a. Hệ thống lưu thay đổi.<br><br>**[Xóa hạng mục]** Tại bước 3, quản trị viên chọn xóa hạng mục không còn phù hợp:<br>3b. Quản trị viên chọn hạng mục cần xóa.<br>4b. Quản trị viên nhấn **Xóa** và xác nhận.<br>5b. Hệ thống xóa hạng mục nếu mẫu chưa được dùng trong giao dịch đang hoạt động. |
| **Luồng ngoại lệ** | Tại bước 5b của luồng Xóa, nếu hạng mục đang được tham chiếu bởi phiếu kiểm tra đang hoạt động, hệ thống thông báo không thể xóa. |

---

## UC-45 – Quản lý danh mục (Manage System Catalog)

| **Mã Use case**    | UC-45 |
| ------------------ | ------ |
| **Tên Use case**   | Quản lý danh mục (Manage System Catalog) |
| **Mô tả**          | Quản trị viên quản lý các danh mục dùng chung trong toàn hệ thống: đơn vị tính (chiếc, lít, hộp,...), lý do hủy lịch / điều chỉnh kho và điều khoản dịch vụ. |
| **Đối tượng**      | Quản trị viên (Administrator) |
| **Tiền điều kiện** | Quản trị viên đã đăng nhập vào hệ thống. |
| **Hậu điều kiện**  | Thành công: Mục danh mục mới được thêm và có thể dùng ngay trong hệ thống. |
| **Luồng cơ bản**   | 1. Quản trị viên vào mục **Danh mục hệ thống**.<br>2. Quản trị viên chọn loại danh mục cần quản lý (Đơn vị tính / Lý do / Điều khoản).<br>3. Quản trị viên chọn **Thêm mới**, nhập tên và mô tả cho mục danh mục.<br>4. Quản trị viên nhấn **Lưu**.<br>5. Hệ thống lưu mục mới và hiển thị trong danh sách tương ứng. |
| **Luồng thay thế** | **[Cập nhật mục danh mục]** Tại bước 3, thay vì chọn **Thêm mới**:<br>3a. Quản trị viên chọn mục cần cập nhật từ danh sách.<br>4a. Quản trị viên nhấn **Chỉnh sửa**.<br>5a. Quản trị viên thay đổi tên và mô tả.<br>6a. Quản trị viên nhấn **Lưu**.<br>7a. Hệ thống lưu thông tin mới.<br><br>**[Vô hiệu hóa mục danh mục]** Tại bước 3, quản trị viên chọn mục cần vô hiệu hóa:<br>3b. Quản trị viên chọn mục từ danh sách.<br>4b. Quản trị viên nhấn **Vô hiệu hóa** và xác nhận.<br>5b. Hệ thống chuyển mục sang trạng thái Không hoạt động; dữ liệu lịch sử tham chiếu vẫn được giữ nguyên. |
| **Luồng ngoại lệ** | Không có. |

---

*Hết tài liệu đặc tả Use Case – Phiên bản 1.8*
