<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$admin_id = $input['admin_id'] ?? null;
$user_id = $input['user_id'] ?? null;
$amount = $input['amount'] ?? 0;
$type = $input['type'] ?? 'add'; // 'add' or 'remove'
$description = $input['description'] ?? '';

if (!$admin_id || !$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

if (!is_numeric($amount) || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid amount. Must be a positive number.']);
    exit;
}

if (!in_array($type, ['add', 'remove'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Must be "add" or "remove".']);
    exit;
}

// Admin Check
$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$user = $stmt->fetch();

if (!$user || $user['is_admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

if ($method === 'POST') {
    try {
        // Determine the amount to insert (negative for remove)
        $insertAmount = $type === 'remove' ? -$amount : $amount;

        // Insert into referral_earnings with admin tracking and flag
        $stmt = $pdo->prepare("INSERT INTO referral_earnings (user_id, referred_user_id, subscription_id, amount, description, adjusted_by_admin_id, is_admin_adjustment, status, created_at) VALUES (?, NULL, NULL, ?, ?, ?, 1, 'completed', NOW())");
        $stmt->execute([$user_id, $insertAmount, $description, $admin_id]);

        echo json_encode(['success' => true, 'message' => 'Balance adjusted successfully']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>