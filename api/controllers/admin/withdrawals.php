<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? $_POST['admin_id'] ?? null;

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
    $stmt = $pdo->query("SELECT w.*, u.name, u.email FROM withdrawals w JOIN users u ON w.user_id = u.id ORDER BY w.requested_at DESC");
    echo json_encode($stmt->fetchAll());
} elseif ($method === 'POST') {
    $id = $_POST['id'] ?? null;
    $status = $_POST['status'] ?? null;
    $transaction_id = $_POST['transaction_id'] ?? '';
    $admin_id = $_POST['admin_id'];

    if (!$id || !$status) {
        http_response_code(400);
        echo json_encode(['error' => 'ID and status required']);
        exit;
    }

    // Preserve existing screenshot_url unless a new file is uploaded
    $existing = $pdo->prepare("SELECT screenshot_url FROM withdrawals WHERE id = ?");
    $existing->execute([$id]);
    $screenshot_url = $existing->fetchColumn() ?: '';

    if (isset($_FILES['screenshot']) && !empty($_FILES['screenshot']['tmp_name']) && $_FILES['screenshot']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['screenshot'];
        // Accept common image, document & PDF formats
        $allowed = ['png','jpg','jpeg','gif','webp','heic','heif','bmp','svg','pdf','doc','docx','xls','xlsx','txt'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext === '' || !in_array($ext, $allowed, true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Unsupported file type: .' . $ext . '. Allowed: ' . implode(', ', $allowed)]);
            exit;
        }

        // Use absolute path so this works regardless of working directory
        $uploadDir = realpath(__DIR__ . '/../../') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR;
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0775, true);
        }
        $filename   = 'withdrawal_' . $id . '_' . time() . '.' . $ext;
        $targetPath = $uploadDir . $filename;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $screenshot_url = 'uploads/' . $filename;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save uploaded file. Check folder permissions on uploads/.']);
            exit;
        }
    }

    $stmt = $pdo->prepare("UPDATE withdrawals SET status = ?, transaction_id = ?, screenshot_url = ?, processed_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $transaction_id, $screenshot_url, $id]);

    echo json_encode(['success' => true, 'screenshot_url' => $screenshot_url]);
}
?>
