-- ==============================================================================
-- CƠ SỞ DỮ LIỆU QUẢN LÝ TRUNG TÂM DỊCH VỤ Ô TÔ (HỆ QUẢN TRỊ MYSQL 8.x)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `auto_service_db`
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `auto_service_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. IDENTITY & ACCESS (USERS, ROLES, EMPLOYEES)
-- ------------------------------------------------------------------------------

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20) UNIQUE NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `address` TEXT NULL,
  `user_type` ENUM('CUSTOMER', 'STAFF') NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `otp_hash` VARCHAR(255) NULL,
  `otp_attempts` INT DEFAULT 0,
  `otp_requested_at` DATETIME NULL,
  `otp_expires_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  UNIQUE KEY `uq_user_role` (`user_id`, `role_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNIQUE NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `position` ENUM('TECHNICIAN', 'DETAILER', 'QC_STAFF', 'ADVISOR', 'OTHER') NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `employee_skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `skill_id` INT NOT NULL,
  UNIQUE KEY `uq_employee_skill` (`employee_id`, `skill_id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`),
  FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. CUSTOMER & VEHICLE
-- ------------------------------------------------------------------------------

CREATE TABLE `vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `license_plate` VARCHAR(20) NOT NULL UNIQUE,
  `make` VARCHAR(100) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `year` SMALLINT NULL,
  `color` VARCHAR(50) NULL,
  `vehicle_size` ENUM('SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK') NOT NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. SYSTEM CATALOG
-- ------------------------------------------------------------------------------

CREATE TABLE `system_catalogs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `catalog_type` ENUM('UOM', 'CANCEL_REASON', 'ADJUST_REASON', 'TERMS') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  UNIQUE KEY `uq_catalog_type_name` (`catalog_type`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. SERVICE CATALOG & PRICING
-- ------------------------------------------------------------------------------

CREATE TABLE `service_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `service_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `pricing_type` ENUM('FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS') NOT NULL,
  `fixed_price` DECIMAL(12,2) NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehicle_size_prices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `service_template_id` INT NOT NULL,
  `vehicle_size` ENUM('SMALL', 'MEDIUM', 'LARGE', 'SUV', 'TRUCK') NOT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  UNIQUE KEY `uq_service_size` (`service_template_id`, `vehicle_size`),
  FOREIGN KEY (`service_template_id`) REFERENCES `service_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `hourly_rate` DECIMAL(12,2) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_type_id` INT NOT NULL,
  `service_template_id` INT NULL,
  `name` VARCHAR(150) NOT NULL,
  `estimated_hours` DECIMAL(5,2) NOT NULL,
  `requires_qc` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`),
  FOREIGN KEY (`service_template_id`) REFERENCES `service_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. INVENTORY MASTER
-- ------------------------------------------------------------------------------

CREATE TABLE `suppliers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `contact_person` VARCHAR(150) NULL,
  `phone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `item_type` ENUM('PART', 'CONSUMABLE', 'CHEMICAL', 'ACCESSORY') NOT NULL,
  `uom_id` INT NOT NULL,
  `selling_price` DECIMAL(12,2) NOT NULL,
  `average_cost` DECIMAL(12,4) DEFAULT 0,
  `on_hand` DECIMAL(10,2) DEFAULT 0,
  `reorder_level` DECIMAL(10,2) DEFAULT 0,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`uom_id`) REFERENCES `system_catalogs`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_template_parts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_template_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `default_quantity` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`job_template_id`) REFERENCES `job_templates`(`id`),
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. INSPECTION & QC TEMPLATES
-- ------------------------------------------------------------------------------

CREATE TABLE `inspection_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `service_template_id` INT NULL,
  `template_type` ENUM('INSPECTION', 'QC') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (`service_template_id`) REFERENCES `service_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inspection_template_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `template_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `is_required` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  FOREIGN KEY (`template_id`) REFERENCES `inspection_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. APPOINTMENT & INTAKE
-- ------------------------------------------------------------------------------

