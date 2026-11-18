# Kế hoạch Chuyển đổi Database: Tích hợp Phân hệ Bảo hành (Warranty Module)

Dựa trên tài liệu đặc tả nghiệp vụ bảo hành [`SPEC_Warranty_Process_Plan.md`](../../../docs/requirements/references/SPEC_Warranty_Process_Plan.md) và danh mục Use Cases từ `UC-80` đến `UC-86`, hệ thống triển khai tích hợp phân hệ **Quản lý Bảo hành & Hỗ trợ Thiện chí (Warranty & Goodwill Module)** với các nguyên tắc kiến trúc cốt lõi:

1. **Lấy Phiếu công việc (Work Order) làm hồ sơ trung tâm**: Kế thừa toàn bộ máy trạng thái hữu hạn 10 bước (FSM 10 States: `DRAFT` → `CLOSED`), không tạo quy trình song song gây xáo trộn kiến trúc.
2. **Truy vết chuỗi bảo hành đa cấp**: Sử dụng quan hệ tự tham chiếu (Self-relation) `parent_work_order_id` để kết nối Lệnh bảo hành với Lệnh sửa chữa gốc phát sinh lỗi.
3. **Quy tắc kép Tài chính & Kho vận**:
   - Đối với khách hàng: Hạng mục bảo hành (`Job.is_warranty = true`, `JobPart.is_warranty = true`) áp dụng chính sách đơn giá **0 VNĐ**. Hóa đơn bảo hành 0 VNĐ tự động kích hoạt trạng thái `PAID` và `FINANCIAL_CLEARED` để xe vượt qua Cổng bàn giao xe (`Release Gate`).
   - Đối với nội bộ xưởng: Phụ tùng thay thế vẫn thực xuất kho vật lý (giảm tồn kho `on_hand`), hạch toán chi phí vốn theo phương pháp **Giá vốn bình quân gia quyền di động (MWA)** vào chi phí bảo hành của trung tâm; ghi nhận giờ công kỹ thuật viên để tính hiệu suất thợ.
4. **Cấu hình Master Data bảo hành theo 2 chiều**: Quản lý hạn mức bảo hành theo cả **Số tháng** (`warranty_months`) và **Số km ODO** (`warranty_mileage`).

---

## 1. Chi tiết Sửa đổi Database (`schema.prisma`)

### A. Bổ sung & Cập nhật Enum
- **Tạo mới `enum WorkOrderType`**:
  ```prisma
  enum WorkOrderType {
    NORMAL        // Đơn hàng sửa chữa, bảo dưỡng tiêu chuẩn
    WARRANTY      // Đơn hàng xử lý bảo hành thuần túy
    MIXED         // Đơn hàng hỗn hợp (có cả bảo hành miễn phí và dịch vụ phát sinh tính phí)
  }
  ```
- **Cập nhật `enum IntakeType`**: Bổ sung `WARRANTY` (Tiếp nhận xe đến vì sự cố bảo hành).
- **Cập nhật `enum WorkOrderSourceType`**: Bổ sung `WARRANTY` (Lệnh sửa chữa khởi tạo từ nguồn bảo hành).

---

### B. Mở rộng Bảng Lệnh Sửa Chữa (`work_orders`)
Thêm các trường phục vụ phân loại, liên kết chuỗi và phê duyệt bảo hành:
```prisma
model WorkOrder {
  // ... các trường hiện tại ...
  order_type           WorkOrderType       @default(NORMAL)
  parent_work_order_id Int?                // Liên kết Work Order gốc phát sinh lỗi
  warranty_reason      String?             @db.Text // Diễn giải hiện tượng lỗi theo phản ánh của khách
  claim_approved_by_id Int?                // Cấp quản lý phê duyệt bảo hành thiện chí (Goodwill)

  // Quan hệ tự tham chiếu (Self-relation) & người duyệt
  parent_work_order     WorkOrder?          @relation("WorkOrderHierarchy", fields: [parent_work_order_id], references: [id])
  child_warranty_orders WorkOrder[]        @relation("WorkOrderHierarchy")
  claim_approved_by     User?               @relation("ApprovedWarrantyClaims", fields: [claim_approved_by_id], references: [id])
}
```

---

### C. Mở rộng Bảng Công Việc & Phụ Tùng (`jobs`, `job_parts`)
Đánh dấu hạng mục bảo hành để áp dụng chính sách miễn phí 0đ:
```prisma
model Job {
  // ... các trường hiện tại ...
  is_warranty     Boolean   @default(false) // Đánh dấu công việc bảo hành
  original_job_id Int?                      // ID công việc cũ ở Lệnh trước
}

model JobPart {
  // ... các trường hiện tại ...
  is_warranty     Boolean   @default(false) // Đánh dấu phụ tùng thay thế miễn phí
}
```

