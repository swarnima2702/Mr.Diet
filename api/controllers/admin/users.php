<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;
$action = $_GET['action'] ?? '';

if (!$admin_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
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

function admin_plan_days($plan_type) {
    if ($plan_type === 'monthly') return 30;
    if ($plan_type === 'weekly') return 7;
    if ($plan_type === 'daily') return 1;
    return 0;
}

function admin_plan_price($pdo, $plan_type) {
    $keys = [
        'daily' => 'priceDaily',
        'weekly' => 'priceWeekly',
        'monthly' => 'priceMonthly',
    ];
    $fallbacks = [
        'daily' => 99.0,
        'weekly' => 599.0,
        'monthly' => 1999.0,
    ];

    if (!isset($keys[$plan_type])) return 0.0;

    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$keys[$plan_type]]);
    $value = $stmt->fetchColumn();

    if ($value === false || $value === null || $value === '') {
        return $fallbacks[$plan_type];
    }

    return floatval($value);
}

if ($method === 'POST' && $action === 'change_plan') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $targetUserId = $input['user_id'] ?? null;
    $planType = strtolower(trim($input['plan_type'] ?? ''));
    $validPlans = ['daily', 'weekly', 'monthly'];

    if (!$targetUserId || !in_array($planType, $validPlans, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id and a valid plan_type are required']);
        exit;
    }

    $targetStmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
    $targetStmt->execute([$targetUserId]);
    $targetUser = $targetStmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $planDays = admin_plan_days($planType);
    $amount = admin_plan_price($pdo, $planType);
    $endDate = date('Y-m-d', strtotime("+$planDays days"));
    $today = date('Y-m-d');

    try {
        $pdo->beginTransaction();

        $profileStmt = $pdo->prepare("SELECT id, name FROM profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
        $profileStmt->execute([$targetUserId]);
        $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);

        if (!$profile) {
            $createProfile = $pdo->prepare("
                INSERT INTO profiles
                    (user_id, name, email, age, gender, height, weight, goal, activity_level, dietary_restrictions, allergies, meal_preference, extended_data)
                VALUES
                    (?, ?, ?, 0, '', 0, 0, '', '', '[]', '', '', '{}')
            ");
            $createProfile->execute([$targetUserId, $targetUser['name'], $targetUser['email']]);
            $profile = [
                'id' => $pdo->lastInsertId(),
                'name' => $targetUser['name'],
            ];
        }

        $expireStmt = $pdo->prepare("
            UPDATE subscriptions
            SET status = 'expired',
                end_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY),
                admin_note = CONCAT(COALESCE(admin_note, ''), CASE WHEN admin_note IS NULL OR admin_note = '' THEN '' ELSE '\n' END, ?)
            WHERE user_id = ?
              AND payment_status = 'completed'
              AND end_date >= CURDATE()
        ");
        $expireStmt->execute([
            "Admin changed plan to $planType on $today",
            $targetUserId,
        ]);

        $insertSub = $pdo->prepare("
            INSERT INTO subscriptions
                (user_id, profile_id, plan_type, plan_days, end_date, amount, payment_method, payment_status, transaction_id, admin_note)
            VALUES
                (?, ?, ?, ?, ?, ?, 'admin', 'completed', ?, ?)
        ");
        $transactionId = 'ADMIN-' . date('YmdHis') . '-' . $targetUserId;
        $adminNote = "Plan assigned by admin #$admin_id on $today";
        $insertSub->execute([
            $targetUserId,
            $profile['id'],
            $planType,
            $planDays,
            $endDate,
            $amount,
            $transactionId,
            $adminNote,
        ]);
        $subscriptionId = $pdo->lastInsertId();

        $insertPlan = $pdo->prepare("
            INSERT INTO daily_diet_plans
                (subscription_id, day_number, plan_date, is_unlocked, user_name)
            VALUES
                (?, ?, ?, 0, ?)
        ");
        for ($day = 1; $day <= $planDays; $day++) {
            $planDate = date('Y-m-d', strtotime('+' . ($day - 1) . ' days'));
            $insertPlan->execute([
                $subscriptionId,
                $day,
                $planDate,
                $targetUser['name'] ?: ($profile['name'] ?? 'User'),
            ]);
        }

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'subscription_id' => intval($subscriptionId),
            'user_id' => intval($targetUserId),
            'plan_type' => $planType,
            'plan_days' => $planDays,
            'end_date' => $endDate,
            'amount' => $amount,
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to change plan: ' . $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    // List all users with their subscription count and wallet stats
    $stmt = $pdo->query("
        SELECT
            u.*,
            (SELECT id FROM subscriptions WHERE user_id = u.id AND payment_status = 'completed' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1) as active_subscription_id,
            (SELECT plan_type FROM subscriptions WHERE user_id = u.id AND payment_status = 'completed' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1) as active_plan,
            (SELECT end_date FROM subscriptions WHERE user_id = u.id AND payment_status = 'completed' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1) as active_plan_end_date,
            COUNT(s.id) as sub_count,
            COALESCE(re.total_earned, 0) as total_earned,
            COALESCE(re.total_earned, 0) - COALESCE(wr.total_withdrawn, 0) - COALESCE(wr.pending_withdrawal, 0) as current_balance
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        LEFT JOIN (
            SELECT user_id, SUM(amount) as total_earned
            FROM referral_earnings
            GROUP BY user_id
        ) re ON u.id = re.user_id
        LEFT JOIN (
            SELECT user_id,
                   SUM(CASE WHEN status = 'processed' THEN amount ELSE 0 END) as total_withdrawn,
                   SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_withdrawal
            FROM withdrawal_requests
            GROUP BY user_id
        ) wr ON u.id = wr.user_id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    ");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'DELETE' || ($method === 'POST' && isset($_POST['_method']) && $_POST['_method'] === 'DELETE')) {
    $input = json_decode(file_get_contents('php://input'), true);
    $userIds = $input['userIds'] ?? [];
    $userId = $input['userId'] ?? null;

    if ($userId) $userIds = [$userId];

    if (empty($userIds)) {
        http_response_code(400);
        echo json_encode(['error' => 'No user IDs provided']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';

        // 1a. Collect related IDs (subscriptions are keyed by user_id; profiles by user_id;
        //     but child tables of subscriptions/profiles only know subscription_id / profile_id).
        $sStmt = $pdo->prepare("SELECT id FROM subscriptions WHERE user_id IN ($placeholders)");
        $sStmt->execute($userIds);
        $subIds = $sStmt->fetchAll(PDO::FETCH_COLUMN);

        $pStmt = $pdo->prepare("SELECT id FROM profiles WHERE user_id IN ($placeholders)");
        $pStmt->execute($userIds);
        $profileIds = $pStmt->fetchAll(PDO::FETCH_COLUMN);

        // 1b. Delete subscription-keyed children
        if (!empty($subIds)) {
            $sp = str_repeat('?,', count($subIds) - 1) . '?';
            foreach (['daily_diet_plans', 'daily_logs', 'checkins', 'generation_timers', 'timers'] as $t) {
                $pdo->prepare("DELETE FROM $t WHERE subscription_id IN ($sp)")->execute($subIds);
            }
            // Preserve upstream referrer's earnings — only NULL the FK to the gone subscription.
            $pdo->prepare("UPDATE referral_earnings SET subscription_id = NULL WHERE subscription_id IN ($sp)")->execute($subIds);
        }

        // 1c. Delete profile-keyed children
        if (!empty($profileIds)) {
            $pp = str_repeat('?,', count($profileIds) - 1) . '?';
            $pdo->prepare("DELETE FROM health_metrics WHERE profile_id IN ($pp)")->execute($profileIds);
        }

        // 1d. Delete user-keyed tables (those that actually have user_id)
        $userKeyedTables = [
            'subscriptions',
            'profiles',
            'referral_earnings',     // user_id and referred_user_id
            'withdrawal_requests',   // user_id
            'withdrawals',           // user_id
            'period_logs',           // user_id
            'notification_logs',     // user_id
            'notification_preferences', // user_id
        ];
        foreach ($userKeyedTables as $table) {
            $pdo->prepare("DELETE FROM $table WHERE user_id IN ($placeholders)")->execute($userIds);
        }

        // 1e. Preserve upstream referrer's earned commissions — these belong to a different
        //     user (the referrer). Just NULL the FK to the deleted referred user.
        $pdo->prepare("UPDATE referral_earnings SET referred_user_id = NULL WHERE referred_user_id IN ($placeholders)")->execute($userIds);

        // 1f. Null-out users.referred_by for anyone referred by these users (preserves their accounts)
        $pdo->prepare("UPDATE users SET referred_by = NULL WHERE referred_by IN ($placeholders)")->execute($userIds);

        // 2. Finally delete users (skip admins)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders) AND is_admin != 1");
        $stmt->execute($userIds);
        $deleted = $stmt->rowCount();

        $pdo->commit();
        echo json_encode(['success' => true, 'deleted' => $deleted, 'message' => "$deleted user(s) deleted successfully"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete users: ' . $e->getMessage()]);
    }
}
?>
