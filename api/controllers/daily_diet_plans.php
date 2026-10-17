<?php
require_once __DIR__ . '/../config/db.php';
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(0);
ini_set('display_errors', 0);

function logDebug($msg)
{
// Disabled for production
}

$method = $_SERVER['REQUEST_METHOD'];
logDebug("Method: $method");

// Handle GET requests (Fetch plans)
if ($method === 'GET') {
    $subscription_id = $_GET['subscription_id'] ?? null;

    if (!$subscription_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing subscription_id']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM daily_diet_plans WHERE subscription_id = ? ORDER BY day_number ASC");
    $stmt->execute([$subscription_id]);
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode JSON meal_json for frontend and map to meal_plan
    foreach ($plans as &$plan) {
        if (!empty($plan['meal_json'])) {
            $plan['meal_plan'] = json_decode($plan['meal_json']);
        }
        else {
            $plan['meal_plan'] = null;
        }
        // Remove raw json column to avoid confusion
        unset($plan['meal_json']);

        $plan['is_unlocked'] = (bool)$plan['is_unlocked'];
    }

    echo json_encode($plans);
}

// Handle POST requests (Insert new plans)
else if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Assume it's an array of plans for bulk insert
    if (!is_array($data) || empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data format']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO daily_diet_plans (subscription_id, day_number, plan_date, is_unlocked, user_name) VALUES (?, ?, ?, ?, ?)");

        foreach ($data as $row) {
            $stmt->execute([
                $row['subscription_id'],
                $row['day_number'],
                $row['plan_date'],
                $row['is_unlocked'] ? 1 : 0,
                $row['user_name'] ?? 'Unknown'
            ]);
        }
        $pdo->commit();
        echo json_encode(['message' => 'Plans created successfully']);
    }
    catch (PDOException $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

// Handle PATCH/PUT requests (Update/Unlock plan)
else if ($method === 'PATCH' || $method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $subscription_id = $_GET['subscription_id'] ?? null;
    $day_number = $_GET['day_number'] ?? null;

    if (!$subscription_id || !$day_number) {
        logDebug("Error: Missing identifiers. sub=$subscription_id, day=$day_number");
        http_response_code(400);
        echo json_encode(['error' => 'Missing identifiers']);
        exit;
    }
    logDebug("Updating plan for sub=$subscription_id, day=$day_number");

    $meal_plan = isset($data['meal_plan']) ? json_encode($data['meal_plan']) : null;
    $is_unlocked = isset($data['is_unlocked']) ? ($data['is_unlocked'] ? 1 : 0) : null;
    $unlocked_at = $data['unlocked_at'] ?? null;

    // Dynamic update query
    $fields = [];
    $params = [];

    if (isset($data['meal_plan'])) {
        // Use correct column name 'meal_json'
        $fields[] = "meal_json = ?";
        $params[] = $meal_plan;
    }
    if ($is_unlocked !== null) {
        $fields[] = "is_unlocked = ?";
        $params[] = $is_unlocked;
    }
    if ($unlocked_at !== null) {
        $fields[] = "unlocked_at = ?";
        $params[] = $unlocked_at;
    }

    if (empty($fields)) {
        echo json_encode(['message' => 'No changes']);
        exit;
    }

    $params[] = $subscription_id;
    $params[] = $day_number;

    $sql = "UPDATE daily_diet_plans SET " . implode(', ', $fields) . " WHERE subscription_id = ? AND day_number = ?";
    $stmt = $pdo->prepare($sql);

    try {
        $stmt->execute($params);
        echo json_encode(['message' => 'Updated successfully']);
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
