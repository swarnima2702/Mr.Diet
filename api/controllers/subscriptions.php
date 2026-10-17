<?php
require_once __DIR__ . '/../config/db.php';
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Process Referral Commission
 * 
 * @param PDO $pdo
 * @param int $subscription_id
 * @param int $user_id
 * @param string $plan_type
 * @param float $amount
 */
function processReferralCommission($pdo, $subscription_id, $user_id, $plan_type, $amount) {
    // 1. Check if user was referred
    $stmt = $pdo->prepare("SELECT referred_by FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $referredBy = $stmt->fetchColumn();

    if (!$referredBy) return; // Not referred

    // 2. Already processed for this subscription?
    $stmt = $pdo->prepare("SELECT id FROM referral_earnings WHERE subscription_id = ?");
    $stmt->execute([$subscription_id]);
    if ($stmt->fetch()) return;

    // 3. Get Commission settings
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'referral%'");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    // If disabled or missing, exit
    if (($settings['referralEnabled'] ?? '0') !== '1') return;

    // Determine commission amount
    $commission = 0;
    $type = strtolower($plan_type);
    
    // Choose the right setting based on plan keywords
    if (strpos($type, 'daily') !== false) {
        $commissionVal = (float)($settings['referralCommissionDaily'] ?? 0);
    } elseif (strpos($type, 'weekly') !== false) {
        $commissionVal = (float)($settings['referralCommissionWeekly'] ?? 0);
    } elseif (strpos($type, 'monthly') !== false) {
        $commissionVal = (float)($settings['referralCommissionMonthly'] ?? 0);
    } else {
        // Fallback for custom naming: use Weekly commission if no match
        $commissionVal = (float)($settings['referralCommissionWeekly'] ?? $settings['referralCommissionDaily'] ?? 50);
    }

    if ($commissionVal > 0) {
        if (($settings['referralCommissionType'] ?? 'fixed') === 'percentage') {
            $commission = ($amount * $commissionVal) / 100;
        } else {
            $commission = $commissionVal;
        }
    }

    if ($commission > 0) {
        $stmt = $pdo->prepare("INSERT INTO referral_earnings (user_id, referred_user_id, subscription_id, amount, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())");
        $stmt->execute([$referredBy, $user_id, $subscription_id, $commission]);
    }
}

/**
 * Map plan_type → numeric tier (0..3). Higher = better.
 */
function plan_tier($type) {
    $t = strtolower($type ?? '');
    if (strpos($t, 'monthly') !== false) return 3;
    if (strpos($t, 'weekly')  !== false) return 2;
    if (strpos($t, 'daily')   !== false) return 1;
    if (strpos($t, 'trial')   !== false) return 0;
    return 0;
}

/**
 * Plan price helper — pulls live value from settings table, falls back to defaults.
 */
function plan_price($pdo, $type) {
    $t = strtolower($type ?? '');
    $key = null;
    if (strpos($t, 'monthly') !== false) $key = 'priceMonthly';
    elseif (strpos($t, 'weekly') !== false) $key = 'priceWeekly';
    elseif (strpos($t, 'daily') !== false) $key = 'priceDaily';
    if (!$key) return 0.0;
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $v = $stmt->fetchColumn();
    if ($v === false || $v === null || $v === '') {
        return $type === 'monthly' ? 1999.0 : ($type === 'weekly' ? 599.0 : 99.0);
    }
    return floatval($v);
}

function plan_days_for($type) {
    $t = strtolower($type ?? '');
    if (strpos($t, 'monthly') !== false) return 30;
    if (strpos($t, 'weekly')  !== false) return 7;
    if (strpos($t, 'daily')   !== false) return 1;
    if (strpos($t, 'trial')   !== false) return 1;
    return 0;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ---------- Preview upgrade/renew/downgrade ----------
if ($method === 'GET' && $action === 'preview_change') {
    $user_id = $_GET['user_id']  ?? null;
    $newPlan = strtolower($_GET['new_plan'] ?? '');
    if (!$user_id || !$newPlan) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id and new_plan required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM subscriptions WHERE user_id = ? AND payment_status = 'completed' AND end_date >= CURDATE() ORDER BY start_date DESC LIMIT 1");
    $stmt->execute([$user_id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);

    $newPrice = plan_price($pdo, $newPlan);
    $newDays  = plan_days_for($newPlan);

    if (!$current) {
        echo json_encode([
            'mode'           => 'new',
            'current_plan'   => null,
            'new_plan'       => $newPlan,
            'new_price'      => $newPrice,
            'credit'         => 0,
            'final_amount'   => $newPrice,
            'days_remaining' => 0,
            'message'        => 'No active plan — full price applies.',
        ]);
        exit;
    }

    $currentTier = plan_tier($current['plan_type']);
    $newTier     = plan_tier($newPlan);

    // Days remaining (inclusive of today)
    $today      = new DateTime(date('Y-m-d'));
    $endDate    = new DateTime($current['end_date']);
    $diff       = $today->diff($endDate);
    $daysRem    = max(0, intval($diff->days) * ($endDate >= $today ? 1 : -1));
    if ($endDate < $today) $daysRem = 0;

    $totalDays  = max(1, intval($current['plan_days']));
    $perDay     = floatval($current['amount']) / $totalDays;
    $credit     = round($perDay * $daysRem, 2);

    if ($newTier === $currentTier) {
        // RENEW (extend) — full price, append days
        echo json_encode([
            'mode'           => 'renew',
            'current_plan'   => $current['plan_type'],
            'new_plan'       => $newPlan,
            'current_end'    => $current['end_date'],
            'new_price'      => $newPrice,
            'credit'         => 0,
            'final_amount'   => $newPrice,
            'days_remaining' => $daysRem,
            'message'        => "Renewal — your access will extend by $newDays day(s) after the current period.",
        ]);
        exit;
    }

    if ($newTier < $currentTier) {
        // DOWNGRADE — blocked
        echo json_encode([
            'mode'           => 'downgrade',
            'current_plan'   => $current['plan_type'],
            'new_plan'       => $newPlan,
            'current_end'    => $current['end_date'],
            'new_price'      => $newPrice,
            'credit'         => 0,
            'final_amount'   => $newPrice,
            'days_remaining' => $daysRem,
            'blocked'        => true,
            'message'        => "Downgrade not allowed mid-cycle. Your $current[plan_type] plan is active till $current[end_date].",
        ]);
        exit;
    }

    // UPGRADE — new tier > current tier — apply prorated credit
    $finalAmount = max(0, round($newPrice - $credit, 2));
    echo json_encode([
        'mode'           => 'upgrade',
        'current_plan'   => $current['plan_type'],
        'current_sub_id' => intval($current['id']),
        'new_plan'       => $newPlan,
        'current_end'    => $current['end_date'],
        'new_price'      => $newPrice,
        'credit'         => $credit,
        'final_amount'   => $finalAmount,
        'days_remaining' => $daysRem,
        'message'        => "Upgrade — ₹$credit credit from your remaining $daysRem day(s) applied.",
    ]);
    exit;
}

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    $all = ($_GET['all'] ?? 'false') === 'true';
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required']);
        exit;
    }

    if ($all) {
        $stmt = $pdo->prepare("SELECT s.*, p.name as profile_name, u.name as user_name FROM subscriptions s JOIN profiles p ON s.profile_id = p.id JOIN users u ON s.user_id = u.id WHERE s.user_id = ? ORDER BY s.start_date DESC");
        $stmt->execute([$user_id]);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($subscriptions);
    } else {
        $stmt = $pdo->prepare("SELECT s.*, p.name as profile_name, u.name as user_name FROM subscriptions s JOIN profiles p ON s.profile_id = p.id JOIN users u ON s.user_id = u.id WHERE s.user_id = ? AND s.payment_status = 'completed' AND s.end_date >= CURDATE() ORDER BY s.start_date DESC LIMIT 1");
        $stmt->execute([$user_id]);
        $subscription = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($subscription) {
            echo json_encode($subscription);
        } else {
            // Return null instead of 404 to avoid console noise for inactive/new users
            echo json_encode(null);
        }
    }
}
elseif ($method === 'POST' || $method === 'PATCH') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($method === 'POST') {
        $profile_id = $data['profile_id'] ?? null;
        $user_id = $data['user_id'] ?? null; // Expect user_id from frontend

        // Fallback: If no user_id, fetch from profile
        if (!$user_id && $profile_id) {
            $uStmt = $pdo->prepare("SELECT user_id FROM profiles WHERE id = ?");
            $uStmt->execute([$profile_id]);
            $uRow = $uStmt->fetch(PDO::FETCH_ASSOC);
            if ($uRow) {
                $user_id = $uRow['user_id'];
            }
        }

        $plan_type = $data['plan_type'] ?? '';
        $plan_days = $data['plan_days'] ?? 0;
        $end_date = $data['end_date'] ?? '';
        $amount = $data['amount'] ?? 0.0;
        $payment_method = $data['payment_method'] ?? '';
        $payment_status = $data['payment_status'] ?? 'pending';

        if (!$user_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing user_id for subscription']);
            exit;
        }

        // Get user name
        $userStmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
        $userStmt->execute([$user_id]);
        $userRow = $userStmt->fetch(PDO::FETCH_ASSOC);
        $user_name = $userRow['name'] ?? 'Unknown';

        // Optional: this subscription replaces an existing one (upgrade flow)
        $replaces_sub_id = $data['replaces_subscription_id'] ?? null;

        $stmt = $pdo->prepare("INSERT INTO subscriptions (user_id, profile_id, plan_type, plan_days, end_date, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

        try {
            $pdo->beginTransaction();
            $stmt->execute([$user_id, $profile_id, $plan_type, $plan_days, $end_date, $amount, $payment_method, $payment_status]);
            $id = $pdo->lastInsertId();

            // If replacing an old subscription, mark it 'upgraded' and end it today.
            if ($replaces_sub_id) {
                $up = $pdo->prepare("UPDATE subscriptions SET payment_status = 'upgraded', end_date = CURDATE() WHERE id = ? AND user_id = ?");
                $up->execute([$replaces_sub_id, $user_id]);
            }

            if (in_array($payment_status, ['completed', 'active', 'paid', 'success', 'captured'])) {
                processReferralCommission($pdo, $id, $user_id, $plan_type, $amount);
            }
            
            $pdo->commit();
            echo json_encode(['id' => $id, 'user_id' => $user_id, 'profile_id' => $profile_id]);
        }
        catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    else { // PATCH
        $id = $_GET['id'] ?? null;
        $payment_status = $data['payment_status'] ?? null;

        if (!$id || !$payment_status) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id or payment_status', 'received' => $data]);
            exit;
        }

        try {
            $pdo->beginTransaction();
            
            // Get subscription details before update
            $sStmt = $pdo->prepare("SELECT user_id, plan_type, amount FROM subscriptions WHERE id = ?");
            $sStmt->execute([$id]);
            $sub = $sStmt->fetch(PDO::FETCH_ASSOC);

            if (!$sub) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(['error' => 'Subscription not found']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE subscriptions SET payment_status = ? WHERE id = ?");
            $stmt->execute([$payment_status, $id]);

            if (in_array($payment_status, ['completed', 'active', 'paid', 'success', 'captured'])) {
                processReferralCommission($pdo, $id, $sub['user_id'], $sub['plan_type'], $sub['amount']);
            }

            $pdo->commit();
            echo json_encode(['success' => true]);
        }
        catch (PDOException $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
}
?>
