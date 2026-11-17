## I. TỔNG QUAN ĐỘ BAO PHỦ HIỆN TẠI CỦA CÁC BỘ TEST CASE (8 BỘ TEST CASE)

| STT | Bộ Test Case | Số lượng TC hiện tại | Đối tượng & Phân hệ bao phủ | Trạng thái |
|:---:|---|:---:|---|:---:|
| 1 | [TC_Admin_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Admin_Process.md) | **50 TCs** | Quản trị tài khoản, nhân sự, dịch vụ, bảng giá, loại công việc, danh mục chung. | Hoàn thành chuẩn hóa |
| 2 | [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) | **48 TCs** | Đặt lịch hẹn (Khách hàng/Lễ tân), Tiếp nhận xe (Có hẹn, Walk-in, Cứu hộ), Hàng đợi xe. | Hoàn thành chuẩn hóa |
| 3 | [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md) | **38 TCs** | Đăng ký, Đăng nhập, Đăng xuất, Quên/Khôi phục mật khẩu, Xác thực OTP. | Cần làm sạch 4 TC kỹ thuật |
| 4 | [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) | **37 TCs** | Hồ sơ khách hàng, Quản lý xe, Lễ tân CRUD khách & xe, Vô hiệu hóa/Khôi phục. | Cần thêm 3 TC nghiệp vụ |
| 5 | [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) | **60 TCs** | Danh mục & SKU phụ tùng, Nhập/Xuất/Trả kho, Thẻ kho, Bảng giám sát xưởng, Báo cáo vận hành. | Cần thêm 2 TC nhập kho |
| 6 | [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) | **64 TCs** | Khởi tạo lệnh, Check-in, Khám xe 2D, Lập việc, Báo giá, Thi công xưởng, KCS, Bàn giao xe. | Cần thêm 4 TC thi công |
| 7 | [TC_Dashboard_Report_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Dashboard_Report_Process.md) | **50 TCs** | Bảng điều hành đa vai trò (Khách, Quầy, SA, Quản lý, Admin) & Báo cáo phân tích quản trị. | Hoàn thành tạo mới |
| 8 | [TC_Billing_Invoice_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Billing_Invoice_Process.md) | **30 TCs** | Quản lý thu ngân, 4 tab hàng đợi, tạo hóa đơn nháp, chiết khấu quầy, thanh toán đa phương thức, nợ từng phần, in PDF. | **Mới hoàn thành** |
| | **TỔNG CỘNG** | **377 TCs** | | |

---

## II. 🚨 ĐÁNH GIÁ 2 PHÂN HỆ LỚN

### 1. Phân hệ Kế toán / Thu ngân, Hóa đơn & Thanh toán (`TC_Billing_Invoice_Process.md`)
* **Trạng thái:** ✅ **ĐÃ HOÀN THÀNH XÂY DỰNG TOÀN DIỆN (30 TEST CASES)**
* **File tài liệu:** [TC_Billing_Invoice_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Billing_Invoice_Process.md)
* **Các nghiệp vụ đã bao phủ 100%:**
  1. **Quản lý hàng đợi thanh toán 4 Tab nghiệp vụ:** `PENDING` (Chờ lập), `DRAFT` (Hóa đơn nháp), `ISSUED` (Đã phát hành), `PAID` (Đã thu tiền).
  2. **Khởi tạo hóa đơn nháp (`CreateInvoiceDraftModal`):** Tự động trích xuất phụ tùng thực dùng và đơn giá từ báo giá đã duyệt; chặn tạo khi chưa đạt KCS; chặn tạo trùng 2 hóa đơn.
  3. **Điều chỉnh chiết khấu quầy (`DiscountEditorModal`):** Chiết khấu tiền mặt hoặc %, bắt buộc nhập lý do chiết khấu tối thiểu 3 ký tự, chặn chiết khấu vượt tổng tiền.
  4. **Phát hành hóa đơn (`ISSUED`):** Đóng băng chi phí bất biến, đồng bộ hóa đơn sang Cổng khách hàng.
  5. **Thanh toán đa phương thức & Thanh toán từng phần (`PaymentModal`):** Thu tiền mặt (tính tiền thối, chặn thiếu tiền), quẹt thẻ POS ngân hàng, VietQR động (SePay), trả góp từng phần (`PARTIALLY_PAID`), thanh toán hết nợ.
  6. **Mở cổng Xuất xưởng (`Financial Clearance`):** Tự động mở Release Gate cho Cố vấn bàn giao xe khi thanh toán đủ 100%.
  7. **Hủy hóa đơn (`CancelInvoiceModal`):** Hủy hóa đơn chưa thanh toán kèm lý do, chặn hủy hóa đơn đã thanh toán (PAID).
  8. **In ấn & Xuất bản chứng từ:** Xuất hóa đơn / biên lai điện tử ra tệp PDF chuẩn văn phòng.

