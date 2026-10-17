<?php
// checkin.php - Save daily specific logs (weight, mood, notes)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once __DIR__ . '/../config/db.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $subscriptionId = $input['subscription_id'] ?? null;
    $dayNumber = $input['day_number'] ?? null;

    // Optional fields
    $weight = $input['weight'] ?? null;
    $mood = $input['mood'] ?? null;
    $notes = $input['notes'] ?? null;

    if (!$subscriptionId || !$dayNumber) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing subscription_id or day_number']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO daily_logs (subscription_id, day_number, weight_log, mood_log, notes) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE weight_log = VALUES(weight_log), mood_log = VALUES(mood_log), notes = VALUES(notes)");

        $stmt->execute([$subscriptionId, $dayNumber, $weight, $mood, $notes]);

        echo json_encode(['success' => true, 'message' => 'Daily log saved successfully']);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}
?>
