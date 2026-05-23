<?php
declare(strict_types=1);

require_once __DIR__ . '/db_connect.php';

header('Content-Type: application/json; charset=utf-8');

function hb_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function hb_read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function hb_collection_maps(): array
{
    $orderFields = [
        'ORDER_id' => 'ORDER_id',
        'CUST_id' => 'ORDER_customerId',
        'customer_id' => 'ORDER_customerId',
        'SHOP_id' => 'ORDER_riderId',
        'shopper_id' => 'ORDER_riderId',
        'MERCH_id' => 'ORDER_merchantId',
        'merch_id' => 'ORDER_merchantId',
        'DELIVERY_id' => 'ORDER_deliveryId',
        'delivery_id' => 'ORDER_deliveryId',
        'ORDER_status' => 'ORDER_status',
        'order_status' => 'ORDER_status',
        'ORDER_totalAmount' => 'ORDER_totalAmount',
        'ORDER_scheduledTime' => 'ORDER_scheduledTime',
        'scheduled_time' => 'ORDER_scheduledTime',
        'payment_method' => 'ORDER_paymentMethod',
        'ORDER_paymentStatus' => 'ORDER_paymentStatus',
        'PAY_status' => 'ORDER_paymentStatus',
        'payment_status' => 'ORDER_paymentStatus',
        'paymentStatus' => 'ORDER_paymentStatus',
        'ORDER_paymentReference' => 'ORDER_paymentReference',
        'payment_reference' => 'ORDER_paymentReference',
        'gcash_reference' => 'ORDER_paymentReference',
        'ORDER_paymentProof' => 'ORDER_paymentProof',
        'payment_proof' => 'ORDER_paymentProof',
        'gcash_proof' => 'ORDER_paymentProof',
        'customer_email' => 'ORDER_customerEmail',
        'customer_name' => 'ORDER_customerName',
        'customer_phone' => 'ORDER_customerPhone',
        'customer_address' => 'ORDER_customerAddress',
        'ORDER_merchantName' => 'ORDER_merchantName',
        'merchant_name' => 'ORDER_merchantName',
        'ORDER_cardLast4' => 'ORDER_cardLast4',
        'payment_card_last4' => 'ORDER_cardLast4',
        'ORDER_cardholderName' => 'ORDER_cardholderName',
        'payment_cardholder' => 'ORDER_cardholderName',
        'ORDER_storeSource' => 'ORDER_storeSource',
        'store_source' => 'ORDER_storeSource',
        'ORDER_storeStatus' => 'ORDER_storeStatus',
        'store_acceptance_status' => 'ORDER_storeStatus',
        'STORE_acceptanceStatus' => 'ORDER_storeStatus',
        'ORDER_needsSellerPayCheck' => 'ORDER_needsSellerPayCheck',
        'requires_seller_payment_verification' => 'ORDER_needsSellerPayCheck',
        'ORDER_sellerPaymentVerified' => 'ORDER_sellerPaymentVerified',
        'seller_payment_verified' => 'ORDER_sellerPaymentVerified',
        'ORDER_paymentVerification' => 'ORDER_paymentVerification',
        'payment_verification_status' => 'ORDER_paymentVerification',
        'ORDER_paymentVerifiedBy' => 'ORDER_paymentVerifiedBy',
        'payment_verified_by' => 'ORDER_paymentVerifiedBy',
        'ORDER_paymentVerifiedAt' => 'ORDER_paymentVerifiedAt',
        'payment_verified_at' => 'ORDER_paymentVerifiedAt',
        'ORDER_rejectedRiders' => 'ORDER_rejectedRiders',
        'rider_rejected_by' => 'ORDER_rejectedRiders',
        'ORDER_lastRiderId' => 'ORDER_lastRiderId',
        'last_rider_id' => 'ORDER_lastRiderId',
        'ORDER_lastRiderAction' => 'ORDER_lastRiderAction',
        'last_rider_action' => 'ORDER_lastRiderAction',
        'ORDER_subtotal' => 'ORDER_subtotal',
        'summary_subtotal' => 'ORDER_subtotal',
        'ORDER_deliveryFee' => 'ORDER_deliveryFee',
        'summary_delivery' => 'ORDER_deliveryFee',
        'ORDER_serviceFee' => 'ORDER_serviceFee',
        'summary_serviceFee' => 'ORDER_serviceFee',
        'ORDER_itemCount' => 'ORDER_itemCount',
        'item_count' => 'ORDER_itemCount',
        'ORDER_date' => 'ORDER_date',
        'createdAt' => 'ORDER_date',
        'updatedAt' => 'ORDER_updatedAt',
    ];

    $orderReturn = [
        'ORDER_id' => 'ORDER_id',
        'CUST_id' => 'ORDER_customerId',
        'customer_id' => 'ORDER_customerId',
        'SHOP_id' => 'ORDER_riderId',
        'shopper_id' => 'ORDER_riderId',
        'MERCH_id' => 'ORDER_merchantId',
        'merch_id' => 'ORDER_merchantId',
        'DELIVERY_id' => 'ORDER_deliveryId',
        'delivery_id' => 'ORDER_deliveryId',
        'ORDER_status' => 'ORDER_status',
        'order_status' => 'ORDER_status',
        'ORDER_totalAmount' => 'ORDER_totalAmount',
        'ORDER_scheduledTime' => 'ORDER_scheduledTime',
        'scheduled_time' => 'ORDER_scheduledTime',
        'payment_method' => 'ORDER_paymentMethod',
        'ORDER_paymentStatus' => 'ORDER_paymentStatus',
        'PAY_status' => 'ORDER_paymentStatus',
        'payment_status' => 'ORDER_paymentStatus',
        'paymentStatus' => 'ORDER_paymentStatus',
        'ORDER_paymentReference' => 'ORDER_paymentReference',
        'payment_reference' => 'ORDER_paymentReference',
        'gcash_reference' => 'ORDER_paymentReference',
        'ORDER_paymentProof' => 'ORDER_paymentProof',
        'payment_proof' => 'ORDER_paymentProof',
        'gcash_proof' => 'ORDER_paymentProof',
        'customer_email' => 'ORDER_customerEmail',
        'customer_name' => 'ORDER_customerName',
        'customer_phone' => 'ORDER_customerPhone',
        'customer_address' => 'ORDER_customerAddress',
        'ORDER_merchantName' => 'ORDER_merchantName',
        'merchant_name' => 'ORDER_merchantName',
        'ORDER_cardLast4' => 'ORDER_cardLast4',
        'payment_card_last4' => 'ORDER_cardLast4',
        'ORDER_cardholderName' => 'ORDER_cardholderName',
        'payment_cardholder' => 'ORDER_cardholderName',
        'ORDER_storeSource' => 'ORDER_storeSource',
        'store_source' => 'ORDER_storeSource',
        'ORDER_storeStatus' => 'ORDER_storeStatus',
        'store_acceptance_status' => 'ORDER_storeStatus',
        'STORE_acceptanceStatus' => 'ORDER_storeStatus',
        'ORDER_needsSellerPayCheck' => 'ORDER_needsSellerPayCheck',
        'requires_seller_payment_verification' => 'ORDER_needsSellerPayCheck',
        'ORDER_sellerPaymentVerified' => 'ORDER_sellerPaymentVerified',
        'seller_payment_verified' => 'ORDER_sellerPaymentVerified',
        'ORDER_paymentVerification' => 'ORDER_paymentVerification',
        'payment_verification_status' => 'ORDER_paymentVerification',
        'ORDER_paymentVerifiedBy' => 'ORDER_paymentVerifiedBy',
        'payment_verified_by' => 'ORDER_paymentVerifiedBy',
        'ORDER_paymentVerifiedAt' => 'ORDER_paymentVerifiedAt',
        'payment_verified_at' => 'ORDER_paymentVerifiedAt',
        'ORDER_rejectedRiders' => 'ORDER_rejectedRiders',
        'rider_rejected_by' => 'ORDER_rejectedRiders',
        'ORDER_lastRiderId' => 'ORDER_lastRiderId',
        'last_rider_id' => 'ORDER_lastRiderId',
        'ORDER_lastRiderAction' => 'ORDER_lastRiderAction',
        'last_rider_action' => 'ORDER_lastRiderAction',
        'ORDER_subtotal' => 'ORDER_subtotal',
        'summary_subtotal' => 'ORDER_subtotal',
        'ORDER_deliveryFee' => 'ORDER_deliveryFee',
        'summary_delivery' => 'ORDER_deliveryFee',
        'ORDER_serviceFee' => 'ORDER_serviceFee',
        'summary_serviceFee' => 'ORDER_serviceFee',
        'ORDER_itemCount' => 'ORDER_itemCount',
        'item_count' => 'ORDER_itemCount',
        'ORDER_date' => 'ORDER_date',
        'createdAt' => 'ORDER_date',
        'updatedAt' => 'ORDER_updatedAt',
    ];

    $ordersFields = $orderFields;
    $ordersReturn = $orderReturn;

    return [
        'customer' => [
            'table' => 'customer',
            'pk' => 'CUST_id',
            'id_prefix' => 'C',
            'fields' => [
                'CUST_firstName' => 'CUST_firstName',
                'firstName' => 'CUST_firstName',
                'CUST_lastName' => 'CUST_lastName',
                'lastName' => 'CUST_lastName',
                'CUST_email' => 'CUST_email',
                'email' => 'CUST_email',
                'CUST_password' => 'CUST_password',
                'CUST_role' => 'CUST_role',
                'CUST_status' => 'CUST_status',
                'CUST_phone' => 'CUST_phone',
                'phone' => 'CUST_phone',
                'CUST_city' => 'CUST_city',
                'city' => 'CUST_city',
                'CUST_address' => 'CUST_address',
                'address' => 'CUST_address',
                'CUST_preferredDeliveryTime' => 'CUST_preferredDeliveryTime',
                'CUST_createdAt' => 'CUST_createdAt',
                'createdAt' => 'CUST_createdAt',
                'updatedAt' => 'CUST_updatedAt',
            ],
            'return' => [
                'CUST_id' => 'CUST_id',
                'CUST_firstName' => 'CUST_firstName',
                'firstName' => 'CUST_firstName',
                'CUST_lastName' => 'CUST_lastName',
                'lastName' => 'CUST_lastName',
                'CUST_email' => 'CUST_email',
                'email' => 'CUST_email',
                'CUST_password' => 'CUST_password',
                'CUST_role' => 'CUST_role',
                'CUST_status' => 'CUST_status',
                'CUST_phone' => 'CUST_phone',
                'phone' => 'CUST_phone',
                'CUST_city' => 'CUST_city',
                'city' => 'CUST_city',
                'CUST_address' => 'CUST_address',
                'address' => 'CUST_address',
                'CUST_preferredDeliveryTime' => 'CUST_preferredDeliveryTime',
                'CUST_createdAt' => 'CUST_createdAt',
                'createdAt' => 'CUST_createdAt',
                'updatedAt' => 'CUST_updatedAt',
            ],
        ],
        'merchant' => [
            'table' => 'merchant',
            'pk' => 'MERCH_id',
            'id_prefix' => 'M',
            'fields' => [
                'MERCH_ownerFirstName' => 'MERCH_ownerFirstName',
                'MERCH_ownerLastName' => 'MERCH_ownerLastName',
                'MERCH_ownerEmail' => 'MERCH_ownerEmail',
                'MERCH_password' => 'MERCH_password',
                'MERCH_phone' => 'MERCH_phone',
                'MERCH_name' => 'MERCH_name',
                'MERCH_type' => 'MERCH_type',
                'MERCH_address' => 'MERCH_address',
                'MERCH_businessHours' => 'MERCH_businessHours',
                'MERCH_businessProof' => 'MERCH_businessProof',
                'MERCH_availableDays' => 'MERCH_availableDays',
                'MERCH_preparationTime' => 'MERCH_preparationTime',
                'MERCH_storeStatus' => 'MERCH_storeStatus',
                'MERCH_approvalStatus' => 'MERCH_approvalStatus',
                'MERCH_createdAt' => 'MERCH_createdAt',
                'createdAt' => 'MERCH_createdAt',
                'updatedAt' => 'MERCH_updatedAt',
            ],
            'return' => [
                'MERCH_id' => 'MERCH_id',
                'MERCH_ownerFirstName' => 'MERCH_ownerFirstName',
                'MERCH_ownerLastName' => 'MERCH_ownerLastName',
                'MERCH_ownerEmail' => 'MERCH_ownerEmail',
                'MERCH_password' => 'MERCH_password',
                'MERCH_phone' => 'MERCH_phone',
                'MERCH_name' => 'MERCH_name',
                'MERCH_type' => 'MERCH_type',
                'MERCH_address' => 'MERCH_address',
                'MERCH_businessHours' => 'MERCH_businessHours',
                'MERCH_businessProof' => 'MERCH_businessProof',
                'MERCH_availableDays' => 'MERCH_availableDays',
                'MERCH_preparationTime' => 'MERCH_preparationTime',
                'MERCH_storeStatus' => 'MERCH_storeStatus',
                'MERCH_approvalStatus' => 'MERCH_approvalStatus',
                'MERCH_createdAt' => 'MERCH_createdAt',
                'createdAt' => 'MERCH_createdAt',
                'updatedAt' => 'MERCH_updatedAt',
            ],
        ],
        'shopper' => [
            'table' => 'rider',
            'pk' => 'RIDER_id',
            'id_prefix' => 'R',
            'fields' => [
                'SHOP_id' => 'RIDER_id',
                'RIDER_firstName' => 'RIDER_firstName',
                'SHOP_firstName' => 'RIDER_firstName',
                'RIDER_lastName' => 'RIDER_lastName',
                'SHOP_lastName' => 'RIDER_lastName',
                'SHOP_email' => 'RIDER_email',
                'SHOP_password' => 'RIDER_password',
                'SHOP_phone' => 'RIDER_phone',
                'SHOP_currentLocation' => 'RIDER_currentLocation',
                'SHOP_vehicleType' => 'RIDER_vehicleType',
                'SHOP_validId' => 'RIDER_validId',
                'SHOP_availabilityStatus' => 'RIDER_availabilityStatus',
                'SHOP_employmentStatus' => 'RIDER_employmentStatus',
                'SHOP_maxActiveOrders' => 'RIDER_maxActiveOrders',
                'SHOP_createdAt' => 'RIDER_createdAt',
                'role' => 'RIDER_role',
                'createdAt' => 'RIDER_createdAt',
                'updatedAt' => 'RIDER_updatedAt',
            ],
            'return' => [
                'RIDER_id' => 'RIDER_id',
                'SHOP_id' => 'RIDER_id',
                'RIDER_firstName' => 'RIDER_firstName',
                'SHOP_firstName' => 'RIDER_firstName',
                'RIDER_lastName' => 'RIDER_lastName',
                'SHOP_lastName' => 'RIDER_lastName',
                'RIDER_email' => 'RIDER_email',
                'SHOP_email' => 'RIDER_email',
                'RIDER_password' => 'RIDER_password',
                'SHOP_password' => 'RIDER_password',
                'RIDER_phone' => 'RIDER_phone',
                'SHOP_phone' => 'RIDER_phone',
                'SHOP_currentLocation' => 'RIDER_currentLocation',
                'SHOP_vehicleType' => 'RIDER_vehicleType',
                'SHOP_validId' => 'RIDER_validId',
                'SHOP_availabilityStatus' => 'RIDER_availabilityStatus',
                'SHOP_employmentStatus' => 'RIDER_employmentStatus',
                'SHOP_maxActiveOrders' => 'RIDER_maxActiveOrders',
                'SHOP_createdAt' => 'RIDER_createdAt',
                'role' => 'RIDER_role',
                'createdAt' => 'RIDER_createdAt',
                'updatedAt' => 'RIDER_updatedAt',
            ],
        ],
        'USER_ACCOUNT' => [
            'table' => 'customer',
            'logical' => 'user_account',
            'pk' => 'CUST_id',
            'id_prefix' => 'C',
            'fields' => [
                'USER_firstName' => 'CUST_firstName',
                'firstName' => 'CUST_firstName',
                'USER_lastName' => 'CUST_lastName',
                'lastName' => 'CUST_lastName',
                'USER_email' => 'CUST_email',
                'USER_phone' => 'CUST_phone',
                'USER_password' => 'CUST_password',
                'USER_role' => 'CUST_role',
                'USER_status' => 'CUST_status',
                'USER_city' => 'CUST_city',
                'city' => 'CUST_city',
                'USER_address' => 'CUST_address',
                'address' => 'CUST_address',
                'USER_preferredDeliveryTime' => 'CUST_preferredDeliveryTime',
                'USER_createdAt' => 'CUST_createdAt',
                'createdAt' => 'CUST_createdAt',
                'updatedAt' => 'CUST_updatedAt',
            ],
            'return' => [
                'USER_id' => 'CUST_id',
                'USER_linkedId' => 'CUST_id',
                'USER_firstName' => 'CUST_firstName',
                'firstName' => 'CUST_firstName',
                'USER_lastName' => 'CUST_lastName',
                'lastName' => 'CUST_lastName',
                'USER_email' => 'CUST_email',
                'USER_phone' => 'CUST_phone',
                'USER_password' => 'CUST_password',
                'USER_role' => 'CUST_role',
                'USER_status' => 'CUST_status',
                'USER_city' => 'CUST_city',
                'city' => 'CUST_city',
                'USER_address' => 'CUST_address',
                'address' => 'CUST_address',
                'USER_preferredDeliveryTime' => 'CUST_preferredDeliveryTime',
                'USER_createdAt' => 'CUST_createdAt',
                'createdAt' => 'CUST_createdAt',
                'updatedAt' => 'CUST_updatedAt',
            ],
        ],
        'customer_order' => [
            'table' => 'customer_order',
            'pk' => 'ORDER_id',
            'fields' => $orderFields,
            'return' => $orderReturn,
        ],
        'orders' => [
            'table' => 'orders',
            'pk' => 'ORDER_id',
            'fields' => $ordersFields,
            'return' => $ordersReturn,
        ],
        'order_item' => [
            'table' => 'order_item',
            'pk' => 'ITEM_id',
            'fields' => [
                'ITEM_id' => 'ITEM_id',
                'ORDER_id' => 'ITEM_orderId',
                'order_id' => 'ITEM_orderId',
                'product_id' => 'ITEM_productId',
                'merchantId' => 'ITEM_merchantId',
                'merchant_name' => 'ITEM_merchantName',
                'ITEM_name' => 'ITEM_name',
                'name' => 'ITEM_name',
                'ITEM_quantity' => 'ITEM_quantity',
                'quantity' => 'ITEM_quantity',
                'ITEM_unitPrice' => 'ITEM_unitPrice',
                'price' => 'ITEM_unitPrice',
                'unit' => 'ITEM_unit',
                'image' => 'ITEM_image',
                'instructions' => 'ITEM_instructions',
                'substitutePolicy' => 'ITEM_substitutePolicy',
                'substituteName' => 'ITEM_substituteName',
                'ITEM_status' => 'ITEM_status',
                'createdAt' => 'ITEM_createdAt',
            ],
            'return' => [
                'ITEM_id' => 'ITEM_id',
                'ORDER_id' => 'ITEM_orderId',
                'order_id' => 'ITEM_orderId',
                'product_id' => 'ITEM_productId',
                'merchantId' => 'ITEM_merchantId',
                'merchant_name' => 'ITEM_merchantName',
                'ITEM_name' => 'ITEM_name',
                'name' => 'ITEM_name',
                'ITEM_quantity' => 'ITEM_quantity',
                'quantity' => 'ITEM_quantity',
                'ITEM_unitPrice' => 'ITEM_unitPrice',
                'price' => 'ITEM_unitPrice',
                'unit' => 'ITEM_unit',
                'image' => 'ITEM_image',
                'instructions' => 'ITEM_instructions',
                'substitutePolicy' => 'ITEM_substitutePolicy',
                'substituteName' => 'ITEM_substituteName',
                'ITEM_status' => 'ITEM_status',
                'createdAt' => 'ITEM_createdAt',
            ],
        ],
        'products' => [
            'table' => 'products',
            'pk' => 'PROD_id',
            'fields' => [
                'PROD_id' => 'PROD_id',
                'MERCH_id' => 'PROD_merchantId',
                'merchantId' => 'PROD_merchantId',
                'merchant' => 'PROD_merchantName',
                'merchant_name' => 'PROD_merchantName',
                'PROD_name' => 'PROD_name',
                'name' => 'PROD_name',
                'PROD_price' => 'PROD_price',
                'price' => 'PROD_price',
                'PROD_category' => 'PROD_category',
                'category' => 'PROD_category',
                'PROD_unit' => 'PROD_unit',
                'unit' => 'PROD_unit',
                'PROD_description' => 'PROD_description',
                'description' => 'PROD_description',
                'type' => 'PROD_type',
                'tag' => 'PROD_tag',
                'rating' => 'PROD_rating',
                'PROD_image' => 'PROD_image',
                'image' => 'PROD_image',
                'PROD_alt' => 'PROD_alt',
                'alt' => 'PROD_alt',
                'approvalStatus' => 'PROD_approvalStatus',
                'source' => 'PROD_source',
                'createdAt' => 'PROD_createdAt',
                'updatedAt' => 'PROD_updatedAt',
            ],
            'return' => [
                'PROD_id' => 'PROD_id',
                'MERCH_id' => 'PROD_merchantId',
                'merchantId' => 'PROD_merchantId',
                'merchant' => 'PROD_merchantName',
                'merchant_name' => 'PROD_merchantName',
                'PROD_name' => 'PROD_name',
                'name' => 'PROD_name',
                'PROD_price' => 'PROD_price',
                'price' => 'PROD_price',
                'PROD_category' => 'PROD_category',
                'category' => 'PROD_category',
                'PROD_unit' => 'PROD_unit',
                'unit' => 'PROD_unit',
                'PROD_description' => 'PROD_description',
                'description' => 'PROD_description',
                'type' => 'PROD_type',
                'tag' => 'PROD_tag',
                'rating' => 'PROD_rating',
                'PROD_image' => 'PROD_image',
                'image' => 'PROD_image',
                'PROD_alt' => 'PROD_alt',
                'alt' => 'PROD_alt',
                'approvalStatus' => 'PROD_approvalStatus',
                'source' => 'PROD_source',
                'createdAt' => 'PROD_createdAt',
                'updatedAt' => 'PROD_updatedAt',
            ],
        ],
        'delivery' => [
            'table' => 'delivery',
            'pk' => 'DEL_id',
            'fields' => [
                'DELIVERY_id' => 'DEL_id',
                'DEL_orderId' => 'DEL_orderId',
                'DELIVERY_address' => 'DEL_address',
                'address' => 'DEL_address',
                'DELIVERY_serviceArea' => 'DEL_serviceArea',
                'serviceArea' => 'DEL_serviceArea',
                'DELIVERY_status' => 'DEL_status',
                'status' => 'DEL_status',
                'DELIVERY_time' => 'DEL_time',
                'scheduledTime' => 'DEL_time',
                'DELIVERY_serviceHours' => 'DEL_serviceHours',
                'createdAt' => 'DEL_createdAt',
                'updatedAt' => 'DEL_updatedAt',
            ],
            'return' => [
                'DEL_id' => 'DEL_id',
                'DELIVERY_id' => 'DEL_id',
                'DELIVERY_address' => 'DEL_address',
                'address' => 'DEL_address',
                'DELIVERY_serviceArea' => 'DEL_serviceArea',
                'serviceArea' => 'DEL_serviceArea',
                'DELIVERY_status' => 'DEL_status',
                'status' => 'DEL_status',
                'DELIVERY_time' => 'DEL_time',
                'scheduledTime' => 'DEL_time',
                'DELIVERY_serviceHours' => 'DEL_serviceHours',
                'createdAt' => 'DEL_createdAt',
                'updatedAt' => 'DEL_updatedAt',
            ],
        ],
        'payment_transaction' => [
            'table' => 'payment_transaction',
            'pk' => 'PAY_id',
            'fields' => [
                'PAY_id' => 'PAY_id',
                'ORDER_id' => 'PAY_orderId',
                'order_id' => 'PAY_orderId',
                'PAY_amount' => 'PAY_amount',
                'amount' => 'PAY_amount',
                'PAY_method' => 'PAY_method',
                'method' => 'PAY_method',
                'PAY_status' => 'PAY_status',
                'status' => 'PAY_status',
                'PAY_reference' => 'PAY_reference',
                'payment_reference' => 'PAY_reference',
                'PAY_cardLast4' => 'PAY_cardLast4',
                'card_last4' => 'PAY_cardLast4',
                'PAY_cardholderName' => 'PAY_cardholderName',
                'cardholder_name' => 'PAY_cardholderName',
                'PAY_proof' => 'PAY_proof',
                'payment_proof' => 'PAY_proof',
                'proof_path' => 'PAY_proof',
                'PAY_verificationStatus' => 'PAY_verificationStatus',
                'verification_status' => 'PAY_verificationStatus',
                'PAY_verifiedBy' => 'PAY_verifiedBy',
                'verified_by' => 'PAY_verifiedBy',
                'PAY_verifiedAt' => 'PAY_verifiedAt',
                'verified_at' => 'PAY_verifiedAt',
                'PAY_date' => 'PAY_date',
                'createdAt' => 'PAY_date',
            ],
            'return' => [
                'PAY_id' => 'PAY_id',
                'ORDER_id' => 'PAY_orderId',
                'order_id' => 'PAY_orderId',
                'PAY_amount' => 'PAY_amount',
                'amount' => 'PAY_amount',
                'PAY_method' => 'PAY_method',
                'method' => 'PAY_method',
                'PAY_status' => 'PAY_status',
                'status' => 'PAY_status',
                'PAY_reference' => 'PAY_reference',
                'payment_reference' => 'PAY_reference',
                'PAY_cardLast4' => 'PAY_cardLast4',
                'card_last4' => 'PAY_cardLast4',
                'PAY_cardholderName' => 'PAY_cardholderName',
                'cardholder_name' => 'PAY_cardholderName',
                'PAY_proof' => 'PAY_proof',
                'payment_proof' => 'PAY_proof',
                'proof_path' => 'PAY_proof',
                'PAY_verificationStatus' => 'PAY_verificationStatus',
                'verification_status' => 'PAY_verificationStatus',
                'PAY_verifiedBy' => 'PAY_verifiedBy',
                'verified_by' => 'PAY_verifiedBy',
                'PAY_verifiedAt' => 'PAY_verifiedAt',
                'verified_at' => 'PAY_verifiedAt',
                'PAY_date' => 'PAY_date',
                'createdAt' => 'PAY_date',
            ],
        ],
        'rating' => [
            'table' => 'rating',
            'pk' => 'RATE_id',
            'fields' => [
                'ORDER_id' => 'RATE_orderId',
                'order_id' => 'RATE_orderId',
                'CUST_id' => 'RATE_customerId',
                'customer_id' => 'RATE_customerId',
                'SHOP_id' => 'RATE_riderId',
                'RATE_serviceScore' => 'RATE_serviceScore',
                'serviceScore' => 'RATE_serviceScore',
                'RATE_shopperScore' => 'RATE_shopperScore',
                'shopperScore' => 'RATE_shopperScore',
                'RATE_feedbackComment' => 'RATE_feedbackComment',
                'comment' => 'RATE_feedbackComment',
                'RATE_date' => 'RATE_date',
                'createdAt' => 'RATE_date',
            ],
            'return' => [
                'RATE_id' => 'RATE_id',
                'ORDER_id' => 'RATE_orderId',
                'order_id' => 'RATE_orderId',
                'CUST_id' => 'RATE_customerId',
                'customer_id' => 'RATE_customerId',
                'SHOP_id' => 'RATE_riderId',
                'RATE_serviceScore' => 'RATE_serviceScore',
                'serviceScore' => 'RATE_serviceScore',
                'RATE_shopperScore' => 'RATE_shopperScore',
                'shopperScore' => 'RATE_shopperScore',
                'RATE_feedbackComment' => 'RATE_feedbackComment',
                'comment' => 'RATE_feedbackComment',
                'RATE_date' => 'RATE_date',
                'createdAt' => 'RATE_date',
            ],
        ],
        'refund' => [
            'table' => 'refund',
            'pk' => 'REFUND_id',
            'fields' => [
                'ORDER_id' => 'REFUND_orderId',
                'order_id' => 'REFUND_orderId',
                'REFUND_amount' => 'REFUND_amount',
                'amount' => 'REFUND_amount',
                'REFUND_reason' => 'REFUND_reason',
                'reason' => 'REFUND_reason',
                'REFUND_status' => 'REFUND_status',
                'status' => 'REFUND_status',
                'REFUND_date' => 'REFUND_date',
                'createdAt' => 'REFUND_date',
            ],
            'return' => [
                'REFUND_id' => 'REFUND_id',
                'ORDER_id' => 'REFUND_orderId',
                'order_id' => 'REFUND_orderId',
                'REFUND_amount' => 'REFUND_amount',
                'amount' => 'REFUND_amount',
                'REFUND_reason' => 'REFUND_reason',
                'reason' => 'REFUND_reason',
                'REFUND_status' => 'REFUND_status',
                'status' => 'REFUND_status',
                'REFUND_date' => 'REFUND_date',
                'createdAt' => 'REFUND_date',
            ],
        ],
        'substitution' => [
            'table' => 'substitution',
            'pk' => 'SUB_id',
            'fields' => [
                'ITEM_id' => 'SUB_itemId',
                'item_id' => 'SUB_itemId',
                'ORDER_id' => 'SUB_orderId',
                'order_id' => 'SUB_orderId',
                'SUB_originalItem' => 'SUB_originalItem',
                'originalItem' => 'SUB_originalItem',
                'SUB_substituteItem' => 'SUB_substituteItem',
                'substituteItem' => 'SUB_substituteItem',
                'SUB_approvalStatus' => 'SUB_approvalStatus',
                'approvalStatus' => 'SUB_approvalStatus',
                'SUB_approvalDate' => 'SUB_approvalDate',
                'createdAt' => 'SUB_createdAt',
            ],
            'return' => [
                'SUB_id' => 'SUB_id',
                'ITEM_id' => 'SUB_itemId',
                'item_id' => 'SUB_itemId',
                'ORDER_id' => 'SUB_orderId',
                'order_id' => 'SUB_orderId',
                'SUB_originalItem' => 'SUB_originalItem',
                'originalItem' => 'SUB_originalItem',
                'SUB_substituteItem' => 'SUB_substituteItem',
                'substituteItem' => 'SUB_substituteItem',
                'SUB_approvalStatus' => 'SUB_approvalStatus',
                'approvalStatus' => 'SUB_approvalStatus',
                'SUB_approvalDate' => 'SUB_approvalDate',
                'createdAt' => 'SUB_createdAt',
            ],
        ],
        'stores' => [
            'table' => 'stores',
            'pk' => 'STORE_id',
            'fields' => [
                'STORE_id' => 'STORE_id',
                'MERCH_id' => 'STORE_merchantId',
                'STORE_status' => 'STORE_status',
                'STORE_reviewedAt' => 'STORE_reviewedAt',
            ],
            'return' => [
                'STORE_id' => 'STORE_id',
                'MERCH_id' => 'STORE_merchantId',
                'STORE_status' => 'STORE_status',
                'STORE_reviewedAt' => 'STORE_reviewedAt',
            ],
        ],
    ];
}

