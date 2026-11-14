## I. TỔNG QUAN ĐỘ BAO PHỦ HIỆN TẠI CỦA 6 BỘ TEST CASE

| STT | Bộ Test Case | Số lượng TC hiện tại | Đối tượng & Phân hệ bao phủ |
|:---:|---|:---:|---|
| 1 | [TC_Admin_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Admin_Process.md) | **50 TCs** | Quản trị tài khoản, nhân sự, dịch vụ, bảng giá, loại công việc, danh mục chung. |
| 2 | [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) | **43 TCs** | Đặt lịch hẹn (Khách hàng/Lễ tân), Tiếp nhận xe (Có hẹn, Walk-in, Cứu hộ), Hàng đợi xe. |
| 3 | [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md) | **38 TCs** | Đăng ký, Đăng nhập, Đăng xuất, Quên/Khôi phục mật khẩu, Xác thực OTP. |
| 4 | [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) | **37 TCs** | Hồ sơ khách hàng, Quản lý xe, Lễ tân CRUD khách & xe, Vô hiệu hóa/Khôi phục. |
| 5 | [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) | **60 TCs** | Danh mục & SKU phụ tùng, Nhập/Xuất/Trả kho, Thẻ kho, Bảng giám sát xưởng, Báo cáo vận hành, Duyệt bảo hành thiện chí. |
| 6 | [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) | **64 TCs** | Khởi tạo lệnh, Check-in, Khám xe 2D, Lập việc, Báo giá, Thi công xưởng, KCS, Bàn giao xe. |
| | **TỔNG CỘNG** | **292 TCs** | |

---

## II. 🚨 2 PHÂN HỆ LỚN ĐANG BỊ THIẾU TOÀN DIỆN (CHƯA CÓ BỘ TEST CASE HOẶC CHƯA BAO PHỦ)

Qua kiểm tra mã nguồn và `UseCase V2.md`, hệ thống có **2 quy trình nghiệp vụ rất lớn** nhưng hiện tại chưa có bộ test case riêng hoặc chỉ mới được nhắc đến lướt qua:

### 1. Phân hệ Kế toán / Thu ngân, Hóa đơn & Thanh toán (`Billing, Invoicing & Payment Process`)
* **Thực tế trong source code:** Giao diện đã xây dựng cực kỳ đầy đủ tại `apps/internal-web/src/app/(dashboard)/staff/billing/` và trang chi tiết `billing/[id]/page.tsx`, cùng các component: `CreateInvoiceDraftModal`, `PaymentModal`, `DiscountEditorModal`, `CancelInvoiceModal`, `InvoiceLinesTable`. Phía khách hàng có `CustomerPaymentModal.tsx` và `InvoicesView.tsx`.
* **Hiện trạng kiểm thử:** Trong `TC_WorkOrder_SA_Process.md` chỉ có vỏn vẹn 2 test case lướt qua về thu tiền từ góc độ Cố vấn dịch vụ. **Chưa có kịch bản nào kiểm thử màn hình Thu ngân chuyên dụng.**
* **Các luồng nghiệp vụ bị thiếu cần viết bộ test case chuyên biệt (`TC_Billing_Invoice_Process.md` khoảng 25 - 30 TCs):**
  1. **Quản lý hàng đợi thanh toán 4 Tab nghiệp vụ:**
     - Tab `PENDING` (Chờ lập hóa đơn): Danh sách các Work Order đã nghiệm thu KCS Đạt sẵn sàng lập hóa đơn.
     - Tab `DRAFT` (Hóa đơn nháp): Danh sách hóa đơn vừa tạo chờ rà soát.
     - Tab `ISSUED` (Đã xuất hóa đơn): Danh sách hóa đơn chờ khách thanh toán hoặc đang trả góp/thanh toán dở dang.
     - Tab `PAID` (Đã thanh toán): Danh sách hóa đơn đã hoàn tất thu tiền 100%.
  2. **Nghiệp vụ Tạo hóa đơn nháp (`CreateInvoiceDraftModal`):**
     - Chọn Work Order hoàn tất để tự động trích xuất dữ liệu dòng phụ tùng, tiền công và chiết khấu từ báo giá đã duyệt sang hóa đơn.
     - Chặn tạo hóa đơn khi Work Order chưa đạt KCS.
     - Chống tạo trùng lặp 2 hóa đơn cho cùng một Work Order.
  3. **Nghiệp vụ Điều chỉnh chiết khấu bổ sung tại quầy (`DiscountEditorModal`):**
     - Thu ngân áp dụng chiết khấu tiền mặt (VNĐ) hoặc chiết khấu % theo chương trình ưu đãi/khách hàng thân thiết ngay tại thời điểm thanh toán.
     - Ràng buộc: Số tiền chiết khấu không vượt quá tổng giá trị hóa đơn (Số tiền phải thu không âm).
  4. **Nghiệp vụ Xuất hóa đơn (`handleConfirmIssue`):**
     - Chuyển trạng thái từ `DRAFT` sang `ISSUED` $\to$ Đóng băng toàn bộ các dòng chi phí và số tiền phải thu, khóa không cho phép sửa đổi chi tiết hạng mục.
  5. **Nghiệp vụ Thanh toán đa phương thức (`PaymentModal`):**
     - Thanh toán Tiền mặt (Cash), Chuyển khoản ngân hàng (Bank Transfer), Thẻ tín dụng/ghi nợ (Card), Cổng thanh toán (VNPAY/MOMO).
     - **Thanh toán từng phần (Partial Payment):** Khách thanh toán trước một phần (ví dụ hóa đơn 5 triệu, khách thanh toán trước 2 triệu) $\to$ Hóa đơn ghi nhận số dư còn nợ `remainingAmount = 3.000.000đ` và trạng thái `PARTIALLY_PAID` (hoặc `ISSUED`).
     - Thanh toán nốt số dư còn lại $\to$ Hóa đơn tự động chuyển sang `PAID` 100%.
     - Lịch sử các đợt thanh toán (Payment History) hiển thị phân trang và chi tiết ngày giờ, người thu tiền.
  6. **Nghiệp vụ Hủy hóa đơn (`CancelInvoiceModal`):**
     - Hủy hóa đơn nháp hoặc hóa đơn chưa thanh toán kèm bắt buộc chọn lý do hủy (CANCEL_REASON).
     - Chặn hủy đối với hóa đơn đã thanh toán hoàn tất (PAID).
  7. **In ấn & Xuất bản chứng từ:**
     - Thu ngân xuất hóa đơn ra file PDF chuẩn để in phiếu thu trao tay cho khách hàng.
     - Khách hàng xem và tải file hóa đơn điện tử trực tiếp trên Cổng thông tin khách hàng (`/customer/profile?tab=invoices`).

