<?php
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$user_id = $_GET['user_id'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $action;
    $user_id = $input['user_id'] ?? $user_id;
}

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["error" => "user_id is required"]);
    exit;
}

try {

    switch ($action) {
        case 'stats':
            // --- SELF-HEALING REFERRAL ENGINE ---
            // Automatically find and fix any missing commissions for this user's referrals 
            // even if they were manually updated in the database.
            try {
                $checkStmt = $pdo->prepare("
                    SELECT s.id as subscription_id, s.user_id as referee_id, s.plan_type, s.amount
                    FROM subscriptions s
                    JOIN users u ON s.user_id = u.id
                    WHERE u.referred_by = ? 
                    AND s.payment_status IN ('completed', 'active', 'paid', 'success', 'captured')
                    AND NOT EXISTS (SELECT 1 FROM referral_earnings re WHERE re.subscription_id = s.id)
                ");
                $checkStmt->execute([$user_id]);
                $missingEarnings = $checkStmt->fetchAll(PDO::FETCH_ASSOC);

                if (count($missingEarnings) > 0) {
                    // Fetch settings once
                    $setStmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'referral%'");
                    $settings = $setStmt->fetchAll(PDO::FETCH_KEY_PAIR);

                    foreach ($missingEarnings as $me) {
                        $pType = strtolower($me['plan_type']);
                        if (strpos($pType, 'daily') !== false) $v = (float)($settings['referralCommissionDaily'] ?? 0);
                        elseif (strpos($pType, 'weekly') !== false) $v = (float)($settings['referralCommissionWeekly'] ?? 0);
                        elseif (strpos($pType, 'monthly') !== false) $v = (float)($settings['referralCommissionMonthly'] ?? 0);
                        else $v = (float)($settings['referralCommissionWeekly'] ?? 50);

                        $comm = (($settings['referralCommissionType'] ?? 'fixed') === 'percentage') 
                            ? ($me['amount'] * $v) / 100 
                            : $v;

                        if ($comm > 0) {
                            $pdo->prepare("INSERT INTO referral_earnings (user_id, referred_user_id, subscription_id, amount, status, created_at) VALUES (?, ?, ?, ?, 'pending', NOW())")
                                ->execute([$user_id, $me['referee_id'], $me['subscription_id'], $comm]);
                        }
                    }
                }
            } catch (Exception $e) {
                // Silently fail diagnostic check to prevent breaking the main stats fetch
            }
            // ------------------------------------

            // 1. Get user's referral code
            $stmt = $pdo->prepare("SELECT referral_code FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $referral_code = $stmt->fetch(PDO::FETCH_ASSOC)['referral_code'] ?? $user_id;

            // 2. Get referral stats
            $stmt = $pdo->prepare("SELECT COUNT(*) as referrals FROM users WHERE referred_by = ?");
            $stmt->execute([$user_id]);
            $total_referrals = (int)$stmt->fetch(PDO::FETCH_ASSOC)['referrals'] ?? 0;

            // Total earnings
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM referral_earnings WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $total_earned = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            // Total paid out (approved/processed)
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as paid FROM withdrawals WHERE user_id = ? AND status = 'approved'");
            $stmt->execute([$user_id]);
            $total_withdrawn = $stmt->fetch(PDO::FETCH_ASSOC)['paid'] ?? 0;

            // Pending withdrawal
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as pending FROM withdrawals WHERE user_id = ? AND status = 'pending'");
            $stmt->execute([$user_id]);
            $pending_withdrawal = $stmt->fetch(PDO::FETCH_ASSOC)['pending'] ?? 0;

            // 3. Recent earnings
            $stmt = $pdo->prepare("
                SELECT re.id, re.amount, re.description, re.created_at, 
                       u.name as referred_user_name, 
                       COALESCE(u.name, adm.name) as user_name,
                       re.adjusted_by_admin_id,
                       re.is_admin_adjustment,
                       re.referred_user_id
                FROM referral_earnings re
                LEFT JOIN users u ON re.referred_user_id = u.id
                LEFT JOIN users adm ON re.adjusted_by_admin_id = adm.id
                WHERE re.user_id = ?
                ORDER BY re.created_at DESC
                LIMIT 10
            ");
            $stmt->execute([$user_id]);
            $recentEarnings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 4. Payout history
            $stmt = $pdo->prepare("
                SELECT id, amount, status, transaction_id, requested_at, screenshot_url
                FROM withdrawals 
                WHERE user_id = ? 
                ORDER BY requested_at DESC 
                LIMIT 20
            ");
            $stmt->execute([$user_id]);
            $withdrawalHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 5. Referred Users List
            $stmt = $pdo->prepare("
                SELECT u.id, u.name, u.name as user_name, u.email, u.created_at, 
                       re.amount as earning_amount, re.amount as commission_amount
                FROM users u 
                LEFT JOIN referral_earnings re ON re.referred_user_id = u.id AND re.user_id = ?
                WHERE u.referred_by = ? 
                ORDER BY u.created_at DESC 
                LIMIT 50
            ");
            $stmt->execute([$user_id, $user_id]);
            $referredUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $balance = $total_earned - $total_withdrawn - $pending_withdrawal;

            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'minWithdrawalAmount'");
            $stmt->execute();
            $minPayout = $stmt->fetchColumn() ?: 100;

            echo json_encode([
                // New format
                "referral_code" => $referral_code,
                "stats" => [
                    "total_referrals" => $total_referrals,
                    "total_earned" => number_format($total_earned, 2, '.', ''),
                    "total_withdrawn" => number_format($total_withdrawn, 2, '.', ''),
                    "pending_withdrawal" => number_format($pending_withdrawal, 2, '.', ''),
                    "min_payout" => $minPayout
                ],
                "recentEarnings" => $recentEarnings,
                "withdrawalHistory" => $withdrawalHistory,
                "referredUsers" => $referredUsers,

                // Legacy format compatibility
                "referrals" => $total_referrals, // count for PartnerProgram.tsx
                "referrals_list" => $referredUsers, // list for PartnerProgram.tsx
                "earnings" => $recentEarnings, // list for PartnerProgram.tsx
                "payouts" => $withdrawalHistory, // list for PartnerProgram.tsx
                "total_pay" => number_format($total_earned, 2, '.', ''),
                "balance" => number_format($balance, 2, '.', ''),
                "min_payout" => $minPayout
            ]);
            break;

        case 'payout_request':
            $amount = $input['amount'] ?? 0;
            
            $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'minWithdrawalAmount'");
            $stmt->execute();
            $minPayout = (float)($stmt->fetchColumn() ?: 100);

            if ($amount < $minPayout) {
                http_response_code(400);
                echo json_encode(["error" => "Minimum payout is ₹$minPayout"]);
                exit;
            }

            // Calculate balance
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM referral_earnings WHERE user_id = ?");
            $stmt->execute([$user_id]);
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) as paid FROM withdrawals WHERE user_id = ? AND status IN ('processed', 'pending')");
            $stmt->execute([$user_id]);
            $committed = $stmt->fetch(PDO::FETCH_ASSOC)['paid'];

            $balance = $total - $committed;

            if ($amount > $balance) {
                http_response_code(400);
                echo json_encode(["error" => "Insufficient balance"]);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO withdrawals (user_id, amount, status, requested_at) VALUES (?, ?, 'pending', NOW())");
            $stmt->execute([$user_id, $amount]);

            echo json_encode(["success" => true, "message" => "Payout request submitted"]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["error" => "Invalid action"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