function hb_now(): string
{
    return date('Y-m-d H:i:s');
}

function hb_default_product_image(): string
{
    return 'assets/img/offline/default product logo.png';
}

function hb_clean_value(mixed $value): mixed
{
    if (is_array($value) && (($value['__serverTimestamp'] ?? false) === true)) {
        return hb_now();
    }

    if (is_array($value)) {
        foreach ($value as $key => $child) {
            $value[$key] = hb_clean_value($child);
        }
    }

    return $value;
}

function hb_random_id(): string
{
    return bin2hex(random_bytes(10));
}

function hb_ensure_id_sequence_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS id_sequence (
            SEQ_key VARCHAR(40) NOT NULL PRIMARY KEY,
            SEQ_prefix VARCHAR(8) NOT NULL,
            SEQ_next INT NOT NULL DEFAULT 1,
            SEQ_updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}

function hb_column_exists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :tableName
           AND COLUMN_NAME = :columnName'
    );
    $statement->execute([
        'tableName' => $table,
        'columnName' => $column,
    ]);

    return (int) $statement->fetchColumn() > 0;
}

function hb_table_exists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :tableName'
    );
    $statement->execute(['tableName' => $table]);

    return (int) $statement->fetchColumn() > 0;
}

function hb_ensure_payment_detail_columns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }

    foreach (['customer_order', 'orders'] as $table) {
        if (!hb_column_exists($pdo, $table, 'ORDER_paymentReference')) {
            $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN ORDER_paymentReference VARCHAR(120) DEFAULT NULL AFTER ORDER_paymentStatus");
        }
        if (!hb_column_exists($pdo, $table, 'ORDER_paymentProof')) {
            $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN ORDER_paymentProof TEXT DEFAULT NULL AFTER ORDER_paymentReference");
        }
    }

    if (!hb_column_exists($pdo, 'payment_transaction', 'PAY_proof')) {
        $pdo->exec('ALTER TABLE `payment_transaction` ADD COLUMN PAY_proof TEXT DEFAULT NULL AFTER PAY_reference');
    }

    $checked = true;
}


