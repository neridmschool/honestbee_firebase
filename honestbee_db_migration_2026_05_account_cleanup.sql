USE honestbee_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS service_city (
  CITY_name VARCHAR(80) NOT NULL PRIMARY KEY
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO service_city (CITY_name) VALUES
  ('Cebu City'),
  ('Lapu-Lapu'),
  ('Mandaue'),
  ('Consolacion'),
  ('Talisay')
ON DUPLICATE KEY UPDATE
  CITY_name = VALUES(CITY_name);

ALTER TABLE user_account
  ADD COLUMN IF NOT EXISTS USER_firstName VARCHAR(80) DEFAULT NULL AFTER USER_id,
  ADD COLUMN IF NOT EXISTS USER_lastName VARCHAR(80) DEFAULT NULL AFTER USER_firstName,
  ADD COLUMN IF NOT EXISTS USER_city VARCHAR(80) DEFAULT NULL AFTER USER_status;

UPDATE user_account
SET
  USER_firstName = COALESCE(
    NULLIF(TRIM(USER_firstName), ''),
    NULLIF(SUBSTRING_INDEX(TRIM(COALESCE(USER_fullName, '')), ' ', 1), '')
  ),
  USER_lastName = COALESCE(
    NULLIF(TRIM(USER_lastName), ''),
    NULLIF(TRIM(SUBSTRING(TRIM(COALESCE(USER_fullName, '')), LENGTH(SUBSTRING_INDEX(TRIM(COALESCE(USER_fullName, '')), ' ', 1)) + 2)), '')
  ),
  USER_city = CASE
    WHEN USER_city IN ('Cebu City', 'Lapu-Lapu', 'Mandaue', 'Consolacion', 'Talisay') THEN USER_city
    ELSE NULL
  END;

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS CUST_firstName VARCHAR(80) DEFAULT NULL AFTER CUST_id,
  ADD COLUMN IF NOT EXISTS CUST_lastName VARCHAR(80) DEFAULT NULL AFTER CUST_firstName,
  ADD COLUMN IF NOT EXISTS CUST_city VARCHAR(80) DEFAULT NULL AFTER CUST_phone;

UPDATE customer
SET
  CUST_firstName = COALESCE(
    NULLIF(TRIM(CUST_firstName), ''),
    NULLIF(SUBSTRING_INDEX(TRIM(COALESCE(CUST_fullName, '')), ' ', 1), '')
  ),
  CUST_lastName = COALESCE(
    NULLIF(TRIM(CUST_lastName), ''),
    NULLIF(TRIM(SUBSTRING(TRIM(COALESCE(CUST_fullName, '')), LENGTH(SUBSTRING_INDEX(TRIM(COALESCE(CUST_fullName, '')), ' ', 1)) + 2)), '')
  ),
  CUST_city = CASE
    WHEN CUST_city IN ('Cebu City', 'Lapu-Lapu', 'Mandaue', 'Consolacion', 'Talisay') THEN CUST_city
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'cebu city%' THEN 'Cebu City'
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'lapu-lapu%' THEN 'Lapu-Lapu'
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'lapu lapu%' THEN 'Lapu-Lapu'
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'mandaue%' THEN 'Mandaue'
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'consolacion%' THEN 'Consolacion'
    WHEN LOWER(TRIM(COALESCE(CUST_address, ''))) LIKE 'talisay%' THEN 'Talisay'
    ELSE NULL
  END;

UPDATE user_account ua
JOIN customer c ON c.CUST_email = ua.USER_email
SET ua.USER_city = COALESCE(ua.USER_city, c.CUST_city)
WHERE c.CUST_city IN ('Cebu City', 'Lapu-Lapu', 'Mandaue', 'Consolacion', 'Talisay');

ALTER TABLE merchant
  ADD COLUMN IF NOT EXISTS MERCH_ownerFirstName VARCHAR(80) DEFAULT NULL AFTER MERCH_id,
  ADD COLUMN IF NOT EXISTS MERCH_ownerLastName VARCHAR(80) DEFAULT NULL AFTER MERCH_ownerFirstName;

UPDATE merchant
SET
  MERCH_ownerFirstName = COALESCE(
    NULLIF(TRIM(MERCH_ownerFirstName), ''),
    NULLIF(SUBSTRING_INDEX(TRIM(COALESCE(MERCH_ownerName, '')), ' ', 1), '')
  ),
  MERCH_ownerLastName = COALESCE(
    NULLIF(TRIM(MERCH_ownerLastName), ''),
    NULLIF(TRIM(SUBSTRING(TRIM(COALESCE(MERCH_ownerName, '')), LENGTH(SUBSTRING_INDEX(TRIM(COALESCE(MERCH_ownerName, '')), ' ', 1)) + 2)), '')
  );

ALTER TABLE rider
  ADD COLUMN IF NOT EXISTS RIDER_firstName VARCHAR(80) DEFAULT NULL AFTER RIDER_id,
  ADD COLUMN IF NOT EXISTS RIDER_lastName VARCHAR(80) DEFAULT NULL AFTER RIDER_firstName;

UPDATE rider
SET
  RIDER_firstName = COALESCE(
    NULLIF(TRIM(RIDER_firstName), ''),
    NULLIF(SUBSTRING_INDEX(TRIM(COALESCE(RIDER_fullName, '')), ' ', 1), '')
  ),
  RIDER_lastName = COALESCE(
    NULLIF(TRIM(RIDER_lastName), ''),
    NULLIF(TRIM(SUBSTRING(TRIM(COALESCE(RIDER_fullName, '')), LENGTH(SUBSTRING_INDEX(TRIM(COALESCE(RIDER_fullName, '')), ' ', 1)) + 2)), '')
  );

ALTER TABLE user_account
  DROP COLUMN IF EXISTS USER_fullName,
  ADD INDEX idx_user_city (USER_city),
  ADD CONSTRAINT fk_user_city FOREIGN KEY (USER_city) REFERENCES service_city (CITY_name)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE customer
  DROP COLUMN IF EXISTS CUST_fullName,
  ADD INDEX idx_customer_city (CUST_city),
  ADD CONSTRAINT fk_customer_city FOREIGN KEY (CUST_city) REFERENCES service_city (CITY_name)
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE merchant
  DROP COLUMN IF EXISTS MERCH_ownerName;

ALTER TABLE rider
  DROP COLUMN IF EXISTS RIDER_fullName,
  DROP COLUMN IF EXISTS RIDER_preferredServiceArea;

UPDATE user_account
SET USER_data = CASE
  WHEN JSON_LENGTH(JSON_REMOVE(
    USER_data,
    '$.id',
    '$.USER_id',
    '$.USER_fullName',
    '$.USER_displayName',
    '$.USER_firstName',
    '$.USER_lastName',
    '$.firstName',
    '$.lastName',
    '$.USER_email',
    '$.USER_phone',
    '$.USER_password',
    '$.USER_role',
    '$.USER_linkedId',
    '$.USER_status',
    '$.USER_city',
    '$.city',
    '$.USER_preferredDeliveryTime',
    '$.USER_createdAt',
    '$.USER_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )) = 0 THEN NULL
  ELSE JSON_REMOVE(
    USER_data,
    '$.id',
    '$.USER_id',
    '$.USER_fullName',
    '$.USER_displayName',
    '$.USER_firstName',
    '$.USER_lastName',
    '$.firstName',
    '$.lastName',
    '$.USER_email',
    '$.USER_phone',
    '$.USER_password',
    '$.USER_role',
    '$.USER_linkedId',
    '$.USER_status',
    '$.USER_city',
    '$.city',
    '$.USER_preferredDeliveryTime',
    '$.USER_createdAt',
    '$.USER_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )
END
WHERE USER_data IS NOT NULL;

UPDATE customer
SET CUST_data = CASE
  WHEN JSON_LENGTH(JSON_REMOVE(
    CUST_data,
    '$.id',
    '$.CUST_id',
    '$.CUST_fullName',
    '$.fullName',
    '$.CUST_firstName',
    '$.CUST_lastName',
    '$.firstName',
    '$.lastName',
    '$.CUST_email',
    '$.email',
    '$.CUST_phone',
    '$.phone',
    '$.CUST_city',
    '$.city',
    '$.CUST_address',
    '$.address',
    '$.CUST_createdAt',
    '$.CUST_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )) = 0 THEN NULL
  ELSE JSON_REMOVE(
    CUST_data,
    '$.id',
    '$.CUST_id',
    '$.CUST_fullName',
    '$.fullName',
    '$.CUST_firstName',
    '$.CUST_lastName',
    '$.firstName',
    '$.lastName',
    '$.CUST_email',
    '$.email',
    '$.CUST_phone',
    '$.phone',
    '$.CUST_city',
    '$.city',
    '$.CUST_address',
    '$.address',
    '$.CUST_createdAt',
    '$.CUST_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )
END
WHERE CUST_data IS NOT NULL;

UPDATE merchant
SET MERCH_data = CASE
  WHEN JSON_LENGTH(JSON_REMOVE(
    MERCH_data,
    '$.id',
    '$.MERCH_id',
    '$.MERCH_ownerName',
    '$.ownerName',
    '$.MERCH_ownerFirstName',
    '$.MERCH_ownerLastName',
    '$.MERCH_ownerEmail',
    '$.MERCH_password',
    '$.MERCH_phone',
    '$.MERCH_name',
    '$.MERCH_type',
    '$.MERCH_address',
    '$.MERCH_businessHours',
    '$.MERCH_businessProof',
    '$.MERCH_availableDays',
    '$.MERCH_preparationTime',
    '$.MERCH_approvalStatus',
    '$.MERCH_createdAt',
    '$.MERCH_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )) = 0 THEN NULL
  ELSE JSON_REMOVE(
    MERCH_data,
    '$.id',
    '$.MERCH_id',
    '$.MERCH_ownerName',
    '$.ownerName',
    '$.MERCH_ownerFirstName',
    '$.MERCH_ownerLastName',
    '$.MERCH_ownerEmail',
    '$.MERCH_password',
    '$.MERCH_phone',
    '$.MERCH_name',
    '$.MERCH_type',
    '$.MERCH_address',
    '$.MERCH_businessHours',
    '$.MERCH_businessProof',
    '$.MERCH_availableDays',
    '$.MERCH_preparationTime',
    '$.MERCH_approvalStatus',
    '$.MERCH_createdAt',
    '$.MERCH_updatedAt',
    '$.createdAt',
    '$.updatedAt'
  )
END
WHERE MERCH_data IS NOT NULL;

UPDATE rider
SET RIDER_data = CASE
  WHEN JSON_LENGTH(JSON_REMOVE(
    RIDER_data,
    '$.id',
    '$.RIDER_id',
    '$.SHOP_id',
    '$.RIDER_fullName',
    '$.SHOP_fullName',
    '$.fullName',
    '$.RIDER_firstName',
    '$.SHOP_firstName',
    '$.RIDER_lastName',
    '$.SHOP_lastName',
    '$.RIDER_email',
    '$.SHOP_email',
    '$.RIDER_password',
    '$.SHOP_password',
    '$.RIDER_phone',
    '$.SHOP_phone',
    '$.RIDER_currentLocation',
    '$.SHOP_currentLocation',
    '$.RIDER_vehicleType',
    '$.SHOP_vehicleType',
    '$.RIDER_validId',
    '$.SHOP_validId',
    '$.RIDER_availabilityStatus',
    '$.SHOP_availabilityStatus',
    '$.RIDER_employmentStatus',
    '$.SHOP_employmentStatus',
    '$.RIDER_maxActiveOrders',
    '$.SHOP_maxActiveOrders',
    '$.RIDER_createdAt',
    '$.SHOP_createdAt',
    '$.RIDER_updatedAt',
    '$.role',
    '$.createdAt',
    '$.updatedAt'
  )) = 0 THEN NULL
  ELSE JSON_REMOVE(
    RIDER_data,
    '$.id',
    '$.RIDER_id',
    '$.SHOP_id',
    '$.RIDER_fullName',
    '$.SHOP_fullName',
    '$.fullName',
    '$.RIDER_firstName',
    '$.SHOP_firstName',
    '$.RIDER_lastName',
    '$.SHOP_lastName',
    '$.RIDER_email',
    '$.SHOP_email',
    '$.RIDER_password',
    '$.SHOP_password',
    '$.RIDER_phone',
    '$.SHOP_phone',
    '$.RIDER_currentLocation',
    '$.SHOP_currentLocation',
    '$.RIDER_vehicleType',
    '$.SHOP_vehicleType',
    '$.RIDER_validId',
    '$.SHOP_validId',
    '$.RIDER_availabilityStatus',
    '$.SHOP_availabilityStatus',
    '$.RIDER_employmentStatus',
    '$.SHOP_employmentStatus',
    '$.RIDER_maxActiveOrders',
    '$.SHOP_maxActiveOrders',
    '$.RIDER_createdAt',
    '$.SHOP_createdAt',
    '$.RIDER_updatedAt',
    '$.role',
    '$.createdAt',
    '$.updatedAt'
  )
END
WHERE RIDER_data IS NOT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS PROD_merchantName VARCHAR(190) DEFAULT NULL AFTER PROD_merchantId;

UPDATE products
SET PROD_merchantName = COALESCE(
  NULLIF(TRIM(PROD_merchantName), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PROD_data, '$.merchant')), ''),
  NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PROD_data, '$.merchant_name')), '')
)
WHERE PROD_data IS NOT NULL;

ALTER TABLE customer_order
  ADD COLUMN IF NOT EXISTS ORDER_paymentStatus VARCHAR(80) DEFAULT NULL AFTER ORDER_paymentMethod,
  ADD COLUMN IF NOT EXISTS ORDER_merchantName VARCHAR(190) DEFAULT NULL AFTER ORDER_customerAddress,
  ADD COLUMN IF NOT EXISTS ORDER_cardLast4 VARCHAR(4) DEFAULT NULL AFTER ORDER_merchantName,
  ADD COLUMN IF NOT EXISTS ORDER_cardholderName VARCHAR(190) DEFAULT NULL AFTER ORDER_cardLast4,
  ADD COLUMN IF NOT EXISTS ORDER_storeSource VARCHAR(80) DEFAULT NULL AFTER ORDER_cardholderName,
  ADD COLUMN IF NOT EXISTS ORDER_storeStatus VARCHAR(80) DEFAULT NULL AFTER ORDER_storeSource,
  ADD COLUMN IF NOT EXISTS ORDER_needsSellerPayCheck TINYINT(1) NOT NULL DEFAULT 0 AFTER ORDER_storeStatus,
  ADD COLUMN IF NOT EXISTS ORDER_sellerPaymentVerified TINYINT(1) NOT NULL DEFAULT 0 AFTER ORDER_needsSellerPayCheck,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerification VARCHAR(120) DEFAULT NULL AFTER ORDER_sellerPaymentVerified,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerifiedBy VARCHAR(120) DEFAULT NULL AFTER ORDER_paymentVerification,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerifiedAt DATETIME DEFAULT NULL AFTER ORDER_paymentVerifiedBy,
  ADD COLUMN IF NOT EXISTS ORDER_rejectedRiders TEXT DEFAULT NULL AFTER ORDER_paymentVerifiedAt,
  ADD COLUMN IF NOT EXISTS ORDER_lastRiderId VARCHAR(120) DEFAULT NULL AFTER ORDER_rejectedRiders,
  ADD COLUMN IF NOT EXISTS ORDER_lastRiderAction VARCHAR(60) DEFAULT NULL AFTER ORDER_lastRiderId,
  ADD COLUMN IF NOT EXISTS ORDER_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_lastRiderAction,
  ADD COLUMN IF NOT EXISTS ORDER_deliveryFee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_subtotal,
  ADD COLUMN IF NOT EXISTS ORDER_serviceFee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_deliveryFee,
  ADD COLUMN IF NOT EXISTS ORDER_itemCount INT NOT NULL DEFAULT 0 AFTER ORDER_serviceFee;

UPDATE customer_order
SET
  ORDER_paymentStatus = COALESCE(NULLIF(ORDER_paymentStatus, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_status')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.PAY_status')), '')),
  ORDER_merchantName = COALESCE(NULLIF(ORDER_merchantName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.merchant_name')), '')),
  ORDER_cardLast4 = COALESCE(NULLIF(ORDER_cardLast4, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card_last4')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card.last4')), '')),
  ORDER_cardholderName = COALESCE(NULLIF(ORDER_cardholderName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_cardholder')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card.cardholderName')), '')),
  ORDER_storeSource = COALESCE(NULLIF(ORDER_storeSource, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.store_source')), '')),
  ORDER_storeStatus = COALESCE(NULLIF(ORDER_storeStatus, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.store_acceptance_status')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.STORE_acceptanceStatus')), '')),
  ORDER_needsSellerPayCheck = CASE WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.requires_seller_payment_verification')), '')) IN ('true', '1') THEN 1 ELSE ORDER_needsSellerPayCheck END,
  ORDER_sellerPaymentVerified = CASE WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.seller_payment_verified')), '')) IN ('true', '1') THEN 1 ELSE ORDER_sellerPaymentVerified END,
  ORDER_paymentVerification = COALESCE(NULLIF(ORDER_paymentVerification, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verification_status')), '')),
  ORDER_paymentVerifiedBy = COALESCE(NULLIF(ORDER_paymentVerifiedBy, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verified_by')), '')),
  ORDER_paymentVerifiedAt = COALESCE(ORDER_paymentVerifiedAt, STR_TO_DATE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verified_at')), ''), '%Y-%m-%d %H:%i:%s')),
  ORDER_rejectedRiders = COALESCE(NULLIF(ORDER_rejectedRiders, ''), CAST(JSON_EXTRACT(ORDER_data, '$.rider_rejected_by') AS CHAR)),
  ORDER_lastRiderId = COALESCE(NULLIF(ORDER_lastRiderId, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.last_rider_id')), '')),
  ORDER_lastRiderAction = COALESCE(NULLIF(ORDER_lastRiderAction, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.last_rider_action')), '')),
  ORDER_subtotal = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.subtotal')) AS DECIMAL(10,2)), ORDER_subtotal),
  ORDER_deliveryFee = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.delivery')) AS DECIMAL(10,2)), ORDER_deliveryFee),
  ORDER_serviceFee = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.serviceFee')) AS DECIMAL(10,2)), ORDER_serviceFee),
  ORDER_itemCount = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.item_count')) AS UNSIGNED), ORDER_itemCount)
WHERE ORDER_data IS NOT NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ORDER_paymentStatus VARCHAR(80) DEFAULT NULL AFTER ORDER_paymentMethod,
  ADD COLUMN IF NOT EXISTS ORDER_customerEmail VARCHAR(190) DEFAULT NULL AFTER ORDER_paymentStatus,
  ADD COLUMN IF NOT EXISTS ORDER_customerName VARCHAR(190) DEFAULT NULL AFTER ORDER_customerEmail,
  ADD COLUMN IF NOT EXISTS ORDER_customerPhone VARCHAR(20) DEFAULT NULL AFTER ORDER_customerName,
  ADD COLUMN IF NOT EXISTS ORDER_customerAddress TEXT DEFAULT NULL AFTER ORDER_customerPhone,
  ADD COLUMN IF NOT EXISTS ORDER_merchantName VARCHAR(190) DEFAULT NULL AFTER ORDER_customerAddress,
  ADD COLUMN IF NOT EXISTS ORDER_cardLast4 VARCHAR(4) DEFAULT NULL AFTER ORDER_merchantName,
  ADD COLUMN IF NOT EXISTS ORDER_cardholderName VARCHAR(190) DEFAULT NULL AFTER ORDER_cardLast4,
  ADD COLUMN IF NOT EXISTS ORDER_storeSource VARCHAR(80) DEFAULT NULL AFTER ORDER_cardholderName,
  ADD COLUMN IF NOT EXISTS ORDER_storeStatus VARCHAR(80) DEFAULT NULL AFTER ORDER_storeSource,
  ADD COLUMN IF NOT EXISTS ORDER_needsSellerPayCheck TINYINT(1) NOT NULL DEFAULT 0 AFTER ORDER_storeStatus,
  ADD COLUMN IF NOT EXISTS ORDER_sellerPaymentVerified TINYINT(1) NOT NULL DEFAULT 0 AFTER ORDER_needsSellerPayCheck,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerification VARCHAR(120) DEFAULT NULL AFTER ORDER_sellerPaymentVerified,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerifiedBy VARCHAR(120) DEFAULT NULL AFTER ORDER_paymentVerification,
  ADD COLUMN IF NOT EXISTS ORDER_paymentVerifiedAt DATETIME DEFAULT NULL AFTER ORDER_paymentVerifiedBy,
  ADD COLUMN IF NOT EXISTS ORDER_rejectedRiders TEXT DEFAULT NULL AFTER ORDER_paymentVerifiedAt,
  ADD COLUMN IF NOT EXISTS ORDER_lastRiderId VARCHAR(120) DEFAULT NULL AFTER ORDER_rejectedRiders,
  ADD COLUMN IF NOT EXISTS ORDER_lastRiderAction VARCHAR(60) DEFAULT NULL AFTER ORDER_lastRiderId,
  ADD COLUMN IF NOT EXISTS ORDER_subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_lastRiderAction,
  ADD COLUMN IF NOT EXISTS ORDER_deliveryFee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_subtotal,
  ADD COLUMN IF NOT EXISTS ORDER_serviceFee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER ORDER_deliveryFee,
  ADD COLUMN IF NOT EXISTS ORDER_itemCount INT NOT NULL DEFAULT 0 AFTER ORDER_serviceFee;

UPDATE orders
SET
  ORDER_paymentStatus = COALESCE(NULLIF(ORDER_paymentStatus, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_status')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.PAY_status')), '')),
  ORDER_customerEmail = COALESCE(NULLIF(ORDER_customerEmail, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.customer_email')), '')),
  ORDER_customerName = COALESCE(NULLIF(ORDER_customerName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.customer_name')), '')),
  ORDER_customerPhone = COALESCE(NULLIF(ORDER_customerPhone, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.customer_phone')), '')),
  ORDER_customerAddress = COALESCE(NULLIF(ORDER_customerAddress, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.customer_address')), '')),
  ORDER_merchantName = COALESCE(NULLIF(ORDER_merchantName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.merchant_name')), '')),
  ORDER_cardLast4 = COALESCE(NULLIF(ORDER_cardLast4, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card_last4')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card.last4')), '')),
  ORDER_cardholderName = COALESCE(NULLIF(ORDER_cardholderName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_cardholder')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_card.cardholderName')), '')),
  ORDER_storeSource = COALESCE(NULLIF(ORDER_storeSource, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.store_source')), '')),
  ORDER_storeStatus = COALESCE(NULLIF(ORDER_storeStatus, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.store_acceptance_status')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.STORE_acceptanceStatus')), '')),
  ORDER_needsSellerPayCheck = CASE WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.requires_seller_payment_verification')), '')) IN ('true', '1') THEN 1 ELSE ORDER_needsSellerPayCheck END,
  ORDER_sellerPaymentVerified = CASE WHEN LOWER(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.seller_payment_verified')), '')) IN ('true', '1') THEN 1 ELSE ORDER_sellerPaymentVerified END,
  ORDER_paymentVerification = COALESCE(NULLIF(ORDER_paymentVerification, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verification_status')), '')),
  ORDER_paymentVerifiedBy = COALESCE(NULLIF(ORDER_paymentVerifiedBy, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verified_by')), '')),
  ORDER_paymentVerifiedAt = COALESCE(ORDER_paymentVerifiedAt, STR_TO_DATE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.payment_verified_at')), ''), '%Y-%m-%d %H:%i:%s')),
  ORDER_rejectedRiders = COALESCE(NULLIF(ORDER_rejectedRiders, ''), CAST(JSON_EXTRACT(ORDER_data, '$.rider_rejected_by') AS CHAR)),
  ORDER_lastRiderId = COALESCE(NULLIF(ORDER_lastRiderId, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.last_rider_id')), '')),
  ORDER_lastRiderAction = COALESCE(NULLIF(ORDER_lastRiderAction, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.last_rider_action')), '')),
  ORDER_subtotal = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.subtotal')) AS DECIMAL(10,2)), ORDER_subtotal),
  ORDER_deliveryFee = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.delivery')) AS DECIMAL(10,2)), ORDER_deliveryFee),
  ORDER_serviceFee = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.summary.serviceFee')) AS DECIMAL(10,2)), ORDER_serviceFee),
  ORDER_itemCount = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(ORDER_data, '$.item_count')) AS UNSIGNED), ORDER_itemCount)
WHERE ORDER_data IS NOT NULL;

ALTER TABLE order_item
  ADD COLUMN IF NOT EXISTS ITEM_substitutePolicy VARCHAR(40) DEFAULT NULL AFTER ITEM_instructions,
  ADD COLUMN IF NOT EXISTS ITEM_substituteName VARCHAR(190) DEFAULT NULL AFTER ITEM_substitutePolicy;

UPDATE order_item
SET
  ITEM_substitutePolicy = COALESCE(NULLIF(ITEM_substitutePolicy, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ITEM_data, '$.substitutePolicy')), '')),
  ITEM_substituteName = COALESCE(NULLIF(ITEM_substituteName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(ITEM_data, '$.substituteName')), ''))
WHERE ITEM_data IS NOT NULL;

ALTER TABLE payment_transaction
  ADD COLUMN IF NOT EXISTS PAY_cardLast4 VARCHAR(4) DEFAULT NULL AFTER PAY_reference,
  ADD COLUMN IF NOT EXISTS PAY_cardholderName VARCHAR(190) DEFAULT NULL AFTER PAY_cardLast4,
  ADD COLUMN IF NOT EXISTS PAY_verificationStatus VARCHAR(120) DEFAULT NULL AFTER PAY_cardholderName,
  ADD COLUMN IF NOT EXISTS PAY_verifiedBy VARCHAR(120) DEFAULT NULL AFTER PAY_verificationStatus,
  ADD COLUMN IF NOT EXISTS PAY_verifiedAt DATETIME DEFAULT NULL AFTER PAY_verifiedBy;

UPDATE payment_transaction
SET
  PAY_cardLast4 = COALESCE(NULLIF(PAY_cardLast4, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.PAY_cardLast4')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.card_last4')), '')),
  PAY_cardholderName = COALESCE(NULLIF(PAY_cardholderName, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.PAY_cardholderName')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.cardholder_name')), '')),
  PAY_verificationStatus = COALESCE(NULLIF(PAY_verificationStatus, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.PAY_verificationStatus')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.verification_status')), '')),
  PAY_verifiedBy = COALESCE(NULLIF(PAY_verifiedBy, ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.PAY_verifiedBy')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.verified_by')), '')),
  PAY_verifiedAt = COALESCE(PAY_verifiedAt, STR_TO_DATE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.PAY_verifiedAt')), ''), '%Y-%m-%d %H:%i:%s'), STR_TO_DATE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(PAY_data, '$.verified_at')), ''), '%Y-%m-%d %H:%i:%s'))
WHERE PAY_data IS NOT NULL;

ALTER TABLE admin DROP COLUMN IF EXISTS ADMIN_data;
ALTER TABLE user_account DROP COLUMN IF EXISTS USER_data;
ALTER TABLE customer DROP COLUMN IF EXISTS CUST_data;
ALTER TABLE merchant DROP COLUMN IF EXISTS MERCH_data;
ALTER TABLE rider DROP COLUMN IF EXISTS RIDER_data;
ALTER TABLE products DROP COLUMN IF EXISTS PROD_data;
ALTER TABLE delivery DROP COLUMN IF EXISTS DEL_data;
ALTER TABLE customer_order DROP COLUMN IF EXISTS ORDER_data;
ALTER TABLE orders DROP COLUMN IF EXISTS ORDER_data;
ALTER TABLE order_item DROP COLUMN IF EXISTS ITEM_data;
ALTER TABLE payment_transaction DROP COLUMN IF EXISTS PAY_data;
ALTER TABLE rating DROP COLUMN IF EXISTS RATE_data;
ALTER TABLE refund DROP COLUMN IF EXISTS REFUND_data;
ALTER TABLE substitution DROP COLUMN IF EXISTS SUB_data;
ALTER TABLE stores DROP COLUMN IF EXISTS STORE_data;

SET FOREIGN_KEY_CHECKS = 1;
