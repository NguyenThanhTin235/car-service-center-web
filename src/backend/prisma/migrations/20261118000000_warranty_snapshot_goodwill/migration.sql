-- Migration: 20261118000000_warranty_snapshot_goodwill
-- Phân hệ Bảo hành (UC-81 → UC-87)
-- Thêm snapshot hạn bảo hành, ODO tiếp nhận/xuất xưởng và bảng Goodwill Claim

-- ============================================================
-- NHÓM 1: intake_records – Thêm ODO tiếp nhận bảo hành
-- UC-83: Lễ tân nhập ODO để hệ thống kiểm tra chống tua lùi
-- ============================================================
ALTER TABLE `intake_records`
  ADD COLUMN `odometer_reading` INT NULL
  COMMENT 'ODO thực tế khi tiếp nhận xe. Bắt buộc khi intake_type = WARRANTY (validate ở Service layer).';

-- ============================================================
-- NHÓM 2: vehicle_releases – Thêm ODO xuất xưởng
-- UC-81: Mốc tính km bảo hành = odometer_at_release + warranty_mileage
-- ============================================================
ALTER TABLE `vehicle_releases`
  ADD COLUMN `odometer_at_release` INT NULL
  COMMENT 'ODO khi bàn giao xe xuất xưởng. Mốc gốc tính hạn km bảo hành (chính xác hơn ODO check-in).';

-- ============================================================
-- NHÓM 3: wo_services – Snapshot hạn bảo hành dịch vụ
-- UC-81: Tra cứu đúng dù admin đã thay đổi policy bảo hành sau
-- Pattern: giống QuotationLine.snapshot_unit_price
-- ============================================================
ALTER TABLE `wo_services`
  ADD COLUMN `warranty_months`  INT NOT NULL DEFAULT 0
  COMMENT 'Snapshot warranty_months từ Service tại thời điểm tạo Work Order',
  ADD COLUMN `warranty_mileage` INT NOT NULL DEFAULT 0
  COMMENT 'Snapshot warranty_mileage từ Service tại thời điểm tạo Work Order';

-- ============================================================
-- NHÓM 4: job_parts – Snapshot hạn bảo hành phụ tùng
-- UC-81: Tra cứu hạn bảo hành từng phụ tùng đã lắp
-- ============================================================
ALTER TABLE `job_parts`
  ADD COLUMN `warranty_months`  INT NOT NULL DEFAULT 0
  COMMENT 'Snapshot warranty_months từ InventoryItem tại thời điểm tạo Job',
  ADD COLUMN `warranty_mileage` INT NOT NULL DEFAULT 0
  COMMENT 'Snapshot warranty_mileage từ InventoryItem tại thời điểm tạo Job';

-- ============================================================
-- NHÓM 5: Bảng mới goodwill_claims
-- UC-86: Luồng phê duyệt thiện chí của Quản lý
-- Tách riêng để không conflict với FSM WorkOrder.status
-- ============================================================
CREATE TABLE `goodwill_claims` (
  `id`             INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id`     INT NOT NULL
                   COMMENT 'Xe cần xem xét bảo hành thiện chí',
  `customer_id`    INT NOT NULL
                   COMMENT 'Khách hàng yêu cầu thiện chí',
  `intake_id`      INT UNIQUE
                   COMMENT 'Phiếu tiếp nhận bảo hành liên quan (nullable – có thể tạo độc lập)',
  `parent_wo_id`   INT NOT NULL
                   COMMENT 'Work Order gốc đã thực hiện dịch vụ/lắp phụ tùng bị khiếu nại',
  `overdue_days`   INT NULL
                   COMMENT 'Số ngày quá hạn bảo hành (tính tại thời điểm tiếp nhận)',
  `overdue_km`     INT NULL
                   COMMENT 'Số km quá hạn bảo hành (tính tại thời điểm tiếp nhận)',
  `complaint`      TEXT NOT NULL
                   COMMENT 'Hiện tượng kỹ thuật khách phản ánh (mô tả chi tiết)',
  `status`         ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING'
                   COMMENT 'PENDING: Chờ Quản lý xét | APPROVED: Chấp thuận | REJECTED: Từ chối',
  `support_type`   ENUM('FULL','LABOUR_ONLY','PERCENTAGE') NULL
                   COMMENT 'Mức hỗ trợ: FULL=miễn 100% | LABOUR_ONLY=miễn công | PERCENTAGE=giảm % nhất định',
  `support_pct`    DECIMAL(5, 2) NULL
                   COMMENT 'Tỷ lệ % hỗ trợ, dùng khi support_type = PERCENTAGE (ví dụ: 50.00 = giảm 50%)',
  `approval_note`  TEXT NULL
                   COMMENT 'Căn cứ phê duyệt hoặc lý do từ chối (bắt buộc điền khi approve/reject)',
  `approved_by_id` INT NULL
                   COMMENT 'ID Quản lý đã phê duyệt/từ chối',
  `approved_at`    DATETIME NULL
                   COMMENT 'Thời điểm Quản lý ra quyết định',
  `created_by_id`  INT NOT NULL
                   COMMENT 'ID nhân viên lễ tân/cố vấn tạo yêu cầu thiện chí',
  `created_at`     DATETIME NOT NULL DEFAULT NOW(),
  `updated_at`     DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),

  CONSTRAINT `fk_goodwill_vehicle`      FOREIGN KEY (`vehicle_id`)     REFERENCES `vehicles`(`id`),
  CONSTRAINT `fk_goodwill_customer`     FOREIGN KEY (`customer_id`)    REFERENCES `users`(`id`),
  CONSTRAINT `fk_goodwill_approved_by`  FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_goodwill_created_by`   FOREIGN KEY (`created_by_id`)  REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hồ sơ yêu cầu hỗ trợ bảo hành thiện chí – UC-86';

