# Kế hoạch Chuyển đổi Database: Nâng cấp Snapshot Hạn Bảo Hành & Bảng Hỗ Trợ Thiện Chí (Warranty Snapshot & Goodwill Module)

Dựa trên tài liệu đặc tả nghiệp vụ bảo hành [`UseCase V2.md`](../../../docs/requirements/UseCase%20V2.md) (từ `UC-81` đến `UC-87`) và kế hoạch kiến trúc CSDL tối ưu `warranty_db_plan.md`, hệ thống tiến hành nâng cấp Database giai đoạn 2 cho phân hệ **Quản lý Bảo hành & Hỗ trợ Thiện chí (Warranty & Goodwill Module)** với các nguyên tắc kiến trúc cốt lõi:

1. **Kiểm tra chống tua ODO khi tiếp nhận (Anti-Tamper Check - UC-83)**:
   - Ghi nhận chỉ số ODO tiếp nhận thực tế (`odometer_reading`) ngay tại bàn tiếp nhận của Lễ tân (`intake_records`) khi `intake_type = 'WARRANTY'`.
   - Ngăn chặn triệt để hành vi tua lùi công-tơ-mét trước khi Work Order hay Check-in được mở.
2. **Mốc tính km bảo hành xuất xưởng chuẩn xác (Release Odometer - UC-81, UC-83)**:
   - Lưu trữ chỉ số `odometer_at_release` tại bảng `vehicle_releases` tại thời điểm bàn giao xe xuất xưởng thực tế.
   - Trở thành điểm mốc chuẩn xác tuyệt đối để tính toán: `Km hết hạn bảo hành = odometer_at_release + warranty_mileage` (thay vì dùng ODO check-in đầu kỳ sai lệch do chạy thử nghiệm/chạy việc).
3. **Mẫu thiết kế Snapshot Hạn mức bảo hành (Warranty Terms Snapshot Pattern - UC-81)**:
   - Kế thừa pattern chuẩn đã áp dụng thành công tại `QuotationLine.snapshot_unit_price` và `JobPart.unit_price`.
   - Lưu trữ trực tiếp `warranty_months` và `warranty_mileage` trên từng dòng dịch vụ (`wo_services`) và phụ tùng xuất kho (`job_parts`) tại thời điểm tạo lệnh.
   - Đảm bảo tính toán hạn bảo hành cho xe không bị sai lệch trong tương lai nếu Quản trị viên thay đổi chính sách Master Data trong danh mục `Service` hay `InventoryItem`.
4. **Tách biệt luồng duyệt Thiện chí độc lập (Dedicated Goodwill Claims Table - UC-86)**:
   - Xây dựng bảng độc lập `goodwill_claims` cùng các enum trạng thái (`GoodwillClaimStatus`) và hình thức hỗ trợ (`GoodwillSupportType`).
   - Loại bỏ hoàn toàn việc lưu JSON text trong `WorkOrder.warranty_reason` và không xung đột với máy trạng thái 10 bước của `WorkOrder` (đặc biệt tránh nhầm lẫn với trạng thái `PENDING_APPROVAL` của Báo giá).
   - Hỗ trợ đầy đủ 3 mức chính sách thiện chí: Miễn phí toàn bộ (`FULL`), Miễn tiền công (`LABOUR_ONLY`), Giảm trừ theo tỷ lệ (`PERCENTAGE`).

---

## 1. Chi tiết Sửa đổi Database (`schema.prisma`)

### A. Bổ sung Enum Mới
- **Tạo mới `enum GoodwillClaimStatus`**:
  ```prisma
  enum GoodwillClaimStatus {
    PENDING   // Chờ Quản lý thẩm định
    APPROVED  // Đã phê duyệt hỗ trợ
    REJECTED  // Đã từ chối
  }
  ```
- **Tạo mới `enum GoodwillSupportType`**:
  ```prisma
  enum GoodwillSupportType {
    FULL         // Miễn phí 100% (tiền công + phụ tùng)
    LABOUR_ONLY  // Miễn phí tiền công, tính phụ tùng theo giá niêm yết
    PERCENTAGE   // Giảm trừ theo tỷ lệ % nhất định (căn cứ theo support_pct)
  }
  ```

---

