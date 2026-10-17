<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// --- GET: Fetch notification preferences ---
if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id is required']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM notification_preferences WHERE user_id = ?");
    $stmt->execute([$userId]);
    $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$prefs) {
        // Return defaults if no row exists
        echo json_encode([
            'user_id' => (int)$userId,
            'onesignal_player_id' => null,
            'water_reminder_enabled' => false,
            'water_reminder_interval' => 60,
            'water_reminder_start' => '08:00:00',
            'water_reminder_end' => '22:00:00',
            'meal_reminder_enabled' => false,
            'breakfast_time' => '08:00:00',
            'lunch_time' => '12:30:00',
            'dinner_time' => '19:00:00',
            'period_reminder_enabled' => false,
            'period_reminder_days_before' => 2,
            'notifications_paused' => false,
        ]);
        exit;
    }

    // Cast booleans
    $prefs['water_reminder_enabled'] = (bool)$prefs['water_reminder_enabled'];
    $prefs['meal_reminder_enabled'] = (bool)$prefs['meal_reminder_enabled'];
    $prefs['period_reminder_enabled'] = (bool)$prefs['period_reminder_enabled'];
    $prefs['notifications_paused'] = (bool)$prefs['notifications_paused'];

    echo json_encode($prefs);
    exit;
}

// --- POST: Handle various actions ---
if ($method === 'POST') {

    // Register OneSignal device
    if ($action === 'register_device') {
        $userId = $input['user_id'] ?? null;
        $playerId = $input['player_id'] ?? null;

        if (!$userId || !$playerId) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id and player_id are required']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO notification_preferences (user_id, onesignal_player_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE onesignal_player_id = VALUES(onesignal_player_id), updated_at = CURRENT_TIMESTAMP
        ");
        $stmt->execute([$userId, $playerId]);

        echo json_encode(['success' => true, 'message' => 'Device registered']);
        exit;
    }

    // Send test notification
    if ($action === 'send_test') {
        $userId = $input['user_id'] ?? null;
        if (!$userId) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id is required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT onesignal_player_id FROM notification_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || empty($row['onesignal_player_id'])) {
            http_response_code(404);
            echo json_encode(['error' => 'No device registered for this user. Please enable notifications first.']);
            exit;
        }

        $result = sendOneSignalNotification(
            $pdo,
            $row['onesignal_player_id'],
            '✅ Test Notification',
            'Notifications are working! You will receive reminders as configured.',
            'https://mrdietplan.in/dashboard'
        );

        if ($result['success']) {
            echo json_encode(['success' => true, 'message' => 'Test notification sent']);
        } else {
            http_response_code(400); // Bad Request or Configuration Error
            echo json_encode([
                'error' => 'OneSignal Error',
                'details' => $result['error'],
                'code' => $result['code']
            ]);
        }
        exit;
    }

    // Save notification preferences
    $userId = $input['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id is required']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO notification_preferences (
            user_id, water_reminder_enabled, water_reminder_interval,
            water_reminder_start, water_reminder_end,
            meal_reminder_enabled, breakfast_time, lunch_time, dinner_time,
            period_reminder_enabled, period_reminder_days_before,
            notifications_paused
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            water_reminder_enabled = VALUES(water_reminder_enabled),
            water_reminder_interval = VALUES(water_reminder_interval),
            water_reminder_start = VALUES(water_reminder_start),
            water_reminder_end = VALUES(water_reminder_end),
            meal_reminder_enabled = VALUES(meal_reminder_enabled),
            breakfast_time = VALUES(breakfast_time),
            lunch_time = VALUES(lunch_time),
            dinner_time = VALUES(dinner_time),
            period_reminder_enabled = VALUES(period_reminder_enabled),
            period_reminder_days_before = VALUES(period_reminder_days_before),
            notifications_paused = VALUES(notifications_paused),
            updated_at = CURRENT_TIMESTAMP
    ");

    $stmt->execute([
        $userId,
        !empty($input['water_reminder_enabled']) ? 1 : 0,
        $input['water_reminder_interval'] ?? 60,
        $input['water_reminder_start'] ?? '08:00:00',
        $input['water_reminder_end'] ?? '22:00:00',
        !empty($input['meal_reminder_enabled']) ? 1 : 0,
        $input['breakfast_time'] ?? '08:00:00',
        $input['lunch_time'] ?? '12:30:00',
        $input['dinner_time'] ?? '19:00:00',
        !empty($input['period_reminder_enabled']) ? 1 : 0,
        $input['period_reminder_days_before'] ?? 2,
        !empty($input['notifications_paused']) ? 1 : 0,
    ]);

    echo json_encode(['success' => true, 'message' => 'Preferences saved']);
    exit;
}

// --- DELETE: Unregister device ---
if ($method === 'DELETE') {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id is required']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE notification_preferences SET onesignal_player_id = NULL WHERE user_id = ?");
    $stmt->execute([$userId]);

    echo json_encode(['success' => true, 'message' => 'Device unregistered']);
    exit;
}

/**
 * Send a push notification via OneSignal REST API
 * Reads keys from DB settings table
 */
function sendOneSignalNotification($pdo, $playerId, $title, $message, $url = null) {
    $appId = '';
    $apiKey = '';

    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('onesignal_app_id', 'onesignal_rest_api_key')");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        if ($row['setting_key'] === 'onesignal_app_id' && !empty($row['setting_value'])) $appId = $row['setting_value'];
        if ($row['setting_key'] === 'onesignal_rest_api_key' && !empty($row['setting_value'])) $apiKey = $row['setting_value'];
    }

    // Fallback to constants if not in settings table
    if (empty($appId) && defined('ONESIGNAL_APP_ID')) $appId = ONESIGNAL_APP_ID;
    if (empty($apiKey) && defined('ONESIGNAL_REST_API_KEY')) $apiKey = ONESIGNAL_REST_API_KEY;

    if (empty($appId) || empty($apiKey) || strpos($appId, 'YOUR_') === 0) {
        error_log('[Notifications] OneSignal keys not configured');
        return false;
    }

    $data = [
        'app_id' => $appId,
        'include_player_ids' => [$playerId],
        'headings' => ['en' => $title],
        'contents' => ['en' => $message],
    ];

    if ($url) {
        $data['url'] = $url;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://onesignal.com/api/v1/notifications',
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json; charset=utf-8',
            'Authorization: Basic ' . $apiKey,
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    if ($httpCode === 200) {
        return ['success' => true, 'response' => json_decode($response, true)];
    }

    error_log('[Notifications] OneSignal API error code ' . $httpCode . ': ' . $response . ' ' . $curlError);
    return ['success' => false, 'error' => json_decode($response, true) ?: $response, 'code' => $httpCode];
}

// Export the function for use in cron
if (!function_exists('sendOneSignalNotification')) {
    // Already defined above
}
?>