---

### 2. Phân hệ Quản lý Bảo hành sau sửa chữa (`Warranty Management Process` – UC-81 đến UC-87)
* **Trạng thái:** ⏳ **ĐANG CHỜ THỰC HIỆN TIẾP THEO (Ưu tiên 2)**
* **Thực tế trong source code & Prisma:** Cơ sở dữ liệu đã có đầy đủ trường nghiệp vụ bảo hành: `WorkOrderType: WARRANTY`, `is_warranty`, `warranty_months`, `warranty_mileage`, `child_warranty_orders`, `approved_warranty_claims`.
* **Hiện trạng kiểm thử:** Hiện tại mới chỉ có 2 test case cho Quản lý duyệt bảo hành thiện chí trong `TC_Manager_Process.md` và báo cáo chi phí bảo hành.
* **Các luồng nghiệp vụ bảo hành còn thiếu cần viết bộ test case chuyên biệt (`TC_Warranty_Process.md` khoảng 20 - 24 TCs):**
  1. **Tra cứu thời hạn bảo hành (`UC-81`):** Khách hàng hoặc Lễ tân tra cứu phụ tùng/hạng mục đã thay thế ở các lần sửa chữa trước xem còn trong thời hạn bảo hành hay không (theo số tháng hoặc theo số km ODO).
  2. **Đặt lịch hẹn bảo hành trực tuyến (`UC-82`):** Khách hàng chủ động đặt lịch hẹn bảo hành xe dựa trên các hạng mục còn hạn bảo hành hợp lệ.
  3. **Tiếp nhận xe bảo hành tại quầy (`UC-83`):** Lễ tân tiếp nhận xe vào xưởng với lý do bảo hành, đối chiếu ODO và liên kết với mã Phiếu công việc gốc trước đó.
  4. **Lập Work Order loại bảo hành (`UC-84`):** Cố vấn dịch vụ mở phiếu sửa chữa bảo hành với đơn giá phụ tùng và công thợ tính **0 đồng** cho khách hàng theo đúng chính sách bảo hành.
  5. **Xử lý hóa đơn bảo hành 0đ & Financial Clearance (`UC-85`):** Xuất hóa đơn dịch vụ bảo hành với số tiền khách cần trả là **0 đồng**; hệ thống tự động cấp Financial Clearance cho phép xe xuất xưởng.

---

## III. CHI TIẾT CÁC FLOW CẦN BỔ SUNG / LÀM SẠCH TRONG CÁC BỘ TEST CASE HIỆN CÓ

### 1. Làm sạch & bổ sung [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md)
- **Vấn đề:** Loại bỏ 4 test case kỹ thuật/API/Security (TC-AUTH-27 JWT cookie, TC-AUTH-36 API me, TC-AUTH-37 XSS, TC-AUTH-38 SQLi).
- **Bổ sung thay thế:**
  1. **Đổi mật khẩu chủ động trong Hồ sơ cá nhân (`UC-06`):** Kiểm tra form đổi mật khẩu (nhập mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu; chặn trùng mật khẩu cũ, chặn không khớp).
  2. **Cơ chế Ghi nhớ đăng nhập (Remember Me):** Kiểm tra tích chọn giữ phiên khi mở lại trình duyệt.
  3. **Ẩn / Hiện mật khẩu:** Kiểm tra icon con mắt xem trước mật khẩu.
  4. **Khóa tạm thời khi đăng nhập sai nhiều lần:** Khóa tài khoản 15 phút trên UI khi nhập sai liên tiếp quá 5 lần.

