<?php
// Admin transaction tracking + status updater.
// GET    ?admin_id=X[&status=pending|completed|failed|upgraded|all][&q=search][&gateway=razorpay|cashfree|free]
// PATCH  ?admin_id=X { id, payment_status, transaction_id?, note? }

error_reporting(0);
ini_set('display_errors', 0);

require_once __DIR__ . '/../../config/db.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;

$body = null;
if ($method === 'PATCH' || $method === 'POST') {
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
$u = $stmt->fetch();
if (!$u || $u['is_admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

// Helper: ensure transaction_id column exists on subscriptions (one-time migration)
try {
    $col = $pdo->query("SHOW COLUMNS FROM subscriptions LIKE 'transaction_id'")->fetch();
    if (!$col) {
        $pdo->exec("ALTER TABLE subscriptions ADD COLUMN transaction_id VARCHAR(100) NULL AFTER payment_status");
    }
    $col2 = $pdo->query("SHOW COLUMNS FROM subscriptions LIKE 'admin_note'")->fetch();
    if (!$col2) {
        $pdo->exec("ALTER TABLE subscriptions ADD COLUMN admin_note TEXT NULL AFTER transaction_id");
    }
} catch (Exception $e) { /* non-fatal */ }

if ($method === 'GET') {
    $status  = strtolower($_GET['status']  ?? 'all');
    $gateway = strtolower($_GET['gateway'] ?? 'all');
    $q       = trim($_GET['q'] ?? '');

    $where  = ["1=1"];
    $params = [];

    if ($status !== 'all' && $status !== '') {
        $where[]  = "s.payment_status = ?";
        $params[] = $status;
    }
    if ($gateway !== 'all' && $gateway !== '') {
        $where[]  = "LOWER(s.payment_method) LIKE ?";
        $params[] = "%$gateway%";
    }
    if ($q !== '') {
        $where[]  = "(u.email LIKE ? OR u.name LIKE ? OR s.transaction_id LIKE ? OR CAST(s.id AS CHAR) = ?)";
        $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = $q;
    }

    $sql = "
        SELECT
            s.id, s.user_id, s.profile_id, s.plan_type, s.plan_days,
            s.start_date, s.end_date, s.amount, s.payment_method, s.payment_status,
            s.transaction_id, s.admin_note,
            u.email, u.name AS user_name, p.name AS profile_name
        FROM subscriptions s
        LEFT JOIN users    u ON s.user_id    = u.id
        LEFT JOIN profiles p ON s.profile_id = p.id
        WHERE " . implode(' AND ', $where) . "
        ORDER BY s.start_date DESC
        LIMIT 500
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Quick stats over the same filter
    $statsSql = "
        SELECT
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN s.payment_status = 'completed' THEN s.amount ELSE 0 END), 0) AS revenue,
            COUNT(CASE WHEN s.payment_status = 'completed' THEN 1 END) AS completed_count,
            COUNT(CASE WHEN s.payment_status = 'pending'   THEN 1 END) AS pending_count,
            COUNT(CASE WHEN s.payment_status IN ('failed','cancelled') THEN 1 END) AS failed_count
        FROM subscriptions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE " . implode(' AND ', $where);
    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute($params);
    $stats = $statsStmt->fetch();

    echo json_encode([
        'transactions' => $rows,
        'stats'        => $stats,
    ]);
    exit;
}

if ($method === 'PATCH') {
    $id     = $body['id'] ?? null;
    $status = $body['payment_status'] ?? null;
    $txnId  = $body['transaction_id'] ?? null;
    $note   = $body['admin_note']     ?? null;

    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(['error' => 'id and payment_status required']);
        exit;
    }

    $allowed = ['pending', 'completed', 'failed', 'cancelled', 'upgraded', 'refunded'];
    if (!in_array($status, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid status. Allowed: ' . implode(', ', $allowed)]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Get current state to detect transitions (for referral commission processing)
        $cur = $pdo->prepare("SELECT user_id, plan_type, amount, payment_status FROM subscriptions WHERE id = ?");
        $cur->execute([$id]);
        $sub = $cur->fetch();
        if (!$sub) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Subscription not found']);
            exit;
        }

        $sets = ["payment_status = ?"];
        $vals = [$status];
        if ($txnId !== null) { $sets[] = "transaction_id = ?"; $vals[] = $txnId; }
        if ($note  !== null) { $sets[] = "admin_note = ?";     $vals[] = $note; }
        $vals[] = $id;

        $upd = $pdo->prepare("UPDATE subscriptions SET " . implode(', ', $sets) . " WHERE id = ?");
        $upd->execute($vals);

        // If transitioning into a "paid" state, fire referral commission once.
        $paidStates = ['completed', 'paid', 'success', 'captured', 'active'];
        $wasPaid = in_array(strtolower($sub['payment_status']), $paidStates, true);
        $nowPaid = in_array(strtolower($status), $paidStates, true);
        if (!$wasPaid && $nowPaid) {
            // Skip if already credited for this subscription
            $chk = $pdo->prepare("SELECT id FROM referral_earnings WHERE subscription_id = ?");
            $chk->execute([$id]);
            if (!$chk->fetch()) {
                $refStmt = $pdo->prepare("SELECT referred_by FROM users WHERE id = ?");
                $refStmt->execute([$sub['user_id']]);
                $referredBy = $refStmt->fetchColumn();
                if ($referredBy) {
                    $sStmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'referral%'");
                    $settings = $sStmt->fetchAll(PDO::FETCH_KEY_PAIR);
                    if (($settings['referralEnabled'] ?? '0') === '1') {
                        $type = strtolower($sub['plan_type']);
                        $key  = strpos($type, 'monthly') !== false ? 'referralCommissionMonthly'
                              : (strpos($type, 'weekly') !== false ? 'referralCommissionWeekly'
                              : 'referralCommissionDaily');
                        $val = (float)($settings[$key] ?? 0);
                        if ($val > 0) {
                            $commission = ($settings['referralCommissionType'] ?? 'fixed') === 'percentage'
                                ? ((float)$sub['amount'] * $val) / 100
                                : $val;
                            if ($commission > 0) {
                                $ins = $pdo->prepare("INSERT INTO referral_earnings (user_id, referred_user_id, subscription_id, amount, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
                                $ins->execute([$referredBy, $sub['user_id'], $id, $commission]);
                            }
                        }
                    }
                }
            }
        }

        $pdo->commit();
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
