<?php
require_once __DIR__ . '/../../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin_id = $_GET['admin_id'] ?? null;
$slug = $_GET['slug'] ?? null;

// JSON body
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    if ($input) {
        $jsonData = json_decode($input, true);
        if ($jsonData && isset($jsonData['admin_id'])) {
            $admin_id = $jsonData['admin_id'];
        }
    }
}

// NO admin check for GET (public access)
if ($method === 'GET') {
    if ($slug) {
        $stmt = $pdo->prepare("SELECT * FROM pages WHERE slug = ?");
        $stmt->execute([$slug]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT slug, title FROM pages");
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    // Admin Check
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

    $data = json_decode(file_get_contents('php://input'), true);
    $slug = $data['slug'] ?? '';
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';

    if (!$slug) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug required']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO pages (slug, title, content) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = ?, content = ?");
    $stmt->execute([$slug, $title, $content, $title, $content]);

    echo json_encode(['success' => true]);
}
?>