function hb_ensure_customer_account_columns(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }

    if (!hb_column_exists($pdo, 'customer', 'CUST_password')) {
        $pdo->exec('ALTER TABLE `customer` ADD COLUMN CUST_password VARCHAR(255) DEFAULT NULL AFTER CUST_email');
    }
    if (!hb_column_exists($pdo, 'customer', 'CUST_role')) {
        $pdo->exec("ALTER TABLE `customer` ADD COLUMN CUST_role VARCHAR(40) NOT NULL DEFAULT 'customer' AFTER CUST_password");
    }
    if (!hb_column_exists($pdo, 'customer', 'CUST_status')) {
        $pdo->exec("ALTER TABLE `customer` ADD COLUMN CUST_status VARCHAR(40) NOT NULL DEFAULT 'Active' AFTER CUST_role");
    }
    if (!hb_column_exists($pdo, 'customer', 'CUST_preferredDeliveryTime')) {
        $pdo->exec('ALTER TABLE `customer` ADD COLUMN CUST_preferredDeliveryTime VARCHAR(60) DEFAULT NULL AFTER CUST_address');
    }

    if (hb_table_exists($pdo, 'user_account')) {
        $pdo->exec(
            "INSERT INTO `customer` (
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
            FROM `user_account` ua
            LEFT JOIN `customer` c ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
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
                CUST_updatedAt = NOW()"
        );

        $pdo->exec(
            "UPDATE `customer` c
             JOIN `user_account` ua ON LOWER(c.CUST_email) = LOWER(ua.USER_email)
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
             WHERE LOWER(COALESCE(NULLIF(ua.USER_role, ''), 'customer')) = 'customer'"
        );
    }

    $pdo->exec("UPDATE `customer` SET CUST_role = 'customer' WHERE CUST_role IS NULL OR CUST_role = ''");
    $pdo->exec("UPDATE `customer` SET CUST_status = 'Active' WHERE CUST_status IS NULL OR CUST_status = ''");

    $checked = true;
}

