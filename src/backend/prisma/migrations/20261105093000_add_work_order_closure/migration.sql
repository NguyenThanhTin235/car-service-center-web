-- AlterTable: thêm thông tin đóng hồ sơ phiếu công việc
ALTER TABLE `work_orders`
    ADD COLUMN `closed_at` DATETIME(3) NULL,
    ADD COLUMN `closed_by_id` INTEGER NULL,
    ADD COLUMN `close_type` ENUM('MANUAL', 'AUTO') NULL,
    ADD COLUMN `close_notes` TEXT NULL;

-- AddForeignKey
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_closed_by_id_fkey` FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