CREATE TABLE `appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `vehicle_id` INT NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `scheduled_time` TIME NOT NULL,
  `status` ENUM('REQUESTED', 'CONFIRMED', 'ARRIVED', 'CANCELLED') DEFAULT 'REQUESTED',
  `cancel_reason` TEXT NULL,
  `notes` TEXT NULL,
  `created_by_id` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `appointment_services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `appointment_id` INT NOT NULL,
  `service_template_id` INT NOT NULL,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`),
  FOREIGN KEY (`service_template_id`) REFERENCES `service_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `intake_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `vehicle_id` INT NOT NULL,
  `intake_type` ENUM('WALK_IN', 'TOW_IN') NOT NULL,
  `status` ENUM('QUEUED', 'CONVERTED', 'CANCELLED') DEFAULT 'QUEUED',
  `arrived_at` DATETIME NOT NULL,
  `tow_company` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. WORK ORDER CORE
-- ------------------------------------------------------------------------------

CREATE TABLE `work_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wo_number` VARCHAR(20) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `vehicle_id` INT NOT NULL,
  `advisor_id` INT NOT NULL,
  `source_type` ENUM('APPOINTMENT', 'WALK_IN', 'TOW_IN') NOT NULL,
  `appointment_id` INT UNIQUE NULL,
  `intake_record_id` INT UNIQUE NULL,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'PENDING_PAYMENT', 'RELEASED', 'CLOSED') DEFAULT 'OPEN',
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`),
  FOREIGN KEY (`advisor_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`),
  FOREIGN KEY (`intake_record_id`) REFERENCES `intake_records`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `check_ins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL UNIQUE,
  `mileage` INT NOT NULL,
  `fuel_level` ENUM('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL') NOT NULL,
  `complaint` TEXT NOT NULL,
  `belongings` TEXT NULL,
  `exterior_condition` TEXT NOT NULL,
  `status` ENUM('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED', 'REVISION_REQUIRED') DEFAULT 'PENDING_CONFIRMATION',
  `rejection_reason` TEXT NULL,
  `confirmed_by_customer_id` INT NULL,
  `confirmed_at` DATETIME NULL,
  `evidence_urls` JSON NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`confirmed_by_customer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wo_services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL,
  `service_template_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `pricing_type` ENUM('FIXED', 'VEHICLE_SIZE', 'LABOUR_PARTS') NOT NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
  `sort_order` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`service_template_id`) REFERENCES `service_templates`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inspections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL,
  `wo_service_id` INT NULL,
  `template_id` INT NULL,
  `status` ENUM('IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS',
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`wo_service_id`) REFERENCES `wo_services`(`id`),
  FOREIGN KEY (`template_id`) REFERENCES `inspection_templates`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inspection_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inspection_id` INT NOT NULL,
  `template_item_id` INT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `result` ENUM('PASS', 'FAIL', 'MONITOR') NOT NULL,
  `notes` TEXT NULL,
  FOREIGN KEY (`inspection_id`) REFERENCES `inspections`(`id`),
  FOREIGN KEY (`template_item_id`) REFERENCES `inspection_template_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `findings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inspection_id` INT NOT NULL,
  `description` TEXT NOT NULL,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  `recommendation` TEXT NULL,
  `evidence_urls` JSON NULL,
  `is_visible_to_customer` BOOLEAN DEFAULT TRUE,
  `marker_type` ENUM('DAMAGE', 'RUST', 'DENT', 'SCRATCH', 'MISSING', 'OTHER') NULL,
  `part_name` VARCHAR(255) NULL,
  `coordinates` JSON NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`inspection_id`) REFERENCES `inspections`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wo_service_id` INT NOT NULL,
  `job_type_id` INT NULL,
  `job_template_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `estimated_hours` DECIMAL(5,2) NULL,
  `actual_hours` DECIMAL(5,2) NULL,
  `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PLANNED',
  `result_notes` TEXT NULL,
  `is_rework` BOOLEAN DEFAULT FALSE,
  `parent_job_id` INT NULL,
  `rework_source_qc_item_id` INT NULL,
  `created_by_id` INT NOT NULL,
  `started_at` DATETIME NULL,
  `completed_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`wo_service_id`) REFERENCES `wo_services`(`id`),
  FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`),
  FOREIGN KEY (`job_template_id`) REFERENCES `job_templates`(`id`),
  FOREIGN KEY (`parent_job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_findings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT NOT NULL,
  `finding_id` INT NOT NULL,
  UNIQUE KEY `uq_job_finding` (`job_id`, `finding_id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`finding_id`) REFERENCES `findings`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_labours` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT NOT NULL,
  `job_type_id` INT NOT NULL,
  `description` TEXT NULL,
  `employee_id` INT NULL,
  `estimated_hours` DECIMAL(5,2) NOT NULL,
  `billable_hours` DECIMAL(5,2) NULL,
  `hourly_rate` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(billable_hours, estimated_hours) * hourly_rate) STORED,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`job_type_id`) REFERENCES `job_types`(`id`),
  FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_parts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `planned_quantity` DECIMAL(10,2) NOT NULL,
  `issued_quantity` DECIMAL(10,2) DEFAULT 0,
  `returned_quantity` DECIMAL(10,2) DEFAULT 0,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) GENERATED ALWAYS AS ((issued_quantity - returned_quantity) * unit_price) STORED,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. QC & REWORK
-- ------------------------------------------------------------------------------

CREATE TABLE `qc_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `wo_service_id` INT NOT NULL,
  `template_id` INT NULL,
  `overall_result` ENUM('PASS', 'FAIL') NOT NULL,
  `notes` TEXT NULL,
  `inspector_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`wo_service_id`) REFERENCES `wo_services`(`id`),
  FOREIGN KEY (`template_id`) REFERENCES `inspection_templates`(`id`),
  FOREIGN KEY (`inspector_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `qc_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `qc_record_id` INT NOT NULL,
  `template_item_id` INT NULL,
  `item_name` VARCHAR(255) NOT NULL,
  `result` ENUM('PASS', 'FAIL') NOT NULL,
  `notes` TEXT NULL,
  FOREIGN KEY (`qc_record_id`) REFERENCES `qc_records`(`id`),
  FOREIGN KEY (`template_item_id`) REFERENCES `inspection_template_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm khóa ngoại cho jobs.rework_source_qc_item_id (đã define ở trên)