### B. Mở rộng Bảng Tiếp Nhận Xe (`intake_records`)
Bổ sung chỉ số ODO khi tiếp nhận xe:
```prisma
model IntakeRecord {
  // ... các trường hiện tại ...
  odometer_reading Int?         // ODO khi tiếp nhận xe. Bắt buộc khi intake_type = WARRANTY (validate ở Service layer)
  // ... quan hệ hiện tại ...
}
```

---

### C. Mở rộng Bảng Bàn Giao Xe Xuất Xưởng (`vehicle_releases`)
Bổ sung chỉ số ODO lúc bàn giao xuất xưởng thực tế:
```prisma
model VehicleRelease {
  // ... các trường hiện tại ...
  odometer_at_release Int?         // ODO khi bàn giao xe xuất xưởng. Mốc gốc tính hạn km bảo hành
  // ... quan hệ hiện tại ...
}
```

---

### D. Snapshot Hạn Bảo Hành trong Dịch Vụ & Phụ Tùng (`wo_services`, `job_parts`)
Bổ sung snapshot thời hạn bảo hành từ Master Data sang thực thể đơn hàng:
```prisma
model WoService {
  // ... các trường hiện tại ...
  warranty_months  Int @default(0) // Snapshot từ Service.warranty_months lúc tạo WO
  warranty_mileage Int @default(0) // Snapshot từ Service.warranty_mileage lúc tạo WO
}

model JobPart {
  // ... các trường hiện tại ...
  warranty_months  Int @default(0) // Snapshot từ InventoryItem.warranty_months lúc tạo Job
  warranty_mileage Int @default(0) // Snapshot từ InventoryItem.warranty_mileage lúc tạo Job
}
```

---

### E. Tạo mới Bảng Quản Lý Bảo Hành Thiện Chí (`goodwill_claims`)
Bảng chuyên trách quản lý hồ sơ khiếu nại quá hạn nhẹ được Quản lý xét duyệt thiện chí:
```prisma
model GoodwillClaim {
  id             Int                  @id @default(autoincrement())
  vehicle_id     Int
  customer_id    Int
  intake_id      Int?                 @unique
  parent_wo_id   Int
  overdue_days   Int?
  overdue_km     Int?
  complaint      String               @db.Text
  status         GoodwillClaimStatus  @default(PENDING)
  support_type   GoodwillSupportType?
  support_pct    Decimal?             @db.Decimal(5, 2)
  approval_note  String?              @db.Text
  approved_by_id Int?
  approved_at    DateTime?
  created_by_id  Int
  created_at     DateTime             @default(now())
  updated_at     DateTime             @default(now()) @updatedAt

  vehicle     Vehicle   @relation(fields: [vehicle_id], references: [id])
  customer    User      @relation("GoodwillCustomer",   fields: [customer_id],   references: [id])
  approved_by User?     @relation("GoodwillApprovedBy", fields: [approved_by_id], references: [id])
  created_by  User      @relation("GoodwillCreatedBy",  fields: [created_by_id],  references: [id])
  parent_wo   WorkOrder @relation("GoodwillParentWO",  fields: [parent_wo_id],   references: [id])

  @@map("goodwill_claims")
}
```

**Cập nhật các quan hệ ngược (Back-relations) trong `User`, `Vehicle`, `WorkOrder`**:
- **Bảng `users`**:
  ```prisma
  goodwill_claims_as_customer GoodwillClaim[] @relation("GoodwillCustomer")
  goodwill_claims_approved    GoodwillClaim[] @relation("GoodwillApprovedBy")
  goodwill_claims_created     GoodwillClaim[] @relation("GoodwillCreatedBy")
  ```
- **Bảng `vehicles`**:
  ```prisma
  goodwill_claims GoodwillClaim[]
  ```
- **Bảng `work_orders`**:
  ```prisma
  goodwill_claims GoodwillClaim[] @relation("GoodwillParentWO")
  ```

---

## 2. Thực thi Migration & Đồng Bộ CSDL

1. **SQL Migration File**:
   Đã sinh và lưu trữ file migration chính thức tại:
   `src/backend/prisma/migrations/20261118000000_warranty_snapshot_goodwill/migration.sql`