---

### 2. Phân hệ Quản lý Bảo hành sau sửa chữa (`Warranty Management Process` – UC-81 đến UC-87)
* **Thực tế trong source code & Prisma:** Cơ sở dữ liệu đã có đầy đủ trường nghiệp vụ bảo hành: `WorkOrderType: WARRANTY`, `is_warranty`, `warranty_months`, `warranty_mileage`, `child_warranty_orders`, `approved_warranty_claims`.
* **Hiện trạng kiểm thử:** Hiện tại mới chỉ có 4 test case cho Quản lý duyệt bảo hành thiện chí trong `TC_Manager_Process.md` (`TC-MGR-52..55`).
* **Các luồng nghiệp vụ bảo hành còn thiếu:**
  1. **Tra cứu thời hạn bảo hành (`UC-81`):** Khách hàng hoặc Lễ tân tra cứu phụ tùng/hạng mục đã thay thế ở các lần sửa chữa trước xem còn trong thời hạn bảo hành hay không (theo số tháng hoặc theo số km ODO).
  2. **Tiếp nhận xe bảo hành tại quầy (`UC-83`):** Lễ tân tiếp nhận xe vào xưởng với lý do bảo hành, đối chiếu và liên kết với mã Phiếu công việc gốc trước đó.
  3. **Lập Work Order loại bảo hành (`UC-84`):** Cố vấn dịch vụ mở phiếu sửa chữa bảo hành với đơn giá phụ tùng và công thợ tính **0 đồng** cho khách hàng theo đúng chính sách bảo hành.
  4. **Xử lý hóa đơn bảo hành (`UC-85`):** Xuất hóa đơn dịch vụ bảo hành với số tiền khách cần trả là **0 đồng** (chi phí nội bộ được hạch toán cho garage hoặc nhà cung cấp).

---

## III. CHI TIẾT CÁC FLOW BỊ THIẾU TRONG TỪNG BỘ TEST CASE HIỆN CÓ

Dưới đây là danh sách các kịch bản hành vi người dùng cần bổ sung vào từng file:

### 1. Bổ sung vào [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md)

