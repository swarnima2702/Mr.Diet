<?php
/**
 * Cron Script: Send Push Reminders via OneSignal
 *
 * Run every 5 minutes:
 *   Frequency: every 5 mins (e.g. every-5 * * * *)
 *   Command: php /path/to/api/cron/send_reminders.php
 *
 * This script checks all users with notifications enabled and sends
 * water, meal, and period reminders at the appropriate times.
 */

require_once __DIR__ . '/../config/db.php';

date_default_timezone_set('Asia/Kolkata');

$log = function ($msg) {
    $ts = date('Y-m-d H:i:s');
    echo "[$ts] $msg\n";
    error_log("[Cron-Reminders] $msg");
};

// Load OneSignal keys from settings table or config constants
function loadOneSignalKeys($pdo) {
    $appId = '';
    $apiKey = '';

    // 1. Try Settings Table
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('onesignal_app_id', 'onesignal_rest_api_key')");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        if ($row['setting_key'] === 'onesignal_app_id' && !empty($row['setting_value'])) $appId = $row['setting_value'];
        if ($row['setting_key'] === 'onesignal_rest_api_key' && !empty($row['setting_value'])) $apiKey = $row['setting_value'];
    }

    // 2. Fallback to Config Constants
    require_once __DIR__ . '/../config/config.php';
    if (empty($appId) && defined('ONESIGNAL_APP_ID')) $appId = ONESIGNAL_APP_ID;
    if (empty($apiKey) && defined('ONESIGNAL_REST_API_KEY')) $apiKey = ONESIGNAL_REST_API_KEY;

    return [$appId, $apiKey];
}

[$appId, $apiKey] = loadOneSignalKeys($pdo);

if (empty($appId) || empty($apiKey)) {
    $log('ABORT: OneSignal keys not configured in admin settings');
    exit(1);
}

if (!function_exists('sendOneSignalNotification')) {
    /**
     * Send a push notification via OneSignal REST API
     */
    function sendOneSignalNotification($appId, $apiKey, $playerId, $title, $message, $url = null) {
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
            CURLOPT_TIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        return $httpCode === 200;
    }
}

// Rest of the file remains the same...
$now = new DateTime();
$currentDate = $now->format('Y-m-d');
$currentTime = $now->format('H:i:00');
$currentMinutes = (int)$now->format('H') * 60 + (int)$now->format('i');

// Fetch all users with notifications enabled
$stmt = $pdo->query("
    SELECT np.*, p.gender, p.cycle_length, p.period_duration, p.last_period_start
    FROM notification_preferences np
    LEFT JOIN profiles p ON p.user_id = np.user_id
    WHERE np.onesignal_player_id IS NOT NULL
      AND np.notifications_paused = 0
");

$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($users)) {
    $log('No users with active notifications found.');
    exit(0);
}

$log('Processing ' . count($users) . ' users...');

