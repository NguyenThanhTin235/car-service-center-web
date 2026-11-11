# SPEC-MULTI-PORTAL-DASHBOARD: Hệ Thống Dashboard Tương Tác Đa Phân Hệ Dựa Trên Dữ Liệu Thực

> **Trạng thái:** DRAFT ➔ READY FOR IMPLEMENTATION  
> **Tác giả:** Antigravity AI Engineering & Architecture Team  
> **Áp dụng kỹ năng:** [`interactive-dashboard-builder`](../../.agents/skills/UI/interactive-dashboard-builder/SKILL.md), [`operational-dashboard-craft`](../../.agents/skills/UI/operational-dashboard-craft/SKILL.md), [`ponytail`](../../.agents/skills/ponytail/SKILL.md)  
> **Phạm vi mã nguồn:** `src/backend`, `src/frontend/apps/internal-web`  

---

## 1. 🎯 Tổng Quan Bài Toán & Mục Tiêu Nghiệp Vụ

### 1.1. Hiện trạng
- **Admin**: Đã có các màn hình CRUD tài khoản, nhân viên, dịch vụ, danh mục nhưng **chưa có Dashboard trung tâm** (`/admin` hoặc `(admin)/dashboard`) để giám sát tổng thể tài nguyên hệ thống, tỷ lệ kích hoạt tài khoản, cơ cấu dịch vụ và SLA.
- **Service Manager**: Đã có trang `(manager)/dashboard/page.tsx` nhưng dữ liệu thống kê còn sơ khai, thiếu biểu đồ doanh thu theo thời gian, thiếu phân bổ theo danh mục phụ tùng/dịch vụ, và chưa có bộ lọc chu kỳ linh hoạt.
- **Service Advisor (SA)**: Cần màn hình tổng hợp để quản lý đường ống báo giá (Quotations), lệnh chờ duyệt, xe sẵn sàng nghiệm thu QC và xe đã thanh toán chờ bàn giao cho khách (`FINANCIAL_CLEARED` ➔ `CLOSED`).
- **Staff (Kỹ thuật viên / Lễ tân)**: Cần bảng điều phối tiếp nhận xe (Intake Queue) và danh sách công việc được phân công trực tiếp cho thợ trong ca làm việc với bộ đếm thời gian thực.

### 1.2. Mục tiêu kỹ thuật
- **100% Dữ liệu thật từ MySQL/Prisma**: Tuyệt đối không hardcode mockup data. Mọi con số KPI, biểu đồ và danh sách phải truy vấn trực tiếp từ các bảng `work_order`, `wo_service`, `job`, `invoice`, `payment`, `inventory_item`, `appointment`, `user`, `employee`.
- **Kiến trúc API thống nhất**: Route chuẩn `GET /api/dashboard/:portal?period=...&scope=...` tuân thủ nghiêm ngặt `API_CONVENTION.md`.
- **Tương tác chuẩn `interactive-dashboard-builder`**:
  - KPI Cards có chỉ báo tăng trưởng so sánh kỳ trước (`+X% vs kỳ trước`).
  - Biểu đồ tương tác (Area/Line cho xu hướng, Donut cho trạng thái, Bar cho phân loại).
  - Lọc chéo (Cross-filtering): Bấm vào trạng thái hoặc biểu đồ tự động cập nhật danh sách bảng.
  - Socket.IO Live-pulse cập nhật tức thì khi có biến động nghiệp vụ.
  - Tuân thủ 4-State UI (Loading Skeleton, Empty State, Error Retry, Data Render).

---

## 2. 🗄️ Ánh Xạ Dữ Liệu Thực Tế Trong Database (Prisma Data Mapping)

