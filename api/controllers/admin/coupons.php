<?php
// Admin CRUD for coupons.
// GET    ?admin_id=...                 → list all
// POST   { admin_id, code, discount_type, discount_value, max_uses, min_amount, applies_to, valid_from, valid_until, is_active } → create
// PATCH  ?id=N { admin_id, ...fields } → update (partial)
// DELETE ?id=N&admin_id=...            → delete

error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../config/db.php';
header("Content-Type: application/json");

// Auto-create table
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
$admin_id = $_GET['admin_id'] ?? null;
$id = $_GET['id'] ?? null;

$body = null;
if ($method === 'POST' || $method === 'PATCH') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    if ($body && isset($body['admin_id'])) $admin_id = $body['admin_id'];
}

// Admin auth
if (!$admin_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$user = $stmt->fetch();
if (!$user || $user['is_admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$action = $_GET['action'] ?? '';

// ANALYTICS
if ($method === 'GET' && $action === 'analytics') {
    // Per-coupon stats. Discount amount is computed from coupon definition × used_count.
    $rows = $pdo->query("
        SELECT id, code, discount_type, discount_value, applies_to,
               used_count, max_uses, is_active, valid_until, created_at
        FROM coupons
        ORDER BY used_count DESC, id DESC
    ")->fetchAll();

    $totalRedemptions = 0;
    $activeCount = 0;
    $expiredCount = 0;
    $exhaustedCount = 0;
    $now = $pdo->query("SELECT NOW() as n")->fetchColumn();
    foreach ($rows as &$r) {
        $totalRedemptions += intval($r['used_count']);
        if ($r['is_active']) $activeCount++;
        if (!empty($r['valid_until']) && $r['valid_until'] < $now) $expiredCount++;
        if (!is_null($r['max_uses']) && intval($r['used_count']) >= intval($r['max_uses'])) $exhaustedCount++;
    }

    echo json_encode([
        'total_coupons'      => count($rows),
        'active_coupons'     => $activeCount,
        'expired_coupons'    => $expiredCount,
        'exhausted_coupons'  => $exhaustedCount,
        'total_redemptions'  => $totalRedemptions,
        'top_coupons'        => array_slice($rows, 0, 5),
    ]);
    exit;
}

// LIST
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM coupons ORDER BY id DESC")->fetchAll();
    echo json_encode($rows);
    exit;
}

// CREATE
if ($method === 'POST') {
    $code = strtoupper(trim($body['code'] ?? ''));
    if (!$code) { http_response_code(400); echo json_encode(['error' => 'Code required']); exit; }

    $stmt = $pdo->prepare("INSERT INTO coupons
        (code, discount_type, discount_value, max_uses, min_amount, applies_to, valid_from, valid_until, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    try {
        $stmt->execute([
            $code,
            $body['discount_type']  ?? 'percent',
            floatval($body['discount_value'] ?? 0),
            isset($body['max_uses']) && $body['max_uses'] !== '' ? intval($body['max_uses']) : null,
            floatval($body['min_amount'] ?? 0),
            $body['applies_to']    ?? 'all',
            !empty($body['valid_from'])  ? $body['valid_from']  : null,
            !empty($body['valid_until']) ? $body['valid_until'] : null,
            !empty($body['is_active']) ? 1 : 0,
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getCode() === '23000' ? 'Coupon code already exists' : $e->getMessage()]);
    }
    exit;
}

// UPDATE
if ($method === 'PATCH') {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
    $allowed = ['code','discount_type','discount_value','max_uses','min_amount','applies_to','valid_from','valid_until','is_active'];
    $sets = [];
    $vals = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $v = $body[$f];
            if ($f === 'code') $v = strtoupper(trim($v));
            if ($f === 'is_active') $v = !empty($v) ? 1 : 0;
            if (in_array($f, ['valid_from','valid_until','max_uses']) && $v === '') $v = null;
            $vals[] = $v;
        }
    }
    if (!$sets) { echo json_encode(['success' => true]); exit; }
    $vals[] = $id;
    try {
        $sql = "UPDATE coupons SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($vals);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id required']); exit; }
    $pdo->prepare("DELETE FROM coupons WHERE id = ?")->execute([$id]);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