foreach ($users as $user) {
    $userId = $user['user_id'];
    $playerId = $user['onesignal_player_id'];

    // --- WATER REMINDER ---
    if ((int)$user['water_reminder_enabled'] === 1) {
        $startMinutes = timeToMinutes($user['water_reminder_start']);
        $endMinutes = timeToMinutes($user['water_reminder_end']);
        $interval = (int)$user['water_reminder_interval'];

        if ($currentMinutes >= $startMinutes && $currentMinutes <= $endMinutes) {
            // Check if current time aligns with the interval
            if ($currentMinutes % $interval === 0) {
                // Check if already sent in this minute today
                if (!isAlreadySent($pdo, $userId, 'water', $currentDate, $currentTime)) {
                    $sent = sendOneSignalNotification(
                        $appId, $apiKey, $playerId,
                        '💧 Water Reminder',
                        'Time to drink a glass of water! Stay hydrated for your health goals.',
                        'https://mrdietplan.in/dashboard'
                    );
                    if ($sent) {
                        logSent($pdo, $userId, 'water', $currentDate, $currentTime);
                        $log("Water reminder sent to user $userId");
                    }
                }
            }
        }
    }

    // --- MEAL REMINDER ---
    if ((int)$user['meal_reminder_enabled'] === 1) {
        $meals = [
            ['time' => $user['breakfast_time'], 'type' => 'breakfast', 'title' => '🍳 Breakfast Time', 'body' => 'Your breakfast is ready! Don\'t skip the most important meal of the day.'],
            ['time' => $user['lunch_time'],     'type' => 'lunch',     'title' => '🥗 Lunch Time',     'body' => 'It\'s lunch time! Check your diet plan for today\'s meal.'],
            ['time' => $user['dinner_time'],    'type' => 'dinner',    'title' => '🍽️ Dinner Time',    'body' => 'Time for a healthy dinner. Follow your meal plan!'],
        ];

        foreach ($meals as $meal) {
            $mealMinutes = timeToMinutes($meal['time']);
            // Send if current time is within 5 minutes before the meal time
            if ($currentMinutes >= ($mealMinutes - 5) && $currentMinutes <= $mealMinutes) {
                if (!isAlreadySent($pdo, $userId, $meal['type'], $currentDate, $meal['time'])) {
                    $sent = sendOneSignalNotification(
                        $appId, $apiKey, $playerId,
                        $meal['title'],
                        $meal['body'],
                        'https://mrdietplan.in/dashboard'
                    );
                    if ($sent) {
                        logSent($pdo, $userId, $meal['type'], $currentDate, $meal['time']);
                        $log("{$meal['type']} reminder sent to user $userId");
                    }
                }
            }
        }
    }

    // --- PERIOD REMINDER (Women only) ---
    if ((int)$user['period_reminder_enabled'] === 1
        && isset($user['gender'])
        && strtolower(trim($user['gender'])) === 'women'
        && !empty($user['last_period_start'])
    ) {
        $cycleLength = (int)($user['cycle_length'] ?? 28);
        $lastPeriod = new DateTime($user['last_period_start']);
        $nextPeriod = clone $lastPeriod;
        $nextPeriod->modify("+{$cycleLength} days");

        $daysUntil = (int)$now->diff($nextPeriod)->days;
        // If next period is in the past (already passed), calculate the upcoming one
        if ($nextPeriod < $now) {
            while ($nextPeriod < $now) {
                $nextPeriod->modify("+{$cycleLength} days");
            }
            $daysUntil = (int)$now->diff($nextPeriod)->days;
        }

        $reminderDays = (int)$user['period_reminder_days_before'];

        if ($daysUntil <= $reminderDays && $daysUntil >= 0) {
            // Send only once per day (check at 9 AM)
            if ((int)$now->format('H') === 9) {
                if (!isAlreadySent($pdo, $userId, 'period', $currentDate, '09:00:00')) {
                    $dayText = $daysUntil === 0 ? 'today' : ($daysUntil === 1 ? 'tomorrow' : "in {$daysUntil} days");
                    $sent = sendOneSignalNotification(
                        $appId, $apiKey, $playerId,
                        '🌸 Period Reminder',
                        "Your period is expected {$dayText}. Stay prepared and take care!",
                        'https://mrdietplan.in/period-tracker'
                    );
                    if ($sent) {
                        logSent($pdo, $userId, 'period', $currentDate, '09:00:00');
                        $log("Period reminder sent to user $userId (expected {$dayText})");
                    }
                }
            }
        }
    }
}

$log('Done.');

// ===================== HELPER FUNCTIONS (same as before) =====================

function timeToMinutes($time) {
    $parts = explode(':', $time);
    return (int)$parts[0] * 60 + (int)$parts[1];
}

function isAlreadySent($pdo, $userId, $type, $date, $time) {
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM notification_logs WHERE user_id = ? AND type = ? AND sent_date = ? AND sent_time = ?"
    );
    $stmt->execute([$userId, $type, $date, $time]);
    return $stmt->fetchColumn() > 0;
}

function logSent($pdo, $userId, $type, $date, $time) {
    $stmt = $pdo->prepare(
        "INSERT INTO notification_logs (user_id, type, sent_date, sent_time) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$userId, $type, $date, $time]);
}
?>