| Phân hệ (Portal) | Chỉ số / Thành phần | Bảng DB & Điều kiện truy vấn Prisma |
| :--- | :--- | :--- |
| **Admin** | Tổng tài khoản & tỷ lệ kích hoạt | `prisma.user.count()` (groupBy `status`: ACTIVE/INACTIVE/BLOCKED) |
| | Phân bổ vai trò (RBAC) | `prisma.userRole.groupBy({ by: ['role_id'], _count: true })` |
| | Quy mô nhân sự theo chức vụ | `prisma.employee.count()` (theo `specialization` / `department`) |
| | Quy mô danh mục & dịch vụ | `prisma.service.count()`, `prisma.serviceCategory.count()`, `prisma.jobType.count()` |
| | Log hoạt động gần nhất | Top 10 users mới tạo hoặc phiên cập nhật quyền gần nhất |
| **Manager** | Doanh thu thực tế (Revenue) | `prisma.invoice.aggregate({ _sum: { total_amount: true }, where: { status: 'PAID', issued_at: { in: period } } })` |
| | Lệnh sửa chữa đang hoạt động | `prisma.workOrder.count({ where: { status: { in: ACTIVE_STATUSES } } })` |
| | Công việc quá hạn (Overdue SLA) | `prisma.job.count({ where: { status: 'IN_PROGRESS', started_at: { lt: threshold } } })` |
| | Xu hướng doanh thu theo ngày | `prisma.invoice.findMany({ select: { issued_at, total_amount } })` gom nhóm theo ngày |
| | Cơ cấu trạng thái lệnh sửa chữa | `prisma.workOrder.groupBy({ by: ['status'], _count: true })` |
| | Danh sách lệnh cần can thiệp | `workOrder` kèm `services`, `jobs` có cờ cảnh báo quá hạn |
| **Service Advisor** | Báo giá chờ khách duyệt | `prisma.quotation.count({ where: { status: 'SENT' } })` |
| | Lệnh xe đang kiểm tra / lập KH | `prisma.workOrder.count({ where: { status: { in: ['INSPECTION', 'IN_PLANNING'] } } })` |
| | Xe đã sẵn sàng bàn giao | `prisma.workOrder.count({ where: { status: 'FINANCIAL_CLEARED' } })` |
| | Lịch hẹn & Tiếp nhận hôm nay | `prisma.appointment.count({ where: { scheduled_date: today } })` |
| | Danh sách hồ sơ xe của tôi | `prisma.workOrder.findMany({ where: scope === 'my' ? { advisor_id } : {} })` |
| **Staff / Thợ** | Lượng xe chờ tiếp nhận (Intake) | `prisma.appointment.count()` + xe vãng lai trong ngày |
| | Công việc được giao cho tôi | `prisma.job.findMany({ where: { technician_id: user.employee.id, status: { in: ['PLANNED', 'IN_PROGRESS'] } } })` |
| | Công việc hoàn thành trong ca | `prisma.job.count({ where: { technician_id, status: 'COMPLETED', completed_at: today } })` |
| | Phụ tùng sắp hết hàng (Kho) | `prisma.inventoryItem.findMany({ where: { on_hand: { lte: reorder_level } } })` |

---

## 3. 🔌 Hợp Đồng API Chuẩn Hóa (`API_CONVENTION.md`)

### Endpoint duy nhất có phân định route param:
`GET /api/dashboard/:portal`
- `:portal` nhận một trong 4 giá trị: `admin` | `manager` | `sa` | `staff`.
- **Query Parameters**:
  - `period`: `today` | `7days` | `30days` | `this_month` | `custom` (mặc định: `7days`).
  - `start_date`: ISO string (khi `period=custom`).
  - `end_date`: ISO string (khi `period=custom`).
  - `scope`: `my` | `workshop` (áp dụng cho SA và Staff, mặc định `my`).