function hb_ensure_merchant_store_status_column(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }

    if (!hb_column_exists($pdo, 'merchant', 'MERCH_storeStatus')) {
        $pdo->exec("ALTER TABLE `merchant` ADD COLUMN MERCH_storeStatus VARCHAR(40) NOT NULL DEFAULT 'Open' AFTER MERCH_preparationTime");
    }

    $pdo->exec("UPDATE `merchant` SET MERCH_storeStatus = 'Open' WHERE MERCH_storeStatus IS NULL OR MERCH_storeStatus = ''");
    $checked = true;
}

function hb_normalize_store_status(mixed $value): string
{
    return strtolower(trim((string) $value)) === 'closed' ? 'Closed' : 'Open';
}

function hb_assert_order_store_open(PDO $pdo, array $data): void
{
    foreach (['STORE_status', 'store_status', 'MERCH_storeStatus'] as $field) {
        if (array_key_exists($field, $data) && hb_normalize_store_status($data[$field]) === 'Closed') {
            throw new RuntimeException('Store is currently closed');
        }
    }

    $merchantId = trim((string) ($data['MERCH_id'] ?? $data['merch_id'] ?? $data['ORDER_merchantId'] ?? ''));
    $merchantName = trim((string) ($data['merchant_name'] ?? $data['ORDER_merchantName'] ?? ''));
    if ($merchantId === '' && $merchantName === '') {
        return;
    }

    $where = $merchantId !== ''
        ? 'MERCH_id = :merchantId'
        : 'LOWER(MERCH_name) = LOWER(:merchantName)';
    $statement = $pdo->prepare("SELECT MERCH_storeStatus FROM merchant WHERE {$where} LIMIT 1");
    $statement->execute($merchantId !== ''
        ? ['merchantId' => $merchantId]
        : ['merchantName' => $merchantName]
    );
    $status = $statement->fetchColumn();
    if ($status !== false && hb_normalize_store_status($status) === 'Closed') {
        throw new RuntimeException('Store is currently closed');
    }
}

