USE honestbee_db;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS CUST_password VARCHAR(255) DEFAULT NULL AFTER CUST_email,
  ADD COLUMN IF NOT EXISTS CUST_role VARCHAR(40) NOT NULL DEFAULT 'customer' AFTER CUST_password,
  ADD COLUMN IF NOT EXISTS CUST_status VARCHAR(40) NOT NULL DEFAULT 'Active' AFTER CUST_role,
  ADD COLUMN IF NOT EXISTS CUST_preferredDeliveryTime VARCHAR(60) DEFAULT NULL AFTER CUST_address;

INSERT INTO customer (
  CUST_id,
  CUST_firstName,
  CUST_lastName,
  CUST_email,
  CUST_password,
  CUST_role,
  CUST_status,
  CUST_phone,
  CUST_city,
  CUST_preferredDeliveryTime,
  CUST_createdAt,
  CUST_updatedAt
)
SELECT
  CASE
    WHEN ua.USER_linkedId REGEXP '^C[0-9]+$' OR ua.USER_linkedId REGEXP '^customer-' THEN ua.USER_linkedId
    ELSE ua.USER_id
  END,
  ua.USER_firstName,
  ua.USER_lastName,
  ua.USER_email,
  ua.USER_password,
  COALESCE(NULLIF(ua.USER_role, ''), 'customer'),
  COALESCE(NULLIF(ua.USER_status, ''), 'Active'),
  ua.USER_phone,
  ua.USER_city,
  ua.USER_preferredDeliveryTime,
  ua.USER_createdAt,
  ua.USER_updatedAt
FROM user_account ua
LEFT JOIN customer c ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
WHERE LOWER(COALESCE(NULLIF(ua.USER_role, ''), 'customer')) = 'customer'
  AND ua.USER_email IS NOT NULL
  AND ua.USER_email <> ''
  AND c.CUST_id IS NULL
ON DUPLICATE KEY UPDATE
  CUST_firstName = COALESCE(NULLIF(CUST_firstName, ''), VALUES(CUST_firstName)),
  CUST_lastName = COALESCE(NULLIF(CUST_lastName, ''), VALUES(CUST_lastName)),
  CUST_email = COALESCE(NULLIF(CUST_email, ''), VALUES(CUST_email)),
  CUST_password = COALESCE(NULLIF(CUST_password, ''), VALUES(CUST_password)),
  CUST_role = COALESCE(NULLIF(CUST_role, ''), VALUES(CUST_role)),
  CUST_status = COALESCE(NULLIF(CUST_status, ''), VALUES(CUST_status)),
  CUST_phone = COALESCE(NULLIF(CUST_phone, ''), VALUES(CUST_phone)),
  CUST_city = COALESCE(CUST_city, VALUES(CUST_city)),
  CUST_preferredDeliveryTime = COALESCE(CUST_preferredDeliveryTime, VALUES(CUST_preferredDeliveryTime)),
  CUST_updatedAt = NOW();

UPDATE customer c
JOIN user_account ua ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
SET
  c.CUST_firstName = COALESCE(NULLIF(c.CUST_firstName, ''), ua.USER_firstName),
  c.CUST_lastName = COALESCE(NULLIF(c.CUST_lastName, ''), ua.USER_lastName),
  c.CUST_password = COALESCE(NULLIF(c.CUST_password, ''), ua.USER_password),
  c.CUST_role = COALESCE(NULLIF(c.CUST_role, ''), COALESCE(NULLIF(ua.USER_role, ''), 'customer')),
  c.CUST_status = COALESCE(NULLIF(c.CUST_status, ''), COALESCE(NULLIF(ua.USER_status, ''), 'Active')),
  c.CUST_phone = COALESCE(NULLIF(c.CUST_phone, ''), ua.USER_phone),
  c.CUST_city = COALESCE(c.CUST_city, ua.USER_city),
  c.CUST_preferredDeliveryTime = COALESCE(c.CUST_preferredDeliveryTime, ua.USER_preferredDeliveryTime),
  c.CUST_updatedAt = NOW()
WHERE LOWER(COALESCE(NULLIF(ua.USER_role, ''), 'customer')) = 'customer';

UPDATE customer
SET CUST_role = 'customer'
WHERE CUST_role IS NULL OR CUST_role = '';

UPDATE customer
SET CUST_status = 'Active'
WHERE CUST_status IS NULL OR CUST_status = '';

INSERT INTO id_sequence (SEQ_key, SEQ_prefix, SEQ_next)
SELECT
  'customer',
  'C',
  COALESCE(MAX(CAST(SUBSTRING(CUST_id, 2) AS UNSIGNED)), 0) + 1
FROM customer
WHERE CUST_id REGEXP '^C[0-9]+$'
ON DUPLICATE KEY UPDATE
  SEQ_prefix = VALUES(SEQ_prefix),
  SEQ_next = GREATEST(SEQ_next, VALUES(SEQ_next));

DROP TABLE IF EXISTS user_account;

SET FOREIGN_KEY_CHECKS = 1;
