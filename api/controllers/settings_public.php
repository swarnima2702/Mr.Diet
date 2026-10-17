<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../config/db.php';

$stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
$settings = $stmt->fetchAll();

$config = [];
foreach ($settings as $row) {
    // Only export non-sensitive fields. Strip anything containing "secret",
    // "api_key", or "key_secret" (covers razorpay_key_secret, cashfree_secret_key, etc.)
    $k = $row['setting_key'];
    if (strpos($k, 'secret') !== false || strpos($k, 'api_key') !== false || strpos($k, 'key_secret') !== false) {
        continue;
    }
    $config[$k] = $row['setting_value'];
}

// Always expose OneSignal App ID (it's public, needed for browser SDK)
// The REST API key is never exposed (contains 'api_key' in the check above)

echo json_encode($config);
?>