function hb_next_code_id(PDO $pdo, array $map): string
{
    $prefix = (string) ($map['id_prefix'] ?? '');
    if ($prefix === '') {
        return hb_random_id();
    }

    hb_ensure_id_sequence_table($pdo);

    $key = (string) ($map['table'] ?? $prefix);
    $pk = (string) $map['pk'];
    $table = (string) $map['table'];

    $startedTransaction = !$pdo->inTransaction();
    if ($startedTransaction) {
        $pdo->beginTransaction();
    }

    try {
        $statement = $pdo->prepare('SELECT SEQ_next FROM id_sequence WHERE SEQ_key = :seqKey FOR UPDATE');
        $statement->execute(['seqKey' => $key]);
        $next = (int) $statement->fetchColumn();

        if ($next < 1) {
            $maxStatement = $pdo->prepare(
                sprintf(
                    "SELECT COALESCE(MAX(CAST(SUBSTRING(`%s`, 2) AS UNSIGNED)), 0) + 1
                     FROM `%s`
                     WHERE `%s` REGEXP :pattern",
                    $pk,
                    $table,
                    $pk
                )
            );
            $maxStatement->execute(['pattern' => '^' . preg_quote($prefix, '/') . '[0-9]+$']);
            $next = max(1, (int) $maxStatement->fetchColumn());

            $insert = $pdo->prepare(
                'INSERT INTO id_sequence (SEQ_key, SEQ_prefix, SEQ_next)
                 VALUES (:seqKey, :prefix, :next)
                 ON DUPLICATE KEY UPDATE SEQ_prefix = VALUES(SEQ_prefix), SEQ_next = VALUES(SEQ_next)'
            );
            $insert->execute([
                'seqKey' => $key,
                'prefix' => $prefix,
                'next' => $next,
            ]);
        }

        do {
            $id = $prefix . str_pad((string) $next, 3, '0', STR_PAD_LEFT);
            $next++;
        } while (hb_fetch_row($pdo, $map, $id));

        $update = $pdo->prepare('UPDATE id_sequence SET SEQ_next = :next WHERE SEQ_key = :seqKey');
        $update->execute([
            'next' => $next,
            'seqKey' => $key,
        ]);

        if ($startedTransaction) {
            $pdo->commit();
        }

        return $id;
    } catch (Throwable $error) {
        if ($startedTransaction && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function hb_full_name(?string $firstName, ?string $lastName): string
{
    return trim(preg_replace('/\s+/', ' ', trim((string) $firstName) . ' ' . trim((string) $lastName)));
}

function hb_split_full_name(?string $name): array
{
    $name = trim(preg_replace('/\s+/', ' ', (string) $name));
    if ($name === '') {
        return ['', ''];
    }

    $parts = explode(' ', $name);
    $firstName = array_shift($parts) ?? '';
    return [$firstName, implode(' ', $parts)];
}

function hb_first_text(array $data, array $keys): string
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $data) && trim((string) $data[$key]) !== '') {
            return trim((string) $data[$key]);
        }
    }

    return '';
}