ALTER TABLE `jobs` ADD FOREIGN KEY (`rework_source_qc_item_id`) REFERENCES `qc_items`(`id`);

-- ------------------------------------------------------------------------------
-- 10. INVENTORY TRANSACTIONS
-- ------------------------------------------------------------------------------

CREATE TABLE `goods_receipts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_number` VARCHAR(30) NOT NULL UNIQUE,
  `supplier_id` INT NULL,
  `receipt_type` ENUM('PURCHASE', 'OPENING_STOCK') NOT NULL,
  `reference_no` VARCHAR(100) NULL,
  `received_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `goods_receipt_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit_cost` DECIMAL(12,4) NOT NULL,
  FOREIGN KEY (`receipt_id`) REFERENCES `goods_receipts`(`id`),
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `movement_type` ENUM('RECEIPT', 'OPENING', 'ISSUE', 'RETURN', 'ADJUSTMENT') NOT NULL,
  `reference_type` ENUM('GOODS_RECEIPT', 'JOB', 'ADJUSTMENT') NOT NULL,
  `reference_id` INT NOT NULL,
  `source_movement_id` INT NULL,
  `job_id` INT NULL,
  `job_part_id` INT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit_cost` DECIMAL(12,4) NOT NULL,
  `balance_after` DECIMAL(10,2) NOT NULL,
  `notes` TEXT NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`),
  FOREIGN KEY (`source_movement_id`) REFERENCES `stock_movements`(`id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`job_part_id`) REFERENCES `job_parts`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_adjustments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `adjustment_quantity` DECIMAL(10,2) NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  `requested_by_id` INT NOT NULL,
  `approved_by_id` INT NULL,
  `approved_at` DATETIME NULL,
  `reject_reason` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`),
  FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. QUOTATION
-- ------------------------------------------------------------------------------

CREATE TABLE `quotations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL,
  `quotation_number` VARCHAR(30) NOT NULL UNIQUE,
  `quotation_type` ENUM('PRIMARY', 'SUPPLEMENTARY') DEFAULT 'PRIMARY',
  `parent_quotation_id` INT NULL,
  `status` ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
  `subtotal` DECIMAL(12,2) DEFAULT 0,
  `discount_amount` DECIMAL(12,2) DEFAULT 0,
  `tax_rate` DECIMAL(5,4) DEFAULT 0.1000,
  `tax_amount` DECIMAL(12,2) DEFAULT 0,
  `grand_total` DECIMAL(12,2) DEFAULT 0,
  `sent_at` DATETIME NULL,
  `approved_at` DATETIME NULL,
  `approved_by_id` INT NULL,
  `rejected_at` DATETIME NULL,
  `reject_reason` TEXT NULL,
  `snapshot_at` DATETIME NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`parent_quotation_id`) REFERENCES `quotations`(`id`),
  FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quotation_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quotation_id` INT NOT NULL,
  `line_type` ENUM('PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE') NOT NULL,
  `wo_service_id` INT NULL,
  `job_id` INT NULL,
  `job_labour_id` INT NULL,
  `job_part_id` INT NULL,
  `description` VARCHAR(500) NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `snapshot_unit_price` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `sort_order` INT DEFAULT 0,
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations`(`id`),
  FOREIGN KEY (`wo_service_id`) REFERENCES `wo_services`(`id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`),
  FOREIGN KEY (`job_labour_id`) REFERENCES `job_labours`(`id`),
  FOREIGN KEY (`job_part_id`) REFERENCES `job_parts`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. BILLING & PAYMENT
