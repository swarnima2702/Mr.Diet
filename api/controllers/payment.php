<?php
// Prevent PHP warnings/errors from messing up JSON response
error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/**
 * Pull a setting from DB; fall back to provided default.
 */
function setting_get($pdo, $key, $default = '') {
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        try {
            $rows = $pdo->query("SELECT setting_key, setting_value FROM settings")->fetchAll();
            foreach ($rows as $r) $cache[$r['setting_key']] = $r['setting_value'];
        } catch (Exception $e) { $cache = []; }
    }
    return isset($cache[$key]) && $cache[$key] !== '' ? $cache[$key] : $default;
}

/**
 * Validate a coupon and return [final_amount, discount, coupon_row|null].
 * Returns the original amount + null coupon if no/invalid code.
 */
function apply_coupon($pdo, $code, $amount, $planType) {
    $code = strtoupper(trim($code ?? ''));
    if (!$code) return [$amount, 0, null];
    // Use MySQL NOW() for TZ consistency with stored datetime values
    $stmt = $pdo->prepare(
        "SELECT c.*,
            (c.valid_from  IS NOT NULL AND c.valid_from  > NOW()) AS not_yet_active,
            (c.valid_until IS NOT NULL AND c.valid_until < NOW()) AS expired
         FROM coupons c WHERE UPPER(c.code) = ? LIMIT 1"
    );
    $stmt->execute([$code]);
    $c = $stmt->fetch();
    if (!$c || !$c['is_active']) return [$amount, 0, null];

    if ($c['not_yet_active']) return [$amount, 0, null];
    if ($c['expired'])        return [$amount, 0, null];
    if (!is_null($c['max_uses']) && intval($c['used_count']) >= intval($c['max_uses'])) return [$amount, 0, null];
    if ($amount < floatval($c['min_amount'])) return [$amount, 0, null];

    $applies = strtolower($c['applies_to'] ?? 'all');
    $planTypeNorm = strtolower($planType ?? 'all');
    if ($applies !== 'all' && $applies !== $planTypeNorm) return [$amount, 0, null];

    $discount = $c['discount_type'] === 'percent'
        ? round($amount * floatval($c['discount_value']) / 100, 2)
        : round(floatval($c['discount_value']), 2);
    if ($discount > $amount) $discount = $amount;
    $final = max(0, round($amount - $discount, 2));
    return [$final, $discount, $c];
}

/**
 * Resolve the active gateway. Frontend may pass it explicitly; otherwise pick
 * the first enabled in priority order: razorpay > cashfree.
 */