function hb_map_logical_name(array $map): string
{
    return (string) ($map['logical'] ?? $map['table'] ?? '');
}

function hb_is_user_account_map(array $map): bool
{
    return hb_map_logical_name($map) === 'user_account';
}

function hb_user_account_storage_id(PDO $pdo, array $map, string $id, array $data): string
{
    if (!hb_is_user_account_map($map)) {
        return $id;
    }

    $linkedId = hb_first_text($data, ['USER_linkedId', 'CUST_id']);
    if ($linkedId !== '' && preg_match('/^(C\d+|customer-)/i', $linkedId)) {
        return $linkedId;
    }

    if ($id !== '' && preg_match('/^(C\d+|customer-)/i', $id)) {
        return $id;
    }

    $email = strtolower(hb_first_text($data, ['USER_email', 'CUST_email', 'email']));
    if ($email !== '') {
        $statement = $pdo->prepare('SELECT CUST_id FROM `customer` WHERE LOWER(CUST_email) = :email LIMIT 1');
        $statement->execute(['email' => $email]);
        $existingId = (string) ($statement->fetchColumn() ?: '');
        if ($existingId !== '') {
            return $existingId;
        }
    }

    if ($id !== '' && !preg_match('/^user-/i', $id)) {
        return $id;
    }

    return hb_next_code_id($pdo, $map);
}

function hb_normalize_city(?string $value): ?string
{
    $normalized = strtolower(trim(preg_replace('/\s+/', ' ', (string) $value)));
    $normalized = str_replace(['–', '—'], '-', $normalized);

    if ($normalized === '') {
        return null;
    }

    $cities = [
        'cebu' => 'Cebu City',
        'cebu city' => 'Cebu City',
        'lapu lapu' => 'Lapu-Lapu',
        'lapu-lapu' => 'Lapu-Lapu',
        'lapu lapu city' => 'Lapu-Lapu',
        'lapu-lapu city' => 'Lapu-Lapu',
        'mandaue' => 'Mandaue',
        'mandaue city' => 'Mandaue',
        'consolacion' => 'Consolacion',
        'consolacion cebu' => 'Consolacion',
        'talisay' => 'Talisay',
        'talisay city' => 'Talisay',
        'talisay cebu' => 'Talisay',
    ];

    return $cities[$normalized] ?? null;
}

function hb_apply_name_parts(array $data, string $firstKey, string $lastKey, array $fullNameKeys): array
{
    if (hb_first_text($data, [$firstKey]) !== '' || hb_first_text($data, [$lastKey]) !== '') {
        return $data;
    }

    $fullName = hb_first_text($data, $fullNameKeys);
    if ($fullName === '') {
        return $data;
    }

    [$firstName, $lastName] = hb_split_full_name($fullName);
    $data[$firstKey] = $firstName;
    $data[$lastKey] = $lastName;
    return $data;
}