---

### D. Mở rộng Master Data Hạn Bảo Hành (`services`, `inventory_items`)
Cấu hình hạn bảo hành tiêu chuẩn áp dụng cho Dịch vụ và Phụ tùng:
```prisma
model Service {
  // ... các trường hiện tại ...
  warranty_months  Int         @default(0) // Số tháng bảo hành tiêu chuẩn
  warranty_mileage Int         @default(0) // Số km ODO bảo hành tiêu chuẩn
}

model InventoryItem {
  // ... các trường hiện tại ...
  warranty_months  Int         @default(0) // Số tháng bảo hành tiêu chuẩn
  warranty_mileage Int         @default(0) // Số km ODO bảo hành tiêu chuẩn
}
```

---

### E. Mở rộng Bảng Đặt Lịch & Người Dùng (`appointments`, `users`)
- **Bảng `appointments`**: Thêm `is_warranty Boolean @default(false)` phục vụ khách đặt lịch hẹn bảo hành trực tuyến từ ứng dụng Web khách hàng (`customer-web`).
- **Bảng `users`**: Thêm quan hệ `approved_warranty_claims WorkOrder[] @relation("ApprovedWarrantyClaims")`.

---

## 2. Thực thi Migration & Đồng Bộ CSDL

1. **SQL Migration File**:
   Đã sinh file migration chính thức tại:
   `src/backend/prisma/migrations/20261107141500_warranty_module_option1/migration.sql`
2. **Đồng bộ MySQL & Sinh Prisma Client**:
   - Thực thi `npx prisma db push` đồng bộ trực tiếp vào database `car_service_center` trên MySQL localhost:3306.
   - Biên dịch lại Prisma Client (`@prisma/client v5.22.0`) đảm bảo cập nhật đầy đủ typing cho TypeScript.

---

## 3. Cập nhật Mã Nguồn Backend & Tính Tương Thích

- **File `src/backend/src/services/work-order.service.ts`**:
  - Cập nhật hàm chuyển đổi `mapIntakeToSourceType` bổ sung ánh xạ `WARRANTY: 'WARRANTY'`.
  - Tự động gán `order_type: intake.intake_type === 'WARRANTY' ? 'WARRANTY' : 'NORMAL'` khi sinh Lệnh sửa chữa từ Phiếu tiếp nhận.
- **Dọn dẹp thư mục**:
  - Gỡ bỏ thư mục tạm `docs/requirements/uc_new` (nội dung đã được chuẩn hóa vào `UseCase V2.md`).
  - Chuẩn hóa tên file tài liệu tham chiếu tại `docs/requirements/references/` theo định dạng `SCREAMING_SNAKE_CASE`.

---

## 4. Kết Quả Kiểm Thử (Verification Evidence)

Toàn bộ hệ thống Backend và Frontend đã được kiểm tra nghiêm ngặt, đảm bảo không có bất kỳ regression hoặc lỗi typecheck nào:

- **Backend TypeScript Compilation**: `npx tsc --noEmit` → **Exit code: 0 (0 errors)**.
- **Frontend `internal-web` Typecheck**: `npx tsc --noEmit` → **Exit code: 0 (0 errors)**.
- **Frontend `customer-web` Typecheck**: `npx tsc --noEmit` → **Exit code: 0 (0 errors)**.
- **Backend Test Suite (Vitest)**: Chạy 18/18 test files → **152/152 tests PASSED (Exit code: 0)**.
- **Bộ kiểm tra quy chuẩn Toolkit**: `python .agents/scripts/checklist.py .` → **4/4 checks PASSED**.

---

## 5. Lộ Trình Triển Khai Kế Tiếp (Next Steps)

1. **Backend Warranty Service (`warranty.service.ts`)**:
   - `checkVehicleWarrantyEligibility`: Kiểm tra điều kiện bảo hành tự động đối chiếu số tháng và số km ODO từ các Lệnh sửa chữa đã hoàn tất (`RELEASED` / `CLOSED`).
   - Xử lý đơn giá bán 0 VNĐ cho Job và JobPart bảo hành trong `quotation.service.ts`.
   - Xử lý tự động duyệt hóa đơn 0 VNĐ (`PAID`) và chuyển trạng thái `FINANCIAL_CLEARED` trong `invoice.service.ts`.
2. **Frontend UI**:
   - **Internal Web**: Thêm giao diện tra cứu lịch sử bảo hành theo Biển số xe, tiếp nhận xe diện bảo hành, và gắn badge `[BẢO HÀNH]` trên chi tiết Work Order.
   - **Customer Web**: Màn hình tra cứu sổ bảo hành điện tử và form đặt lịch kiểm tra bảo hành.

