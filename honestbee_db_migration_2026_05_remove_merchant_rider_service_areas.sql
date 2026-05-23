USE honestbee_db;

-- Remove merchant/rider service area fields from existing databases.
-- Customer city and delivery service area remain because they are used by customer address and delivery records.

SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'merchant'
    AND COLUMN_NAME = 'MERCH_serviceArea'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE merchant DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT INDEX_NAME
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'merchant'
    AND COLUMN_NAME = 'MERCH_serviceArea'
    AND INDEX_NAME = 'idx_merchant_service_area'
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, 'ALTER TABLE merchant DROP INDEX idx_merchant_service_area', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE merchant
  DROP COLUMN IF EXISTS MERCH_serviceArea;

SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rider'
    AND COLUMN_NAME = 'RIDER_serviceArea'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql := IF(@fk IS NOT NULL, CONCAT('ALTER TABLE rider DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx := (
  SELECT INDEX_NAME
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'rider'
    AND COLUMN_NAME = 'RIDER_serviceArea'
    AND INDEX_NAME = 'idx_rider_service_area'
  LIMIT 1
);
SET @sql := IF(@idx IS NOT NULL, 'ALTER TABLE rider DROP INDEX idx_rider_service_area', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE rider
  DROP COLUMN IF EXISTS RIDER_serviceArea,
  DROP COLUMN IF EXISTS RIDER_preferredServiceArea;
