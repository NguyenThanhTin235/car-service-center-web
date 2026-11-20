# PONYTAIL AUDIT & OPTIMIZATION LOG — `customer-web`

> **Mục đích:** Lưu vết minh bạch mọi file, khối mã thừa (Dead Code) và điểm tối ưu Render Performance được thực hiện trong **Customer Portal (`src/frontend/apps/customer-web`)** theo triết lý **Ponytail** và quy trình **Chesterton's Fence**.
> **Nguyên tắc cô lập:** 100% thay đổi chỉ nằm trong `src/frontend/apps/customer-web`. Tuyệt đối không chỉnh sửa `src/frontend/apps/internal-web`, `src/backend`, hay `src/frontend/packages/ui`.

---

## 1. Bảng Ghi Vết Ponytail Dead-Code Removal (`PT-001` → `PT-020`)

| Mã Log | Đối tượng / File bị loại bỏ | LOC giảm | Bằng chứng Chesterton's Fence (`0` Active Callers) | Trạng thái |
| :--- | :--- | :---: | :--- | :---: |
| `PT-001` | `src/components/layout/SideNavBar.tsx` | 84 | Sidebar ERP của nhân viên (`/staff/*`), `0` imports trong toàn `customer-web`. | Đã xóa |
| `PT-002` | `src/components/layout/TopNavBar.tsx` | 85 | Topbar ERP của nhân viên, `0` imports trong `customer-web`. | Đã xóa |
| `PT-003` | `src/components/layout/CustomerNavBar.tsx` | 208 | Navbar cũ đã thay hoàn toàn bởi `PublicHeader.tsx`, `0` imports. | Đã xóa |
| `PT-004` | `src/components/customers/CustomerFormModal.tsx` | 327 | Modal quản trị khách hàng của Staff, `0` imports trong `customer-web`. | Đã xóa |
| `PT-005` | `src/components/customers/CustomerDetailModal.tsx` | 127 | Modal chi tiết khách hàng của Staff, `0` imports trong `customer-web`. | Đã xóa |
| `PT-006` | `src/components/appointments/CreateAppointmentModal.tsx` | 232 | Modal đặt lịch của Staff (`profile/page.tsx` dùng 3-Step Booking Modal riêng), `0` imports. | Đã xóa |
| `PT-007` | `src/components/appointments/AppointmentDetailPopover.tsx` | 163 | Popover lịch hẹn của Staff, `0` imports. | Đã xóa |
| `PT-008` | `src/components/appointments/MonthlyCalendarGrid.tsx` | 130 | Lịch tháng của Staff, `0` imports. | Đã xóa |
| `PT-009` | `src/components/appointments/RescheduleModal.tsx` | 125 | Modal dời lịch rời (`profile/page.tsx` đã có modal dời lịch nội bộ), `0` imports. | Đã xóa |
| `PT-010` | `src/components/appointments/WeeklyCalendarGrid.tsx` | 117 | Lịch tuần của Staff, `0` imports. | Đã xóa |
| `PT-011` | `src/components/appointments/DailyCalendarGrid.tsx` | 102 | Lịch ngày của Staff, `0` imports. | Đã xóa |
| `PT-012` | `src/components/appointments/AppointmentCard.tsx` | 102 | Chỉ được gọi bởi `DailyCalendarGrid` & `WeeklyCalendarGrid` (đều là dead code), `0` active callers. | Đã xóa |
| `PT-013` | `src/components/appointments/CancelConfirmDialog.tsx` | 101 | Dialog hủy lịch rời, `0` imports. | Đã xóa |
| `PT-014` | `src/components/appointments/ActionConfirmDialog.tsx` | 64 | Dialog xác nhận của Staff, `0` imports. | Đã xóa |
| `PT-015` | `src/lib/api/appointments.ts` | 56 | Wrapper API dư thừa (`appointmentSlice.ts` gọi trực tiếp `@/lib/axios`), `0` imports. | Đã xóa |
| `PT-016` | `src/components/ui/PageHeader.tsx` | 57 | Component UI dư thừa sau khi khôi phục layout gốc của `(customer)/*`, `0` imports ngoài `ui/index.ts`. | Đã xóa + bỏ export |
| `PT-017` | `src/components/ui/ResponsiveModal.tsx` | 97 | Component UI dư thừa, `0` imports ngoài `ui/index.ts`. | Đã xóa + bỏ export |
| `PT-018` | `src/components/ui/LicensePlateTag.tsx` | 48 | Component UI dư thừa, `0` imports ngoài `ui/index.ts`. | Đã xóa + bỏ export |
| `PT-019` | `src/app/(customer)/customer/profile/page.tsx` (Dead History Mock & Modals) | ~297 | Loại bỏ `HistoryRecord`, `mockHistoryData`, `historySearch`, `selectedVehicleFilter`, `viewInvoiceItem`, `viewProgressItem`, `filteredHistory` và 2 modal không còn trigger (tab `history` đã dùng `<HistoryView isEmbedded />`). | Đã dọn |
| `PT-020` | `package.json` (`konva`, `react-konva`, `xlsx`) | 3 deps | Gỡ 3 dependency chỉ phục vụ `internal-web` khỏi `customer-web/package.json` (`0` imports trong `customer-web/src`). | Đã gỡ |

**Tổng cộng Ponytail:** Loại bỏ **18 file dead code**, **3 dependency dư thừa** và giảm **~2,531 dòng mã chết** trong `customer-web`.

---

## 2. Nhật Ký Tối Ưu Hiệu Suất Render (`OPT-001` → `OPT-004`)

| Mã Tối Ưu | Vị trí áp dụng | Vấn đề trước khi tối ưu | Giải pháp đã triển khai |
| :--- | :--- | :--- | :--- |
| `OPT-001` | `src/app/(public)/home/page.tsx` | 3 `setInterval` (`3.2s`, `4.0s`, `3.5s`) nằm ở root `HomePage` gây re-render toàn trang ~51 lần/phút. | Cô lập `HeroSection` và `ProcessStepperSection` bằng `React.memo`, đưa các timer vào bên trong từng section để lưới 19 dịch vụ và bản đồ **không re-render ngầm**. |
| `OPT-002` | `src/app/(public)/home/page.tsx` | Lọc danh sách dịch vụ đồng bộ theo từng phím gõ; 5 ảnh Hero không phân biệt độ ưu tiên tải. | Áp dụng `useDeferredValue(searchQuery)` + `useMemo` cho `filteredServices`; đặt `loading="eager"` + `fetchPriority="high"` cho ảnh đầu tiên và `loading="lazy" decoding="async"` cho các ảnh carousel sau. |
| `OPT-003` | `src/app/(customer)/customer/profile/page.tsx` | Nạp tĩnh đồng thời `TrackingView`, `InvoicesView`, `HistoryView` (~3,260 dòng) khi mở `/customer/profile`; tính lại `activeVehicles` & lịch tháng trong render. | Chuyển 3 tab sang `next/dynamic` kèm `LoadingSkeleton`; memo hóa `activeVehicles` và `bookingCalendarMeta` qua `useMemo`. |
| `OPT-004` | `src/components/tracking/TrackingView.tsx`, `src/components/invoices/InvoicesView.tsx` | Nạp tĩnh 4 modal nghiệp vụ nặng (`CustomerQuotationModal`, `CustomerCheckInModal`, `CustomerQCModal`, `CustomerPaymentModal`). | Chuyển cả 4 modal sang `next/dynamic` và bọc điều kiện render theo state `is...ModalOpen` để chỉ tải chunk JS khi người dùng mở modal. |
