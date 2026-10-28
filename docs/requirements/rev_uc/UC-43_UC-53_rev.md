# Điều chỉnh Đặc tả Use Case - UC-43 & UC-53

> **Tài liệu:** Bổ sung và chuẩn hóa đặc tả nghiệp vụ  
> **Áp dụng cho:** Quản lý dịch vụ (Service Manager)  
> **Vị trí lưu trữ:** docs/requirements/rev_uc/UC-43_UC-53_rev.md  
> **Ghi chú nghiệp vụ:** Tài liệu này hoàn toàn sử dụng văn phong nghiệp vụ quản lý xưởng dịch vụ ô tô, không sử dụng thuật ngữ kỹ thuật phần mềm hay mã lệnh.

---

## 1. Bối cảnh và Lý do điều chỉnh

Trong quá trình vận hành xưởng dịch vụ ô tô, Quản lý xưởng cần theo dõi liên tục tiến độ thực tế của từng chiếc xe trong xưởng để kịp thời điều phối nhân lực và giải quyết điểm nghẽn (UC-43). Đồng thời, định kỳ Quản lý cần tra cứu các chỉ số vận hành then chốt về doanh thu, dịch vụ phổ biến và phụ tùng sắp hết để ra quyết định nhập hàng và kinh doanh (UC-53).

Đặc tả gốc ban đầu còn khái quát, chưa nêu rõ các trường hợp xưởng vắng xe, chưa quy định các chỉ số tóm tắt trực quan và chưa chi tiết hóa nội dung của từng dạng báo cáo. Bản điều chỉnh này bổ sung đầy đủ các kịch bản thực tế để hoàn thiện quy trình nghiệp vụ.

---

## 2. UC-43: Theo dõi hoạt động xưởng (Monitor Workshop)

### 2.1 Thông tin cơ bản

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-43** |
| **Tên Use Case** | **Theo dõi hoạt động xưởng (Monitor Workshop)** |
| **Mô tả** | Quản lý dịch vụ theo dõi trực quan và toàn diện tình hình các xe đang có mặt tại xưởng, tiến độ từng hạng mục công việc sửa chữa, bảo dưỡng và các trường hợp bị chậm trễ để xử lý kịp thời. |
| **Tác nhân thực hiện** | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý đã đăng nhập thành công vào hệ thống quản lý nội bộ. |
| **Hậu điều kiện** | Quản lý nắm bắt đầy đủ thông tin vận hành tức thời của xưởng dịch vụ. |

---

### 2.2 Luồng sự kiện chính (Luồng cơ bản)

1. **Truy cập Bảng điều hành:** Quản lý dịch vụ chọn mục **Bảng điều hành xưởng** trên hệ thống.
2. **Hiển thị thẻ chỉ số tổng quan:** Hệ thống hiển thị 4 chỉ số vận hành quan trọng ở đầu màn hình:
   - **Số phiếu đang xử lý:** Tổng số phiếu dịch vụ đang hoạt động trong xưởng.
   - **Phiếu chờ phê duyệt:** Số phiếu đang chờ khách hàng hoặc cố vấn dịch vụ xác nhận báo giá.
   - **Phiếu chờ thanh toán:** Số phiếu đã hoàn tất sửa chữa, xe đã nghiệm thu và đang chờ thu tiền.
   - **Hạng mục chậm tiến độ:** Số công việc sửa chữa đang kéo dài vượt quá thời gian dự kiến định mức.
3. **Hiển thị danh sách phương tiện trong xưởng:** Hệ thống hiển thị danh sách các xe đang thực hiện dịch vụ dưới dạng các thẻ trực quan, mỗi thẻ bao gồm:
   - Mã số phiếu dịch vụ và trạng thái chung của xe.
   - Thông tin xe: Biển số, hãng xe, dòng xe, năm sản xuất.
   - Thông tin khách hàng và Cố vấn dịch vụ phụ trách tiếp nhận.
   - Danh sách các gói dịch vụ và tiến độ chi tiết của từng hạng mục công việc cụ thể (Chưa bắt đầu, Đang sửa, Hoàn thành, Chờ kiểm tra chất lượng,...).
4. **Lọc và tìm kiếm:** Quản lý có thể lọc danh sách theo từng trạng thái (Đang sửa chữa, Chờ duyệt báo giá, Chờ thanh toán,...) để kiểm tra riêng từng nhóm phương tiện.
5. **Cập nhật dữ liệu:** Quản lý nhấn nút làm mới hoặc hệ thống tự động cập nhật định kỳ để luôn hiển thị tình hình mới nhất.
6. **Xem chi tiết phiếu:** Khi cần xem đầy đủ diễn giải sửa chữa của một xe, Quản lý nhấp vào mã phiếu để chuyển sang màn hình thông tin chi tiết.

---

### 2.3 Các luồng thay thế và ngoại lệ

- **Luồng 3a (Xưởng đang trống - Không có xe xử lý):**
  - Tại bước 3, nếu hiện tại không có chiếc xe nào đang trong quy trình sửa chữa hoặc bảo dưỡng, hệ thống hiển thị thông điệp thân thiện: *"Hiện tại xưởng chưa có xe nào đang xử lý"* kèm hình ảnh biểu trưng minh họa, không hiển thị trang trắng hay báo lỗi.
- **Luồng 4a (Bộ lọc không có kết quả):**
  - Khi Quản lý chọn một trạng thái cụ thể nhưng không có phiếu nào thỏa mãn, hệ thống thông báo: *"Không tìm thấy phiếu dịch vụ nào ở trạng thái đã chọn"* và cho phép bấm quay lại danh sách tất cả.