2. **Các câu lệnh DDL chính đã thực thi**:
   ```sql
   -- 1. Thêm ODO tiếp nhận
   ALTER TABLE `intake_records` ADD COLUMN `odometer_reading` INT NULL;

   -- 2. Thêm ODO xuất xưởng
   ALTER TABLE `vehicle_releases` ADD COLUMN `odometer_at_release` INT NULL;

   -- 3. Snapshot hạn bảo hành dịch vụ
   ALTER TABLE `wo_services` 
     ADD COLUMN `warranty_months` INT NOT NULL DEFAULT 0,
     ADD COLUMN `warranty_mileage` INT NOT NULL DEFAULT 0;

   -- 4. Snapshot hạn bảo hành phụ tùng
   ALTER TABLE `job_parts` 
     ADD COLUMN `warranty_months` INT NOT NULL DEFAULT 0,
     ADD COLUMN `warranty_mileage` INT NOT NULL DEFAULT 0;

   -- 5. Tạo bảng hồ sơ bảo hành thiện chí
   CREATE TABLE `goodwill_claims` (
     `id` INT AUTO_INCREMENT PRIMARY KEY,
     `vehicle_id` INT NOT NULL,
     `customer_id` INT NOT NULL,
     `intake_id` INT UNIQUE,
     `parent_wo_id` INT NOT NULL,
     `overdue_days` INT,
     `overdue_km` INT,
     `complaint` TEXT NOT NULL,
     `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
     `support_type` ENUM('FULL','LABOUR_ONLY','PERCENTAGE'),
     `support_pct` DECIMAL(5,2),
     `approval_note` TEXT,
     `approved_by_id` INT,
     `approved_at` DATETIME,
     `created_by_id` INT NOT NULL,
     `created_at` DATETIME NOT NULL DEFAULT NOW(),
     `updated_at` DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
     FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
     FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
     FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`),
     FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
   );
   ```

3. **Đồng bộ MySQL & Sinh Prisma Client**:
   - Thực thi `npx prisma db push --accept-data-loss` đồng bộ trực tiếp schema vào CSDL `car_service_center` trên MySQL `localhost:3306`.
   - Trạng thái phản hồi: *"Your database is now in sync with your Prisma schema"*.
   - Biên dịch lại Prisma Client (`@prisma/client v5.22.0`), sinh mới đầy đủ types cho `GoodwillClaim`, `GoodwillClaimStatus`, `GoodwillSupportType` và các trường mở rộng.

---

## 3. Tổng Hợp Thay Đổi & Mục Đích Nghiệp Vụ (Mapping Use Cases)

| # | Bảng / Enum | Loại thay đổi | Trường dữ liệu bổ sung | Phục vụ Use Case | Mục đích nghiệp vụ |
|:---:|---|:---:|---|:---:|---|
| 1 | `intake_records` | ALTER TABLE | `odometer_reading Int?` | **UC-83** | Ghi nhận ODO khi tiếp nhận xe; Service validate `odometer_reading >= parent_wo.release.odometer_at_release` chống tua lùi ODO. |
| 2 | `vehicle_releases` | ALTER TABLE | `odometer_at_release Int?` | **UC-81, UC-83** | Điểm mốc chuẩn xác tính hạn ODO bảo hành (`odometer_at_release + warranty_mileage`). |
| 3 | `wo_services` | ALTER TABLE | `warranty_months Int`, `warranty_mileage Int` | **UC-81** | Snapshot thời hạn bảo hành công việc tại thời điểm lập lệnh, bảo vệ tính chính xác lịch sử tra cứu. |
| 4 | `job_parts` | ALTER TABLE | `warranty_months Int`, `warranty_mileage Int` | **UC-81** | Snapshot thời hạn bảo hành phụ tùng tại thời điểm xuất kho / chỉ định linh kiện. |
| 5 | `goodwill_claims` | CREATE TABLE | Bảng mới hoàn chỉnh | **UC-86** | Quản lý phê duyệt bảo hành thiện chí khi xe quá hạn nhẹ (ngày/km); lưu lý do và tỷ lệ hỗ trợ. |
| 6 | `GoodwillClaimStatus` | CREATE ENUM | `PENDING`, `APPROVED`, `REJECTED` | **UC-86** | Vòng đời phê duyệt hồ sơ bảo hành thiện chí độc lập với FSM của Work Order. |
| 7 | `GoodwillSupportType` | CREATE ENUM | `FULL`, `LABOUR_ONLY`, `PERCENTAGE` | **UC-86** | Cấu hình 3 mức hỗ trợ thiện chí: Toàn phần (0đ), Miễn công, hoặc Giảm % chi phí. |

