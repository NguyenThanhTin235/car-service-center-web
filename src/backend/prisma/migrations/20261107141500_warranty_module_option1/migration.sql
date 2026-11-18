-- AlterEnum
ALTER TABLE `intake_records` MODIFY `intake_type` ENUM('WALK_IN', 'TOW_IN', 'APPOINTMENT', 'WARRANTY') NOT NULL;

-- AlterEnum
ALTER TABLE `work_orders` MODIFY `source_type` ENUM('APPOINTMENT', 'WALK_IN', 'TOW_IN', 'WARRANTY') NOT NULL;

-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `is_warranty` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `inventory_items` ADD COLUMN `warranty_mileage` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `warranty_months` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `job_parts` ADD COLUMN `is_warranty` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `jobs` ADD COLUMN `is_warranty` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `original_job_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `services` ADD COLUMN `warranty_mileage` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `warranty_months` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `work_orders` ADD COLUMN `claim_approved_by_id` INTEGER NULL,
    ADD COLUMN `order_type` ENUM('NORMAL', 'WARRANTY', 'MIXED') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `parent_work_order_id` INTEGER NULL,
    ADD COLUMN `warranty_reason` TEXT NULL;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_parent_work_order_id_fkey` FOREIGN KEY (`parent_work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_claim_approved_by_id_fkey` FOREIGN KEY (`claim_approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