---

## 3. UC-53: Xem báo cáo vận hành (View Operational Report)

### 3.1 Thông tin cơ bản

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | **UC-53** |
| **Tên Use Case** | **Xem báo cáo vận hành (View Operational Report)** |
| **Mô tả** | Quản lý dịch vụ tra cứu các báo cáo tổng hợp về kết quả kinh doanh, tần suất thực hiện các dịch vụ và cảnh báo mức tồn kho phụ tùng để phục vụ công tác điều hành và lập kế hoạch. |
| **Tác nhân thực hiện** | Quản lý dịch vụ (Service Manager) |
| **Tiền điều kiện** | Quản lý đã đăng nhập thành công vào hệ thống quản lý nội bộ. |
| **Hậu điều kiện** | Quản lý xem được biểu đồ trực quan và bảng số liệu phân tích chi tiết theo tiêu chí đã chọn. |

---

### 3.2 Luồng sự kiện chính (Luồng cơ bản)

1. **Truy cập mục Báo cáo:** Quản lý dịch vụ vào mục **Báo cáo vận hành**.
2. **Chọn loại báo cáo:** Quản lý lựa chọn một trong 3 loại báo cáo nghiệp vụ:
   - **Báo cáo Doanh thu**
   - **Báo cáo Dịch vụ phổ biến**
   - **Báo cáo Cảnh báo tồn kho phụ tùng**
3. **Thiết lập tiêu chí thời gian (đối với Báo cáo Doanh thu và Dịch vụ):**
   - Quản lý chọn ngày bắt đầu và ngày kết thúc cần thống kê.
   - Quản lý nhấn **Xem báo cáo**.
4. **Hệ thống tổng hợp và trình bày kết quả:**
   - **Với Báo cáo Doanh thu:**
     - Thẻ tóm tắt: Tổng doanh thu đã thu thực tế (đồng) và Tổng số lượt hóa đơn đã thanh toán.
     - Biểu đồ hình cột thể hiện biến động doanh thu theo từng ngày trong giai đoạn chọn.
     - Bảng số liệu chi tiết: Ngày, số hóa đơn và tổng tiền tương ứng.
   - **Với Báo cáo Dịch vụ:**
     - Thẻ tóm tắt: Tổng lượt công việc dịch vụ đã cung cấp cho khách hàng.
     - Biểu đồ dạng thanh nằm ngang: Xếp hạng các dịch vụ theo số lượt thực hiện từ nhiều nhất đến ít nhất.
     - Bảng chi tiết: Tên dịch vụ và số lần phục vụ.
   - **Với Báo cáo Cảnh báo tồn kho:**
     - Hệ thống tự động truy xuất dữ liệu tồn kho hiện tại (không cần chọn khoảng ngày).
     - Thẻ tóm tắt: Tổng số mã phụ tùng đang ở dưới hoặc bằng mức tồn kho an toàn tối thiểu.
     - Bảng danh mục cảnh báo: Mã phụ tùng, Tên phụ tùng, Nhóm hàng, Số lượng thực tế trong kho, Mức an toàn quy định và Số lượng đang thiếu hụt cần đặt thêm.

---

### 3.3 Các luồng thay thế và ngoại lệ

- **Luồng 4a (Khoảng thời gian không có số liệu phát sinh):**
  - Nếu trong khoảng ngày Quản lý chọn không có giao dịch doanh thu hoặc dịch vụ nào hoàn tất, hệ thống hiển thị thông báo: *"Không có dữ liệu trong khoảng thời gian đã chọn. Vui lòng chọn khoảng thời gian khác."*
- **Luồng 4b (Kho phụ tùng an toàn đầy đủ):**
  - Khi xem báo cáo tồn kho mà tất cả phụ tùng đều đạt số lượng an toàn, hệ thống hiển thị thông báo tích cực: *"Kho phụ tùng đang đảm bảo - Không có phụ tùng nào dưới ngưỡng cảnh báo."*

---

## 4. Tóm tắt các điểm bổ sung so với đặc tả ban đầu

| Nội dung | Đặc tả ban đầu | Đặc tả điều chỉnh bổ sung | Giá trị mang lại |
| :--- | :--- | :--- | :--- |
| **Chỉ số nhanh UC-43** | Chỉ nêu danh sách phiếu chung | Bổ sung 4 chỉ số: Đang xử lý, Chờ duyệt, Chờ thanh toán, Chậm tiến độ | Quản lý nắm bắt ngay hiện trạng chỉ sau 3 giây nhìn vào màn hình |
| **Trường hợp xưởng vắng** | Chưa mô tả | Bổ sung luồng thông báo thân thiện rõ ràng | Tránh cảm giác trang bị treo hay lỗi hệ thống |
| **Nội dung báo cáo UC-53** | Chỉ liệt kê tên 3 loại báo cáo | Chi tiết hóa thông tin cụ thể, thẻ số liệu, dạng biểu đồ và bảng dữ liệu cho từng loại | Thống nhất cách hiển thị và đảm bảo đáp ứng đúng nhu cầu quản trị |
| **Báo cáo tồn kho** | Yêu cầu chọn khoảng ngày | Xác định là báo cáo thời điểm hiện tại, tự động lấy dữ liệu | Tiết kiệm thao tác cho người dùng, phản ánh đúng thực tế kho |
