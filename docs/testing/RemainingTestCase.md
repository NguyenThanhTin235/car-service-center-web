## I. TỔNG QUAN ĐỘ BAO PHỦ HIỆN TẠI CỦA CÁC BỘ TEST CASE (9 BỘ TEST CASE)

| STT | Bộ Test Case | Số lượng TC hiện tại | Đối tượng & Phân hệ bao phủ | Trạng thái |
|:---:|---|:---:|---|:---:|
| 1 | [TC_Admin_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Admin_Process.md) | **50 TCs** | Quản trị tài khoản, nhân sự, dịch vụ, bảng giá, loại công việc, danh mục chung. | Hoàn thành chuẩn hóa |
| 2 | [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) | **50 TCs** | Đặt lịch hẹn (Khách/Lễ tân), Đặt hẹn nhanh trang chủ, Tiếp nhận xe (Hẹn, Walk-in, Cứu hộ), Biên bản tài sản. | Hoàn thành chuẩn hóa |
| 3 | [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md) | **32 TCs** | Đăng ký OTP, Đăng nhập đa vai trò, Đăng xuất đa tab, Quên/Khôi phục mật khẩu, Đổi mật khẩu chủ động, Remember Me. | **Đã cập nhật theo Excel + Bổ sung** |
| 4 | [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) | **40 TCs** | Hồ sơ khách hàng, Quản lý xe, Phân loại cỡ xe (vehicleSize), Tích lũy chi tiêu, Tra cứu lịch sử trọn đời. | Hoàn thành chuẩn hóa |
| 5 | [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) | **62 TCs** | SKU phụ tùng, Nhập/Xuất/Trả kho, Cảnh báo biên lợi nhuận WAC, Hủy phiếu nháp/xuất trả NCC, Thẻ kho, Bảng xưởng. | Hoàn thành chuẩn hóa |
| 6 | [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) | **68 TCs** | Khởi tạo lệnh, Check-in, Khám 2D, Báo giá bổ sung (Change Order), Tạm dừng việc, Đổi thợ, KCS, Bàn giao dặn dò. | Hoàn thành chuẩn hóa |
| 7 | [TC_Dashboard_Report_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Dashboard_Report_Process.md) | **50 TCs** | Bảng điều hành đa vai trò (Khách, Quầy, SA, Quản lý, Admin) & Báo cáo phân tích quản trị. | Hoàn thành tạo mới |
| 8 | [TC_Billing_Invoice_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Billing_Invoice_Process.md) | **30 TCs** | Quản lý thu ngân, 4 tab hàng đợi, tạo hóa đơn nháp, chiết khấu quầy, thanh toán đa phương thức, nợ từng phần, in PDF. | Hoàn thành tạo mới |
| 9 | [TC_Warranty_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Warranty_Process.md) | **25 TCs** | Vòng đời bảo hành E2E: Tra cứu hạn, Đặt lịch online, Tiếp nhận quầy, Duyệt thiện chí, Báo giá 0đ, Hóa đơn 0đ, Cấp bảo hành mới. | Hoàn thành tạo mới |
| | **TỔNG CỘNG** | **407 TCs** | | |

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

## III. TỔNG KẾT CÁC BỔ SUNG & LÀM SẠCH

### 1. Đã cập nhật & bổ sung [TC_Auth_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Auth_Profile_Process.md) (32 TCs)
- **Cập nhật 28 TCs từ Excel:** Lưu lại kết quả kiểm thử thực tế (22 Pass, 6 Fail), ngày kiểm thử và nhận xét lỗi thực tế.
- **Loại bỏ:** Toàn bộ các test case kỹ thuật/API/Security (Cookie JWT, API me, XSS, SQL injection).
- **Bổ sung 4 TCs mới:**
  - **TC-AUTH-29:** Đổi mật khẩu chủ động thành công trong Hồ sơ cá nhân (`UC-06`).
  - **TC-AUTH-30:** Chặn đổi mật khẩu khi nhập sai mật khẩu cũ hoặc mật khẩu mới trùng mật khẩu cũ.
  - **TC-AUTH-31:** Cơ chế 'Ghi nhớ đăng nhập' (Remember Me) khi đóng và mở lại trình duyệt.
  - **TC-AUTH-32:** Tính năng Ẩn / Hiển thị mật khẩu bằng biểu tượng con mắt.

