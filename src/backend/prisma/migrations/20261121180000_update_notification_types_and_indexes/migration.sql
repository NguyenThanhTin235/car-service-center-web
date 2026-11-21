-- AlterTable
ALTER TABLE `notifications`
  MODIFY `notification_type` ENUM('APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_REMINDER', 'APPOINTMENT_RESCHEDULED', 'CHECKIN_READY', 'QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED', 'WORK_ORDER_STARTED', 'SERVICE_ITEM_STARTED', 'INVOICE_ISSUED', 'PAYMENT_SUCCESS', 'VEHICLE_READY', 'VEHICLE_HANDOVER', 'QC_PASSED', 'QC_FAILED', 'LOW_STOCK_ALERT', 'BILLING_REQUEST', 'SYSTEM_ALERT', 'TASK_ASSIGNED', 'GENERAL') NOT NULL;

-- CreateIndex
CREATE INDEX `notifications_user_id_is_read_created_at_idx` ON `notifications`(`user_id`, `is_read`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `notifications_user_id_created_at_idx` ON `notifications`(`user_id`, `created_at` DESC);
