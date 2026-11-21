# ĐẶC TẢ KỸ THUẬT & CHIẾN LƯỢC KIỂM THỬ TỰ ĐỘNG — SA PORTAL (SERVICE ADVISOR)
## HỆ THỐNG QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (CAR SERVICE CENTER)

> **Phiên bản tài liệu:** 1.0  
> **Ngày lập:** 2026-11-16  
> **Tài liệu chuẩn tham chiếu:** [`SPEC-ADMIN-PORTAL-AUTOMATED-TESTING.md`](./SPEC-ADMIN-PORTAL-AUTOMATED-TESTING.md), [`SPEC-STAFF-PORTAL-AUTOMATED-TESTING.md`](./SPEC-STAFF-PORTAL-AUTOMATED-TESTING.md)  
> **Phạm vi:** Toàn bộ cổng Cố vấn Dịch vụ (**SA Portal** — `internal-web` & `backend`: Overview, Command Dashboard, Intake Queue, Work Orders List, Work Order Detail 6-Tab Workspace & Lifecycle)  
> **Trạng thái:** Triển khai đầy đủ 3 tầng Unit $\rightarrow$ Integration $\rightarrow$ Playwright E2E

---

## MỤC LỤC
1. [Mục tiêu & Nguyên tắc Thiết kế](#1-mục-tiêu--nguyên-tắc-thiết-kế)
2. [Ma trận Bao phủ Toàn phần SA Portal](#2-ma-trận-bao-phủ-toàn-phần-sa-portal)
3. [Danh sách Test Suites & Kịch bản Chi tiết](#3-danh-sách-test-suites--kịch-bản-chi-tiết)
4. [Lệnh Chạy Kiểm thử Chuẩn](#4-lệnh-chạy-kiểm-thử-chuẩn)

---

## 1. MỤC TIÊU & NGUYÊN TẮC THIẾT KẾ

Tài liệu này đặc tả hệ thống kiểm thử tự động 3 tầng cho **Service Advisor (SA) Portal** từ tầng Backend Unit $\rightarrow$ Backend Integration $\rightarrow$ Frontend Playwright E2E:

1. **100% Hermetic Isolation (Phân lập tuyệt đối):**
   - **Backend Unit & Integration Tests:** Sử dụng `vi.mock` (cùng `vi.hoisted`) để giả lập hoàn toàn Prisma Client (`$transaction`, các model `workOrder`, `intakeRecord`, `woInspection`, `inspectionFinding`, `quotation`, `qcRecord`, `vehicleRelease`), AI Job Planner service và Notification service. **Không** kết nối MySQL/Redis thật.
   - **Frontend Playwright E2E Tests:** Sử dụng `page.addInitScript` để nạp phiên đăng nhập `SA` (`{ id: 2, email: 'advisor@autocare.vn', fullName: 'Trần Cố Vấn', roles: ['SA'] }`) vào `localStorage` và `page.route('**/api/**', ...)` để giả lập toàn bộ HTTP API theo đúng contract thực tế (bao gồm fallback global tránh 401 redirect).
2. **Tuân thủ The Ponytail Ladder (Zero New Dependencies):**
   - Tái sử dụng toolchain sẵn có trong monorepo: **Vitest** (Unit), **Vitest + Supertest** (Integration), **Playwright Chromium** (E2E). Không cài thêm package ngoài.
3. **Kiểm định Giao diện 4-State UI & Đa thiết bị (5-Viewport Audit):**
   - Mọi màn hình SA Portal được kiểm thử đầy đủ **4 trạng thái**: Loading, Empty, Error (kèm nút **Thử lại**), và Data.
   - Kiểm tra tràn ngang (`scrollWidth <= clientWidth + 2`) trên **5 kích thước màn hình chuẩn**, bao gồm cả Tablet dọc `960×1440` cho không gian làm việc chi tiết phiếu công việc:
     - Mobile: `390×844`
     - Tablet: `768×1024`
     - Tablet Portrait / Workshop Pad: `960×1440`
     - Laptop: `1024×768`
     - Desktop: `1440×900`
4. **Chuẩn hóa Cấu trúc Thư mục & Mã Test ID:**
   - **Unit:** `src/backend/tests/unit/{advisor,work-order,quotation}/*.spec.ts` (`SA-[MODULE]-UT-[INDEX]`)
   - **Integration:** `src/backend/tests/integration/{advisor-portal,work-order,quotation,dashboard}-api.spec.ts` (`SA-[MODULE]-API-[INDEX]`)
   - **E2E:** `src/frontend/e2e/advisor-*.spec.ts` (`E2E-SA-[MODULE]-[INDEX]`)

---

## 2. MA TRẬN BAO PHỦ TOÀN PHẦN SA PORTAL

| # | Phân hệ & Routes | Tầng 1: Backend Unit (`src/backend/tests/unit/`) | Tầng 2: Backend Integration (`src/backend/tests/integration/`) | Tầng 3: Frontend Playwright E2E (`src/frontend/e2e/`) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **SA Overview & Command Dashboard**<br>`/advisor`, `/advisor/dashboard`<br>`/api/dashboard/*` | *(Tổng hợp từ các service & guards)* | `dashboard-api.spec.ts`<br>(`SA-DASH-API-01..N`) | `advisor-overview-dashboard.spec.ts`<br>(`E2E-SA-OVR-01..02`, `E2E-SA-DASH-01`)<br>+ `saas-dashboard-roles.spec.ts` |
| **2** | **Hàng đợi Tiếp nhận (Intake Queue)**<br>`/advisor/intake-queue`<br>`/api/intake-queue`, `/api/work-orders` | `work-order/work-order-guards.spec.ts` | `advisor-portal-api.spec.ts`<br>(`SA-INT-API-01..N`) | `advisor-intake-queue.spec.ts`<br>(`E2E-SA-INT-01..02`) |
| **3** | **Danh sách Phiếu Công việc**<br>`/advisor/work-orders`<br>`/api/work-orders` | `work-order/work-order-guards.spec.ts`<br>`work-order/start-work.spec.ts` | `work-order-api.spec.ts`<br>`advisor-portal-api.spec.ts` | `advisor-work-orders.spec.ts`<br>(`E2E-SA-WO-01..02`) |
| **4** | **Chi tiết Phiếu Công việc — 6-Tab Workspace**<br>`/advisor/work-orders/[id]` (`?tab=checkin\|job\|parts\|quotation\|qc\|release`) | `advisor/check-in-inspection.spec.ts`<br>`quotation/quotation.service.spec.ts`<br>`work-order/qc-workflow.spec.ts`<br>`advisor/handover-release.spec.ts` | `work-order-api.spec.ts`<br>`quotation-api.spec.ts`<br>`advisor-portal-api.spec.ts` | `advisor-wo-detail-tabs.spec.ts`<br>(`E2E-SA-DET-01..02`) |
| **5** | **Luồng E2E Nghiệp vụ Khép kín & AI Job Planner**<br>`/advisor/intake-queue` $\rightarrow$ `/advisor/work-orders/[id]` | `ai/ai-rag-validator.spec.ts` | `work-order-api.spec.ts`<br>`quotation-api.spec.ts` | `advisor-wo-lifecycle.spec.ts` |

---

## 3. DANH SÁCH TEST SUITES & KỊCH BẢN CHI TIẾT

### 3.1. Tầng 1 — Backend Unit Tests (`src/backend/tests/unit/`)
- **`advisor/check-in-inspection.spec.ts`** (`SA-CHK-UT-*`):
  - Kiểm chứng logic tiếp nhận check-in (ODO, mức nhiên liệu, hiện trạng ngoại thất, tài sản trên xe) và ghi nhận dấu vết kiểm tra (`InspectionFinding`) gắn tọa độ sơ đồ xe.
- **`work-order/work-order-guards.spec.ts`** (`SA-WO-UT-*`):
  - Kiểm chứng state machine chuyển trạng thái phiếu công việc (`INTAKE` $\rightarrow$ `IN_PLANNING` $\rightarrow$ `WAITING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `BILLING_REQUESTED` $\rightarrow$ `FINANCIAL_CLEARED` $\rightarrow$ `RELEASED` $\rightarrow$ `CLOSED`).
- **`work-order/start-work.spec.ts`** (`SA-JOB-UT-*`):
  - Kiểm chứng điều kiện khởi động thi công (`startWork`) và phân công kỹ thuật viên.
- **`quotation/quotation.service.spec.ts`** (`SA-QUO-UT-*`):
  - Kiểm chứng tạo báo giá từ kế hoạch (`PRIMARY` / `SUPPLEMENTARY`), tính toán `subtotal`, `discountAmount`, `taxAmount`, `grandTotal`, gửi báo giá (`SENT`) và xử lý phản hồi phê duyệt/từ chối.
- **`work-order/qc-workflow.spec.ts`** (`SA-QC-UT-*`):
  - Kiểm chứng đánh giá KCS theo checklist template (`PASS` / `FAIL`), tạo công việc làm lại (`REWORK`) khi hạng mục không đạt, và điều kiện `requestBilling` khi 100% dịch vụ đạt chuẩn.
- **`advisor/handover-release.spec.ts`** (`SA-REL-UT-*`):
  - Kiểm chứng cổng tài chính (`FINANCIAL_CLEARED`) trước khi bàn giao xe chuẩn (`StandardVehicleHandoverModal`), xuất trả xe đặc biệt (`VehicleReturnModal`), và đóng phiếu (`CLOSED`).

### 3.2. Tầng 2 — Backend Integration Tests (`src/backend/tests/integration/`)
- **`advisor-portal-api.spec.ts`**: Kiểm chứng các endpoint đặc thù cổng Cố vấn (Intake Queue chuyển đổi thành Work Order, Check-in & Inspection findings, Handover/Release).
- **`work-order-api.spec.ts`**: Kiểm chứng CRUD & chuyển trạng thái Work Order, Services/Jobs, Parts, và QC endpoints.
- **`quotation-api.spec.ts`**: Kiểm chứng toàn bộ lifecycle endpoint `/api/quotations/*` (tạo, cập nhật, gửi, lịch sử phiên bản theo Work Order).
- **`dashboard-api.spec.ts`**: Kiểm chứng số liệu tổng hợp KPI & biểu đồ Command Dashboard cho vai trò `SA`.

### 3.3. Tầng 3 — Frontend Playwright E2E Suites (`src/frontend/e2e/`)
- **`advisor-overview-dashboard.spec.ts`** (`E2E-SA-OVR-01..02`, `E2E-SA-DASH-01`):
  - Kiểm thử `/advisor` (KPI, live queue, error 500 + Retry) và `/advisor/dashboard` (Command Dashboard, filter bar, responsive layout).
- **`advisor-intake-queue.spec.ts`** (`E2E-SA-INT-01..02`):
  - Kiểm thử `/advisor/intake-queue` (hàng đợi tiếp nhận xe, chuyển đổi sang Work Order, 4-state UI).
- **`advisor-work-orders.spec.ts`** (`E2E-SA-WO-01..02`):
  - Kiểm thử `/advisor/work-orders` (danh sách phiếu công việc, tìm kiếm, lọc trạng thái, phân trang, 4-state UI).
- **`advisor-wo-detail-tabs.spec.ts`** (`E2E-SA-DET-01..02`):
  - **`E2E-SA-DET-01`**: Kiểm thử `/advisor/work-orders/101`:
    - Sticky Header hiển thị mã phiếu (`WO-261018-001`) + `ChevronPipeline` 8 bước (`Tiếp nhận` $\rightarrow$ `Đóng`).
    - Keep-Alive 6 Tabs (`checkin`, `job`, `parts`, `quotation`, `qc`, `release`): chuyển tab giữ nguyên state input đang nhập và đồng bộ query `?tab=` trên URL (F5/reload khôi phục đúng tab đang mở).
    - Kiểm tra không tràn ngang trên **5 viewports**: `390×844`, `768×1024`, `960×1440`, `1024×768`, `1440×900`.
  - **`E2E-SA-DET-02`**: Kiểm thử tương tác trọng yếu trên cả **6 tabs** tại `960×1440`:
    - **Tab 1 (`checkin`)**: Chạm marker trên `InteractiveCarSVG` mở tooltip chi tiết (`Cửa trước bên lái`); danh sách ghi nhận có wrapper cuộn ngang (`md:overflow-x-auto`) và không hiển thị nhãn thừa `Chú thích:`.
    - **Tab 2 (`job`)**: Hiển thị header dịch vụ, badge `Chờ xử lý` (`PENDING`), và bộ lọc tìm kiếm (`Tìm hạng mục hoặc công việc...`).
    - **Tab 3 (`parts`)**: Hiển thị bảng phụ tùng tối ưu cho tablet `960×1440` với cột gộp `DK / Xuất` và cột `Thành tiền`.
    - **Tab 4 (`quotation`)**: Hiển thị bảng báo giá và mở/đóng `QuotationHistoryModal` qua nút `Lịch sử (1)`.
    - **Tab 5 (`qc`)**: Hiển thị danh sách tiêu chuẩn nghiệm thu KCS và pill trạng thái `Chờ đánh giá`.
    - **Tab 6 (`release`)**: Mở `StandardVehicleHandoverModal` (khi `FINANCIAL_CLEARED`) và kiểm chứng `<canvas>` chữ ký có class `touch-none`.
- **`advisor-wo-lifecycle.spec.ts`**:
  - Kiểm thử luồng E2E từ hàng đợi tiếp nhận $\rightarrow$ lập phiếu công việc $\rightarrow$ AI Job Planner đề xuất công việc & phân công kỹ thuật viên.

---

## 4. LỆNH CHẠY KIỂM THỬ CHUẨN

```bash
# 1. Backend Unit & Integration Tests (Vitest)
cd src/backend && npm test

# 2. Frontend Typecheck (Internal Web)
cd src/frontend/apps/internal-web && npx tsc --noEmit

# 3. Frontend Playwright E2E — SA Portal
cd src/frontend && npx playwright test e2e/advisor-wo-detail-tabs.spec.ts
cd src/frontend && npx playwright test e2e/advisor-*.spec.ts
```
