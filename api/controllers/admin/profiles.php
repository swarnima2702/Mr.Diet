<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;
$profile_id = $_GET['id'] ?? null;

// JSON body
if ($method === 'PATCH' || $method === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        $jsonData = json_decode($input, true);
        if ($jsonData && isset($jsonData['admin_id'])) {
            $admin_id = $jsonData['admin_id'];
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
    if ($profile_id) {
        $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = ?");
        $stmt->execute([$profile_id]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("
            SELECT p.*,
                   CASE
                       WHEN s.payment_status = 'completed' AND s.end_date >= CURDATE()
                       THEN s.plan_type
                       ELSE 'Trial'
                   END as active_plan
            FROM profiles p
            LEFT JOIN subscriptions s ON p.user_id = s.user_id
                AND s.payment_status = 'completed'
                AND s.end_date >= CURDATE()
            ORDER BY p.created_at DESC
        ");
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'PATCH') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    unset($data['admin_id'], $data['id']);

    if (!$id || empty($data)) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and data required']);
        exit;
    }

    $setParts = [];
    $values = [];
    foreach ($data as $key => $value) {
        $setParts[] = "$key = ?";
        $values[] = is_array($value) ? json_encode($value) : $value;
    }
    $values[] = $id;

    $sql = "UPDATE profiles SET " . implode(', ', $setParts) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $profile_id = $_GET['id'] ?? null;

    if (!$profile_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Profile ID required']);
        exit;
    }

    // Delete the profile
    $stmt = $pdo->prepare("DELETE FROM profiles WHERE id = ?");
    $stmt->execute([$profile_id]);

    echo json_encode(['success' => true, 'deleted' => $profile_id]);
}
?>