### 2. Bổ sung vào [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md)
- **Bổ sung 3 luồng:**
  1. **Phân loại kích cỡ xe (`vehicleSize`):** Bắt buộc chọn kích cỡ xe khi thêm xe mới (SMALL, MEDIUM, LARGE, XL), liên kết bảng giá dịch vụ theo cỡ xe.
  2. **Kiểm tra tính toàn vẹn số liệu thống kê khách hàng:** Sau khi hoàn tất và thanh toán một lượt xe, kiểm tra số liệu Tổng chi tiêu và Số dịch vụ sử dụng trên hồ sơ khách hàng tự động tích lũy chính xác.
  3. **Tra cứu Lịch sử dịch vụ (`HistoryView.tsx`):** Khách hàng mở tab Lịch sử xem lại toàn bộ các lần làm dịch vụ, ODO từng lần, phụ tùng đã thay và hóa đơn tương ứng.

### 3. Bổ sung vào [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md)
- **Bổ sung 4 luồng thi công:**
  1. **Phát sinh công việc khi đang thi công (Supplementary Work / Change Order):** Thợ phát hiện hư hỏng mới $\to$ Cố vấn tạo báo giá bổ sung $\to$ Khách duyệt online riêng phần phát sinh $\to$ Thợ mới được thi công.
  2. **Tạm dừng và Tiếp tục công việc (Pause / Resume Job):** Thợ tạm dừng việc khi chờ phụ tùng kèm lý do, tiếp tục thi công khi phụ tùng sẵn sàng.
  3. **Phân công & Điều chuyển Kỹ thuật viên (Technician Assignment & Reassignment):** Đổi thợ phụ trách theo tay nghề/bậc thợ khi thợ ban đầu bận đột xuất.
  4. **Ghi chú nội bộ giữa Thợ và Cố vấn dịch vụ:** Thợ ghi chú khuyến nghị kỹ thuật $\to$ Cố vấn đưa vào dặn dò trên Biên bản bàn giao.

### 4. Bổ sung vào [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md)
- **Bổ sung 2 luồng:**
  1. **Khách vãng lai xem bảng giá trang chủ & Đặt hẹn nhanh (`UC-01`):** Khách chưa đăng nhập bấm Đặt hẹn ngay từ trang chủ $\to$ chuyển hướng đăng nhập rồi giữ lại thông tin dịch vụ đã chọn.
  2. **Ghi nhận biên bản bàn giao tài sản khi Tiếp nhận:** Ghi nhận đồ đạc có giá trị và mức xăng ban đầu vào biên bản bàn giao tạm thời trước khi chuyển giao cho SA.

### 5. Bổ sung vào [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md)
- **Bổ sung 2 luồng:**
  1. **Biến động giá vốn nhập kho & Cảnh báo biên lợi nhuận:** Cảnh báo khi giá vốn WAC mới vượt giá bán niêm yết hiện tại.
  2. **Hủy phiếu nhập kho nháp / Xuất trả hàng nhà cung cấp:** Hủy phiếu nháp hoặc xuất trả hàng nhà cung cấp khi hàng giao bị lỗi.

---

## IV. LỘ TRÌNH THỰC HIỆN TIẾP THEO

```
[ĐÃ HOÀN THÀNH - Ưu tiên 1] 
└── TC_Billing_Invoice_Process.md (30 TCs cho phân hệ Thu ngân, Hóa đơn & Thanh toán)

[Ưu tiên 2 - Tiếp theo] 
└── Viết bộ test case mới: TC_Warranty_Process.md (khoảng 20-24 TCs cho phân hệ Bảo hành UC-81 -> UC-85)

[Ưu tiên 3] 
└── Làm sạch TC_Auth_Profile_Process.md (loại bỏ 4 test case API/Security, thay bằng Đổi mật khẩu chủ động, Remember Me, Ẩn/Hiện mật khẩu)

[Ưu tiên 4] 
└── Bổ sung các kịch bản còn thiếu vào TC_WorkOrder_SA_Process.md, TC_Customer_Profile_Process.md, TC_Appointment_Intake_Process.md, TC_Manager_Process.md

[Ưu tiên 5] 
└── Đồng bộ lại số liệu tổng thể trong TestPlan.md và TEST_CHECKLIST.md
```