| STT | Luồng nghiệp vụ còn thiếu | Mô tả hành vi & Quy tắc kiểm thử cần thêm |
|:---:|---|---|
| 1 | **Khách vãng lai xem trang chủ & Đặt hẹn nhanh (`UC-01`)** | Khách chưa đăng nhập vào xem trang chủ (`/home`), tham khảo bảng giá dịch vụ và bấm nút *"Đặt lịch hẹn ngay"*. Hệ thống yêu cầu đăng nhập/đăng ký nhanh, sau đó tự động điền lại các thông tin dịch vụ khách vừa chọn. |
| 2 | **Tiếp nhận Walk-in khách cũ mang xe mới** | Khách hàng đã có tài khoản trong hệ thống nhưng hôm nay mang một chiếc **xe mới toanh** (chưa từng đăng ký). Lễ tân tìm thấy khách qua SĐT $\to$ Bấm *"Thêm xe mới"* ngay tại biểu mẫu tiếp nhận $\to$ Hệ thống lưu xe vào hồ sơ khách và tạo phiếu tiếp nhận thành công. |
| 3 | **Ghi nhận biên bản bàn giao tài sản khi Tiếp nhận** | Tại khâu tiếp nhận xe, Lễ tân ghi chú các tài sản có giá trị của khách để trên xe (tiền mặt, đồ điện tử) và ghi nhận mức xăng ban đầu vào biên bản bàn giao tạm thời trước khi chuyển xe cho Cố vấn dịch vụ. |
| 4 | **Hủy phiếu tiếp nhận & Cập nhật hàng đợi** | Khi Lễ tân hủy phiếu tiếp nhận xe trong hàng đợi (khách đổi ý lấy xe về), hệ thống cập nhật tức thì làm chiếc xe đó biến mất khỏi màn hình Hàng đợi tiếp nhận (`intake-queue`) của Cố vấn dịch vụ. |

---

### 2. Bổ sung vào [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md)

| STT | Luồng nghiệp vụ còn thiếu | Mô tả hành vi & Quy tắc kiểm thử cần thêm |
|:---:|---|---|
| 1 | **Đổi mật khẩu chủ động trong Hồ sơ cá nhân** | Người dùng đang đăng nhập vào trang cá nhân chọn *"Đổi mật khẩu"*: Nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu mới. Kiểm tra: Nhập sai mật khẩu cũ $\to$ Báo lỗi; Mật khẩu mới trùng mật khẩu cũ $\to$ Cảnh báo không được trùng; Mật khẩu mới không khớp ô xác nhận $\to$ Chặn lưu. |
| 2 | **Khóa tạm thời khi đăng nhập sai nhiều lần** | Người dùng nhập sai mật khẩu liên tiếp 5 lần $\to$ Hệ thống tạm khóa tài khoản trong 15 phút kèm thông báo cảnh báo rõ ràng để chống dò mật khẩu. |
| 3 | **Cơ chế Ghi nhớ đăng nhập (Remember Me)** | Tích chọn *"Ghi nhớ đăng nhập"* $\to$ Đóng trình duyệt mở lại vẫn giữ trạng thái đăng nhập; Không tích chọn $\to$ Đóng trình duyệt sẽ tự động đăng xuất. |

---

### 3. Bổ sung vào [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md)

| STT | Luồng nghiệp vụ còn thiếu | Mô tả hành vi & Quy tắc kiểm thử cần thêm |
|:---:|---|---|
| 1 | **Kiểm tra tính toàn vẹn số liệu thống kê khách hàng (Tổng chi tiêu & Số lượt)** | **(Đây là vấn đề bạn vừa gặp lỗi):** Khi Lễ tân tạo khách hàng mới $\to$ *Tổng chi tiêu* = 0đ, *Số dịch vụ sử dụng* = 0. Sau khi khách hàng hoàn tất một Work Order và thanh toán hóa đơn $\to$ Hệ thống tự động tích lũy chính xác doanh thu và số lượt vào hồ sơ khách hàng. |
| 2 | **Khách hàng thêm xe - Phân loại kích cỡ xe (`vehicleSize`)** | Khi khách thêm xe mới, bắt buộc phải chọn đúng Phân khúc cỡ xe (Nhỏ - SMALL, Vừa - MEDIUM, Lớn - LARGE, Cực lớn - XL). Cỡ xe này sẽ tự động liên kết với bảng giá dịch vụ theo phân khúc khi đặt hẹn và khi Cố vấn dịch vụ báo giá. |
| 3 | **Khách hàng tra cứu Lịch sử dịch vụ (`HistoryView.tsx`)** | Khách hàng mở tab *Lịch sử* xem lại toàn bộ các lần làm dịch vụ của từng xe trong quá khứ: Ngày làm, số km ODO tại thời điểm đó, các phụ tùng đã thay thế và hóa đơn tương ứng. |

---

### 4. Bổ sung vào [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md)

