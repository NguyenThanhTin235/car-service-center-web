## I. TỔNG QUAN ĐỘ BAO PHỦ HIỆN TẠI CỦA CÁC BỘ TEST CASE (9 BỘ TEST CASE)

| STT | Bộ Test Case | Số lượng TC hiện tại | Đối tượng & Phân hệ bao phủ | Trạng thái |
|:---:|---|:---:|---|:---:|
| 1 | [TC_Admin_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Admin_Process.md) | **50 TCs** | Quản trị tài khoản, nhân sự, dịch vụ, bảng giá, loại công việc, danh mục chung. | Hoàn thành chuẩn hóa |
| 2 | [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) | **50 TCs** *(+2)* | Đặt lịch hẹn (Khách/Lễ tân), Đặt hẹn nhanh trang chủ, Tiếp nhận xe (Hẹn, Walk-in, Cứu hộ), Biên bản tài sản. | **Đã bổ sung hoàn tất** |
| 3 | [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md) | **38 TCs** | Đăng ký, Đăng nhập, Đăng xuất, Quên/Khôi phục mật khẩu, Xác thực OTP. | Cần làm sạch 4 TC kỹ thuật |
| 4 | [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) | **40 TCs** *(+3)* | Hồ sơ khách hàng, Quản lý xe, Phân loại cỡ xe (vehicleSize), Tích lũy chi tiêu, Tra cứu lịch sử trọn đời. | **Đã bổ sung hoàn tất** |
| 5 | [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) | **62 TCs** *(+2)* | SKU phụ tùng, Nhập/Xuất/Trả kho, Cảnh báo biên lợi nhuận WAC, Hủy phiếu nháp/xuất trả NCC, Thẻ kho, Bảng xưởng. | **Đã bổ sung hoàn tất** |
| 6 | [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) | **68 TCs** *(+4)* | Khởi tạo lệnh, Check-in, Khám 2D, Báo giá bổ sung (Change Order), Tạm dừng việc, Đổi thợ, KCS, Bàn giao dặn dò. | **Đã bổ sung hoàn tất** |
| 7 | [TC_Dashboard_Report_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Dashboard_Report_Process.md) | **50 TCs** | Bảng điều hành đa vai trò (Khách, Quầy, SA, Quản lý, Admin) & Báo cáo phân tích quản trị. | Hoàn thành tạo mới |
| 8 | [TC_Billing_Invoice_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Billing_Invoice_Process.md) | **30 TCs** | Quản lý thu ngân, 4 tab hàng đợi, tạo hóa đơn nháp, chiết khấu quầy, thanh toán đa phương thức, nợ từng phần, in PDF. | Hoàn thành tạo mới |
| 9 | [TC_Warranty_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Warranty_Process.md) | **25 TCs** | Vòng đời bảo hành E2E: Tra cứu hạn, Đặt lịch online, Tiếp nhận quầy, Duyệt thiện chí, Báo giá 0đ, Hóa đơn 0đ, Cấp bảo hành mới. | Hoàn thành tạo mới |
| | **TỔNG CỘNG** | **413 TCs** | | |

---

## II. 🚨 ĐÁNH GIÁ 2 PHÂN HỆ LỚN ĐÃ HOÀN THÀNH

### 1. Phân hệ Kế toán / Thu ngân, Hóa đơn & Thanh toán (`TC_Billing_Invoice_Process.md`)
* **Trạng thái:** ✅ **ĐÃ HOÀN THÀNH XÂY DỰNG TOÀN DIỆN (30 TEST CASES)**
* **File tài liệu:** [TC_Billing_Invoice_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Billing_Invoice_Process.md)
* **Nghiệp vụ bao phủ:** 4 Tab hàng đợi (`PENDING`, `DRAFT`, `ISSUED`, `PAID`), tạo hóa đơn nháp, đối soát phụ tùng thực tế, chiết khấu tại quầy, phát hành đóng băng dữ liệu, thanh toán tiền mặt/POS/VietQR SePay, nợ dở dang, cấp Financial Clearance mở Release Gate, hủy hóa đơn và xuất PDF.

---

### 2. Phân hệ Quản lý Bảo hành sau sửa chữa (`TC_Warranty_Process.md`)
* **Trạng thái:** ✅ **ĐÃ HOÀN THÀNH XÂY DỰNG TOÀN DIỆN FULL FLOW E2E (25 TEST CASES)**
* **File tài liệu:** [TC_Warranty_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Warranty_Process.md)
* **Nghiệp vụ bao phủ:** Tra cứu hạn theo ODO/ngày (`UC-81`), đặt lịch bảo hành online (`UC-82`), tiếp nhận quầy đối chiếu ODO và chống lùi ODO (`UC-83`), thẩm định duyệt bảo hành thiện chí 3 phương án (`UC-86`), lập Work Order & Báo giá 0đ (`UC-84`), nghiệm thu KCS, hóa đơn 0đ tự chuyển PAID & tự cấp Financial Clearance (`UC-85`), bàn giao kích hoạt bảo hành mới và báo cáo chi phí vốn WAC (`UC-87`).

