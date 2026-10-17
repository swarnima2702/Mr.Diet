<?php
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

// Handle CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set('UTC'); // Use UTC consistently

$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch timer for a specific subscription and day
if ($method === 'GET') {
    $subscription_id = $_GET['subscription_id'] ?? null;
    $day_number = $_GET['day_number'] ?? null;

    if (!$subscription_id || !$day_number) {
        echo json_encode(['error' => 'Missing subscription_id or day_number']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM generation_timers WHERE subscription_id = ? AND day_number = ?");
    $stmt->execute([$subscription_id, $day_number]);
    $timer = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($timer) {
        // Append Z so the frontend JS correctly parses this as UTC instead of Local Time
        $timer['unlock_at'] = str_replace(' ', 'T', $timer['unlock_at']) . 'Z';
    }

    echo json_encode(['timer' => $timer ?: null]);
}

// POST: Create or Update a timer
else if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $subscription_id = $input['subscription_id'] ?? null;
    $day_number = $input['day_number'] ?? null;
    $unlock_at = $input['unlock_at'] ?? null; // Expects ISO string or numeric timestamp? 
    // Let's expect numeric timestamp (millis) from JS, convert to MySQL DATETIME

    if (!$subscription_id || !$day_number || !$unlock_at) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    // Convert millis to MySQL format (Y-m-d H:i:s) in UTC
    $seconds = (int) floor(((float) $unlock_at) / 1000);
    $unlock_at_datetime = gmdate('Y-m-d H:i:s', $seconds);

    // Upsert (Insert or Update)
    $sql = "INSERT INTO generation_timers (subscription_id, day_number, unlock_at) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE unlock_at = VALUES(unlock_at)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$subscription_id, $day_number, $unlock_at_datetime]);
        echo json_encode(['success' => true, 'unlock_at' => $unlock_at_datetime]);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// DELETE: Remove a timer (e.g. when unlocked)
else if ($method === 'DELETE') {
    $subscription_id = $_GET['subscription_id'] ?? null;
    $day_number = $_GET['day_number'] ?? null;

    if (!$subscription_id || !$day_number) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing params']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM generation_timers WHERE subscription_id = ? AND day_number = ?");
    $stmt->execute([$subscription_id, $day_number]);
    echo json_encode(['success' => true]);
}
?>
