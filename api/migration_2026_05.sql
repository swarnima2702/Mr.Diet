-- =====================================================================
-- MRDiet — Production Migration  (run on existing DB, zero data loss)
-- Date: 2026-05-10  (last updated)
-- Adds:
--   • coupons table
--   • payment-gateway / coupon settings rows
--   • subscriptions.transaction_id, subscriptions.admin_note columns
-- Safe to run multiple times — every statement is idempotent.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. New table: coupons
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupons` (
  `id`             INT PRIMARY KEY AUTO_INCREMENT,
  `code`           VARCHAR(50)               NOT NULL UNIQUE,
  `discount_type`  ENUM('percent','fixed')   NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(10,2)             NOT NULL DEFAULT 0,
  `max_uses`       INT                                DEFAULT NULL,   -- NULL = unlimited
  `used_count`     INT                       NOT NULL DEFAULT 0,
  `min_amount`     DECIMAL(10,2)             NOT NULL DEFAULT 0,
  `applies_to`     VARCHAR(50)               NOT NULL DEFAULT 'all',  -- all | daily | weekly | monthly
  `valid_from`     DATETIME                           DEFAULT NULL,   -- NULL = no start gate
  `valid_until`    DATETIME                           DEFAULT NULL,   -- NULL = lifetime
  `is_active`      TINYINT(1)                NOT NULL DEFAULT 1,
  `created_at`     DATETIME                  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coupon_code`   (`code`),
  INDEX `idx_coupon_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. subscriptions table — add transaction_id + admin_note columns
--    (Used by admin Transactions panel to manually update statuses
--     and store gateway txn IDs / notes.)
--    Safe pattern: drop-if-exists then add — works on MariaDB/MySQL
--    without IF NOT EXISTS column support in older versions.
-- ---------------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'subscriptions'
    AND COLUMN_NAME  = 'transaction_id'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `subscriptions` ADD COLUMN `transaction_id` VARCHAR(100) NULL AFTER `payment_status`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'subscriptions'
    AND COLUMN_NAME  = 'admin_note'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE `subscriptions` ADD COLUMN `admin_note` TEXT NULL AFTER `transaction_id`',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---------------------------------------------------------------------
-- 3. Seed settings rows (key-value table — INSERT IGNORE skips existing)
--    These power the admin "Payments" panel + coupon system.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('enable_cashfree',      '1'),
  ('enable_razorpay',      '0'),
  ('enable_paypal',        '0'),
  ('cashfree_app_id',      ''),
  ('cashfree_secret_key',  ''),
  ('razorpay_key_id',      ''),
  ('razorpay_key_secret',  ''),
  ('paypal_client_id',     ''),
  ('paypal_client_secret', '');

-- ---------------------------------------------------------------------
-- 4. subscriptions.payment_status — no schema change needed.
--    The app now writes the value 'upgraded' here when a subscription
--    is replaced via the upgrade flow, and admins may set 'refunded'
--    via the Transactions panel. Column is already VARCHAR(50).
--    (Documentation only — nothing to ALTER.)
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- DONE.
-- Verify:
--   SHOW TABLES LIKE 'coupons';
--   SHOW COLUMNS FROM subscriptions LIKE 'transaction_id';
--   SHOW COLUMNS FROM subscriptions LIKE 'admin_note';
--   SELECT setting_key, setting_value FROM settings
--     WHERE setting_key IN ('enable_cashfree','enable_razorpay','enable_paypal',
--                           'razorpay_key_id','cashfree_app_id');
-- ---------------------------------------------------------------------
