USE honestbee_db;

-- Adds merchant open/closed store status used by Merchant, Customer, Rider, and Admin views.
SET @has_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'merchant'
    AND COLUMN_NAME = 'MERCH_storeStatus'
);
SET @sql := IF(@has_column = 0,
  'ALTER TABLE merchant ADD COLUMN MERCH_storeStatus VARCHAR(40) NOT NULL DEFAULT ''Open'' AFTER MERCH_preparationTime',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE merchant
SET MERCH_storeStatus = 'Open'
WHERE MERCH_storeStatus IS NULL OR MERCH_storeStatus = '';

UPDATE stores
SET STORE_status = 'Open'
WHERE STORE_status IS NULL OR STORE_status = '';
