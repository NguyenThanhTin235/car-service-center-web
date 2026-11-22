# BẢNG CHECKLIST THIẾT KẾ & BAO PHỦ KIỂM THỬ (TEST DESIGN & COVERAGE CHECKLIST)
## HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (CAR SERVICE CENTER)

> **Mục đích tài liệu:** Định hình danh mục các điều kiện, kịch bản nghiệp vụ và tiêu chí chất lượng cần được bao phủ; làm căn cứ tiên quyết để phân công thiết kế bộ kịch bản kiểm thử chi tiết (Manual Test Cases), lập trình các bộ kiểm thử tự động (Automated Tests) và phân tích kiểm thử hộp trắng (White-box Testing).  
> **Tài liệu căn cứ:**  
> - Tài liệu Đặc tả Yêu cầu Hệ thống: [\`docs/requirements/Requirement v3.md\`](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/requirements/Requirement%20v3.md)  
> - Tài liệu Đặc tả Use Case: [\`docs/requirements/UseCase V2.md\`](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/requirements/UseCase%20V2.md)  
> - Đặc tả Máy trạng thái Phiếu công việc: [\`docs/requirements/WORK_ORDER_STATUS_TRANSITION.md\`](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/requirements/WORK_ORDER_STATUS_TRANSITION.md)  
> - Đặc tả Công thức Tính giá & Tài chính: [\`docs/requirements/Pricing_Calculation_Formulas.md\`](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/requirements/Pricing_Calculation_Formulas.md)  
> - Kế hoạch Kiểm thử Tổng thể: [\`docs/testing/TestPlan.md\`](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/TestPlan.md)  
> **Ngày ban hành:** 26/10/2026 | **Phiên bản:** 1.0 (Baseline chuẩn trước khi thiết kế Test Cases)  
> **Người lập:** Đội ngũ QA / Test Lead

---

## MỤC LỤC
1. [Nguyên tắc & Hướng dẫn Sử dụng Checklist](#1-nguyên-tắc--hướng-dẫn-sử-dụng-checklist)
2. [Checklist Chuẩn bị Môi trường & Tiền điều kiện Kiểm thử](#2-checklist-chuẩn-bị-môi-trường--tiền-điều-kiện-kiểm-thử)
3. [Checklist Định hướng Kiểm thử Tự động (Automated Testing Strategy)](#3-checklist-định-hướng-kiểm-thử-tự-động-automated-testing-strategy)
4. [Checklist Định hướng Kiểm thử Hộp trắng (White-box Testing Scope - 10 Hàm Cốt lõi)](#4-checklist-định-hướng-kiểm-thử-hộp-trắng-white-box-testing-scope---10-hàm-cốt-lõi)
5. [Checklist Bao phủ Nghiệp vụ Chức năng theo Tác nhân & Use Case](#5-checklist-bao-phủ-nghiệp-vụ-chức-năng-theo-tác-nhân--use-case)
   - [5.1 Phân hệ Xác thực, Phân quyền & Quản lý Phiên (UC-01 → UC-05, UC-54 → UC-61)](#51-phân-hệ-xác-thực-phân-quyền--quản-lý-phiên-uc-01--uc-05-uc-54--uc-61)
   - [5.2 Phân hệ Cổng Khách hàng Trực tuyến & Phương tiện (UC-06 → UC-16, UC-80)](#52-phân-hệ-cổng-khách-hàng-trực-tuyến--phương-tiện-uc-06--uc-16-uc-80)
   - [5.3 Phân hệ Quản lý Lịch hẹn & Tiếp nhận xe tại Quầy (UC-11 → UC-25, UC-79)](#53-phân-hệ-quản-lý-lịch-hẹn--tiếp-nhận-xe-tại-quầy-uc-11--uc-25-uc-79)
   - [5.4 Phân hệ Phiếu công việc, Sơ đồ 2D & Cố vấn Dịch vụ (UC-26, UC-29 → UC-43)](#54-phân-hệ-phiếu-công-việc-sơ-đồ-2d--cố-vấn-dịch-vụ-uc-26-uc-29--uc-43)
   - [5.5 Phân hệ Quản lý Kho, Vật tư & Vận hành Xưởng (UC-44 → UC-53, UC-86, UC-87)](#55-phân-hệ-quản-lý-kho-vật-tư--vận-hành-xưởng-uc-44--uc-53-uc-86-uc-87)
   - [5.6 Phân hệ Quản trị Dữ liệu chủ & Cấu hình Hệ thống (UC-54 → UC-78)](#56-phân-hệ-quản-trị-dữ-liệu-chủ--cấu-hình-hệ-thống-uc-54--uc-78)
6. [Checklist Các Chốt chặn Nghiệp vụ Cốt lõi (Critical Business Gates)](#6-checklist-các-chốt-chặn-nghiệp-vụ-cốt-lõi-critical-business-gates)
7. [Checklist Tiêu chuẩn Nghiệm thu Đề tài (Acceptance Criteria AC-01 → AC-07)](#7-checklist-tiêu-chuẩn-nghiệm-thu-đề-tài-acceptance-criteria-ac-01--ac-07)
8. [Checklist Quy trình Theo dõi & Bàn giao Sản phẩm Kiểm thử](#8-checklist-quy-trình-theo-dõi--bàn-giao-sản-phẩm-kiểm-thử)

---

## 1. NGUYÊN TẮC & HƯỚNG DẪN SỬ DỤNG CHECKLIST

Tài liệu này được lập ở giai đoạn **Test Planning & Design** (ngay sau khi hoàn thành tài liệu đặc tả yêu cầu và kế hoạch kiểm thử tổng thể). Mục tiêu là thiết lập "khung xương" kiểm soát chất lượng trước khi nhóm tiến hành viết kịch bản chi tiết và triển khai code kiểm thử:

1. **Định hướng thiết kế (Design Blueprint):** Mỗi mục checklist đại diện cho một điều kiện kiểm tra (Test Condition / Verification Point). Khi viết test case chi tiết (Manual Test Cases) hoặc viết test tự động, người phụ trách phải đối soát để đảm bảo có ít nhất một kịch bản kiểm thử bao phủ mục đó.
2. **Kỹ thuật kiểm thử bắt buộc áp dụng khi viết kịch bản:**
   - **Phân vùng tương đương (Equivalence Partitioning):** Xác định rõ vùng dữ liệu hợp lệ (Positive) và không hợp lệ (Negative).
   - **Phân tích giá trị biên (Boundary Value Analysis):** Bắt buộc kiểm tra các ngưỡng biên (Min, Max, Min-1, Max+1, rỗng, 0).
   - **Chuyển đổi trạng thái (State Transition):** Kiểm tra tất cả các bước chuyển hợp lệ và chặn đứng các bước chuyển trái phép.
   - **Bảng quyết định (Decision Table):** Sử dụng cho các chốt chặn kết hợp nhiều điều kiện đồng thời.
3. **Quy ước cột trạng thái theo dõi:**
   - `[ ]` : Hạng mục đã được xác định, chờ thiết kế kịch bản / viết mã kiểm thử.
   - `[D]` : Đã hoàn thành thiết kế kịch bản kiểm thử (Designed).
   - `[P]` : Đã thực thi kiểm thử và Đạt yêu cầu (Passed).
   - `[F]` : Đã thực thi kiểm thử nhưng Phát hiện lỗi (Failed / Logged Bug).

---

## 2. CHECKLIST CHUẨN BỊ MÔI TRƯỜNG & TIỀN ĐIỀU KIỆN KIỂM THỬ

*Các yêu cầu tiên quyết về hạ tầng và dữ liệu cần được chuẩn bị sẵn sàng trước khi bước vào giai đoạn thực thi kiểm thử:*

| STT | Yêu cầu Chuẩn bị Môi trường & Dữ liệu | Tiêu chí Hoàn thành | Trạng thái |
| :---: | :--- | :--- | :---: |
| **2.1** | **Môi trường Runtime & Công cụ** | Cài đặt hoàn chỉnh Node.js LTS (>= 18), Python 3.8+, Git, Playwright Browsers | [ ] |
| **2.2** | **Cơ sở dữ liệu Kiểm thử Cục bộ** | Khởi tạo MySQL Server cục bộ/Docker, cấu hình database riêng biệt cho kiểm thử | [ ] |
| **2.3** | **Đồng bộ Schema & ORM** | Chạy thành công Prisma Migration (`prisma migrate dev`) và sinh Prisma Client | [ ] |
| **2.4** | **Chuẩn bị Bộ Dữ liệu Mẫu (Seed Data)** | Nạp dữ liệu nền tảng đầy đủ: đủ 7 vai trò người dùng mẫu, danh mục dịch vụ chuẩn, hãng/dòng xe, SKU phụ tùng ban đầu, hồ sơ khách hàng mẫu | [ ] |
| **2.5** | **Cấu hình Môi trường (.env)** | Cấu hình bảo mật JWT Secret, PORT=3002 (API), DATABASE_URL, CORS whitelist, Mock flags cho dịch vụ bên ngoài | [ ] |
| **2.6** | **Cổng Dịch vụ Khách hàng (Customer Web)** | Chạy ứng dụng Next.js cổng 3000, kiểm tra hiển thị trang chủ, bảng giá, đăng nhập | [ ] |
| **2.7** | **Cổng Vận hành Nội bộ (Internal Web)** | Chạy ứng dụng Next.js cổng 3001, kiểm tra hiển thị form đăng nhập nhân viên | [ ] |
| **2.8** | **Cơ chế Phân lập Dịch vụ Ngoài (Mocking)** | Thiết lập cơ chế giả lập cho Nodemailer (Email OTP/Nhắc hẹn) và Cloudinary (Ảnh tiếp nhận) để bài test chạy độc lập hoàn toàn | [ ] |

---

## 3. CHECKLIST ĐỊNH HƯỚNG KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING STRATEGY)

*Kế hoạch tự động hóa áp dụng mô hình Kim tự tháp kiểm thử 3 tầng (Test Pyramid), đặt mục tiêu 100% Pass và thực thi siêu tốc (< 1 phút):*

### 3.1 Tầng 1: Backend Unit Tests (Mục tiêu: ~45 tests, thời gian thực thi < 2s)
- [ ] **Bộ kiểm thử AI RAG Guardrails (`ai-rag-validator`):**
  - [ ] Khử trùng lặp: Lọc bỏ triệt để các công việc trùng tên trong cùng một nhóm dịch vụ.
  - [ ] Chuẩn hóa chuỗi tiếng Việt: Bỏ dấu, chữ hoa/thường, loại khoảng trắng thừa.
  - [ ] Cơ chế Fallback an toàn: Tự động gán mã loại thợ mặc định khi AI trả về mã không hợp lệ.
  - [ ] An toàn dữ liệu: Xử lý an toàn mảng rỗng đầu vào (không crash tiến trình server).
  - [ ] Chống trùng với DB: Bỏ qua công việc nếu đã tồn tại trên phiếu công việc.
  - [ ] Ràng buộc trạng thái: Chỉ sinh việc cho dịch vụ đang `PENDING`.
- [ ] **Bộ kiểm thử Công thức Tính toán Tài chính (`pricing-calculator`):**
  - [ ] Tính tổng tiền công lao động: $\text{Labour} = \sum (\text{hours} \times \text{hourly\_rate})$.
  - [ ] Tính tổng phụ tùng: $\text{Parts} = \sum (\text{quantity} \times \text{unit\_price})$.
  - [ ] Hệ số kích thước phương tiện (Vehicle Size Multiplier cho Sedan, SUV, Bán tải).
  - [ ] Quy định Zero-Tax (SPEC-FIN-02): Thuế suất = 0, tiền thuế = 0đ.
  - [ ] Giới hạn chiết khấu: Tự động chặn chiết khấu vượt quá Subtotal ($\text{Discount} \le \text{Subtotal}$).
  - [ ] Tổng thanh toán cuối cùng: $\text{GrandTotal} = \text{Subtotal} - \text{Discount} \ge 0$.
- [ ] **Bộ kiểm thử Dịch vụ Báo giá (`quotation.service`):**
  - [ ] Quản lý phiên bản tự động: Tăng phiên bản (`v1` $\rightarrow$ `v2`) khi SA điều chỉnh phương án.
  - [ ] Snapshot cố định: Đóng băng toàn bộ đơn giá tại thời điểm phê duyệt.
  - [ ] Tổng hợp chi phí: Tính đúng tổng tiền của tất cả dịch vụ và phụ tùng liên kết.
  - [ ] Khóa bất biến: Chặn sửa đổi khi báo giá đã đạt trạng thái `APPROVED`.
- [ ] **Bộ kiểm thử Máy trạng thái Phiếu công việc (`work-order-guards` & `start-work`):**
  - [ ] Kiểm tra ma trận chuyển đổi hợp lệ giữa 8 trạng thái.
  - [ ] Điều kiện bắt đầu thi công: Chỉ cho phép khi trạng thái là `APPROVED`.
  - [ ] Chặn thi công khi còn `DRAFT`, `PENDING_APPROVAL`, `CANCELLED` hoặc `RELEASED`.
  - [ ] Release Gate: Cho phép bàn giao (`RELEASED`) khi thỏa mãn đồng thời 3 điều kiện: Thi công xong + Pass QC + Hóa đơn `PAID`.
  - [ ] Chặn bàn giao khi hóa đơn còn nợ (`UNPAID`) hoặc chưa Pass QC.
- [ ] **Bộ kiểm thử Giá vốn Bình quân & Tồn kho (`inventory-wac`):**
  - [ ] Tính lại giá vốn Moving WAC khi nhập kho lô hàng mới:
    $$\text{WAC}_{\text{new}} = \frac{(\text{Qty}_{\text{old}} \times \text{WAC}_{\text{old}}) + (\text{Qty}_{\text{in}} \times \text{Price}_{\text{in}})}{\text{Qty}_{\text{old}} + \text{Qty}_{\text{in}}}$$
  - [ ] Khởi tạo WAC cho lô hàng nhập kho đầu tiên.
  - [ ] Xuất kho không làm biến động đơn giá vốn WAC hiện hành.
  - [ ] Tính tồn khả dụng: $\text{Available} = \text{On-Hand} - \text{Reserved}$.
  - [ ] Chặn xuất kho vượt tồn khả dụng (bảo vệ nguyên tắc Kho không âm).
- [ ] **Bộ kiểm thử Tiện ích Xác thực & Nhắc hẹn (`auth-helpers`, `auto-reminder`):**
  - [ ] Băm mật khẩu bcrypt $\ge$ 10 salt rounds; kiểm tra so khớp mật khẩu.
  - [ ] Cấp phát & giải mã JWT chứa đúng định danh và phân quyền.
  - [ ] Sinh OTP 6 chữ số và hết hạn chính xác sau 5 phút.
  - [ ] Tiến trình quét lịch hẹn tự động trước 24 giờ và gửi email nhắc lịch.

### 3.2 Tầng 2: Backend Integration Tests (Mục tiêu: ~58 tests, thời gian thực thi < 8s)
- [ ] **Kiểm thử Xác thực & Phân quyền RBAC (`auth-rbac`):**
  - [ ] Endpoint bảo vệ: Chặn truy cập khi thiếu token hoặc token giả/hết hạn (HTTP 401).
  - [ ] Phân quyền cổng: Chặn vai trò `CUSTOMER` truy cập endpoint nghiệp vụ xưởng (HTTP 403).
  - [ ] Rào chắn Header `x-portal: internal` chặn khách hàng mở API nội bộ.
  - [ ] Xác thực quyền truy cập hợp lệ theo đúng vai trò: Lễ tân, SA, Quản lý, Admin.
- [ ] **Kiểm thử API Tiếp nhận xe tại Quầy (`intake-api`):**
  - [ ] Tạo phiếu tiếp nhận Walk-in trạng thái `QUEUED`.
  - [ ] Tiếp nhận Tow-in bắt buộc có đơn vị cứu hộ; báo lỗi HTTP 400 nếu thiếu.
  - [ ] Chống trùng xe: Báo lỗi 400 khi xe đang có phiếu tiếp nhận `QUEUED`.
  - [ ] Tra cứu chi tiết phiếu tiếp nhận (200 OK / 404 Not Found).
  - [ ] Hủy phiếu tiếp nhận `QUEUED`; chặn hủy khi đã chuyển thành Work Order (`CONVERTED`).
- [ ] **Kiểm thử API Phiếu công việc (`work-order-api`):**
  - [ ] Tạo Work Order chuẩn mã `WO-YYMMDD-XXX` và chuyển Intake sang `CONVERTED`.
  - [ ] Chặn khách hàng tạo Work Order (HTTP 403).
  - [ ] Khởi động thi công khi Work Order ở trạng thái `APPROVED`.
  - [ ] Chặn bắt đầu thi công khi Work Order chưa được duyệt (HTTP 400/422).
  - [ ] Tra cứu tiến độ `/my-tracking` dành riêng cho khách hàng sở hữu xe.
- [ ] **Kiểm thử API Báo giá & Phê duyệt (`quotation-api`):**
  - [ ] Xác nhận cấu trúc Zero-Tax trên API chi tiết báo giá.
  - [ ] Khách hàng phê duyệt báo giá $\rightarrow$ chuyển `APPROVED`.
  - [ ] Chặn phê duyệt lại báo giá đã duyệt (chống duplicate action).
  - [ ] Khách hàng từ chối báo giá kèm lý do từ chối.
- [ ] **Kiểm thử API Lịch hẹn (`appointment-api`):**
  - [ ] Khách hàng tra cứu lịch của mình; Lễ tân tra cứu lịch toàn xưởng.
  - [ ] Đặt lịch hẹn mới thành công; chặn đặt ngoài khung giờ 8h00 - 17h00.
  - [ ] Chặn trùng lịch cho cùng một phương tiện trong cùng một ngày.
  - [ ] Dời lịch hẹn (`RESCHEDULED`); Lễ tân xác nhận lịch (`CONFIRMED`).
  - [ ] Khách hủy lịch `REQUESTED` kèm lý do; chặn khách tự hủy khi đã `CONFIRMED`.
  - [ ] Đánh dấu xe đã đến xưởng (`ARRIVED`) và sinh bản ghi `IntakeRecord`.
- [ ] **Kiểm thử API Hóa đơn & Thanh toán (`invoice-payment-api`):**
  - [ ] Khách hàng lấy danh sách hóa đơn và 4 thẻ chỉ số Bento.
  - [ ] Bảo mật IDOR: Chặn khách hàng xem hóa đơn của người khác (HTTP 403).
  - [ ] Nhân viên nội bộ có quyền tra cứu hóa đơn phục vụ thu ngân.

### 3.3 Tầng 3: Frontend Playwright E2E Tests (Mục tiêu: ~8 tests, kiểm thử trình duyệt thật)
- [ ] **Luồng Khách hàng Đặt lịch & Quản lý xe (`customer-booking`):**
  - [ ] Form đăng nhập khách hàng kiểm tra dữ liệu đầu vào và chuyển trang thành công.
  - [ ] Wizard đặt lịch 3 bước: Chọn xe $\rightarrow$ Chọn dịch vụ $\rightarrow$ Chọn ngày giờ $\rightarrow$ Hoàn tất.
  - [ ] Hiển thị danh sách phương tiện cá nhân kèm biển số, dòng xe, năm sản xuất.
- [ ] **Luồng Cố vấn Quản lý Vòng đời Work Order (`advisor-wo-lifecycle`):**
  - [ ] Cố vấn đăng nhập Cổng Nội bộ $\rightarrow$ Dashboard điều hành xưởng.
  - [ ] Điều hướng các tab: Thông tin chung, Hạng mục việc, Khám xe sơ đồ 2D, Báo giá.
  - [ ] AI Job Planner: Mở modal gợi ý, tự động nhận diện việc đã có trong phiếu (gắn badge "Đã có"), áp dụng việc mới vào phiếu thành công.
- [ ] **Rào chắn Phân quyền & Phiên làm việc (`auth-rbac-guard`):**
  - [ ] Chặn tài khoản khách hàng đăng nhập vào Cổng Nội bộ (:3001).
  - [ ] Xóa cookie phiên và điều hướng an toàn khi người dùng cố tình truy cập trái phép.

---

## 4. CHECKLIST ĐỊNH HƯỚNG KIỂM THỬ HỘP TRẮNG (WHITE-BOX TESTING SCOPE - 10 HÀM CỐT LÕI)

*Yêu cầu đồ án: 10 đơn vị mã nguồn phức tạp (2 hàm/thành viên cho nhóm 5 người). Mỗi hàm bắt buộc hoàn thành đủ 5 tiêu chuẩn phân tích:*
*a) Vẽ Đồ thị dòng điều khiển (CFG) | b) Tính Độ phức tạp Cyclomatic $V(G)$ | c) Thiết kế Test Cases theo đường thi hành độc lập | d) Vẽ Đồ thị dòng dữ liệu (DFG) | e) Kiểm thử Vòng đời biến (Def-Use pairs)*

- [ ] **Đơn vị 1: `calculateLaborTotal()`** *(pricing-calculator.ts)*
  - [ ] Tiêu chí chọn: Chứa logic phân nhánh theo giờ công, đơn giá thợ và hệ số loại xe.
  - [ ] Yêu cầu bao phủ: Nhánh giờ = 0, giờ > 0, hệ số xe tiêu chuẩn, hệ số xe đặc thù (SUV/Bán tải).
- [ ] **Đơn vị 2: `calculatePartsTotal()`** *(pricing-calculator.ts)*
  - [ ] Tiêu chí chọn: Chứa vòng lặp tính phụ tùng, kiểm tra đơn giá và số lượng.
  - [ ] Yêu cầu bao phủ: Danh sách rỗng, phụ tùng giá 0đ (miễn phí), nhiều phụ tùng có số lượng > 1.
- [ ] **Đơn vị 3: `applyDiscount()`** *(pricing-calculator.ts)*
  - [ ] Tiêu chí chọn: Logic tính chiết khấu kép (tiền mặt VNĐ hoặc phần trăm %) và chặn trần.
  - [ ] Yêu cầu bao phủ: Chiết khấu = 0, chiết khấu % hợp lệ, chiết khấu tiền mặt vượt quá Subtotal.
- [ ] **Đơn vị 4: `calculateGrandTotal()`** *(pricing-calculator.ts)*
  - [ ] Tiêu chí chọn: Tính toán số tiền cuối cùng và bảo đảm nguyên tắc không âm.
  - [ ] Yêu cầu bao phủ: Nhánh Subtotal > Discount, Subtotal = Discount, Subtotal < Discount (biên phòng ngừa).
- [ ] **Đơn vị 5: `validateWorkOrderTransition()`** *(work-order-guards.ts)*
  - [ ] Tiêu chí chọn: Máy trạng thái hữu hạn (FSM) gồm 8 trạng thái với hàng chục bước chuyển.
  - [ ] Yêu cầu bao phủ: Đường chuyển tuần tự hợp lệ, đường chuyển tắt bị chặn, đường chuyển ngược (Rework).
- [ ] **Đơn vị 6: `checkReleaseGate()`** *(work-order-guards.ts)*
  - [ ] Tiêu chí chọn: Biểu thức logic phức hợp 3 điều kiện đồng thời để bàn giao xe xuất xưởng.
  - [ ] Yêu cầu bao phủ: Đủ cả 8 tổ hợp chân lý (Truth Table) của 3 biến: `isJobsDone`, `isQcPassed`, `isInvoicePaid`.
- [ ] **Đơn vị 7: `recalculateWAC()`** *(inventory-wac.ts)*
  - [ ] Tiêu chí chọn: Công thức tài chính tính giá vốn bình quân di động.
  - [ ] Yêu cầu bao phủ: Lô đầu tiên (tồn cũ = 0), lô bổ sung (tồn cũ > 0, giá mới khác giá cũ).
- [ ] **Đơn vị 8: `checkAvailableStock()`** *(inventory-wac.ts)*
  - [ ] Tiêu chí chọn: Chốt chặn kiểm tra tồn khả dụng, ngăn chặn xuất âm kho.
  - [ ] Yêu cầu bao phủ: Yêu cầu < Khả dụng, Yêu cầu = Khả dụng, Yêu cầu > Khả dụng.
- [ ] **Đơn vị 9: `validateAiJobSuggestions()`** *(ai-rag-validator.ts)*
  - [ ] Tiêu chí chọn: Thuật toán lọc trùng và chuẩn hóa chuỗi tiếng Việt phức tạp.
  - [ ] Yêu cầu bao phủ: Danh sách không trùng, trùng hoàn toàn, trùng sai biệt dấu/hoa thường/khoảng trắng, job_type_id không hợp lệ.
- [ ] **Đơn vị 10: `approveQuotation()`** *(quotation-service.ts)*
  - [ ] Tiêu chí chọn: Xử lý giao dịch duyệt báo giá, snapshot đơn giá và kích hoạt giữ kho.
  - [ ] Yêu cầu bao phủ: Duyệt lần đầu thành công, duyệt khi báo giá đã duyệt trước đó, cập nhật Work Order sang APPROVED.

---

## 5. CHECKLIST BAO PHỦ NGHIỆP VỤ CHỨC NĂNG THEO TÁC NHÂN & USE CASE

*Danh mục chi tiết các điều kiện kiểm tra cần thiết kế thành Test Cases thủ công (Manual Test Cases):*

### 5.1 Phân hệ Xác thực, Phân quyền & Quản lý Phiên (UC-01 → UC-05, UC-54 → UC-61)
- [ ] **Quy trình Đăng ký tài khoản Khách hàng (UC-02):**
  - [ ] Đăng ký thành công với thông tin hợp lệ và mã OTP email chuẩn.
  - [ ] Kiểm tra tính duy nhất: Chặn đăng ký trùng Email hoặc trùng Số điện thoại đã có.
  - [ ] Kiểm tra độ dài mật khẩu biên (tối thiểu 6 ký tự).
  - [ ] Kiểm tra thời hạn hiệu lực OTP (5 phút): Hợp lệ tại 299s, báo hết hạn tại 301s.
  - [ ] Xử lý khi người dùng nhập sai mã OTP nhiều lần.
  - [ ] Kiểm tra cơ chế gửi lại mã OTP (Resend) kèm đồng hồ đếm ngược 60 giây (Countdown).
  - [ ] Kiểm tra khớp mật khẩu xác nhận (Confirm password mismatch).
  - [ ] Kiểm tra định dạng số điện thoại theo chuẩn di động Việt Nam.
  - [ ] Kiểm tra độ dài họ và tên (từ 2 đến 150 ký tự).
  - [ ] Chặn nhập mã OTP chứa chữ cái hoặc ký tự đặc biệt.
- [ ] **Quy trình Đăng nhập hệ thống (UC-03):**
  - [ ] Đăng nhập thành công với tài khoản Khách hàng.
  - [ ] Đăng nhập nhân sự và điều hướng đúng không gian làm việc theo 4 vai trò:
    - [ ] Admin $\rightarrow$ `/accounts`
    - [ ] Quản lý dịch vụ $\rightarrow$ `/dashboard`
    - [ ] Lễ tân $\rightarrow$ `/intake`
    - [ ] Cố vấn dịch vụ $\rightarrow$ `/work-orders`
  - [ ] Chặn đăng nhập tài khoản nhân viên đang bị tạm khóa (`isActive = false`).
  - [ ] Cơ chế khóa tạm tài khoản sau 5 lần nhập sai mật khẩu liên tiếp.
  - [ ] Thông báo lỗi an toàn khi nhập email không tồn tại hoặc sai mật khẩu.
  - [ ] Kiểm tra lưu trữ Cookie JWT an toàn (`HttpOnly`, `SameSite=Strict`).
- [ ] **Quy trình Đăng xuất (UC-04):**
  - [ ] Đăng xuất an toàn và chặn nút Back của trình duyệt quay lại trang bảo mật.
  - [ ] Hộp thoại xác nhận đăng xuất: Kiểm tra hủy bỏ đăng xuất giữ nguyên phiên làm việc.
  - [ ] Đồng bộ trạng thái đăng xuất trên nhiều tab trình duyệt (Multi-tab Logout).
- [ ] **Quy trình Quên & Đặt lại mật khẩu (UC-05):**
  - [ ] Yêu cầu quên mật khẩu với email không tồn tại (thông báo an toàn bảo vệ quyền riêng tư).
  - [ ] Đặt lại mật khẩu thành công bằng mã OTP gửi qua email.
  - [ ] Kiểm tra OTP quên mật khẩu hết hạn hoặc nhập sai.
  - [ ] Bắt buộc mật khẩu mới và mật khẩu xác nhận phải trùng khớp.
- [ ] **Bảo mật & Rào chắn AuthGuard:**
  - [ ] AuthGuard chặn mở trực tiếp URL nội bộ khi chưa đăng nhập, tự động chuyển về Login kèm URL chuyển tiếp.
  - [ ] Chặn gọi trực tiếp API người dùng khi thiếu Bearer Token (HTTP 401).
  - [ ] Kiểm tra phòng chống tấn công XSS trên các form nhập liệu và SQL Injection trên form đăng nhập.

### 5.2 Phân hệ Cổng Khách hàng Trực tuyến & Phương tiện (UC-06 → UC-16, UC-80)
- [ ] **Quản lý Hồ sơ cá nhân (UC-06, UC-07):**
  - [ ] Xem và cập nhật thông tin cá nhân: Họ tên, số điện thoại, địa chỉ, ảnh đại diện.
  - [ ] Đổi mật khẩu: Xác thực mật khẩu cũ chính xác và mật khẩu mới đạt chuẩn bảo mật.
- [ ] **Quản lý Phương tiện cá nhân (UC-08, UC-09, UC-10):**
  - [ ] Khai báo xe mới: Biển số, hãng xe, dòng xe, năm sản xuất, số VIN, phân loại cỡ xe.
  - [ ] Chặn khai báo biển số xe đã tồn tại trong hệ thống.
  - [ ] Cập nhật thông tin xe đã lưu.
  - [ ] Xóa xe khỏi danh sách (chỉ cho phép xóa khi xe không có phiếu sửa chữa đang mở).
- [ ] **Theo dõi Tiến độ Dịch vụ Trực tuyến (UC-15):**
  - [ ] Hiển thị thông tin xe đang làm dịch vụ, tên và số điện thoại Cố vấn phụ trách.
  - [ ] Hiển thị trực quan thanh tiến độ trạng thái theo thời gian thực (Check-in $\rightarrow$ Khám xe $\rightarrow$ Báo giá $\rightarrow$ Thi công $\rightarrow$ QC $\rightarrow$ Bàn giao).
  - [ ] Hỗ trợ chuyển đổi theo dõi linh hoạt giữa nhiều xe của cùng một khách hàng.
  - [ ] Mở xem Biên bản tiếp nhận xe trực tuyến (Số ODO, mức xăng, tài sản, ảnh hiện trường).
- [ ] **Phê duyệt Báo giá Trực tuyến (UC-38, UC-40):**
  - [ ] Banner nổi bật thông báo khi có báo giá dịch vụ chờ khách hàng duyệt.
  - [ ] Xem chi tiết minh bạch từng mục: Tiền công thợ, tiền phụ tùng, chính sách thuế 0%, chiết khấu.
  - [ ] Thao tác duyệt báo giá trực tuyến $\rightarrow$ Chuyển trạng thái sang `APPROVED`.
  - [ ] Thao tác từ chối báo giá kèm lý do từ chối phản hồi cho Cố vấn.
- [ ] **Tra cứu Hóa đơn & Đánh giá Dịch vụ (UC-16, UC-43, UC-80):**
  - [ ] Tra cứu danh sách hóa đơn cá nhân kèm thống kê chi tiêu tổng hợp.
  - [ ] Gửi đánh giá mức độ hài lòng khách hàng (CSAT 1-5 sao) sau khi nhận xe.
  - [ ] Tra cứu lịch sử sửa chữa trọn đời của phương tiện.

### 5.3 Phân hệ Quản lý Lịch hẹn & Tiếp nhận xe tại Quầy (UC-11 → UC-25, UC-79)
- [ ] **Đặt Lịch hẹn Trực tuyến & Tại quầy (UC-11, UC-17):**
  - [ ] Đặt lịch thành công có chọn trước danh sách dịch vụ yêu cầu.
  - [ ] Đặt lịch thành công chỉ kèm mô tả hiện trạng triệu chứng hư hỏng.
  - [ ] Kiểm tra giờ hẹn tại 2 mốc biên hợp lệ: 08:00 (mở cửa) và 17:00 (cuối ngày).
  - [ ] Chặn đặt lịch ngoài khung giờ hành chính (trước 08:00 hoặc sau 17:00).
  - [ ] Chặn chọn ngày hoặc giờ hẹn trong quá khứ.
  - [ ] Ràng buộc duy nhất: Chặn đặt trùng lịch cho cùng một phương tiện trong cùng một ngày.
  - [ ] Bảo mật quyền sở hữu: Chặn khách hàng đặt lịch cho xe của người khác.
  - [ ] Kiểm tra các trường thông tin bắt buộc khi gửi biểu mẫu đặt lịch.
- [ ] **Tra cứu, Lọc & Xác nhận Lịch hẹn (UC-12, UC-18, UC-19):**
  - [ ] Khách hàng tra cứu danh sách lịch hẹn của riêng mình.
  - [ ] Lễ tân xem lưới lịch hẹn toàn xưởng đa chế độ xem: Ngày / Tuần / Tháng (Calendar Grid).
  - [ ] Lễ tân tìm kiếm và lọc lịch hẹn theo Biển số xe, Tên khách hàng và Trạng thái.
  - [ ] Lễ tân xác nhận lịch hẹn (`REQUESTED` $\rightarrow$ `CONFIRMED`) và tự động gửi email xác nhận.
  - [ ] Chặn khách hàng tự ý xác nhận lịch hẹn của chính mình.
- [ ] **Dời lịch & Hủy Lịch hẹn (UC-13, UC-14, UC-21, UC-22):**
  - [ ] Khách hàng tự dời lịch hẹn khi lịch đang ở trạng thái `REQUESTED`.
  - [ ] Chặn khách hàng tự dời lịch khi lịch đã được Lễ tân xác nhận (`CONFIRMED`).
  - [ ] Lễ tân có thẩm quyền hỗ trợ dời lịch cho khách hàng khi có yêu cầu đột xuất.
  - [ ] Hủy lịch hẹn thành công kèm lý do hủy bắt buộc và gửi email thông báo hủy.
  - [ ] Bắt buộc nhập lý do hủy hẹn (chặn để trống lý do).
  - [ ] Chặn hủy lịch hẹn khi xe đã được tiếp nhận đến xưởng (`ARRIVED`).
- [ ] **Đa kênh Tiếp nhận xe vào Xưởng (UC-20, UC-23, UC-24, UC-25):**
  - [ ] Tiếp nhận xe có lịch hẹn: Lịch chuyển sang `ARRIVED`, sinh `IntakeRecord` `QUEUED` và sao chép toàn bộ dịch vụ đăng ký trước đó.
  - [ ] Chặn tiếp nhận xe từ lịch hẹn chưa được xác nhận (`REQUESTED`).
  - [ ] Chặn tạo trùng phiếu tiếp nhận khi xe đã có phiếu đang chờ trong hàng đợi (`QUEUED`).
  - [ ] Tiếp nhận xe khách vãng lai (`WALK_IN`) cho khách hàng cũ đã có thông tin.
  - [ ] Tiếp nhận xe `WALK_IN` kèm chức năng Tạo nhanh Khách hàng mới + Xe mới trong 1 Transaction.
  - [ ] Tiếp nhận xe cứu hộ (`TOW_IN`) bắt buộc ghi nhận tên đơn vị hoặc người giao xe.
  - [ ] Bàn giao xe từ Hàng đợi tiếp nhận sang Lệnh sửa chữa xưởng (`CONVERTED`).

### 5.4 Phân hệ Phiếu công việc, Sơ đồ 2D & Cố vấn Dịch vụ (UC-26, UC-29 → UC-43)
- [ ] **Khởi tạo Phiếu công việc & Check-in Gate (UC-29, UC-30):**
  - [ ] Chuyển phiếu tiếp nhận thành Work Order, tự động sinh mã chuẩn `WO-YYMMDD-XXX`.
  - [ ] Chặn tạo Work Order mới khi xe đã có một Work Order khác đang xử lý tại xưởng.
  - [ ] Kiểm tra Check-in Gate: Bắt buộc đủ số ODO tiếp nhận, mức nhiên liệu (0-100%), hiện trạng tài sản trên xe và tối thiểu 1 ảnh hiện trường.
  - [ ] Chặn số ODO tiếp nhận nhỏ hơn số ODO lần dịch vụ gần nhất (Chống lùi số ODO).
- [ ] **Đồng bộ hóa Hiển thị trên Cổng Khách hàng (UC-15):**
  - [ ] Ngay khi tạo Work Order, phương tiện xuất hiện ngay trên trang Theo dõi của khách hàng.
  - [ ] Hiển thị đúng thẻ xe, mã phiếu, tên/SĐT Cố vấn, các gói dịch vụ và tiến độ các khâu.
- [ ] **Khám xe trên Sơ đồ Thân xe 2D (UC-33):**
  - [ ] Thao tác tương tác sơ đồ 2D với 4 góc nhìn chuẩn: Trước, Sau, Trái, Phải.
  - [ ] Đánh dấu vị trí khuyết tật (Finding) và phân loại: Móp méo, Trầy xước, Rỉ sét, Bể vỡ, Thiếu chi tiết.
  - [ ] Chức năng liên kết trực tiếp vết lỗi chẩn đoán sang công việc kỹ thuật (+Job).
  - [ ] Chặn xóa vết lỗi chẩn đoán khi đã có công việc kỹ thuật gắn kèm.
- [ ] **Lập Kế hoạch Công việc & AI Job Planner (UC-34, UC-35, UC-36):**
  - [ ] Thêm công việc kỹ thuật thủ công: Chọn loại thợ, định mức giờ công, đơn giá giờ.
  - [ ] Phân công kỹ thuật viên phụ trách từng công việc cụ thể.
  - [ ] Sử dụng trợ lý AI phân tích triệu chứng để gợi ý danh mục công việc tự động.
  - [ ] AI tự nhận diện công việc đã có trên phiếu và gắn nhãn "Đã có trong phiếu" để chống trùng.
  - [ ] Khai báo vật tư/phụ tùng thay thế cho công việc; kiểm tra số lượng tồn kho khả dụng.
- [ ] **Quy trình Báo giá & Chính sách Thuế 0% VAT (UC-37 → UC-41):**
  - [ ] Tổng hợp tự động chi phí tiền công thợ và tiền phụ tùng.
  - [ ] Áp dụng quy định thuế Zero-Tax (thuế suất 0%, tiền thuế 0đ).
  - [ ] Áp dụng chiết khấu (tiền mặt / %) và chặn chiết khấu vượt quá Subtotal.
  - [ ] Gửi báo giá cho khách duyệt $\rightarrow$ Chuyển trạng thái sang `PENDING_APPROVAL`.
  - [ ] Khách hàng phê duyệt $\rightarrow$ Chuyển sang `APPROVED`, tự động giữ chỗ phụ tùng (`RESERVED`) và đóng băng snapshot đơn giá.
  - [ ] Lập báo giá bổ sung khi phát sinh hỏng hóc trong quá trình tháo lắp sửa chữa.
- [ ] **Thi công Xưởng & Quản lý Phụ tùng Thực tế (UC-42):**
  - [ ] Execution Gate: Tuyệt đối chặn bắt đầu thi công khi báo giá chưa được duyệt (`APPROVED`).
  - [ ] Xuất kho phụ tùng thực tế theo từng công việc; hoàn trả lượng phụ tùng thừa về lại kho.
  - [ ] Cập nhật tiến độ hoàn thành từng công việc; chuyển phiếu sang chờ kiểm định (`QC_PENDING`).
- [ ] **Kiểm định Chất lượng (QC Gate) & Vòng lặp Sửa lại (UC-42):**
  - [ ] QC Đạt (PASS): Chuyển trạng thái phiếu sang sẵn sàng bàn giao (`READY_FOR_RELEASE`).
  - [ ] QC Không đạt (FAIL): Tự động sinh công việc sửa lại (`[Sửa lại - KCS]`) và chuyển ngược phiếu về `IN_PROGRESS`.
- [ ] **Bàn giao xe & Đóng Phiếu (UC-43):**
  - [ ] Release Gate: Chặn bàn giao khi chưa Pass QC hoặc hóa đơn chưa được thanh toán đủ.
  - [ ] Cho phép bàn giao xe khi thỏa mãn đồng thời 3 điều kiện: Việc xong + Pass QC + Đã thanh toán.
  - [ ] Kiểm tra đối chiếu ODO xuất xưởng $\ge$ ODO tiếp nhận; thu thập chữ ký bàn giao điện tử.

### 5.5 Phân hệ Quản lý Kho, Vật tư & Vận hành Xưởng (UC-44 → UC-53, UC-86, UC-87)
- [ ] **Quản lý Danh mục & Mã Phụ tùng SKU (UC-45 → UC-52):**
  - [ ] Khởi tạo nhóm danh mục phụ tùng; chặn trùng mã danh mục.
  - [ ] Chặn xóa danh mục phụ tùng đang chứa các mặt hàng phụ tùng con.
  - [ ] Khai báo mã SKU mới với số lượng tồn ban đầu = 0 và giá vốn khởi tạo = 0đ.
  - [ ] Chặn khai báo trùng mã SKU; chặn thiết lập giá bán niêm yết âm.
  - [ ] Thiết lập ngưỡng tồn kho an toàn và cảnh báo thiếu hàng khi tồn khả dụng giảm sâu.
- [ ] **Quản lý Nhà cung cấp & Nhập kho (UC-53, MGR-B03, B04):**
  - [ ] Khởi tạo và cập nhật hồ sơ nhà cung cấp: Tên, mã số thuế, thông tin liên hệ.
  - [ ] Nhập kho hàng mới: Tự động tính lại giá vốn bình quân di động (Moving WAC).
  - [ ] Chặn lập phiếu nhập kho có số lượng hoặc đơn giá $\le 0$.
  - [ ] Chặn lưu phiếu nhập kho rỗng không có mặt hàng phụ tùng nào.
- [ ] **Xuất kho, Nhập trả & Thẻ kho (MGR-B06, B07, B08):**
  - [ ] Xuất kho phụ tùng gắn theo từng công việc cụ thể của phiếu công việc.
  - [ ] Kiểm soát kho không âm: Chặn xuất kho vượt quá số lượng tồn khả dụng.
  - [ ] Nhập trả phụ tùng thừa về kho; chặn nhập trả vượt số lượng đã xuất trước đó.
  - [ ] Thẻ kho (Stock Ledger): Bảo đảm tính liên tục số dư sau mỗi lần nhập/xuất/trả.
  - [ ] Toàn vẹn số liệu: Nghiêm cấm sửa trực tiếp số lượng tồn kho mà không qua chứng từ.
- [ ] **Kiểm kê & Bảng Điều hành Xưởng (MGR-B09, UC-44):**
  - [ ] Lập phiếu kiểm kê điều chỉnh kho tăng/giảm bắt buộc có lý do giải trình và duyệt bởi Quản lý.
  - [ ] Bảng điều hành xưởng theo thời gian thực: Giám sát 4 chỉ số KPI cốt lõi và danh sách xe đang sửa.
  - [ ] Cảnh báo các công việc chậm tiến độ thi công quá 8 giờ làm việc.
- [ ] **Closure Gate, Báo cáo & Bảo hành Thiện chí (MGR-B10, UC-54, UC-86, UC-87):**
  - [ ] Closure Gate: Chỉ đóng hồ sơ vĩnh viễn khi xe đã giao + không nợ tiền + 0 việc mở.
  - [ ] Báo cáo vận hành: Doanh thu theo thời gian, Cơ cấu dịch vụ phổ biến, Cảnh báo thiếu hụt kho.
  - [ ] Phê duyệt bảo hành thiện chí (Goodwill Warranty) 0đ cho khách hàng và hạch toán chi phí vốn.
  - [ ] Báo cáo chi phí bảo hành nội bộ với cơ chế phân quyền bảo mật cao.

### 5.6 Phân hệ Quản trị Dữ liệu chủ & Cấu hình Hệ thống (UC-54 → UC-78)
- [ ] **Quản lý Tài khoản & Phân quyền Nhân sự (UC-54 → UC-61):**
  - [ ] Tạo mới tài khoản nhân viên cho các vai trò: Cố vấn, Lễ tân, Quản lý, Admin.
  - [ ] Chặn tạo tài khoản với email đã tồn tại trong hệ thống.
  - [ ] Chuyển đổi và phân quyền vai trò nhân sự hợp lệ.
  - [ ] Khóa tạm tài khoản (`isActive = false`) và kích hoạt lại tài khoản nhân viên.
  - [ ] Đặt lại mật khẩu tài khoản người dùng từ màn hình quản trị.
  - [ ] Tìm kiếm và lọc tài khoản theo Họ tên, Email, Vai trò và Trạng thái hoạt động.
- [ ] **Quản lý Dữ liệu chủ - Hãng xe & Dòng xe (UC-62 → UC-69):**
  - [ ] Thêm hãng xe mới; chặn trùng tên hãng xe.
  - [ ] Thêm dòng xe trực thuộc hãng kèm phân loại cỡ xe chuẩn (Sedan, SUV, Bán tải).
  - [ ] Chặn xóa hãng xe đang có các dòng xe trực thuộc.
  - [ ] Chặn xóa dòng xe đang có phương tiện của khách hàng liên kết.
- [ ] **Quản lý Dữ liệu chủ - Dịch vụ & Loại thợ (UC-70 → UC-77):**
  - [ ] Thêm dịch vụ mới, thiết lập đơn giá chuẩn và cách thức tính giá.
  - [ ] Chặn trùng mã dịch vụ; cập nhật thông tin bảng giá dịch vụ niêm yết.
  - [ ] Thêm loại thợ kỹ thuật (Máy - Gầm, Điện, Đồng - Sơn) kèm đơn giá công chuẩn theo giờ.
  - [ ] Chặn xóa loại thợ đang có công việc kỹ thuật liên kết trên các phiếu công việc.
- [ ] **Báo cáo Thống kê Toàn hệ thống (UC-78):**
  - [ ] Báo cáo tổng hợp số lượng tài khoản, tổng doanh thu và biểu đồ tăng trưởng trung tâm.

---

## 6. CHECKLIST CÁC CHỐT CHẶN NGHIỆP VỤ CỐT LÕI (CRITICAL BUSINESS GATES)

*6 Cổng kiểm soát bắt buộc phải có kịch bản kiểm thử bao phủ cả trường hợp THỎA MÃN (Cho qua) và KHÔNG THỎA MÃN (Chặn lại):*

| Tên Cổng Chốt Chặn | Điều kiện Kiểm soát Cốt lõi | Kịch bản Cho qua (Pass Gate) | Kịch bản Chặn lại (Block Gate) |
| :--- | :--- | :--- | :--- |
| **1. Check-in Gate** *(Tiếp nhận xe)* | Đủ ODO, Xăng %, Tài sản, $\ge 1$ Ảnh; $\text{ODO}_{\text{mới}} \ge \text{ODO}_{\text{cũ}}$ | Nhập đủ 4 thông tin, ODO tăng $\rightarrow$ Cho phép lưu tiếp nhận | Thiếu ảnh, hoặc ODO mới < ODO cũ $\rightarrow$ Khóa lưu, báo lỗi đỏ |
| **2. Quotation Gate** *(Phê duyệt báo giá)* | Zero-Tax (0% VAT); Chiết khấu $\le$ Subtotal; Freeze snapshot khi duyệt | Khách bấm Duyệt $\rightarrow$ Đóng băng giá, giữ kho phụ tùng RESERVED | Chiết khấu vượt subtotal hoặc sửa báo giá đã APPROVED $\rightarrow$ Bị chặn |
| **3. Execution Gate** *(Bắt đầu thi công)* | Work Order phải đạt trạng thái `APPROVED`; Kho không xuất âm | Báo giá đã APPROVED, kho đủ hàng $\rightarrow$ Bắt đầu thi công thành công | Work Order còn DRAFT hoặc xuất vượt tồn khả dụng $\rightarrow$ Bị từ chối |
| **4. QC Gate** *(Kiểm định chất lượng)* | 100% việc thi công hoàn tất; Đạt tiêu chuẩn KCS xuất xưởng | Toàn bộ việc xong, KCS bấm ĐẠT $\rightarrow$ Chuyển `READY_FOR_RELEASE` | Có việc chưa xong, hoặc KCS Không đạt $\rightarrow$ Tự sinh việc `[Sửa lại - KCS]` |
| **5. Release Gate** *(Bàn giao xe)* | Đủ 3 điều kiện: 1) Việc xong + 2) QC Đạt + 3) Hóa đơn đã PAID; $\text{ODO}_{\text{ra}} \ge \text{ODO}_{\text{vào}}$ | Đủ cả 3 điều kiện và ODO xuất xưởng $\ge$ ODO vào $\rightarrow$ Bàn giao thành công | Hóa đơn còn UNPAID hoặc chưa Pass QC $\rightarrow$ Khóa cứng nút bàn giao |
| **6. Closure Gate** *(Đóng hồ sơ vĩnh viễn)* | Xe đã xuất xưởng + Hóa đơn tất toán 100% + Không còn công việc mở | Đủ điều kiện $\rightarrow$ Đóng hồ sơ vĩnh viễn, lưu Lịch sử trọn đời xe (UC-80) | Xe chưa giao hoặc còn nợ tiền $\rightarrow$ Chặn không cho đóng hồ sơ |

---

## 7. CHECKLIST TIÊU CHUẨN NGHIỆM THU ĐỀ TÀI (ACCEPTANCE CRITERIA AC-01 → AC-07)

*7 Tiêu chí bắt buộc phải được chứng minh bằng kết quả kiểm thử khi nghiệm thu đồ án:*

- [ ] **AC-01:** Chứng minh luồng E2E trọn vẹn không đứt gãy: Đặt lịch $\rightarrow$ Tiếp nhận $\rightarrow$ Khám xe $\rightarrow$ Báo giá $\rightarrow$ Thi công $\rightarrow$ QC $\rightarrow$ Thanh toán $\rightarrow$ Bàn giao xe.
- [ ] **AC-02:** Chứng minh tính liên kết dữ liệu trực tiếp: Vết lỗi chẩn đoán trên sơ đồ 2D (Finding) $\rightarrow$ Công việc kỹ thuật (Job) $\rightarrow$ Phụ tùng thay thế (Part).
- [ ] **AC-03:** Chứng minh kiểm soát tồn kho khả dụng: $\text{Available} = \text{On-Hand} - \text{Reserved}$, chặn tuyệt đối việc đặt hoặc xuất vượt số lượng có sẵn.
- [ ] **AC-04:** Chứng minh tính đúng định mức lao động và cơ chế đóng băng Snapshot báo giá cố định tại thời điểm khách hàng phê duyệt.
- [ ] **AC-05:** Chứng minh công thức giá vốn bình quân di động (Moving WAC) khi nhập kho, xuất kho gắn theo Job và nguyên tắc Kho không âm hàng.
- [ ] **AC-06:** Chứng minh Release Gate hoạt động chuẩn xác: Chỉ cho phép bàn giao xe khi thỏa mãn đồng thời 3 điều kiện (Việc xong + Pass QC + Đã thanh toán).
- [ ] **AC-07:** Chứng minh hệ thống kiểm thử tự động bao phủ toàn diện cả 3 tầng, tỷ lệ Pass 100%, thực thi độc lập không tốn chi phí bên ngoài.

---

## 8. CHECKLIST QUY TRÌNH THEO DÕI & BÀN GIAO SẢN PHẨM KIỂM THỬ

*Quy trình quản lý tiến độ kiểm thử từ giai đoạn thiết kế đến lúc đóng gói nộp báo cáo:*

### 8.1 Theo dõi Quá trình Thiết kế & Thực thi Kiểm thử
- [ ] **Giai đoạn Thiết kế Kịch bản (Test Design):**
  - [ ] Phân bổ thành viên viết 6 bộ Manual Test Cases tương ứng với các phân hệ trong checklist.
  - [ ] Đối soát từng mục trong checklist để đảm bảo không bỏ sót Use Case hay Business Rule.
  - [ ] Thiết lập đầy đủ dữ liệu thử nghiệm mẫu (Pre-conditions, Sample Data, Expected Results).
- [ ] **Giai đoạn Thực thi & Quản lý Lỗi (Test Execution & Defect Tracking):**
  - [ ] Thực hiện kiểm thử chéo (Cross-testing) giữa các thành viên theo kịch bản đã viết.
  - [ ] Ghi nhận toàn bộ lỗi phát sinh vào cột Actual Result và Remarks của từng kịch bản.
  - [ ] Phân loại mức độ nghiêm trọng: Critical (Chặn đứng), Major (Nghiêm trọng), Minor (Nhẹ), Trivial (Góp ý).
  - [ ] Thực hiện kiểm thử hồi quy (Regression Testing) sau khi lập trình viên sửa lỗi.

### 8.2 Danh mục Tài liệu Bàn giao Nghiệm thu (Test Deliverables)
- [ ] Kế hoạch kiểm thử tổng thể (Test Plan) hoàn thiện theo chuẩn môn học.
- [ ] Bảng Checklist thiết kế & bao phủ kiểm thử (tài liệu này) được cập nhật trạng thái thực thi.
- [ ] Bộ 6 tài liệu kịch bản kiểm thử thủ công chi tiết (Manual Test Cases Suites).
- [ ] Tài liệu phân tích kiểm thử hộp trắng (White-box Testing Analysis) cho 10 hàm nghiệp vụ cốt lõi.
- [ ] Bộ mã nguồn kiểm thử tự động (Unit, Integration, E2E Playwright) và tài liệu hướng dẫn vận hành.
- [ ] Báo cáo tổng kết kết quả kiểm thử (Test Summary & Defect Report) phục vụ bảo vệ đồ án.

---
*Tài liệu được phê duyệt làm căn cứ thiết kế và nghiệm thu kiểm thử cho Dự án Car Service Center.*