-- ------------------------------------------------------------------------------

CREATE TABLE `billing_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL UNIQUE,
  `status` ENUM('PENDING', 'PROCESSED') DEFAULT 'PENDING',
  `requested_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`requested_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL UNIQUE,
  `invoice_number` VARCHAR(30) NOT NULL UNIQUE,
  `status` ENUM('DRAFT', 'ISSUED', 'PAID') DEFAULT 'DRAFT',
  `subtotal` DECIMAL(12,2) NOT NULL,
  `discount_amount` DECIMAL(12,2) DEFAULT 0,
  `tax_amount` DECIMAL(12,2) DEFAULT 0,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `amount_due` DECIMAL(12,2) NOT NULL,
  `issued_at` DATETIME NULL,
  `created_by_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `line_type` ENUM('PACKAGE', 'LABOUR', 'PART', 'MATERIAL', 'FEE') NOT NULL,
  `quotation_line_id` INT NULL,
  `wo_service_id` INT NULL,
  `job_id` INT NULL,
  `description` VARCHAR(500) NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `sort_order` INT DEFAULT 0,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`),
  FOREIGN KEY (`quotation_line_id`) REFERENCES `quotation_lines`(`id`),
  FOREIGN KEY (`wo_service_id`) REFERENCES `wo_services`(`id`),
  FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `payment_method` ENUM('CASH', 'CARD', 'QR_TRANSFER') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `transaction_ref` VARCHAR(255) UNIQUE NULL,
  `gateway_provider` VARCHAR(50) NULL,
  `payment_payload` JSON NULL,
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
  `paid_at` DATETIME NULL,
  `received_by_id` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`),
  FOREIGN KEY (`received_by_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehicle_releases` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `work_order_id` INT NOT NULL UNIQUE,
  `release_notes` TEXT NULL,
  `released_by_id` INT NOT NULL,
  `released_at` DATETIME NOT NULL,
  `confirmed_by_customer_id` INT NULL,
  `confirmed_at` DATETIME NULL,
  FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`),
  FOREIGN KEY (`released_by_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`confirmed_by_customer_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. SYSTEM & SUPPORT
-- ------------------------------------------------------------------------------

CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `notification_type` ENUM(
    'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'CHECKIN_READY',
    'QUOTATION_SENT', 'QUOTATION_APPROVED', 'QUOTATION_REJECTED',
    'INVOICE_ISSUED', 'PAYMENT_SUCCESS', 'VEHICLE_READY', 'BILLING_REQUEST', 'GENERAL'
  ) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `read_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE') NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NOT NULL,
  `before_data` JSON NULL,
  `after_data` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- END OF SCRIPT
-- ==============================================================================
