# ĐẶC TẢ KỸ THUẬT & CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG — DESK-STAFF PORTAL
## HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (CAR SERVICE CENTER)

> **Phiên bản tài liệu:** 1.0  
> **Ngày lập:** 2026-11-14  
> **Tài liệu chuẩn tham chiếu:** [`SPEC-ADMIN-PORTAL-AUTOMATED-TESTING.md`](./SPEC-ADMIN-PORTAL-AUTOMATED-TESTING.md)  
> **Phạm vi:** Toàn bộ 6 phân hệ thuộc cổng Lễ tân & Thu ngân (**Desk-Staff Portal** — `internal-web` & `backend`)  
> **Trạng thái:** Đã triển khai đầy đủ 3 tầng Unit $\rightarrow$ Integration $\rightarrow$ Playwright E2E trên nhánh `feat/staff`

---

## MỤC LỤC
1. [Mục tiêu & Nguyên tắc Thiết kế](#1-mục-tiêu--nguyên-tắc-thiết-kế)
2. [Security & Architecture Gaps (Ghi nhận riêng — Out of Scope)](#2-security--architecture-gaps-ghi-nhận-riêng--out-of-scope)
3. [Ma trận Bao phủ Toàn phần Desk-Staff Portal (6 Phân hệ)](#3-ma-trận-bao-phủ-toàn-phần-desk-staff-portal-6-phân-hệ)
4. [Danh sách Test Suites & Kịch bản Chi tiết](#4-danh-sách-test-suites--kịch-bản-chi-tiết)

---

## 1. MỤC TIÊU & NGUYÊN TẮC THIẾT KẾ

Tài liệu này đặc tả toàn bộ hệ thống kiểm thử tự động bao phủ **100% 6 màn hình của Desk-Staff Portal** từ tầng Backend Unit $\rightarrow$ Backend Integration $\rightarrow$ Frontend Playwright E2E:

1. **100% Hermetic Isolation (Phân lập tuyệt đối):**
   - **Backend Unit & Integration Tests:** Sử dụng `vi.mock` (cùng `vi.hoisted`) để giả lập hoàn toàn Prisma Client (`$transaction`, các model `user`, `vehicle`, `appointment`, `intakeRecord`, `workOrder`, `invoice`), `NotificationService.sendEmail`. **Không** kết nối MySQL/Redis thật, **không** gửi email ra ngoài.
   - **Frontend Playwright E2E Tests:** Sử dụng `page.addInitScript` để nạp phiên đăng nhập `DESK_STAFF` vào `localStorage` và `page.route('**/api/**', ...)` để giả lập toàn bộ HTTP API theo đúng contract thực tế.
2. **Tuân thủ The Ponytail Ladder (Zero New Dependencies):**
   - Tái sử dụng toolchain sẵn có trong monorepo: **Vitest** (Unit), **Vitest + Supertest** (Integration), **Playwright Chromium** (E2E). Không cài thêm package ngoài.
3. **Kiểm định Giao diện 4-State UI & Đa thiết bị (4-Viewport Audit):**
   - Mọi màn hình Desk-Staff được kiểm thử đầy đủ cả **4 trạng thái**: Loading, Empty (kèm CTA phục hồi/tạo mới), Error (kèm nút **Thử lại**), và Data.
   - Mọi màn hình đều vượt qua bài kiểm tra tràn ngang (`scrollWidth <= clientWidth + 2`) trên **4 kích thước màn hình chuẩn**: Mobile (`390×844`), Tablet (`768×1024`), Laptop (`1024×768`), Desktop (`1440×900`).
4. **Chuẩn hóa Cấu trúc Thư mục & Mã Test ID:**
   - **Unit:** `src/backend/tests/unit/staff/*.spec.ts` (`STF-[MODULE]-UT-[INDEX]`)
   - **Integration:** `src/backend/tests/integration/*-api.spec.ts` (`STF-[MODULE]-API-[INDEX]`)
   - **E2E:** `src/frontend/e2e/staff-*.spec.ts` (`E2E-STF-[MODULE]-[INDEX]`)

---

## 2. SECURITY & ARCHITECTURE GAPS (GHI NHẬN RIÊNG — OUT OF SCOPE)

Trong quá trình kiểm toán mã nguồn Desk-Staff Portal trước khi viết test, nhóm ghi nhận các khoảng trống kiến trúc/bảo mật sau để xử lý ở ticket hardening độc lập (không viết test cố tình đỏ CI):

| Mã Gap | Phân hệ ảnh hưởng | Mô tả thực tế trong mã nguồn | Ghi chú cho bộ Test |
| :--- | :--- | :--- | :--- |
| **GAP-STF-SEC-01** | Customer Routes (`src/backend/src/routes/customer.routes.ts`) | Mount trực tiếp tại `/api/customers` trong `app.ts` nhưng chưa gắn middleware `authenticate` và `authorizeRoles`. | Integration test `customer-api.spec.ts` kiểm chứng contract HTTP 200/201/400/500 hiện hành của `CustomerController` & `CustomerService`. |
| **GAP-STF-VAL-01** | Appointment Past-Date Validation (`AppointmentService` & `appointment.dto.ts`) | `AppointmentService.createAppointment` kiểm tra giờ hành chính (`08:00 - 17:00`) và trùng lịch trong ngày, nhưng chưa chặn ngày quá khứ ở tầng backend DTO/Service (hiện mới kiểm tra ở UI `CreateAppointmentModal.tsx`). | Unit test kiểm chứng chính xác rule giờ hành chính `08:00-17:00`, trùng lịch, sở hữu xe và schema Joi `HH:mm`; chưa assert reject ngày quá khứ ở backend. |
| **GAP-STF-ARC-01** | Customer Response Envelope (`customer.controller.ts` vs `appointment/intake`) | `customer.controller.ts` trả `{ status: 'success' | 'error', data, pagination: { totalRecords, totalPages, currentPage, limit } }`, khác với `{ success, data, meta: { pagination } }` của `billing`/`intake`. | Cả Integration test và Playwright E2E mock sử dụng đúng envelope thực tế của từng module. |

---

## 3. MA TRẬN BAO PHỦ TOÀN PHẦN DESK-STAFF PORTAL (6 PHÂN HỆ)

| # | Phân hệ & Routes | Tầng 1: Backend Unit (`tests/unit/staff/`) | Tầng 2: Backend Integration (`tests/integration/`) | Tầng 3: Frontend Playwright E2E (`src/frontend/e2e/`) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Desk-Staff Overview & Command Dashboard**<br>`/staff`, `/staff/dashboard` | *(Tổng hợp qua Dashboard & các service con)* | `dashboard-api.spec.ts` *(đã có)* | `staff-overview-dashboard.spec.ts` (`E2E-STF-OVR-01..02`, `E2E-STF-DASH-01`) + `saas-dashboard-roles.spec.ts` |
| **2** | **Lịch hẹn Dịch vụ**<br>`/staff/appointments`<br>`/api/appointments` | `appointment-service.spec.ts` (`STF-APT-UT-01..03`) | `appointment-api.spec.ts` *(đã có)* | `staff-appointments.spec.ts` (`E2E-STF-APT-01..02`) |
| **3** | **Tiếp nhận Xe (Walk-in / Tow-in / Appointment Check-in)**<br>`/staff/intake`<br>`/api/intake` | `intake-service.spec.ts` (`STF-INT-UT-01..03`) | `intake-api.spec.ts` *(đã có)* | `staff-intake.spec.ts` (`E2E-STF-INT-01..02`) |
| **4** | **Thu ngân & Hóa đơn**<br>`/staff/billing`, `/staff/billing/[id]`<br>`/api/invoices`, `/api/payments` | *(Logic tài chính phủ ở tầng Integration)* | `invoice-payment-api.spec.ts` *(đã có — 22 tests)* | `staff-billing.spec.ts` (`E2E-STF-BIL-01..02`) |
| **5** | **Quản lý Khách hàng & Phương tiện**<br>`/staff/customers`<br>`/api/customers` | `customer-service.spec.ts` (`STF-CUS-UT-01..03`) | `customer-api.spec.ts` *(mới — 4 tests)* | `staff-customers.spec.ts` (`E2E-STF-CUS-01..02`) |

---

## 4. DANH SÁCH TEST SUITES & KỊCH BẢN CHI TIẾT

### 4.1. Backend Unit Tests (`src/backend/tests/unit/staff/`)
- [`appointment-service.spec.ts`](../../../src/backend/tests/unit/staff/appointment-service.spec.ts) (16 tests):
  - `STF-APT-UT-01`: Kiểm tra khung giờ hành chính `08:00 - 17:00`, ranh giới `07:59` / `17:01`, liên kết `service_ids`, gửi email xác nhận, và schema Joi `createAppointmentSchema`.
  - `STF-APT-UT-02`: Chặn thiếu khách hàng/xe, xe không thuộc khách hàng, trùng lịch trong cùng ngày trên cùng biển số.
  - `STF-APT-UT-03`: Luồng chuyển trạng thái `confirmAppointment`, `updateAppointment` (chặn khách tự dời khi đã `CONFIRMED`, cho phép staff dời -> `RESCHEDULED`), `cancelAppointment`, và `arriveAppointment` (`CONFIRMED` -> `ARRIVED` + tạo `IntakeRecord` `QUEUED` + copy `services`).
- [`intake-service.spec.ts`](../../../src/backend/tests/unit/staff/intake-service.spec.ts) (6 tests):
  - `STF-INT-UT-01`: Tạo phiếu `WALK_IN` kèm `serviceIds`, truy vấn phân trang `getIntakeQueue` (`pagination.total`, `perPage`), lấy chi tiết `getIntakeById`.
  - `STF-INT-UT-02`: Quick-create khách hàng mới + xe mới trong cùng `$transaction`, chặn trùng SĐT / trùng biển số / sai chủ xe / xe đang `QUEUED`.
  - `STF-INT-UT-03`: Ràng buộc bắt buộc `towCompany` khi tiếp nhận `TOW_IN`, hủy phiếu `cancelIntake` chỉ cho phép khi `QUEUED`.
- [`customer-service.spec.ts`](../../../src/backend/tests/unit/staff/customer-service.spec.ts) (8 tests):
  - `STF-CUS-UT-01`: Tìm kiếm đa trường (`full_name`, `phone`, `email`, `license_plate`), lọc `active` / `deleted`, tính toán phân trang.
  - `STF-CUS-UT-02`: Tạo/cập nhật khách hàng & danh sách xe (fallback email `${phone}@placeholder.com`), chặn xóa xe đang gắn với `WorkOrder`/`Appointment`/`IntakeRecord`.
  - `STF-CUS-UT-03`: Chặn xóa mềm khi có `WorkOrder` mở, `Invoice` `DRAFT`/`ISSUED`, hoặc `Appointment` mở; khôi phục `restoreCustomer`; xóa vĩnh viễn `hardDeleteCustomer`.

### 4.2. Backend Integration Test Mới (`src/backend/tests/integration/`)
- [`customer-api.spec.ts`](../../../src/backend/tests/integration/customer-api.spec.ts) (4 tests): Kiểm chứng đủ 6 endpoints (`/api/customers` GET/POST, `/:id` PUT/DELETE, `/:id/restore` PATCH, `/:id/hard` DELETE) kèm guardrails 400 và lỗi DB 500.

### 4.3. Frontend Playwright E2E Suites (`src/frontend/e2e/`)
- [`staff-overview-dashboard.spec.ts`](../../../src/frontend/e2e/staff-overview-dashboard.spec.ts): `/staff` (Bento grid, wave chart, lọc live queue, lỗi 500 + nút **Thử lại**) & `/staff/dashboard` (Command Dashboard, `DashboardFilterBar`, `scope=workshop`, không tràn ngang 4 viewports).
- [`staff-appointments.spec.ts`](../../../src/frontend/e2e/staff-appointments.spec.ts): `/staff/appointments` (chuyển Ngày/Tuần/Tháng, lọc nhanh, mở/validate `CreateAppointmentModal`, lỗi 500 + **Thử lại**, Empty state, 4 viewports).
- [`staff-intake.spec.ts`](../../../src/frontend/e2e/staff-intake.spec.ts): `/staff/intake` (KPI, tab `QUEUED`/`CONVERTED`/`CANCELLED`, tìm kiếm, validate `WalkInIntakeModal` & `TowInIntakeModal`, lỗi 500 + **Thử lại**, Empty state, 4 viewports).
- [`staff-billing.spec.ts`](../../../src/frontend/e2e/staff-billing.spec.ts): `/staff/billing` (Bento KPI, 5 tabs, `<TablePagination />`, lỗi 500 + **Thử lại**, Empty state + **Xóa tìm kiếm**) & `/staff/billing/101` (`PaymentModal` Tiền mặt tính tiền thối + Chuyển khoản VietQR SePay + 4 viewports).
- [`staff-customers.spec.ts`](../../../src/frontend/e2e/staff-customers.spec.ts): `/staff/customers` (danh sách khách & xe, chuyển tab Đang hoạt động / Đã vô hiệu hóa, `CustomerFormModal` inline validation theo `validators.ts`, lỗi 500 + **Thử lại**, Empty state + `+ Thêm mới`, 4 viewports).