function hb_normalize_record_payload(array $map, array $data): array
{
    $table = $map['table'] ?? '';
    $logical = hb_map_logical_name($map);

    if ($logical === 'user_account') {
        $data = hb_apply_name_parts($data, 'USER_firstName', 'USER_lastName', ['USER_fullName', 'USER_displayName', 'fullName']);
        if (array_key_exists('city', $data) && !array_key_exists('USER_city', $data)) {
            $data['USER_city'] = $data['city'];
        }
        if (array_key_exists('USER_city', $data)) {
            $data['USER_city'] = hb_normalize_city((string) $data['USER_city']);
        }
        if (!array_key_exists('USER_role', $data)) {
            $data['USER_role'] = 'customer';
        }
        if (!array_key_exists('USER_status', $data)) {
            $data['USER_status'] = 'Active';
        }
    }

    if ($table === 'customer') {
        $data = hb_apply_name_parts($data, 'CUST_firstName', 'CUST_lastName', ['CUST_fullName', 'fullName']);
        if (array_key_exists('city', $data) && !array_key_exists('CUST_city', $data)) {
            $data['CUST_city'] = $data['city'];
        }
        if (array_key_exists('CUST_city', $data)) {
            $data['CUST_city'] = hb_normalize_city((string) $data['CUST_city']);
        }
    }

    if ($table === 'merchant') {
        $data = hb_apply_name_parts($data, 'MERCH_ownerFirstName', 'MERCH_ownerLastName', ['MERCH_ownerName', 'ownerName']);
    }

    if ($table === 'rider') {
        $data = hb_apply_name_parts($data, 'SHOP_firstName', 'SHOP_lastName', ['SHOP_fullName', 'RIDER_fullName', 'fullName']);
        if (array_key_exists('RIDER_firstName', $data) && !array_key_exists('SHOP_firstName', $data)) {
            $data['SHOP_firstName'] = $data['RIDER_firstName'];
        }
        if (array_key_exists('RIDER_lastName', $data) && !array_key_exists('SHOP_lastName', $data)) {
            $data['SHOP_lastName'] = $data['RIDER_lastName'];
        }
    }

    if ($table === 'customer_order' || $table === 'orders') {
        $summary = is_array($data['summary'] ?? null) ? $data['summary'] : [];
        if ($summary) {
            $data['ORDER_subtotal'] = $data['ORDER_subtotal'] ?? $summary['subtotal'] ?? null;
            $data['ORDER_deliveryFee'] = $data['ORDER_deliveryFee'] ?? $summary['delivery'] ?? null;
            $data['ORDER_serviceFee'] = $data['ORDER_serviceFee'] ?? $summary['serviceFee'] ?? null;
            $data['ORDER_totalAmount'] = $data['ORDER_totalAmount'] ?? $summary['total'] ?? null;
        }

        if (is_array($data['payment_card'] ?? null)) {
            $data['payment_card_last4'] = $data['payment_card_last4'] ?? $data['payment_card']['last4'] ?? null;
            $data['payment_cardholder'] = $data['payment_cardholder'] ?? $data['payment_card']['cardholderName'] ?? null;
        }
    }

    if ($table === 'products') {
        $image = hb_first_text($data, ['image', 'PROD_image']);
        if ($image === '') {
            $image = hb_default_product_image();
        }

        $data['image'] = $image;
        $data['PROD_image'] = $image;
    }

    return $data;
}

function hb_with_computed_names(array $map, array $record): array
{
    $table = $map['table'] ?? '';
    $logical = hb_map_logical_name($map);

    if ($logical === 'user_account') {
        $fullName = hb_full_name($record['USER_firstName'] ?? '', $record['USER_lastName'] ?? '');
        $record['USER_fullName'] = $fullName ?: ($record['USER_fullName'] ?? '');
        $record['USER_displayName'] = $record['USER_displayName'] ?? $record['USER_fullName'];
        $record['USER_role'] = $record['USER_role'] ?? 'customer';
        $record['USER_status'] = $record['USER_status'] ?? 'Active';
    }

    if ($table === 'customer') {
        $fullName = hb_full_name($record['CUST_firstName'] ?? '', $record['CUST_lastName'] ?? '');
        if ($fullName !== '') {
            $record['CUST_fullName'] = $fullName;
            $record['fullName'] = $fullName;
        }
    }

    if ($table === 'merchant') {
        $record['MERCH_ownerName'] = hb_full_name($record['MERCH_ownerFirstName'] ?? '', $record['MERCH_ownerLastName'] ?? '') ?: ($record['MERCH_ownerName'] ?? '');
    }

    if ($table === 'rider') {
        $fullName = hb_full_name($record['RIDER_firstName'] ?? $record['SHOP_firstName'] ?? '', $record['RIDER_lastName'] ?? $record['SHOP_lastName'] ?? '');
        if ($fullName !== '') {
            $record['RIDER_fullName'] = $fullName;
            $record['SHOP_fullName'] = $fullName;
        }
    }

    if ($table === 'products') {
        $image = hb_first_text($record, ['image', 'PROD_image']);
        if ($image === '') {
            $image = hb_default_product_image();
        }

        $record['image'] = $image;
        $record['PROD_image'] = $image;
    }

    if ($table === 'customer_order' || $table === 'orders') {
        $record['requires_seller_payment_verification'] = hb_truthy($record['requires_seller_payment_verification'] ?? $record['ORDER_needsSellerPayCheck'] ?? false);
        $record['seller_payment_verified'] = hb_truthy($record['seller_payment_verified'] ?? $record['ORDER_sellerPaymentVerified'] ?? false);

        $rejectedRiders = $record['rider_rejected_by'] ?? $record['ORDER_rejectedRiders'] ?? [];
        if (is_string($rejectedRiders)) {
            $decoded = json_decode($rejectedRiders, true);
            $rejectedRiders = is_array($decoded)
                ? $decoded
                : array_values(array_filter(array_map('trim', explode(',', $rejectedRiders))));
        }
        $record['rider_rejected_by'] = is_array($rejectedRiders) ? $rejectedRiders : [];

        $subtotal = (float) ($record['ORDER_subtotal'] ?? 0);
        $deliveryFee = (float) ($record['ORDER_deliveryFee'] ?? 0);
        $serviceFee = (float) ($record['ORDER_serviceFee'] ?? 0);
        $total = (float) ($record['ORDER_totalAmount'] ?? 0);
        $record['summary'] = [
            'subtotal' => $subtotal,
            'delivery' => $deliveryFee,
            'serviceFee' => $serviceFee,
            'total' => $total,
        ];
    }

    return $record;
}

function hb_truthy(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }

    if (is_numeric($value)) {
        return (int) $value === 1;
    }

    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function hb_column_value(string $column, mixed $value): mixed
{
    $value = hb_clean_value($value);

    if (in_array($column, ['ORDER_needsSellerPayCheck', 'ORDER_sellerPaymentVerified'], true)) {
        return hb_truthy($value) ? 1 : 0;
    }

    if ($column === 'ORDER_rejectedRiders') {
        if (is_array($value)) {
            return json_encode(array_values(array_unique(array_filter($value))), JSON_UNESCAPED_SLASHES);
        }
        return (string) $value;
    }

    if (is_array($value)) {
        return json_encode($value, JSON_UNESCAPED_SLASHES);
    }

    return $value;
}

function hb_record_from_row(array $map, array $row): array
{
    $record = [];
    $record['id'] = $row[$map['pk']];

    foreach (($map['return'] ?? []) as $alias => $column) {
        if (array_key_exists($column, $row) && $row[$column] !== null) {
            $record[$alias] = $row[$column];
        }
    }

    $record[$map['pk']] = $row[$map['pk']];
    return hb_with_computed_names($map, $record);
}

function hb_fetch_row(PDO $pdo, array $map, string $id): ?array
{
    $sql = sprintf('SELECT * FROM `%s` WHERE `%s` = :id LIMIT 1', $map['table'], $map['pk']);
    $statement = $pdo->prepare($sql);
    $statement->execute(['id' => $id]);
    $row = $statement->fetch();
    return $row ?: null;
}

function hb_apply_special_updates(array $existing, array $updates): array
{
    foreach ($updates as $key => $value) {
        if (is_array($value) && (($value['__op'] ?? '') === 'arrayUnion')) {
            $current = $existing[$key] ?? [];
            $current = is_array($current) ? array_values($current) : [$current];

            foreach (($value['values'] ?? []) as $entry) {
                if (!in_array($entry, $current, true)) {
                    $current[] = $entry;
                }
            }

            $existing[$key] = $current;
            continue;
        }

        $existing[$key] = hb_clean_value($value);
    }

    return $existing;
}

function hb_columns_from_payload(array $map, string $id, array $data): array
{
    $data = hb_normalize_record_payload($map, $data);
    $columns = [
        $map['pk'] => $id,
    ];

    foreach (($map['fields'] ?? []) as $field => $column) {
        if (array_key_exists($field, $data)) {
            $value = hb_column_value($column, $data[$field]);
            if ($value === '' && isset($columns[$column]) && $columns[$column] !== '') {
                continue;
            }
            $columns[$column] = $value;
        }
    }

    if (isset($map['fields']['updatedAt']) && !isset($columns[$map['fields']['updatedAt']])) {
        $columns[$map['fields']['updatedAt']] = hb_now();
    }

    return $columns;
}

