# ĐIỀU CHỈNH & CHUẨN HÓA ĐẶC TẢ USE CASE – PHÂN HỆ BÁO GIÁ (UC-37 → UC-40)

> **Tài liệu:** Chuẩn hóa đặc tả nghiệp vụ phân hệ Quản lý Báo giá (Quotation Management)  
> **Áp dụng cho:** Cố vấn dịch vụ (Service Advisor), Khách hàng (Customer), Lễ tân (Front Desk Staff)  
> **Vị trí lưu trữ:** `docs/requirements/rev_uc/UC-37-40_rev.md`  
> **Tài liệu tham chiếu:** [`docs/requirements/UseCase V2.md`](file:///d:/TLCN/CAR%20SERVICE%20CENTER/docs/requirements/UseCase%20V2.md), [`docs/requirements/WORK_ORDER_STATUS_TRANSITION.md`](file:///d:/TLCN/CAR%20SERVICE%20CENTER/docs/requirements/WORK_ORDER_STATUS_TRANSITION.md), [`docs/requirements/Pricing_Calculation_Formulas.md`](file:///d:/TLCN/CAR%20SERVICE%20CENTER/docs/requirements/Pricing_Calculation_Formulas.md)  
> **Phiên bản:** 2.0 (Chuẩn hóa toàn diện theo kiến trúc thực thi đa cổng Portal)

---

## 1. BỐI CẢNH VÀ LÝ DO ĐIỀU CHỈNH

Trong hệ thống vận hành xưởng dịch vụ ô tô, **Báo giá (Quotation)** là văn bản cam kết pháp lý và tài chính giữa Trung tâm dịch vụ và Khách hàng trước khi thợ kỹ thuật được phép động cờ lê vào xe.

### 1.1 Những điểm hạn chế của đặc tả cũ (v2.0):
1. **Thiếu quy chế bóc tách chi phí đa mô hình:** Đặc tả cũ chỉ nêu "tính toán chi phí chung", không phản ánh được 3 mô hình tính giá đặc thù của ngành ô tô: (1) Gói dịch vụ cố định (`FIXED`), (2) Gói dịch vụ định giá theo phân khúc kích cỡ xe (`VEHICLE_SIZE`), và (3) Gói sửa chữa bóc tách nhân công thực tế + phụ tùng (`LABOUR_PARTS`).
2. **Chưa chuẩn hóa chính sách thuế và chiết khấu:** Chưa quy định công thức chiết khấu linh hoạt (theo % hoặc số tiền cố định) và chính sách Zero-Tax (thuế suất VAT = 0% theo quy định mới).
3. **Thiếu cơ chế chống sinh báo giá rác (Idempotency / Anti-Duplication):** Khi cố vấn dịch vụ bấm lập lại báo giá mà kế hoạch công việc không có thay đổi, hệ thống cũ sinh ra các bản ghi trùng lặp gây rối loạn lịch sử.
4. **Chưa phân tách 2 hướng từ chối báo giá:** Khách hàng từ chối báo giá có 2 mong muốn hoàn toàn khác nhau:
   - *Yêu cầu điều chỉnh (REVISE):* Muốn bỏ bớt công việc, đổi phụ tùng rẻ hơn $\rightarrow$ Cần đưa phiếu về kế hoạch để sửa đổi.
   - *Hủy dịch vụ và nhận lại xe (CANCEL):* Không muốn sửa nữa, muốn nhận lại xe ngay $\rightarrow$ Cần kích hoạt quy trình xuất trả xe sớm (Early Release).
5. **Chưa liên kết tự động với Kho và Tiến độ thi công:** Thiếu quy định đóng băng dữ liệu (Immutability Snapshot), tự động giữ chỗ phụ tùng trong kho (`RESERVED`) và tự động khóa biên bản kiểm tra ban đầu (`CheckIn.CONFIRMED`) khi báo giá được phê duyệt.
6. **Thiếu hỗ trợ gửi báo giá đa kênh (Omni-channel):** Chưa quy chuẩn việc xuất file PDF và gửi email tự động kèm liên kết truy cập nhanh (Deep Link) vào cổng thông tin khách hàng.

---

## 2. DANH MỤC USE CASE BÁO GIÁ ĐƯỢC CHUẨN HÓA

| Mã UC | Tên Use Case | Tác nhân chính | Mục tiêu nghiệp vụ cốt lõi |
| :---: | :--- | :--- | :--- |
| **UC-37** | **Lập báo giá dịch vụ (Create Quotation)** | Cố vấn dịch vụ (SA) | Tự động bóc tách 3 mô hình định giá, kiểm tra chống trùng lặp, tính chiết khấu và phát hành mã báo giá theo chuẩn. |
| **UC-38** | **Xem và tra cứu báo giá (View Quotation & History)** | Cố vấn dịch vụ, Khách hàng, Lễ tân | Hiển thị bảng chiết tính chi tiết, so sánh các phiên bản báo giá lịch sử, tải hoặc in file PDF tiêu chuẩn. |
| **UC-39** | **Xử lý duyệt và phản hồi báo giá (Process Approval / Rejection)** | Khách hàng, Cố vấn dịch vụ | Gửi báo giá cho khách qua Email/SMS; Khách tự duyệt hoặc SA ghi nhận ủy quyền; Phân nhánh từ chối (Sửa đổi hoặc Hủy trả xe); Khóa snapshot & giữ kho. |
| **UC-40** | **Điều chỉnh và Hủy báo giá (Update & Cancel Quotation)** | Cố vấn dịch vụ (SA) | Cập nhật chiết khấu cho báo giá nháp/đang gửi; Hủy báo giá nháp sai sót và hoàn trả trạng thái về lập kế hoạch. |

---

## 3. CHI TIẾT ĐẶC TẢ TỪNG USE CASE

---

### UC-37 – Lập báo giá dịch vụ (Create Quotation)

#### 3.1 Thông tin cơ bản
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use case** | **UC-37** |
| **Tên Use case** | **Lập báo giá dịch vụ (Create Quotation)** |
| **Mô tả** | Cố vấn dịch vụ tổng hợp toàn bộ các gói dịch vụ, công việc kỹ thuật viên và vật tư/phụ tùng đã được lập kế hoạch trên Phiếu công việc thành một bản Báo giá hoàn chỉnh. Hệ thống tự động tính toán tổng tiền theo 3 mô hình giá và áp dụng chiết khấu. |
| **Tác nhân thực hiện** | Cố vấn dịch vụ (Service Advisor), Quản trị viên (Admin) |
| **Tiền điều kiện** | 1. Phiếu công việc (Work Order) đang ở trạng thái `IN_PLANNING` (hoặc `DRAFT`).<br>2. Phiếu công việc có ít nhất 01 hạng mục dịch vụ, công việc hoặc phụ tùng có chi phí lớn hơn 0 đồng. |
| **Hậu điều kiện** | Thành công: Bản ghi Báo giá mới được tạo ở trạng thái Bản nháp (`DRAFT`) kèm danh sách chi tiết các dòng chi phí đã được chốt giá tạm thời.<br>Thất bại: Hệ thống hiển thị thông báo lỗi cụ thể, không tạo bản ghi mới. |

#### 3.2 Luồng sự kiện chính (Luồng cơ bản)
1. Cố vấn dịch vụ mở Phiếu công việc cần lập báo giá và chọn tab **Báo giá** (Tab 4).
2. Hệ thống kiểm tra xem phiếu công việc đã có kế hoạch dịch vụ/công việc hay chưa.
3. Cố vấn dịch vụ nhấn nút **Tạo báo giá tự động**.
4. Hệ thống tiến hành bóc tách toàn bộ chi phí theo đúng 3 mô hình định giá:
   - **Mô hình Gói cố định (`FIXED`):** Lấy đơn giá cố định của gói dịch vụ, không tính tiền lẻ của từng job con bên trong.
   - **Mô hình Theo phân khúc xe (`VEHICLE_SIZE`):** Xác định kích thước của phương tiện (`SMALL`, `MEDIUM`, `LARGE`, `SUV`, `TRUCK`) và áp dụng chính xác đơn giá tương ứng của phân khúc đó.
   - **Mô hình Nhân công & Phụ tùng (`LABOUR_PARTS`):** Quét từng công việc thực tế, cộng tổng tiền nhân công định mức (`JobLabour`) và tiền phụ tùng dự kiến (`JobPart` = Số lượng $\times$ Đơn giá bán niêm yết).
5. Hệ thống tính tổng tiền trước giảm giá (`subtotal`), áp dụng chính sách thuế **Zero-Tax (VAT = 0%)**.
6. Hệ thống thực hiện **Kiểm tra chống trùng lặp (Anti-Duplication Guardrail)**: So sánh nội dung chi tiết từng dòng, đơn giá và tổng tiền với các báo giá đã tạo trước đó của phiếu:
   - *Nếu giống hệt 100%:* Hệ thống không tạo mới mà tự động mở lại báo giá cũ kèm thông báo: *"Kế hoạch dịch vụ và phụ tùng không có thay đổi so với báo giá [Mã]. Hệ thống tự động mở lại báo giá này."* (Kết thúc use case).
   - *Nếu có thay đổi:* Hệ thống chuyển sang bước 7.
7. Hệ thống tự động sinh Mã báo giá duy nhất theo định dạng chuẩn: `QUO-[Mã_WO]-[Số_thứ_tự]` (Ví dụ: `QUO-WO-20261102-001-01`).
8. Cố vấn dịch vụ có thể nhập thêm tỷ lệ chiết khấu (%) hoặc số tiền giảm giá trực tiếp (VND).
9. Cố vấn dịch vụ nhấn **Lưu báo giá**.
10. Hệ thống lưu bản ghi Báo giá ở trạng thái **Bản nháp (`DRAFT`)**, lưu danh sách các dòng chi phí (`QuotationLine`) và hiển thị bản báo giá lên màn hình.

#### 3.3 Các luồng thay thế và ngoại lệ
- **Luồng 2a (Phiếu chưa có hạng mục nào):**
  - Tại bước 2, nếu phiếu công việc hoàn toàn trống (chưa gắn dịch vụ, chưa có nhân công hay phụ tùng), hệ thống vô hiệu hóa nút tạo hoặc hiển thị cảnh báo: *"Phiếu công việc chưa có bất kỳ hạng mục dịch vụ hoặc phụ tùng nào có chi phí. Vui lòng lập kế hoạch trước khi tạo báo giá."*
- **Luồng 7a (Tạo báo giá bổ sung - Supplementary Quotation):**
  - Trong quá trình thi công (`IN_PROGRESS`), nếu phát sinh hư hỏng mới sau kiểm tra, Cố vấn tạo thêm dịch vụ và nhấn **Tạo báo giá bổ sung**. Hệ thống đánh dấu loại báo giá là `SUPPLEMENTARY`, liên kết với Báo giá gốc (`parent_quotation_id`) và cộng dồn chi phí phát sinh.
- **Luồng ngoại lệ 1 (Phiếu đã đóng hoặc hủy):**
  - Nếu Phiếu công việc đang ở trạng thái `CLOSED`, `CANCELLED` hoặc `RELEASED`, hệ thống khóa chức năng tạo báo giá và báo lỗi: *"Phiếu công việc đã kết thúc vòng đời, không thể tạo báo giá mới."*

---

### UC-38 – Xem và tra cứu báo giá (View Quotation & History)

#### 3.1 Thông tin cơ bản
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use case** | **UC-38** |
| **Tên Use case** | **Xem và tra cứu báo giá (View Quotation & History)** |
| **Mô tả** | Người dùng xem chi tiết bảng tính giá của từng phiên bản báo giá, bao gồm phân tích nhóm nhân công, nhóm phụ tùng, chính sách giảm giá, thông tin cố vấn lập và theo dõi lịch sử gửi duyệt. |
| **Tác nhân thực hiện** | Cố vấn dịch vụ, Nhân viên lễ tân, Quản lý xưởng, Khách hàng |
| **Tiền điều kiện** | Người dùng đã đăng nhập và được phân quyền phù hợp (Khách hàng chỉ xem được báo giá xe của chính mình). |
| **Hậu điều kiện** | Hệ thống hiển thị đầy đủ, minh bạch toàn bộ các dòng chi phí và các nút hành động tương ứng với vai trò. |

#### 3.2 Luồng sự kiện chính (Luồng cơ bản)
1. Người dùng truy cập chi tiết Phiếu công việc và mở tab **Báo giá** (hoặc Khách hàng mở modal báo giá từ màn hình Theo dõi tiến độ xe trên Cổng khách hàng).
2. Hệ thống tải toàn bộ danh sách báo giá của phiếu và tự động chọn **Báo giá gửi mới nhất (`isLatestSent`)** làm mặc định.
3. Hệ thống hiển thị giao diện báo giá trực quan gồm các khu vực:
   - **Thẻ thông tin tổng quan:** Mã số báo giá, ngày lập, ngày gửi, người lập, trạng thái hiện tại (Bản nháp, Chờ duyệt, Đã duyệt, Khách từ chối).
   - **Bảng chi tiết hạng mục nhân công & dịch vụ:** Tên công việc, định mức giờ công, đơn giá, thành tiền.
   - **Bảng chi tiết danh mục phụ tùng & vật tư:** Tên phụ tùng, mã SKU, hãng sản xuất, số lượng, đơn vị tính, đơn giá, thành tiền.
   - **Khu vực tổng kết tài chính:** Tổng tiền gốc (`subtotal`), Tiền chiết khấu (`discount_amount`), Thuế VAT (`0% - Không thu thuế`), và **Tổng thanh toán cuối cùng (`grand_total`)**.
4. Người dùng có thể nhấn nút **Lịch sử báo giá** để xem bảng so sánh các phiên bản báo giá cũ (V1, V2, V3...), lý do từ chối của khách ở các phiên bản trước (nếu có).
5. Người dùng nhấn nút **Tải / In PDF** để xuất báo giá thành văn bản PDF chuẩn hóa để lưu trữ hoặc in ra giấy.

#### 3.3 Các luồng thay thế và ngoại lệ
- **Luồng 1a (Khách hàng truy cập trái phép báo giá người khác):**
  - Nếu người dùng với vai trò `CUSTOMER` cố tình gửi yêu cầu lấy ID báo giá của xe khác, hệ thống kiểm tra quyền sở hữu (`Security Ownership Check`), từ chối truy cập và phản hồi mã lỗi `403 Forbidden: Bạn không có quyền xem báo giá này`.
- **Luồng 2a (Phiếu chưa từng tạo báo giá):**
  - Hệ thống hiển thị trạng thái trống (Empty State): *"Chưa có bản báo giá nào được tạo cho phiếu công việc này"* kèm hướng dẫn bấm nút Tạo báo giá.

---

### UC-39 – Xử lý duyệt và phản hồi báo giá (Process Approval / Rejection)

#### 3.1 Thông tin cơ bản
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use case** | **UC-39** |
| **Tên Use case** | **Xử lý duyệt và phản hồi báo giá (Process Approval / Rejection)** |
| **Mô tả** | Bao gồm quy trình: (1) Cố vấn gửi báo giá cho khách qua Email/SMS; (2) Khách hàng hoặc Cố vấn thực hiện Phê duyệt báo giá; hoặc (3) Từ chối báo giá có phân nhánh (Yêu cầu chỉnh sửa hoặc Hủy nhận lại xe). Khi duyệt, hệ thống tự động khóa dữ liệu và giữ chỗ kho phụ tùng. |
| **Tác nhân thực hiện** | Khách hàng (Customer), Cố vấn dịch vụ (Service Advisor) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái Bản nháp (`DRAFT`) hoặc Đang gửi chờ khách duyệt (`SENT`). |
| **Hậu điều kiện** | - *Nếu Phê duyệt:* Báo giá chuyển sang `APPROVED`, Phiếu công việc chuyển `APPROVED`, Phụ tùng chuyển `RESERVED`, Check-in chuyển `CONFIRMED`.<br>- *Nếu Từ chối (Sửa đổi):* Báo giá chuyển `REJECTED`, Phiếu công việc chuyển về `IN_PLANNING`.<br>- *Nếu Từ chối (Hủy trả xe):* Báo giá chuyển `REJECTED`, mở luồng xuất trả xe. |

#### 3.2 Luồng sự kiện chính (Luồng cơ bản - Phê duyệt báo giá)
1. **Gửi báo giá cho khách:**
   - Cố vấn kiểm tra báo giá nháp (`DRAFT`), nhấn nút **Gửi cho khách hàng**.
   - Hệ thống chuyển trạng thái Báo giá sang **Đang chờ duyệt (`SENT`)** và cập nhật trạng thái Phiếu công việc sang **Chờ duyệt báo giá (`PENDING_APPROVAL`)**.
   - Hệ thống tự động gửi Email thông báo tới hộp thư khách hàng với giao diện chuẩn nhận diện, đính kèm bảng tóm tắt chi phí và đường dẫn liên kết nhanh (Deep Link) trực tiếp vào portal.
2. **Khách hàng tiếp nhận:** Khách hàng đăng nhập vào Cổng thông tin khách hàng hoặc nhấp vào liên kết trong email để mở chi tiết báo giá.
3. **Phê duyệt báo giá:**
   - Khách hàng (hoặc Cố vấn sau khi gọi điện xác nhận ủy quyền) nhấn **Phê duyệt báo giá**.
   - Hệ thống hiển thị hộp thoại xác nhận cam kết chi phí. Người dùng bấm **Xác nhận duyệt**.
4. **Hệ thống thực thi chuỗi giao dịch liên hoàn (Transaction Safety):**
   - **Khóa bất biến (Snapshot Immutability):** Chuyển trạng thái Báo giá sang `APPROVED`, đóng băng đơn giá snapshot tại thời điểm duyệt.
   - **Giữ chỗ kho (Part Reservation Gate):** Quét toàn bộ phụ tùng trong báo giá và tự động cập nhật trạng thái trong phiếu sang **Đã giữ chỗ (`RESERVED`)** để đảm bảo không bị thợ khác lấy mất linh kiện.
   - **Kích hoạt phiếu công việc:** Chuyển trạng thái Phiếu công việc từ `PENDING_APPROVAL` sang **Đã duyệt (`APPROVED`)**, sẵn sàng cho phép Quản đốc hoặc Kỹ thuật viên bắt đầu sửa chữa (`start-work`).
   - **Khóa biên bản tiếp nhận:** Tự động chuyển trạng thái biên bản kiểm tra ban đầu (`CheckIn`) sang **Đã xác nhận (`CONFIRMED`)**.
5. Hệ thống gửi thông báo thành công và làm mới giao diện hiển thị badge `Đã phê duyệt (Đã khóa)`.

#### 3.3 Các luồng thay thế và ngoại lệ
- **Luồng 3a: Khách hàng từ chối báo giá (Phân nhánh nghiệp vụ):**
  - Tại bước 3, khách hàng nhấn nút **Từ chối báo giá**.
  - Hệ thống hiển thị biểu mẫu yêu cầu chọn phân loại lý do từ chối:
    * **Phân nhánh 1 - Yêu cầu điều chỉnh (`REVISE`):** Khách chọn lý do (Chi phí vượt ngân sách, chỉ muốn làm hạng mục cần thiết, muốn đổi phụ tùng OEM,...) $\rightarrow$ Hệ thống chuyển Báo giá sang `REJECTED`, chuyển Phiếu công việc quay trở lại trạng thái **Đang lập kế hoạch (`IN_PLANNING`)** để Cố vấn bớt việc và tạo báo giá mới.
    * **Phân nhánh 2 - Hủy dịch vụ & Xuất trả xe (`CANCEL`):** Khách không đồng ý làm bất kỳ dịch vụ nào và yêu cầu nhận lại xe $\rightarrow$ Hệ thống chuyển Báo giá sang `REJECTED`, ghi nhận lý do hủy và tự động chuyển hướng sang biểu mẫu xuất trả xe sớm (Early Release Gate).
- **Luồng ngoại lệ 1: Duyệt lặp lại báo giá đã duyệt:**
  - Nếu báo giá đã ở trạng thái `APPROVED`, nút Duyệt sẽ bị vô hiệu hóa. Nếu có request gửi lên, hệ thống chặn lại với lỗi `400: Báo giá này đã được phê duyệt trước đó`.
- **Luồng ngoại lệ 2: Từ chối báo giá đã được duyệt:**
  - Nếu công việc đã bắt đầu thi công và báo giá đã `APPROVED`, hệ thống ngăn chặn việc từ chối để bảo vệ công nợ xưởng.

---

### UC-40 – Điều chỉnh và Hủy báo giá (Update & Cancel Quotation)

#### 3.1 Thông tin cơ bản
| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use case** | **UC-40** |
| **Tên Use case** | **Điều chỉnh và Hủy báo giá (Update & Cancel Quotation)** |
| **Mô tả** | Cố vấn dịch vụ áp dụng chính sách giảm giá/chiết khấu trực tiếp trên báo giá trước khi chốt, hoặc hủy bỏ một bản báo giá nháp bị sai sót để giải phóng dữ liệu. |
| **Tác nhân thực hiện** | Cố vấn dịch vụ (Service Advisor), Quản trị viên (Admin) |
| **Tiền điều kiện** | Báo giá đang ở trạng thái Bản nháp (`DRAFT`) hoặc Đang chờ duyệt (`SENT`). Tuyệt đối không áp dụng cho báo giá đã duyệt (`APPROVED`). |
| **Hậu điều kiện** | - *Nếu Điều chỉnh:* Tổng thanh toán và tiền chiết khấu của báo giá được cập nhật.<br>- *Nếu Hủy:* Báo giá chuyển sang `CANCELLED`, phiếu công việc quay về `IN_PLANNING`. |

#### 3.2 Luồng sự kiện chính (Luồng cơ bản)
1. **Áp dụng chiết khấu / Điều chỉnh giá:**
   - Cố vấn dịch vụ mở báo giá đang xử lý và chọn nút **Áp dụng chiết khấu**.
   - Cố vấn chọn hình thức: Giảm theo số tiền (VND) hoặc Giảm theo tỷ lệ phần trăm (%).
   - Cố vấn nhập số liệu giảm giá và lý do ưu đãi (Khách hàng thân thiết, chương trình khuyến mãi tháng,...).
   - Hệ thống tự động tính lại tổng thanh toán cuối cùng (`grand_total = subtotal - discount_amount`).
   - Cố vấn nhấn **Lưu thay đổi**. Hệ thống cập nhật báo giá thành công.
2. **Hủy bản báo giá nháp sai sót:**
   - Cố vấn phát hiện sai sót trong báo giá nháp và nhấn **Hủy báo giá**.
   - Hệ thống hiển thị hộp thoại cảnh báo: *"Bạn có chắc chắn muốn hủy bản báo giá này? Thao tác này không thể hoàn tác."*
   - Cố vấn xác nhận **Đồng ý hủy**.
   - Hệ thống cập nhật trạng thái Báo giá thành **Đã hủy (`CANCELLED`)**.
   - Nếu phiếu công việc đang ở `PENDING_APPROVAL`, hệ thống đưa trạng thái phiếu quay về **Đang lập kế hoạch (`IN_PLANNING`)** để cố vấn tiếp tục hiệu chỉnh công việc.

#### 3.3 Các luồng thay thế và ngoại lệ
- **Luồng ngoại lệ 1: Cố tình chỉnh sửa hoặc hủy báo giá đã được duyệt:**
  - Nếu báo giá đã ở trạng thái `APPROVED`, hệ thống ẩn hoàn toàn các nút Chỉnh sửa và Hủy. Nếu phát sinh lệnh can thiệp API, hệ thống lập tức từ chối và báo lỗi: `400: Báo giá đã được phê duyệt, không thể chỉnh sửa hoặc hủy bỏ`.

---

## 4. MA TRẬN CHUYỂN TRẠNG THÁI BÁO GIÁ (`QuotationStatus`)

| Trạng thái hiện tại | Thao tác kích hoạt | Trạng thái tiếp theo | Trạng thái Work Order đi kèm | Hành động dữ liệu kèm theo |
| :--- | :--- | :--- | :--- | :--- |
| *(Chưa có)* | Tạo báo giá tự động (UC-37) | **`DRAFT`** | `IN_PLANNING` | Bóc tách chi phí 3 mô hình, chống trùng lặp, sinh mã `QUO-...` |
| **`DRAFT`** | Gửi báo giá cho khách (UC-39) | **`SENT`** | `PENDING_APPROVAL` | Gửi Email thông báo có Deep Link, ghi nhận `sent_at` |
| **`DRAFT` / `SENT`** | Cập nhật chiết khấu (UC-40) | **`DRAFT` / `SENT`** | Giữ nguyên | Tính lại tổng thanh toán và tiền giảm giá |
| **`DRAFT` / `SENT`** | Hủy báo giá (UC-40) | **`CANCELLED`** | `IN_PLANNING` | Hủy hiệu lực báo giá, giải phóng hạng mục |
| **`SENT`** | Phê duyệt báo giá (UC-39) | **`APPROVED`** | **`APPROVED`** | **Khóa snapshot bất biến, Phụ tùng -> `RESERVED`, Check-in -> `CONFIRMED`** |
| **`SENT`** | Khách từ chối: Sửa đổi (UC-39) | **`REJECTED`** | **`IN_PLANNING`** | Ghi nhận lý do, cho phép SA thêm/bớt hạng mục để báo giá lại |
| **`SENT`** | Khách từ chối: Hủy xe (UC-39) | **`REJECTED`** | **`IN_PLANNING`** $\rightarrow$ `RELEASED` | Chuyển sang luồng xuất trả xe sớm (Early Release) |
| **`APPROVED`** | *Mọi thao tác sửa/hủy* | *BỊ CHẶN (FORBIDDEN)* | Giữ nguyên | Báo lỗi 400. Mọi phát sinh mới bắt buộc phải tạo Báo giá bổ sung (`SUPPLEMENTARY`) |

---

## 5. ĐỀ XUẤT SỬA ĐỔI & BỔ SUNG VÀO ỨNG DỤNG THỰC TẾ

Dựa trên việc rà soát thực tế giữa đặc tả và mã nguồn hiện tại, dưới đây là các khuyến nghị nâng cấp:

1. **Hiển thị trực quan Badge "Phụ tùng đã giữ chỗ (`RESERVED`)" trong Tab Phụ tùng:**
   - Ngay khi báo giá được duyệt, ở tab Phụ tùng ([TabParts.tsx](file:///d:/TLCN/CAR%20SERVICE%20CENTER/src/frontend/apps/internal-web/src/components/advisor/work-order/tabs/TabParts.tsx)), hiển thị nhãn xanh *"Đã giữ chỗ trong kho (Reserved)"* để thợ biết linh kiện đã được đảm bảo sẵn sàng cho thi công.
2. **Bổ sung Banner cảnh báo phân nhánh từ chối ở đầu Tab Báo giá:**
   - Nếu khách hàng từ chối báo giá với loại `CANCEL` (Muốn lấy xe về), hệ thống cần hiển thị banner đỏ nổi bật: *"Khách hàng đã từ chối sửa chữa và yêu cầu nhận lại xe. Nhấn vào đây để tiến hành thủ tục xuất trả xe sớm"*.
3. **Mẫu in Báo giá PDF tích hợp mã QR tra cứu nhanh:**
   - Trong tiện ích xuất file PDF ([pdf-quotation.util.ts](file:///d:/TLCN/CAR%20SERVICE%20CENTER/src/backend/src/utils/pdf-quotation.util.ts)), bổ sung in mã QR trực tiếp trên trang đầu để khách hàng có thể dùng camera điện thoại quét và duyệt báo giá ngay lập tức mà không cần gõ link thủ công.
4. **Cơ chế so sánh khác biệt (Diff View) giữa Báo giá bổ sung và Báo giá gốc:**
   - Khi tạo báo giá bổ sung (`SUPPLEMENTARY`), giao diện cần làm nổi bật (highlight màu vàng) các dòng công việc hoặc linh kiện mới phát sinh để khách hàng nắm rõ phần chi phí tăng thêm.