### Response Envelope:
```json
{
  "success": true,
  "data": {
    "portal": "manager",
    "period": {
      "key": "7days",
      "startDate": "2026-11-04T00:00:00.000Z",
      "endDate": "2026-11-11T23:59:59.999Z"
    },
    "kpis": [
      {
        "key": "totalRevenue",
        "label": "Doanh thu dịch vụ",
        "value": 185400000,
        "prevValue": 162000000,
        "format": "currency",
        "trendInverted": false
      }
    ],
    "charts": {
      "trend": [
        { "label": "04/11", "value": 24000000, "count": 8 }
      ],
      "distribution": [
        { "category": "Đang sửa chữa", "count": 14, "color": "#0ea5e9" }
      ],
      "ranking": [
        { "name": "Bảo dưỡng 20.000km", "value": 35 }
      ]
    },
    "actionableList": []
  },
  "message": "Lấy dữ liệu dashboard manager thành công",
  "meta": {
    "timestamp": "2026-11-11T10:55:00.000Z"
  }
}
```

---

## 4. 🎨 Kiến Trúc UI & Trải Nghiệm Người Dùng (Frontend Architecture)

### 4.1. Cấu trúc Component dùng chung (`src/frontend/apps/internal-web/src/components/dashboard/`)
1. `DashboardKPIRow.tsx`: Hiển thị hàng thẻ KPI với format VND tự động (`formatVND`), nhãn so sánh kỳ trước (`+12.4% vs kỳ trước`), icon chuyên biệt.
2. `DashboardFilterBar.tsx`:
   - Bộ chọn thời gian nhanh (`Hôm nay`, `7 ngày qua`, `30 ngày qua`, `Tháng này`).
   - Toggle Scope (`Việc của tôi` vs `Toàn xưởng`) cho SA & Staff.
   - Nút "Làm mới dữ liệu" kèm hiển thị thời gian đồng bộ cuối cùng (`Cập nhật lúc 10:45`).
3. `DashboardTrendChart.tsx`: Biểu đồ Area/Wave Chart hỗ trợ Tooltip tiền tệ chuẩn và tương thích giao diện sáng/tối.
4. `DashboardStatusDonut.tsx`: Biểu đồ vành khuyên thể hiện tỷ trọng trạng thái, cho phép **click vào lát cắt để lọc danh sách bên dưới (Cross-filtering)**.
5. `DashboardActionTable.tsx`: Bảng dữ liệu tương tác mật độ cao với Sticky Header, sort client-side tức thì, badge trạng thái kèm dot live-pulse.

### 4.2. Bản đồ đường dẫn các trang Dashboard (Routes):
- **Admin**: `src/app/(admin)/dashboard/page.tsx` (Route `/dashboard` hoặc `/admin`) kèm bổ sung tab điều hướng trong `AdminLayout`.
- **Manager**: Nâng cấp toàn diện `src/app/(manager)/dashboard/page.tsx`.
- **Service Advisor**: `src/app/(advisor)/advisor/page.tsx` (hoặc `(advisor)/dashboard/page.tsx`) kết nối dữ liệu thật.
- **Staff (Technician & Receptionist)**: `src/app/(dashboard)/staff/dashboard/page.tsx`.

---

## 5. ⚡ Tích Hợp Real-time (Socket.IO Live-Pulse)

Khi có các sự kiện phát sinh từ backend:
- `work_order:status_changed`
- `job:status_changed`
- `invoice:paid`
- `intake:created`

Hook `useDashboardSocket(portal, onRefresh)` sẽ:
- Bật hiệu ứng nhấp nháy êm dịu (`bg-blue-50/50 transition-colors duration-700`).
- Tự động debounce gọi lại API cập nhật dữ liệu mà không làm giật khung hình người dùng đang xem.

---

## 6. 🚫 Giới Hạn & Ngoài Phạm Vi (Out of Scope)
- Không lưu tùy chỉnh vị trí kéo thả widget vào database cá nhân (YAGNI).
- Không xuất báo cáo ra file Excel phức tạp trong scope của Dashboard (chức năng đó đã thuộc về module `/reports`).
- Không can thiệp sửa đổi schema cơ sở dữ liệu `schema.prisma` (tận dụng 100% schema và models hiện có theo quy tắc The Ladder).