---

## III. CHI TIẾT CÁC FLOW BỔ SUNG VÀO 4 BỘ TEST CASE (ĐÃ THỰC HIỆN)

### 1. Bổ sung vào [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) (Nâng từ 64 lên 68 TCs)
- **TC-WO-65:** Thợ phát hiện hư hỏng phát sinh khi thi công $\to$ Cố vấn lập Báo giá bổ sung (Change Order) $\to$ Khách duyệt online riêng phần phát sinh $\to$ Mở quyền thi công.
- **TC-WO-66:** Kỹ thuật viên tạm dừng công việc thi công do chờ phụ tùng hoặc chờ duyệt phát sinh kèm lý do bắt buộc (PAUSED / RESUMED).
- **TC-WO-67:** Quản đốc hoặc Cố vấn điều chuyển công việc sang kỹ thuật viên khác khi thợ ban đầu bận đột xuất (Technician Reassignment).
- **TC-WO-68:** Kỹ thuật viên ghi chú khuyến nghị kỹ thuật nội bộ để Cố vấn đưa vào mục Dặn dò trên Biên bản bàn giao xe xuất xưởng cho khách.

### 2. Bổ sung vào [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) (Nâng từ 37 lên 40 TCs)
- **TC-CUS-38:** Khách hàng hoặc Lễ tân bắt buộc phải chọn đúng Phân khúc kích cỡ xe (`vehicleSize`: SMALL, MEDIUM, LARGE, XL) khi thêm phương tiện mới.
- **TC-CUS-39:** Kiểm tra tính toàn vẹn số liệu thống kê tích lũy của khách hàng (`Tổng chi tiêu` và `Số lượt dịch vụ`) sau khi hoàn tất thanh toán hóa đơn.
- **TC-CUS-40:** Khách hàng tra cứu Lịch sử dịch vụ và Sổ bảo dưỡng điện tử trọn đời của phương tiện (`HistoryView.tsx` / tải tệp PDF).

### 3. Bổ sung vào [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) (Nâng từ 48 lên 50 TCs)
- **TC-APT-31:** Khách vãng lai xem bảng giá dịch vụ tại Trang chủ (`/home`) và bấm Đặt lịch hẹn nhanh, hệ thống chuyển hướng đăng nhập và giữ lại dịch vụ đã chọn (Deep-linking).
- **TC-INT-19:** Lễ tân ghi nhận chi tiết tài sản có giá trị và mức nhiên liệu ban đầu vào Biên bản bàn giao tiếp nhận tạm thời trước khi chuyển giao xe cho SA.

### 4. Bổ sung vào [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) (Nâng từ 60 lên 62 TCs)
- **TC-MGR-61:** Hệ thống cảnh báo biên lợi nhuận âm khi giá vốn nhập kho bình quân (WAC) mới tăng vượt quá giá bán niêm yết hiện tại.
- **TC-MGR-62:** Quản lý hủy phiếu nhập kho nháp hoặc lập phiếu xuất trả hàng cho nhà cung cấp khi hàng giao bị lỗi quy cách.

---

## IV. LỘ TRÌNH THỰC HIỆN TIẾP THEO

```
[ĐÃ HOÀN THÀNH - Ưu tiên 1] 
└── TC_Billing_Invoice_Process.md (30 TCs cho phân hệ Thu ngân, Hóa đơn & Thanh toán)

[ĐÃ HOÀN THÀNH - Ưu tiên 2] 
└── TC_Warranty_Process.md (25 TCs cho phân hệ Quản lý Bảo hành full flow E2E)

[ĐÃ HOÀN THÀNH - Ưu tiên 4] 
└── Bổ sung +11 kịch bản vào TC_WorkOrder_SA_Process.md, TC_Customer_Profile_Process.md, TC_Appointment_Intake_Process.md, TC_Manager_Process.md

[Ưu tiên 3 - Tiếp theo] 
└── Làm sạch TC_Auth_Profile_Process.md (loại bỏ 4 test case API/Security, thay bằng Đổi mật khẩu chủ động, Remember Me, Ẩn/Hiện mật khẩu, Brute-force lockout)

[Ưu tiên 5] 
└── Đồng bộ lại số liệu tổng thể trong TestPlan.md và TEST_CHECKLIST.md
```
