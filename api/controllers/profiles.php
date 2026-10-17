<?php
require_once __DIR__ . '/../config/db.php';
error_reporting(E_ALL);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? null;
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required']);
        exit;
    }
    // Use simpler join to avoid any ambiguity or missing column errors
    $sql = "SELECT p.*, u.name as u_name, u.email as u_email 
            FROM users u 
            LEFT JOIN profiles p ON u.id = p.user_id 
            WHERE u.id = ?";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($row) {
        // Build the response object carefully
        $res = [];
        $res['id'] = $row['id'] ?? null; // Profile ID
        $res['user_id'] = $user_id; // Core User ID
        
        // Priority 1: Profile Column | Priority 2: User Table | Priority 3: Fallback
        $res['name'] = !empty(trim($row['name'] ?? '')) ? $row['name'] : ($row['u_name'] ?? 'User');
        $res['email'] = !empty(trim($row['email'] ?? '')) ? $row['email'] : ($row['u_email'] ?? '');
        
        // Debugging Info (will hidden in UI but visible in console)
        $res['debug_profile_name'] = $row['name'] ?? 'NULL';
        $res['debug_auth_name'] = $row['u_name'] ?? 'NULL';
        $res['debug_profile_email'] = $row['email'] ?? 'NULL';
        $res['debug_auth_email'] = $row['u_email'] ?? 'NULL';
        
        // Extended Data parsing
        $ext = json_decode($row['extended_data'] ?? '{}', true) ?: [];
        
        // Smarter phone/city extraction
        $res['phone'] = !empty(trim($row['phone'] ?? '')) ? $row['phone'] : ($ext['phone'] ?? $ext['formData']['phone'] ?? '');
        $res['city'] = !empty(trim($row['city'] ?? '')) ? $row['city'] : ($ext['city'] ?? $ext['formData']['city'] ?? '');
        
        // Health metrics
        $res['weight'] = (float)($row['weight'] ?? 0);
        $res['height'] = (float)($row['height'] ?? 0);
        $res['age'] = (int)($row['age'] ?? 0);
        $res['gender'] = $row['gender'] ?? '';
        $res['bmi'] = (float)($row['bmi'] ?? 0);
        $res['goal'] = $row['goal'] ?? '';
        $res['extended_data'] = $ext;
        
        echo json_encode($res);
    }
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Account not found']);
    }
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $user_id = $data['user_id'] ?? null;
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id required for saving data']);
        exit;
    }

    // 1. Fetch Existing Profile to avoid overwriting fields with 0 or null
    $stmt = $pdo->prepare("SELECT * FROM profiles WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

    // 2. Safely merge new data onto the existing data
    $name = !empty($data['name']) ? $data['name'] : ($existing['name'] ?? '');
    
    // Crucial: Fallback to existing profile email, OR fetch from users table if empty to prevent empty email duplicate errors
    $email = !empty($data['email']) ? $data['email'] : ($existing['email'] ?? '');
    if (empty($email) && $user_id) {
        $uStmt = $pdo->prepare("SELECT email FROM users WHERE id = ?");
        $uStmt->execute([$user_id]);
        $email = $uStmt->fetchColumn() ?: '';
    }
    $age = isset($data['age']) ? $data['age'] : ($existing['age'] ?? 0);
    $gender = isset($data['gender']) ? $data['gender'] : ($existing['gender'] ?? '');
    $height = isset($data['height']) ? $data['height'] : ($existing['height'] ?? 0);
    $weight = isset($data['weight']) ? $data['weight'] : ($existing['weight'] ?? 0);
    $goal = isset($data['goal']) ? $data['goal'] : ($existing['goal'] ?? '');
    $activity_level = isset($data['activity_level']) ? $data['activity_level'] : ($existing['activity_level'] ?? '');
    $bmi = isset($data['bmi']) ? $data['bmi'] : ($existing['bmi'] ?? null);

    $dietary_restrictions = isset($data['dietary_restrictions']) 
        ? json_encode($data['dietary_restrictions']) 
        : ($existing['dietary_restrictions'] ?? '[]');
        
    $allergies = isset($data['allergies']) ? $data['allergies'] : ($existing['allergies'] ?? '');
    $meal_preference = isset($data['meal_preference']) ? $data['meal_preference'] : ($existing['meal_preference'] ?? '');

    // 3. Handle extended_data smartly (inject phone and city)
    $extArray = [];
    if (!empty($existing['extended_data'])) {
        $extArray = json_decode($existing['extended_data'], true) ?: [];
    }
    if (isset($data['extended_data'])) {
        $extArray = array_merge($extArray, is_array($data['extended_data']) ? $data['extended_data'] : json_decode($data['extended_data'], true));
    }
    if (isset($data['formData'])) {
        $extArray = array_merge($extArray, is_array($data['formData']) ? $data['formData'] : json_decode($data['formData'], true));
    }
    if (isset($data['phone'])) $extArray['phone'] = $data['phone'];
    if (isset($data['city'])) $extArray['city'] = $data['city'];
    
    $extended_data = json_encode($extArray);

    $sql = "INSERT INTO profiles (user_id, name, email, age, gender, height, weight, goal, activity_level, dietary_restrictions, allergies, meal_preference, extended_data, bmi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name), email = VALUES(email), age = VALUES(age), gender = VALUES(gender),
             height = VALUES(height), weight = VALUES(weight), goal = VALUES(goal), activity_level = VALUES(activity_level),
             dietary_restrictions = VALUES(dietary_restrictions), allergies = VALUES(allergies), meal_preference = VALUES(meal_preference), extended_data = VALUES(extended_data), bmi = VALUES(bmi)";

    $stmt = $pdo->prepare($sql);

    try {
        // Run Profile Update
        $stmt->execute([$user_id, $name, $email, $age, $gender, $height, $weight, $goal, $activity_level, $dietary_restrictions, $allergies, $meal_preference, $extended_data, $bmi]);

        // 4. Mirror critical info to `users` table (like Name and Password updates from Settings Tab)
        $userUpdates = [];
        $userParams = [];
        
        if (isset($data['name'])) {
            $userUpdates[] = "name = ?";
            $userParams[] = $data['name'];
        }
        if (isset($data['email'])) {
            $userUpdates[] = "email = ?";
            $userParams[] = $data['email'];
        }
        if (isset($data['password']) && trim($data['password']) !== '') {
            $userUpdates[] = "password = ?";
            $userParams[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (count($userUpdates) > 0) {
            $userParams[] = $user_id;
            $stmtUser = $pdo->prepare("UPDATE users SET " . implode(", ", $userUpdates) . " WHERE id = ?");
            $stmtUser->execute($userParams);
        }

        // Fetch the actual auto-increment ID to prevent Foreign Key violation on subscriptions row creation
        $idStmt = $pdo->prepare("SELECT id FROM profiles WHERE user_id = ?");
        $idStmt->execute([$user_id]);
        $row = $idStmt->fetch(PDO::FETCH_ASSOC);
        $true_profile_id = $row['id'] ?? $pdo->lastInsertId();

        // Re-fetch the updated profile to return all current fields
        $stmt = $pdo->prepare("SELECT * FROM profiles WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $updatedProfile = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($updatedProfile) {
            $updatedProfile['id'] = $true_profile_id; // Ensure the correct ID is set
            $updatedProfile['dietary_restrictions'] = json_decode($updatedProfile['dietary_restrictions'], true);
            $ext = json_decode($updatedProfile['extended_data'] ?? '{}', true);
            $updatedProfile['extended_data'] = $ext;
            $updatedProfile['phone'] = $ext['phone'] ?? '';
            $updatedProfile['city'] = $ext['city'] ?? '';
            $updatedProfile['message'] = 'Profile updated securely without data loss.';
            echo json_encode($updatedProfile);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to retrieve updated profile.']);
        }
    }
    catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
}
?>