### 2. Đã bổ sung vào [TC_WorkOrder_SA_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_WorkOrder_SA_Process.md) (68 TCs)
- **TC-WO-65:** Thợ phát hiện hư hỏng phát sinh $\to$ Báo giá bổ sung (Change Order) $\to$ Khách duyệt online.
- **TC-WO-66:** Tạm dừng và Tiếp tục công việc thi công kèm lý do bắt buộc (PAUSED / RESUMED).
- **TC-WO-67:** Điều chuyển và phân công lại kỹ thuật viên theo nhóm chuyên môn (Reassignment).
- **TC-WO-68:** Ghi chú kỹ thuật nội bộ của thợ đưa vào mục Dặn dò trên Biên bản bàn giao xuất xưởng.

### 3. Đã bổ sung vào [TC_Customer_Profile_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Customer_Profile_Process.md) (40 TCs)
- **TC-CUS-38:** Bắt buộc chọn Phân khúc kích cỡ xe (`vehicleSize`: SMALL, MEDIUM, LARGE, XL) khi thêm xe mới.
- **TC-CUS-39:** Kiểm tra tính toàn vẹn số liệu thống kê tích lũy (`Tổng chi tiêu` và `Số lượt dịch vụ`).
- **TC-CUS-40:** Tra cứu Lịch sử dịch vụ và Sổ bảo dưỡng điện tử trọn đời của phương tiện (`HistoryView.tsx` / Tải PDF).

### 4. Đã bổ sung vào [TC_Appointment_Intake_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Appointment_Intake_Process.md) (50 TCs)
- **TC-APT-31:** Khách vãng lai xem bảng giá tại Trang chủ và bấm Đặt lịch hẹn nhanh, tự động giữ dịch vụ sau đăng nhập.
- **TC-INT-19:** Lễ tân ghi nhận chi tiết tài sản có giá trị và mức xăng ban đầu vào Biên bản bàn giao tiếp nhận tạm thời.

### 5. Đã bổ sung vào [TC_Manager_Process.md](file:///d:/hocTap/TLCN/CAR%20SERVICE%20CENTER/CAR%20SERVICE%20CENTER/docs/testing/manual/TC_Manager_Process.md) (62 TCs)
- **TC-MGR-61:** Cảnh báo biên lợi nhuận âm khi giá vốn WAC mới vượt giá bán niêm yết hiện tại.
- **TC-MGR-62:** Hủy phiếu nhập kho nháp hoặc lập phiếu xuất trả hàng cho nhà cung cấp khi hàng giao bị lỗi.

---

## IV. LỘ TRÌNH TIẾP THEO

```
[ĐÃ HOÀN THÀNH - Toàn bộ 9 bộ test case] 
├── TC_Admin_Process.md (50 TCs)
├── TC_Appointment_Intake_Process.md (50 TCs)
├── TC_Auth_Profile_Process.md (32 TCs)
├── TC_Customer_Profile_Process.md (40 TCs)
├── TC_Manager_Process.md (62 TCs)
├── TC_WorkOrder_SA_Process.md (68 TCs)
├── TC_Dashboard_Report_Process.md (50 TCs)
├── TC_Billing_Invoice_Process.md (30 TCs)
└── TC_Warranty_Process.md (25 TCs)
    ──> Tổng cộng: 407 Test Cases hoàn chỉnh 100%

[Bước tiếp theo] 
└── Đồng bộ lại số liệu tổng thể trong TestPlan.md và TEST_CHECKLIST.md
```