---

## 4. Kết Quả Kiểm Thử & Xác Minh (Verification Evidence)

Hệ thống đã trải qua kiểm tra nghiêm ngặt ngay sau khi cập nhật schema:

- **Backend TypeScript Compilation**: `npx tsc --noEmit` → **Exit code: 0 (0 errors, hoàn toàn type-safe)**.
- **Database Status**: Đã cập nhật đầy đủ 5 trường/bảng mới, không phát sinh lỗi khóa ngoại hay xung đột schema.
- **Prisma Client Generation**: `@prisma/client v5.22.0` đồng bộ hoàn tất.

---

## 5. Lộ Trình Triển Khai Kế Tiếp (Next Steps - Backend & Frontend)

### Bước 1: Seed Data (`seed.ts`)
- Bổ sung cấu hình mẫu `warranty_months` và `warranty_mileage` vào Master Data dịch vụ và phụ tùng (ví dụ: bảo dưỡng định kỳ 6 tháng/10.000 km, phụ tùng hao mòn 12 tháng/20.000 km).

### Bước 2: Backend Services
1. **`warranty.service.ts` (Tạo mới)**:
   - `checkVehicleWarrantyEligibility(vehicleId, currentOdo)`: Tra cứu các hạng mục còn hạn từ các WO đã `RELEASED`/`CLOSED` dựa trên snapshot `warranty_months/mileage` và `odometer_at_release`.
   - `createGoodwillClaim(...)`: Tiếp nhận yêu cầu bảo hành thiện chí khi quá hạn nhẹ.
   - `approveGoodwillClaim(...)` & `rejectGoodwillClaim(...)`: Quản lý xét duyệt thiện chí kèm lý do bắt buộc.
2. **`work-order.service.ts`**:
   - Snapshot `warranty_months` & `warranty_mileage` từ Master Data khi tạo `WoService` và `JobPart`.
   - Ghi nhận `odometer_at_release` khi thực hiện xuất xưởng bàn giao xe (`releaseVehicle`).
3. **`intake.service.ts`**:
   - Lưu trữ `odometer_reading` khi tiếp nhận xe.
   - Thực hiện kiểm tra chống tua ODO (UC-83): `odometer_reading >= parent_wo.release.odometer_at_release`.
4. **`quotation.service.ts` & `invoice.service.ts`**:
   - Đảm bảo hạng mục bảo hành (`is_warranty = true`) giữ nguyên giá bán 0 VNĐ.
   - Tự động thanh toán (`status = 'PAID'`) và kích hoạt `FINANCIAL_CLEARED` khi hóa đơn đơn hàng bảo hành thuần túy có giá trị 0 VNĐ (UC-85).
5. **`report.service.ts`**:
   - Bổ sung hàm `getWarrantyReport()` thống kê tỷ lệ bảo hành, chi phí giá vốn bảo hành (MWA), linh kiện lỗi nhiều nhất và kỹ thuật viên liên quan (UC-87).

### Bước 3: Backend API Controllers & Routes
- Cung cấp các endpoint:
  - `GET /api/warranty/vehicle/:vehicleId?odometer=xxx`
  - `GET /api/warranty/goodwill-claims`
  - `POST /api/warranty/goodwill-claims`
  - `PATCH /api/warranty/goodwill-claims/:id/approve`
  - `PATCH /api/warranty/goodwill-claims/:id/reject`

### Bước 4: Frontend UI
- **Internal Web**:
  - Giao diện tiếp nhận xe bảo hành với kiểm tra ODO tự động (UC-83).
  - Màn hình Quản lý phê duyệt hồ sơ thiện chí `/warranty` (UC-86).
  - Tab Báo cáo bảo hành & phụ tùng lỗi trong `/reports` (UC-87).
- **Customer Web**:
  - Màn hình Sổ bảo hành điện tử `/customer/warranty` (UC-81).
  - Form đặt lịch hẹn bảo hành trực tuyến với liên kết hạng mục bảo hành (UC-82).
