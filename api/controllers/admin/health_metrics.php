<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;
$profile_id = $_GET['profile_id'] ?? null;

// JSON body
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        $jsonData = json_decode($input, true);
        if ($jsonData && isset($jsonData['admin_id'])) {
            $admin_id = $jsonData['admin_id'];
            $profile_id = $jsonData['profile_id'];
        }
    }
}

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
    if (!$profile_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Profile ID required']);
        exit;
    }
    // Return most recent metrics for this profile
    $stmt = $pdo->prepare("SELECT * FROM health_metrics WHERE profile_id = ? ORDER BY last_updated DESC LIMIT 1");
    $stmt->execute([$profile_id]);
    $metrics = $stmt->fetch();
    echo json_encode($metrics ?: null);
} elseif ($method === 'POST') {
    $data = $jsonData; // Already decoded top level
    $profileId = $data['profile_id'] ?? null;
    $bmi = $data['bmi'] ?? 0;
    $targetCalories = $data['target_calories'] ?? 0;
    $notes = $data['notes'] ?? '';

    if (!$profileId) {
        http_response_code(400);
        echo json_encode(['error' => 'Profile ID required']);
        exit;
    }

    // Insert as new history entry
    $stmt = $pdo->prepare("INSERT INTO health_metrics (profile_id, bmi, target_calories, notes, updated_by_admin, last_updated) VALUES (?, ?, ?, ?, 1, NOW())");
    $stmt->execute([$profileId, $bmi, $targetCalories, $notes]);

    echo json_encode(['success' => true]);
}


?>
