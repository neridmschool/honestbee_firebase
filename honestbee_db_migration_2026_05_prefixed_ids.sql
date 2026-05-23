USE honestbee_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS id_sequence (
  SEQ_key VARCHAR(40) NOT NULL PRIMARY KEY,
  SEQ_prefix VARCHAR(8) NOT NULL,
  SEQ_next INT NOT NULL DEFAULT 1,
  SEQ_updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO customer (
  CUST_id,
  CUST_firstName,
  CUST_lastName,
  CUST_email,
  CUST_phone,
  CUST_city,
  CUST_createdAt,
  CUST_updatedAt
)
SELECT
  CONCAT('customer-', LEFT(MD5(ua.USER_email), 32)),
  ua.USER_firstName,
  ua.USER_lastName,
  ua.USER_email,
  ua.USER_phone,
  ua.USER_city,
  ua.USER_createdAt,
  NOW()
FROM user_account ua
LEFT JOIN customer c ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
WHERE LOWER(ua.USER_role) = 'customer'
  AND c.CUST_id IS NULL;

DROP TEMPORARY TABLE IF EXISTS tmp_customer_id_map;
CREATE TEMPORARY TABLE tmp_customer_id_map (
  old_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  new_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE
) ENGINE=MEMORY;

SET @customer_no = 0;
INSERT INTO tmp_customer_id_map (old_id, new_id)
SELECT ordered.CUST_id, CONCAT('C', LPAD(@customer_no := @customer_no + 1, 3, '0'))
FROM (
  SELECT CUST_id
  FROM customer
  ORDER BY CUST_createdAt, CUST_id
) ordered;

UPDATE user_account ua
JOIN customer c ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
JOIN tmp_customer_id_map m ON m.old_id = c.CUST_id
SET ua.USER_linkedId = m.new_id,
    ua.USER_updatedAt = NOW()
WHERE LOWER(ua.USER_role) = 'customer';

UPDATE user_account ua
JOIN tmp_customer_id_map m ON m.old_id = ua.USER_linkedId
SET ua.USER_linkedId = m.new_id,
    ua.USER_updatedAt = NOW();

UPDATE customer_order o
JOIN tmp_customer_id_map m ON m.old_id = o.ORDER_customerId
SET o.ORDER_customerId = m.new_id;

UPDATE orders o
JOIN tmp_customer_id_map m ON m.old_id = o.ORDER_customerId
SET o.ORDER_customerId = m.new_id;

UPDATE rating r
JOIN tmp_customer_id_map m ON m.old_id = r.RATE_customerId
SET r.RATE_customerId = m.new_id;

UPDATE customer c
JOIN tmp_customer_id_map m ON m.old_id = c.CUST_id
SET c.CUST_id = m.new_id,
    c.CUST_updatedAt = NOW()
WHERE c.CUST_id <> m.new_id;

DROP TEMPORARY TABLE IF EXISTS tmp_merchant_id_map;
CREATE TEMPORARY TABLE tmp_merchant_id_map (
  old_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  new_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE
) ENGINE=MEMORY;

SET @merchant_no = 0;
INSERT INTO tmp_merchant_id_map (old_id, new_id)
SELECT ordered.MERCH_id, CONCAT('M', LPAD(@merchant_no := @merchant_no + 1, 3, '0'))
FROM (
  SELECT MERCH_id
  FROM merchant
  ORDER BY MERCH_createdAt, MERCH_id
) ordered;

UPDATE user_account ua
JOIN tmp_merchant_id_map m ON m.old_id = ua.USER_linkedId
SET ua.USER_linkedId = m.new_id,
    ua.USER_updatedAt = NOW();

UPDATE customer_order o
JOIN tmp_merchant_id_map m ON m.old_id = o.ORDER_merchantId
SET o.ORDER_merchantId = m.new_id;

UPDATE orders o
JOIN tmp_merchant_id_map m ON m.old_id = o.ORDER_merchantId
SET o.ORDER_merchantId = m.new_id;

UPDATE order_item i
JOIN tmp_merchant_id_map m ON m.old_id = i.ITEM_merchantId
SET i.ITEM_merchantId = m.new_id;

UPDATE products p
JOIN tmp_merchant_id_map m ON m.old_id = p.PROD_merchantId
SET p.PROD_merchantId = m.new_id,
    p.PROD_updatedAt = NOW();

UPDATE stores s
JOIN tmp_merchant_id_map m ON m.old_id = s.STORE_merchantId
SET s.STORE_merchantId = m.new_id;

UPDATE stores s
JOIN tmp_merchant_id_map m ON m.old_id = s.STORE_id
SET s.STORE_id = m.new_id,
    s.STORE_merchantId = m.new_id;

UPDATE customer_order o
JOIN tmp_merchant_id_map m ON m.old_id = o.ORDER_paymentVerifiedBy
SET o.ORDER_paymentVerifiedBy = m.new_id;

UPDATE orders o
JOIN tmp_merchant_id_map m ON m.old_id = o.ORDER_paymentVerifiedBy
SET o.ORDER_paymentVerifiedBy = m.new_id;

UPDATE payment_transaction p
JOIN tmp_merchant_id_map m ON m.old_id = p.PAY_verifiedBy
SET p.PAY_verifiedBy = m.new_id;

UPDATE merchant merch
JOIN tmp_merchant_id_map m ON m.old_id = merch.MERCH_id
SET merch.MERCH_id = m.new_id,
    merch.MERCH_updatedAt = NOW()
WHERE merch.MERCH_id <> m.new_id;

DROP TEMPORARY TABLE IF EXISTS tmp_rider_id_map;
CREATE TEMPORARY TABLE tmp_rider_id_map (
  old_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
  new_id VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE
) ENGINE=MEMORY;

SET @rider_no = 0;
INSERT INTO tmp_rider_id_map (old_id, new_id)
SELECT ordered.RIDER_id, CONCAT('R', LPAD(@rider_no := @rider_no + 1, 3, '0'))
FROM (
  SELECT RIDER_id
  FROM rider
  ORDER BY RIDER_createdAt, RIDER_id
) ordered;

UPDATE user_account ua
JOIN tmp_rider_id_map m ON m.old_id = ua.USER_linkedId
SET ua.USER_linkedId = m.new_id,
    ua.USER_updatedAt = NOW();

UPDATE customer_order o
JOIN tmp_rider_id_map m ON m.old_id = o.ORDER_riderId
SET o.ORDER_riderId = m.new_id;

UPDATE orders o
JOIN tmp_rider_id_map m ON m.old_id = o.ORDER_riderId
SET o.ORDER_riderId = m.new_id;

UPDATE customer_order o
JOIN tmp_rider_id_map m ON m.old_id = o.ORDER_lastRiderId
SET o.ORDER_lastRiderId = m.new_id;

UPDATE orders o
JOIN tmp_rider_id_map m ON m.old_id = o.ORDER_lastRiderId
SET o.ORDER_lastRiderId = m.new_id;

UPDATE customer_order o
JOIN tmp_rider_id_map m ON o.ORDER_rejectedRiders LIKE CONCAT('%', m.old_id, '%')
SET o.ORDER_rejectedRiders = REPLACE(o.ORDER_rejectedRiders, m.old_id, m.new_id);

UPDATE orders o
JOIN tmp_rider_id_map m ON o.ORDER_rejectedRiders LIKE CONCAT('%', m.old_id, '%')
SET o.ORDER_rejectedRiders = REPLACE(o.ORDER_rejectedRiders, m.old_id, m.new_id);

UPDATE rating r
JOIN tmp_rider_id_map m ON m.old_id = r.RATE_riderId
SET r.RATE_riderId = m.new_id;

UPDATE rider r
JOIN tmp_rider_id_map m ON m.old_id = r.RIDER_id
SET r.RIDER_id = m.new_id,
    r.RIDER_updatedAt = NOW()
WHERE r.RIDER_id <> m.new_id;

INSERT INTO id_sequence (SEQ_key, SEQ_prefix, SEQ_next)
SELECT 'customer', 'C', COALESCE(MAX(CAST(SUBSTRING(CUST_id, 2) AS UNSIGNED)), 0) + 1
FROM customer
WHERE CUST_id REGEXP '^C[0-9]+$'
ON DUPLICATE KEY UPDATE
  SEQ_prefix = VALUES(SEQ_prefix),
  SEQ_next = VALUES(SEQ_next);

INSERT INTO id_sequence (SEQ_key, SEQ_prefix, SEQ_next)
SELECT 'merchant', 'M', COALESCE(MAX(CAST(SUBSTRING(MERCH_id, 2) AS UNSIGNED)), 0) + 1
FROM merchant
WHERE MERCH_id REGEXP '^M[0-9]+$'
ON DUPLICATE KEY UPDATE
  SEQ_prefix = VALUES(SEQ_prefix),
  SEQ_next = VALUES(SEQ_next);

INSERT INTO id_sequence (SEQ_key, SEQ_prefix, SEQ_next)
SELECT 'rider', 'R', COALESCE(MAX(CAST(SUBSTRING(RIDER_id, 2) AS UNSIGNED)), 0) + 1
FROM rider
WHERE RIDER_id REGEXP '^R[0-9]+$'
ON DUPLICATE KEY UPDATE
  SEQ_prefix = VALUES(SEQ_prefix),
  SEQ_next = VALUES(SEQ_next);

SET FOREIGN_KEY_CHECKS = 1;
