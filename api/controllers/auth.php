<?php
require_once __DIR__ . '/../config/db.php';

error_reporting(E_ALL);
ini_set('display_errors', 0);

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'verify_google') {
        $credential = $data['credential'] ?? '';

        // Verify the ID token with Google's API
        $url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $credential;
        $response = file_get_contents($url);

        if ($response === FALSE) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid Google Token']);
            exit;
        }

        $payload = json_decode($response, true);

        if (isset($payload['error_description'])) {
            http_response_code(400);
            echo json_encode(['error' => $payload['error_description']]);
            exit;
        }

        $googleId = $payload['sub'];
        $email = $payload['email'];
        $name = $payload['name'];
        $picture = $payload['picture'];

        // Check if user exists by google_id
        $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ?");
        $stmt->execute([$googleId]);
        $user = $stmt->fetch();

        if (!$user) {
            // Check if email exists (link account)
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                // Link account
                $stmt = $pdo->prepare("UPDATE users SET google_id = ? WHERE id = ?");
                $stmt->execute([$googleId, $existingUser['id']]);
                $user = $existingUser;
                $user['google_id'] = $googleId;
            }
            else {
                // Create new user (Google)
                $newCode = strtoupper(substr(md5(uniqid($email, true)), 0, 8));
                $stmt = $pdo->prepare("INSERT INTO users (email, google_id, name, referral_code) VALUES (?, ?, ?, ?)");
                $stmt->execute([$email, $googleId, $name, $newCode]);
                $userId = $pdo->lastInsertId();
                $user = [
                    'id' => $userId,
                    'email' => $email,
                    'name' => $name,
                    'is_new' => true,
                    'is_admin' => 0,
                    'referral_code' => $newCode
                ];
            }
        }

        echo json_encode([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'is_admin' => (int)$user['is_admin'],
                'referral_code' => $user['referral_code']
            ],
            'token' => 'mock_token_' . $user['id']
        ]);

    }
    elseif ($action === 'verify_google_manual') {
        $googleId = $data['google_id'] ?? '';
        $email = $data['email'] ?? '';
        $name = $data['name'] ?? '';

        if (!$googleId || !$email) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data']);
            exit;
        }

        // Check if user exists by google_id
        $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ?");
        $stmt->execute([$googleId]);
        $user = $stmt->fetch();

        if (!$user) {
            // Check if email exists (link account)
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $existingUser = $stmt->fetch();

            if ($existingUser) {
                // Link account
                $stmt = $pdo->prepare("UPDATE users SET google_id = ? WHERE id = ?");
                $stmt->execute([$googleId, $existingUser['id']]);
                $user = $existingUser;
                $user['google_id'] = $googleId;
            }
            else {
                // Create new user (Manual Google Signup)
                $refCode = $data['referral_code'] ?? '';
                $refBy = null;
                if ($refCode) {
                    $rStmt = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
                    $rStmt->execute([$refCode]);
                    $referrer = $rStmt->fetch();
                    if ($referrer) {
                        $refBy = $referrer['id'];
                    } else if (is_numeric($refCode)) {
                        $rStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                        $rStmt->execute([$refCode]);
                        if ($rStmt->fetch()) $refBy = $refCode;
                    }
                }
                $newCode = strtoupper(substr(md5(uniqid($email, true)), 0, 8));

                $stmt = $pdo->prepare("INSERT INTO users (email, google_id, name, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$email, $googleId, $name, $newCode, $refBy]);
                $userId = $pdo->lastInsertId();
                $user = [
                    'id' => $userId,
                    'email' => $email,
                    'name' => $name,
                    'is_new' => true,
                    'is_admin' => 0,
                    'referral_code' => $newCode
                ];
            }
        }

        echo json_encode([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'is_admin' => (int)($user['is_admin'] ?? 0),
                'referral_code' => $user['referral_code']
            ],
            'token' => 'mock_token_' . $user['id']
        ]);

    }
    elseif ($action === 'signup') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';
        $name = $data['data']['name'] ?? ''; // Matching Supabase structure

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            exit;
        }

        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['message' => 'Email already registered']); // Matching Supabase error somewhat
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $referralCode = $data['data']['referral_code'] ?? '';
        $referredBy = null;

        if ($referralCode) {
            // Check if it's a code
            $rStmt = $pdo->prepare("SELECT id FROM users WHERE referral_code = ?");
            $rStmt->execute([$referralCode]);
            $referrer = $rStmt->fetch();
            if ($referrer) {
                $referredBy = $referrer['id'];
            } else if (is_numeric($referralCode)) {
                // Fallback: Check if it's a numeric user ID
                $rStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                $rStmt->execute([$referralCode]);
                if ($rStmt->fetch()) {
                    $referredBy = $referralCode;
                }
            }
        }

        // Generate a new code for THIS user
        $newCode = strtoupper(substr(md5(uniqid($email, true)), 0, 8));

        $stmt = $pdo->prepare("INSERT INTO users (email, password, name, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)");

        try {
            $stmt->execute([$email, $hashedPassword, $name, $newCode, $referredBy]);
            $userId = $pdo->lastInsertId();

            echo json_encode([
                'user' => [
                    'id' => $userId,
                    'email' => $email,
                    'name' => $name,
                    'is_admin' => 0,
                    'referral_code' => $newCode
                ],
                'session' => ['access_token' => 'mock_token_' . $userId] // Mock token
            ]);
        }
        catch (PDOException $e) {
            error_log('Signup database error: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Unable to create account. Please try again later.']);
        }

    }
    elseif ($action === 'login') {
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password required']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            $verify = password_verify($password, $user['password']);
            if ($verify) {
                echo json_encode([
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'name' => $user['name'],
                        'is_admin' => (int)$user['is_admin'],
                        'referral_code' => $user['referral_code']
                    ],
                    'session' => ['access_token' => 'mock_token_' . $user['id']]
                ]);
            }
            else {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid email or password']);
            }
        }
        else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid email or password']);
        }
    }
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Invalid action']);
    }
}
?>
