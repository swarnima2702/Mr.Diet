<?php
// Public coupon validate endpoint.
// POST /api/controllers/coupons.php?action=validate  { code, plan_type, amount }
// Returns: { valid, code, discount_type, discount_value, discount_amount, final_amount, message? }

error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../config/db.php';
header("Content-Type: application/json");

// Auto-create table on first hit (so dev/prod doesn't need a separate migration step)
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS coupons (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
        discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_uses INT DEFAULT NULL,
        used_count INT NOT NULL DEFAULT 0,
        min_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        applies_to VARCHAR(50) NOT NULL DEFAULT 'all',
        valid_from DATETIME DEFAULT NULL,
        valid_until DATETIME DEFAULT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");
} catch (Exception $e) { /* ignore */ }

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method !== 'POST' || $action !== 'validate') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$code = strtoupper(trim($body['code'] ?? ''));
$planType = strtolower(trim($body['plan_type'] ?? 'all'));
$amount = floatval($body['amount'] ?? 0);

if (!$code) {
    echo json_encode(['valid' => false, 'message' => 'Enter a coupon code']);
    exit;
}
if ($amount <= 0) {
    echo json_encode(['valid' => false, 'message' => 'Invalid amount']);
    exit;
}

// Use MySQL NOW() for time comparisons so we're in the same TZ as the stored datetimes,
// regardless of PHP's timezone setting.
$stmt = $pdo->prepare(
    "SELECT c.*,
        (c.valid_from  IS NOT NULL AND c.valid_from  > NOW()) AS not_yet_active,
        (c.valid_until IS NOT NULL AND c.valid_until < NOW()) AS expired
     FROM coupons c WHERE UPPER(c.code) = ? LIMIT 1"
);
$stmt->execute([$code]);
$c = $stmt->fetch();

if (!$c) {
    echo json_encode(['valid' => false, 'message' => 'Coupon not found']);
    exit;
}

// Check plan applicability FIRST — gives the most useful error if the user
// pasted a code meant for a different plan.
$applies = strtolower($c['applies_to'] ?? 'all');
if ($applies !== 'all' && $applies !== $planType) {
    echo json_encode(['valid' => false, 'message' => 'Coupon not applicable to this plan']);
    exit;
}
if (!$c['is_active']) {
    echo json_encode(['valid' => false, 'message' => 'Coupon is inactive']);
    exit;
}
if ($c['not_yet_active']) {
    echo json_encode(['valid' => false, 'message' => 'Coupon not yet active']);
    exit;
}
if ($c['expired']) {
    echo json_encode(['valid' => false, 'message' => 'Coupon expired']);
    exit;
}
if (!is_null($c['max_uses']) && intval($c['used_count']) >= intval($c['max_uses'])) {
    echo json_encode(['valid' => false, 'message' => 'Coupon limit reached']);
    exit;
}
if ($amount < floatval($c['min_amount'])) {
    echo json_encode(['valid' => false, 'message' => 'Minimum order ₹' . $c['min_amount'] . ' required']);
    exit;
}

$discount = 0;
if ($c['discount_type'] === 'percent') {
    $discount = round($amount * floatval($c['discount_value']) / 100, 2);
} else {
    $discount = round(floatval($c['discount_value']), 2);
}
if ($discount > $amount) $discount = $amount;
$final = max(0, round($amount - $discount, 2));

echo json_encode([
    'valid'           => true,
    'code'            => $c['code'],
    'discount_type'   => $c['discount_type'],
    'discount_value'  => floatval($c['discount_value']),
    'discount_amount' => $discount,
    'final_amount'    => $final,
    'message'         => 'Coupon applied!',
]);
