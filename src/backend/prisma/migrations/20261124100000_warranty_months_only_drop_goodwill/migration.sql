-- Migration: Warranty Months-Only Refactor & Drop Goodwill
-- 1. Drop GoodwillClaim table
DROP TABLE IF EXISTS `goodwill_claims`;

-- 2. Drop warranty_mileage columns from catalog & snapshot tables
ALTER TABLE `services` DROP COLUMN `warranty_mileage`;
ALTER TABLE `inventory_items` DROP COLUMN `warranty_mileage`;
ALTER TABLE `wo_services` DROP COLUMN `warranty_mileage`;
ALTER TABLE `job_parts` DROP COLUMN `warranty_mileage`;

-- 3. Drop odometer_reading from intake_records
ALTER TABLE `intake_records` DROP COLUMN `odometer_reading`;
