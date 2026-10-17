<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? $_POST['admin_id'] ?? null;

// JSON body
if ($method === 'POST' || $method === 'PATCH') {
    $input = file_get_contents('php://input');
    if ($input) {
        $jsonData = json_decode($input, true);
        if ($jsonData && isset($jsonData['admin_id'])) {
            $admin_id = $jsonData['admin_id'];
        }
    }
}

// Basic Admin Check
if (!$admin_id) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$stmt = $pdo->prepare("SELECT is_admin FROM users WHERE id = ?");
$stmt->execute([$admin_id]);
$user = $stmt->fetch();

if (!$user || $user['is_admin'] != 1) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settings = $stmt->fetchAll();
    
    $config = [];
    foreach ($settings as $row) {
        $config[$row['setting_key']] = $row['setting_value'];
    }
    
    echo json_encode($config);
} elseif ($method === 'POST') {
    // Handle multipart/form-data for logos
    $postData = $_POST;
    
    // Save each setting
    foreach ($postData as $key => $value) {
        if ($key === 'admin_id') continue;
        
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, $value, $value]);
    }
    
    // Handle File Uploads
    if (!empty($_FILES)) {
        $uploadDir = '../../uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        
        foreach ($_FILES as $key => $file) {
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $key . '_' . time() . '.' . $ext;
            $targetPath = $uploadDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $dbPath = 'uploads/' . $filename;
                $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                $stmt->execute([$key, $dbPath, $dbPath]);
            }
        }
    }
    
    echo json_encode(['success' => true]);
}
?>