| STT | Luồng nghiệp vụ còn thiếu | Mô tả hành vi & Quy tắc kiểm thử cần thêm |
|:---:|---|---|
| 1 | **Biến động giá vốn nhập kho & Cảnh báo biên lợi nhuận** | Khi nhập kho lô phụ tùng mới có giá vốn biến động tăng so với trước $\to$ Hệ thống tính lại giá vốn bình quân và đưa ra cảnh báo nếu giá bán niêm yết hiện tại thấp hơn giá vốn mới nhập. |
| 2 | **Hủy phiếu nhập kho nháp / Xuất trả hàng nhà cung cấp** | Quản lý kho phát hiện hàng giao bị móp méo, sai quy cách sau khi lập phiếu nhập kho nháp $\to$ Hủy phiếu nhập kho hoặc tạo phiếu xuất trả nhà cung cấp, giảm tồn kho tương ứng. |
| 3 | **Xuất báo cáo vận hành ra tệp Excel/PDF** | Quản lý xuất Báo cáo Doanh thu, Báo cáo Sản lượng dịch vụ, Báo cáo Xuất nhập tồn ra tệp Excel để phục vụ lưu trữ và báo cáo ban giám đốc. |

---

### 5. Bổ sung vào [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md)

| STT | Luồng nghiệp vụ còn thiếu | Mô tả hành vi & Quy tắc kiểm thử cần thêm |
|:---:|---|---|
| 1 | **Phát sinh công việc khi đang thi công (Supplementary Work / Change Order)** | Trong quá trình thi công, kỹ thuật viên phát hiện thêm lỗi phát sinh mới $\to$ Cố vấn dịch vụ tạo *Báo giá bổ sung*. Khách hàng nhận thông báo và duyệt online riêng cho phần phát sinh này $\to$ Thợ mới được phép thi công hạng mục mới. |
| 2 | **Phân công & Điều chuyển Kỹ thuật viên (Technician Assignment & Reassignment)** | Cố vấn hoặc Quản đốc phân công kỹ thuật viên cụ thể cho từng công việc dựa trên tay nghề (Bậc thợ, kỹ năng Máy/Gầm/Điện/Sơn) và cho phép đổi thợ phụ trách khi thợ ban đầu bận đột xuất. |
| 3 | **Tạm dừng và Tiếp tục công việc (Pause / Resume Job)** | Tạm dừng công việc khi phải chờ phụ tùng đặt hàng hoặc chờ khách hàng duyệt báo giá bổ sung (kèm ghi chú lý do) $\to$ Bấm Tiếp tục thi công khi phụ tùng đã sẵn sàng. |
| 4 | **Ghi chú nội bộ giữa Thợ và Cố vấn dịch vụ** | Kỹ thuật viên nhập ghi chú kỹ thuật cho Cố vấn dịch vụ (ví dụ: *"Khuyên khách nên thay má phanh sau sau 5.000km nữa"*). Cố vấn duyệt và đưa nội dung này vào mục Dặn dò trên Biên bản bàn giao xe xuất xưởng cho khách. |

---

### 6. Bổ sung vào [TC_Admin_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Admin_Process.md)
* File này vừa được chúng ta chuẩn hóa thành công với **50 Test Cases** rất hoàn chỉnh.
* Nếu hệ thống có màn hình **Cấu hình thông tin Garage (General Settings)**, bạn có thể bổ sung thêm 1 kịch bản: Cập nhật tên trung tâm dịch vụ, địa chỉ, số hotline và khung giờ mở cửa xưởng hiển thị trên hóa đơn và trang chủ.

---

## IV. ĐỀ XUẤT KẾ HOẠCH HÀNH ĐỘNG TIẾP THEO

Để bộ tài liệu kiểm thử manual của bạn đạt độ bao phủ 100% toàn bộ hệ thống thực tế:

1. **Ưu tiên 1 (Cấp thiết nhất):** Khởi tạo mới bộ **`TC_Billing_Invoice_Process.md`** (khoảng 20 - 25 test cases) bao phủ trọn vẹn màn hình Thu ngân (`/staff/billing`), từ hàng đợi PENDING $\to$ lập hóa đơn nháp DRAFT $\to$ sửa chiết khấu $\to$ xuất hóa đơn ISSUED $\to$ thanh toán từng phần/toàn phần $\to$ in hóa đơn PDF.
2. **Ưu tiên 2:** Bổ sung các kịch bản còn thiếu vào từng file hiện có theo danh sách chi tiết ở Mục III (đặc biệt là luồng *Phát sinh công việc khi đang thi công* trong Work Order và *Kiểm tra tính toàn vẹn số liệu thống kê khách hàng*).
3. **Ưu tiên 3:** Bổ sung phân hệ *Bảo hành sau sửa chữa* (Warranty Management).

Bạn muốn chúng ta tiến hành **viết ngay bộ test case mới cho Phân hệ Kế toán / Thu ngân (`TC_Billing_Invoice_Process.md`)**, hay muốn **bổ sung trực tiếp các kịch bản còn thiếu vào các file hiện có trước**?