function hb_save_record(PDO $pdo, array $map, string $id, array $updates, bool $merge): array
{
    $id = hb_user_account_storage_id($pdo, $map, $id, $updates);
    $existingRow = hb_fetch_row($pdo, $map, $id);
    $existingData = $merge && $existingRow ? hb_record_from_row($map, $existingRow) : [];
    unset($existingData['id']);

    $data = hb_apply_special_updates($existingData, $updates);
    $data = hb_normalize_record_payload($map, $data);
    $data[$map['pk']] = $id;

    $columns = hb_columns_from_payload($map, $id, $data);
    $columnNames = array_keys($columns);
    if (count($columnNames) === 1) {
        $sql = sprintf('INSERT IGNORE INTO `%s` (`%s`) VALUES (:%s)', $map['table'], $map['pk'], $map['pk']);
        $statement = $pdo->prepare($sql);
        $statement->execute([$map['pk'] => $id]);

        $row = hb_fetch_row($pdo, $map, $id);
        return $row ? hb_record_from_row($map, $row) : ['id' => $id, $map['pk'] => $id];
    }

    $placeholders = array_map(fn ($column) => ':' . $column, $columnNames);
    $updatesSql = array_map(fn ($column) => "`{$column}` = VALUES(`{$column}`)", array_filter($columnNames, fn ($column) => $column !== $map['pk']));

    $sql = sprintf(
        'INSERT INTO `%s` (`%s`) VALUES (%s) ON DUPLICATE KEY UPDATE %s',
        $map['table'],
        implode('`, `', $columnNames),
        implode(', ', $placeholders),
        implode(', ', $updatesSql)
    );

    $statement = $pdo->prepare($sql);
    $statement->execute($columns);

    $row = hb_fetch_row($pdo, $map, $id);
    return $row ? hb_record_from_row($map, $row) : array_merge(['id' => $id], $data);
}

function hb_list_records(PDO $pdo, array $map, array $filters, int $limit): array
{
    $limit = max(1, min(1000, $limit));
    $whereSql = [];
    $params = [];
    $clientFilters = [];

    foreach ($filters as $index => $filter) {
        $field = (string) ($filter['field'] ?? '');
        $operator = $filter['op'] ?? '==';

        if ($operator === '==' && isset($map['fields'][$field])) {
            $param = 'filter_' . $index;
            $column = $map['fields'][$field];
            $whereSql[] = stripos($field, 'email') !== false
                ? sprintf('LOWER(`%s`) = LOWER(:%s)', $column, $param)
                : sprintf('`%s` = :%s', $column, $param);
            $params[$param] = is_string($filter['value'] ?? null)
                ? trim((string) $filter['value'])
                : ($filter['value'] ?? null);
            continue;
        }

        $clientFilters[] = $filter;
    }

    $fetchLimit = $clientFilters ? 1000 : $limit;
    $whereClause = $whereSql ? ' WHERE ' . implode(' AND ', $whereSql) : '';
    $sql = sprintf('SELECT * FROM `%s`%s ORDER BY `%s` DESC LIMIT %d', $map['table'], $whereClause, $map['pk'], $fetchLimit);
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    $rows = $statement->fetchAll();
    $records = array_map(fn ($row) => hb_record_from_row($map, $row), $rows);

    if ($clientFilters) {
        $records = array_values(array_filter($records, function (array $record) use ($clientFilters): bool {
            foreach ($clientFilters as $filter) {
                $field = $filter['field'] ?? '';
                $operator = $filter['op'] ?? '==';
                $value = $filter['value'] ?? null;

                if ($operator !== '==') {
                    return false;
                }

                $recordValue = $record[$field] ?? null;
                if (is_string($recordValue) && is_string($value) && stripos((string) $field, 'email') !== false) {
                    if (strtolower(trim($recordValue)) !== strtolower(trim($value))) {
                        return false;
                    }
                    continue;
                }

                if ($recordValue != $value) {
                    return false;
                }
            }

            return true;
        }));
    }

    return array_slice($records, 0, $limit);
}

function hb_delete_record(PDO $pdo, array $map, string $id): bool
{
    $sql = sprintf('DELETE FROM `%s` WHERE `%s` = :id', $map['table'], $map['pk']);
    $statement = $pdo->prepare($sql);
    $statement->execute(['id' => $id]);
    return $statement->rowCount() > 0;
}

try {
    $input = hb_read_json_body();
    $action = (string) ($input['action'] ?? '');
    $collection = (string) ($input['collection'] ?? '');
    $maps = hb_collection_maps();

    if ($action === '' || !isset($maps[$collection])) {
        hb_json_response(['ok' => false, 'error' => 'Invalid MySQL API request.'], 400);
    }

    $pdo = honestbee_pdo();
    hb_ensure_payment_detail_columns($pdo);
    hb_ensure_customer_account_columns($pdo);
    hb_ensure_merchant_store_status_column($pdo);
    $map = $maps[$collection];

    if ($action === 'list') {
        $records = hb_list_records(
            $pdo,
            $map,
            is_array($input['filters'] ?? null) ? $input['filters'] : [],
            (int) ($input['limit'] ?? 100)
        );
        hb_json_response(['ok' => true, 'records' => $records]);
    }

    if ($action === 'get') {
        $id = (string) ($input['id'] ?? '');
        $row = $id !== '' ? hb_fetch_row($pdo, $map, $id) : null;
        hb_json_response([
            'ok' => true,
            'exists' => (bool) $row,
            'record' => $row ? hb_record_from_row($map, $row) : null,
        ]);
    }

    if ($action === 'nextId') {
        $id = hb_next_code_id($pdo, $map);
        hb_json_response(['ok' => true, 'id' => $id]);
    }

    if ($action === 'add') {
        $data = is_array($input['data'] ?? null) ? $input['data'] : [];
        if (in_array($collection, ['customer_order', 'orders'], true)) {
            hb_assert_order_store_open($pdo, $data);
        }
        $id = hb_next_code_id($pdo, $map);
        $record = hb_save_record($pdo, $map, $id, $data, false);
        hb_json_response(['ok' => true, 'id' => $id, 'record' => $record]);
    }

    if ($action === 'set' || $action === 'update') {
        $id = (string) ($input['id'] ?? '');
        if ($id === '') {
            hb_json_response(['ok' => false, 'error' => 'Missing record ID.'], 400);
        }

        $data = is_array($input['data'] ?? null) ? $input['data'] : [];
        $merge = $action === 'update' || (bool) ($input['merge'] ?? false);
        $record = hb_save_record($pdo, $map, $id, $data, $merge);
        $responseId = (string) ($record['id'] ?? $record[$map['pk']] ?? $id);
        hb_json_response(['ok' => true, 'id' => $responseId, 'record' => $record]);
    }

    if ($action === 'delete') {
        $id = (string) ($input['id'] ?? '');
        if ($id === '') {
            hb_json_response(['ok' => false, 'error' => 'Missing record ID.'], 400);
        }

        hb_json_response(['ok' => true, 'id' => $id, 'deleted' => hb_delete_record($pdo, $map, $id)]);
    }

    hb_json_response(['ok' => false, 'error' => 'Unsupported MySQL API action.'], 400);
} catch (Throwable $error) {
    hb_json_response(['ok' => false, 'error' => $error->getMessage()], 500);
}