function resolve_gateway($pdo, $requested) {
    $razorEnabled = setting_get($pdo, 'enable_razorpay', '0') === '1';
    $cashfreeEnabled = setting_get($pdo, 'enable_cashfree', '0') === '1';

    if ($requested === 'razorpay' && $razorEnabled) return 'razorpay';
    if ($requested === 'cashfree' && $cashfreeEnabled) return 'cashfree';

    if ($razorEnabled) return 'razorpay';
    if ($cashfreeEnabled) return 'cashfree';

    // Last resort: cashfree (legacy default) — keeps old flow alive if no toggles set
    return 'cashfree';
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create_order') {
        if (!$data) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON data']);
            exit;
        }
        $amount = $data['amount'] ?? 0;
        $customerId = $data['customer_id'] ?? '';
        $customerPhone = $data['customer_phone'] ?? '';
        if (empty(trim($customerPhone))) $customerPhone = '9999999999';
        $customerPhone = preg_replace('/[^0-9]/', '', $customerPhone);
        if (empty($customerPhone) || strlen($customerPhone) < 10) $customerPhone = '9999999999';
        if (strlen($customerPhone) > 10) $customerPhone = substr($customerPhone, -10);

        $customerName  = $data['customer_name']  ?? 'Customer';
        $customerEmail = $data['customer_email'] ?? 'noreply@example.com';

        if (empty($customerId) || $customerId === 'GUEST') $customerId = 'GUEST_' . uniqid();
        $customerId = preg_replace('/[^a-zA-Z0-9_]/', '', $customerId);
        if (empty($customerId)) $customerId = 'GUEST_' . uniqid();

        $orderId = 'ORDER_' . uniqid() . '_' . time();
        $gateway = resolve_gateway($pdo, $data['gateway'] ?? '');

        // Apply coupon if supplied (server-side authoritative)
        $couponCode = $data['coupon_code'] ?? '';
        $planType   = $data['plan_type']   ?? 'all';
        $originalAmount = $amount;
        $couponDiscount = 0;
        $couponRow = null;
        if (!empty($couponCode)) {
            list($amount, $couponDiscount, $couponRow) = apply_coupon($pdo, $couponCode, $amount, $planType);
            if ($couponRow) {
                // increment used_count once order creation request arrives (before gateway call)
                try {
                    $pdo->prepare("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?")
                        ->execute([$couponRow['id']]);
                } catch (Exception $e) { /* non-fatal */ }
            }
        }

        // ---------------- RAZORPAY ----------------
        if ($gateway === 'razorpay') {
            $keyId     = setting_get($pdo, 'razorpay_key_id', RAZORPAY_KEY_ID);
            $keySecret = setting_get($pdo, 'razorpay_key_secret', RAZORPAY_KEY_SECRET);

            if (empty($keyId) || empty($keySecret)) {
                http_response_code(400);
                echo json_encode(['error' => 'Razorpay keys not configured']);
                exit;
            }

            $payload = [
                'amount'   => intval(round($amount * 100)), // paise
                'currency' => 'INR',
                'receipt'  => substr($orderId, 0, 40),
                'notes'    => [
                    'customer_id'    => $customerId,
                    'customer_name'  => $customerName,
                    'customer_email' => $customerEmail,
                    'customer_phone' => $customerPhone,
                ],
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, RAZORPAY_BASE_URL . '/orders');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_USERPWD, $keyId . ':' . $keySecret);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);

            $result = curl_exec($ch);
            if (curl_errno($ch)) {
                $err = curl_error($ch);
                file_put_contents(__DIR__ . '/razorpay_debug.log', date('Y-m-d H:i:s') . " Curl Error: $err\n", FILE_APPEND);
                http_response_code(500);
                echo json_encode(['error' => 'Curl error: ' . $err]);
                exit;
            }
            $response = json_decode($result, true);
            file_put_contents(__DIR__ . '/razorpay_debug.log', date('Y-m-d H:i:s') . " Response: $result\n", FILE_APPEND);

            if (!isset($response['id'])) {
                http_response_code(400);
                echo json_encode([
                    'error'   => $response['error']['description'] ?? 'Razorpay order creation failed',
                    'details' => $response,
                ]);
                exit;
            }

            echo json_encode([
                'gateway'    => 'razorpay',
                'order_id'   => $response['id'],
                'amount'     => $response['amount'],
                'currency'   => $response['currency'],
                'key_id'     => $keyId,
                'prefill'    => [
                    'name'    => $customerName,
                    'email'   => $customerEmail,
                    'contact' => $customerPhone,
                ],
            ]);
            exit;
        }

        // ---------------- CASHFREE (existing flow) ----------------
        $appId  = setting_get($pdo, 'cashfree_app_id', CASHFREE_APP_ID);
        $secret = setting_get($pdo, 'cashfree_secret_key', CASHFREE_SECRET_KEY);

        // Auto-detect TEST keys → sandbox endpoint. PROD keys → live endpoint.
        $isTestKey = (stripos($appId, 'TEST') === 0) || (stripos($secret, 'cfsk_ma_test') !== false);
        $cfBaseUrl = $isTestKey ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

        $returnUrl = $data['return_url'] ?? 'http://localhost:8081/dashboard?order_id={order_id}';

        $payload = [
            'order_id'       => $orderId,
            'order_amount'   => $amount,
            'order_currency' => 'INR',
            'customer_details' => [
                'customer_id'    => "CUST_" . $customerId,
                'customer_name'  => $customerName,
                'customer_email' => $customerEmail,
                'customer_phone' => $customerPhone,
            ],
            'order_meta' => [
                'return_url' => $returnUrl,
            ],
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $cfBaseUrl . '/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-client-id: ' . $appId,
            'x-client-secret: ' . $secret,
            'x-api-version: ' . CASHFREE_API_VERSION,
            'Content-Type: application/json',
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, $isTestKey ? 0 : 1);

        file_put_contents(__DIR__ . '/cashfree_debug.log', date('Y-m-d H:i:s') . " [" . ($isTestKey ? 'SANDBOX' : 'PROD') . "] Payload: " . json_encode($payload) . "\n", FILE_APPEND);

        $result = curl_exec($ch);
        if (curl_errno($ch)) {
            $err = curl_error($ch);
            file_put_contents(__DIR__ . '/cashfree_debug.log', date('Y-m-d H:i:s') . " Curl Error: $err\n", FILE_APPEND);
            echo json_encode(['error' => 'Curl error: ' . $err]);
            exit;
        }
        $response = json_decode($result, true);
        file_put_contents(__DIR__ . '/cashfree_debug.log', date('Y-m-d H:i:s') . " Response: $result\n", FILE_APPEND);

        if (isset($response['message']) && !isset($response['payment_session_id'])) {
            http_response_code(400);
            echo json_encode(['error' => $response['message'], 'details' => $response]);
            exit;
        }

        $response['gateway'] = 'cashfree';
        $response['cf_mode'] = $isTestKey ? 'sandbox' : 'production';
        echo json_encode($response);
        exit;
    }

    elseif ($action === 'verify') {
        $gateway = $data['gateway'] ?? resolve_gateway($pdo, '');

        // ---------------- RAZORPAY VERIFY (signature) ----------------
        if ($gateway === 'razorpay') {
            $orderId     = $data['razorpay_order_id']   ?? '';
            $paymentId   = $data['razorpay_payment_id'] ?? '';
            $signature   = $data['razorpay_signature']  ?? '';
            $keySecret   = setting_get($pdo, 'razorpay_key_secret', RAZORPAY_KEY_SECRET);

            if (!$orderId || !$paymentId || !$signature || !$keySecret) {
                http_response_code(400);
                echo json_encode(['order_status' => 'FAILED', 'error' => 'Missing params']);
                exit;
            }

            $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $keySecret);
            $valid = hash_equals($expected, $signature);

            file_put_contents(__DIR__ . '/razorpay_debug.log', date('Y-m-d H:i:s') . " Verify order=$orderId payment=$paymentId valid=" . ($valid ? '1' : '0') . "\n", FILE_APPEND);

            echo json_encode([
                'gateway'      => 'razorpay',
                'order_status' => $valid ? 'PAID' : 'FAILED',
                'order_id'     => $orderId,
                'payment_id'   => $paymentId,
            ]);
            exit;
        }

        // ---------------- CASHFREE VERIFY (existing) ----------------
        $orderId = $data['order_id'] ?? '';
        $appId   = setting_get($pdo, 'cashfree_app_id', CASHFREE_APP_ID);
        $secret  = setting_get($pdo, 'cashfree_secret_key', CASHFREE_SECRET_KEY);

        $isTestKey = (stripos($appId, 'TEST') === 0) || (stripos($secret, 'cfsk_ma_test') !== false);
        $cfBaseUrl = $isTestKey ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $cfBaseUrl . '/orders/' . $orderId);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-client-id: ' . $appId,
            'x-client-secret: ' . $secret,
            'x-api-version: ' . CASHFREE_API_VERSION,
            'Content-Type: application/json',
        ]);

        $result = curl_exec($ch);
        file_put_contents(__DIR__ . '/payment_verify_debug.log', date('Y-m-d H:i:s') . " Order: $orderId, Result: $result\n", FILE_APPEND);

        echo $result;
        exit;
    }
}
?>
