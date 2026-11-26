-- CreateIndex
CREATE INDEX `services_is_active_name_idx` ON `services`(`is_active`, `name`);

-- CreateIndex
CREATE INDEX `appointments_status_scheduled_date_idx` ON `appointments`(`status`, `scheduled_date`);

-- CreateIndex
CREATE INDEX `appointments_scheduled_date_scheduled_time_idx` ON `appointments`(`scheduled_date`, `scheduled_time`);

-- CreateIndex
CREATE INDEX `work_orders_status_created_at_idx` ON `work_orders`(`status`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `work_orders_advisor_id_status_updated_at_idx` ON `work_orders`(`advisor_id`, `status`, `updated_at` DESC);

-- CreateIndex
CREATE INDEX `work_orders_order_type_created_at_idx` ON `work_orders`(`order_type`, `created_at`);

-- CreateIndex
CREATE INDEX `work_orders_created_at_idx` ON `work_orders`(`created_at` DESC);

-- CreateIndex
CREATE INDEX `quotations_work_order_id_status_idx` ON `quotations`(`work_order_id`, `status`);

-- CreateIndex
CREATE INDEX `quotations_status_created_at_idx` ON `quotations`(`status`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `inventory_items_is_active_created_at_idx` ON `inventory_items`(`is_active`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `inventory_items_is_active_on_hand_idx` ON `inventory_items`(`is_active`, `on_hand`);

-- CreateIndex
CREATE INDEX `stock_movements_item_id_created_at_id_idx` ON `stock_movements`(`item_id`, `created_at` DESC, `id` DESC);

-- CreateIndex
CREATE INDEX `invoices_status_created_at_idx` ON `invoices`(`status`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `invoices_status_issued_at_idx` ON `invoices`(`status`, `issued_at`);

-- CreateIndex
CREATE INDEX `invoices_status_paid_at_idx` ON `invoices`(`status`, `paid_at`);

-- CreateIndex
CREATE INDEX `payments_status_expires_at_idx` ON `payments`(`status`, `expires_at`);

-- CreateIndex
CREATE INDEX `audit_logs_entity_type_entity_id_created_at_idx` ON `audit_logs`(`entity_type`, `entity_id`, `created_at` DESC);

-- CreateIndex
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs`(`created_at` DESC);
