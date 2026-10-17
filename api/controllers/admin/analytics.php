<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;

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

if ($method === 'GET') {
    try {
        // --- BASIC STATS ---
        $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $totalProfiles = $pdo->query("SELECT COUNT(*) FROM profiles")->fetchColumn();
        
        // --- FINANCIAL STATS ---
        $totalRevenue = (float)($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM subscriptions WHERE payment_status IN ('completed', 'SUCCESS')")->fetchColumn() ?: 0);
        $pendingPaymentsCount = (int)$pdo->query("SELECT COUNT(*) FROM subscriptions WHERE payment_status = 'pending'")->fetchColumn();
        
        $revenueToday = (float)($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM subscriptions WHERE payment_status IN ('completed', 'SUCCESS') AND DATE(start_date) = CURDATE()")->fetchColumn() ?: 0);

        $activeSubscriptions = (int)$pdo->query("SELECT COUNT(*) FROM subscriptions WHERE payment_status IN ('completed', 'SUCCESS') AND end_date >= CURDATE()")->fetchColumn();

        // --- Monthly Recurring Revenue (Only for monthly duration plans) ---
        // We define monthly plans as having plan_days >= 28 to exclude weekly/daily trials
        $mrr = (float)($pdo->query("
            SELECT COALESCE(SUM(amount), 0) 
            FROM subscriptions 
            WHERE payment_status IN ('completed', 'SUCCESS') 
            AND plan_days >= 28 
            AND end_date >= CURDATE()
        ")->fetchColumn() ?: 0);

        // --- REFERRAL & WALLET STATS ---
        $totalReferralEarned = (float)($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM referral_earnings")->fetchColumn() ?: 0);
        $pendingWithdrawalsCount = (int)($pdo->query("SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'")->fetchColumn() ?: 0);
        $pendingWithdrawalsAmount = (float)($pdo->query("SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'pending'")->fetchColumn() ?: 0);
        
        // --- HISTORY & TRENDS ---
        $revenueHistory = $pdo->query("
            SELECT DATE_FORMAT(start_date, '%b %Y') as month, SUM(amount) as revenue 
            FROM subscriptions 
            WHERE payment_status IN ('completed', 'SUCCESS') AND start_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month 
            ORDER BY start_date ASC
        ")->fetchAll();

        // --- RECENT ITEMS ---
        $recentTransactions = $pdo->query("
            SELECT s.*, u.name, u.email 
            FROM subscriptions s 
            JOIN users u ON s.user_id = u.id 
            ORDER BY s.start_date DESC 
            LIMIT 10
        ")->fetchAll();

        // --- CHART DATA ---
        $growthChart = $pdo->query("
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY date
            ORDER BY date ASC
        ")->fetchAll();

        $revenueChart = $pdo->query("
            SELECT DATE(start_date) as date, SUM(amount) as amount
            FROM subscriptions
            WHERE payment_status IN ('completed', 'SUCCESS') AND start_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY date
            ORDER BY date ASC
        ")->fetchAll();

        echo json_encode([
            'stats' => [
                'totalUsers' => (int)$totalUsers,
                'totalProfiles' => (int)$totalProfiles,
                'totalRevenue' => $totalRevenue,
                'mrr' => $mrr,
                'pendingPayments' => (int)$pendingPaymentsCount,
                'revenueToday' => $revenueToday,
                'activeSubscriptions' => $activeSubscriptions,
                'totalReferralPayout' => $totalReferralEarned,
                'pendingWithdrawalsCount' => $pendingWithdrawalsCount,
                'pendingWithdrawalsAmount' => $pendingWithdrawalsAmount,
                'conversionRate' => $totalProfiles > 0 ? round(($activeSubscriptions / $totalProfiles) * 100, 1) : 0
            ],
            'recentTransactions' => $recentTransactions,
            'growthChart' => $growthChart,
            'revenueChart' => $revenueChart,
            'revenueHistory' => $revenueHistory
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
