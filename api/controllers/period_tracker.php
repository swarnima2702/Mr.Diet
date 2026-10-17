<?php
require_once __DIR__ . '/../config/db.php';

// Action dispatcher
// Global input handling
$jsonInput = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $_POST['action'] ?? $jsonInput['action'] ?? 'logs';
$user_id = $_GET['user_id'] ?? $_POST['user_id'] ?? $jsonInput['user_id'] ?? null;

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required.']);
    exit;
}

// 1. Gender Guard: Period tracking is ONLY for women.
$profileStmt = $pdo->prepare("SELECT gender, cycle_length, period_duration, last_period_start FROM profiles WHERE user_id = ?");
$profileStmt->execute([$user_id]);
$profile = $profileStmt->fetch(PDO::FETCH_ASSOC);

if (!$profile) {
    http_response_code(403);
    echo json_encode(['error' => 'Your health profile is missing. Please complete health metrics first.', 'user_id' => $user_id]);
    exit;
}

$gender = strtolower(trim($profile['gender']));
if ($gender !== 'women' && $gender !== 'female') {
    http_response_code(403);
    echo json_encode([
        'error' => 'Period tracking is only available for female users.',
        'received' => $gender
    ]);
    exit;
}

// 2. Routing Actions
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($action === 'logs') {
            getPeriodLogs($pdo, $user_id);
        } elseif ($action === 'summary') {
            echo json_encode(getCycleSummary($pdo, $user_id, $profile));
        }
        break;

    case 'POST':
        if ($action === 'update_cycle_config') {
            updateCycleConfig($pdo, $user_id);
        } else {
            savePeriodLog($pdo, $user_id);
        }
        break;

    case 'DELETE':
        deletePeriodLog($pdo, $user_id);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
        break;
}

/**
 * Get period logs for a specific month
 */
function getPeriodLogs($pdo, $user_id) {
    $month = $_GET['month'] ?? date('Y-m');
    $stmt = $pdo->prepare("SELECT * FROM period_logs WHERE user_id = ? AND log_date LIKE ?");
    $stmt->execute([$user_id, "$month%"]);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert numeric flags to boolean
    foreach ($logs as &$log) {
        $log['is_period_day'] = (bool)$log['is_period_day'];
        $log['symptoms'] = json_decode($log['symptoms'], true) ?: [];
    }

    echo json_encode($logs);
}

/**
 * Save or update a period log entry
 */
function savePeriodLog($pdo, $user_id) {
    global $jsonInput;
    $data = $jsonInput;
    
    if (!$data || !isset($data['log_date'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data. log_date is required.']);
        return;
    }

    // Get profile_id
    $pStmt = $pdo->prepare("SELECT id FROM profiles WHERE user_id = ?");
    $pStmt->execute([$user_id]);
    $p = $pStmt->fetch();
    $profile_id = $p['id'];

    $is_period_day = isset($data['is_period_day']) ? (int)$data['is_period_day'] : 0;
    $flow_level = $data['flow_level'] ?? null;
    $symptoms = isset($data['symptoms']) ? json_encode($data['symptoms']) : null;
    $mood = $data['mood'] ?? null;
    $notes = $data['notes'] ?? null;

    $stmt = $pdo->prepare("
        INSERT INTO period_logs (user_id, profile_id, log_date, is_period_day, flow_level, symptoms, mood, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            is_period_day = VALUES(is_period_day),
            flow_level = VALUES(flow_level),
            symptoms = VALUES(symptoms),
            mood = VALUES(mood),
            notes = VALUES(notes)
    ");

    try {
        $stmt->execute([$user_id, $profile_id, $data['log_date'], $is_period_day, $flow_level, $symptoms, $mood, $notes]);
        
        // Re-fetch profile to get latest cycle info for summary
        $profileStmt = $pdo->prepare("SELECT gender, cycle_length, period_duration, last_period_start FROM profiles WHERE user_id = ?");
        $profileStmt->execute([$user_id]);
        $newProfile = $profileStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true, 
            'message' => 'Log saved successfully.',
            'summary' => getCycleSummary($pdo, $user_id, $newProfile)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save log: ' . $e->getMessage()]);
    }
}

/**
 * Delete a log entry
 */
function deletePeriodLog($pdo, $user_id) {
    $log_date = $_GET['log_date'] ?? null;
    if (!$log_date) {
        http_response_code(400);
        echo json_encode(['error' => 'log_date is required for deletion.']);
        return;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM period_logs WHERE user_id = ? AND log_date = ?");
        $stmt->execute([$user_id, $log_date]);
        
        // Re-fetch profile to get latest cycle info for summary
        $pStmt = $pdo->prepare("SELECT gender, cycle_length, period_duration, last_period_start FROM profiles WHERE user_id = ?");
        $pStmt->execute([$user_id]);
        $newProfile = $pStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true, 
            'message' => 'Log deleted.',
            'summary' => getCycleSummary($pdo, $user_id, $newProfile)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete log: ' . $e->getMessage()]);
    }
}

/**
 * Update cycle configuration in the profile table
 */
function updateCycleConfig($pdo, $user_id) {
    global $jsonInput;
    $data = $jsonInput;
    
    if (!isset($data['cycle_length']) || !isset($data['period_duration'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Cycle length and period duration are required.']);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE profiles 
        SET cycle_length = ?, period_duration = ?, last_period_start = ?
        WHERE user_id = ?
    ");

    try {
        $stmt->execute([
            $data['cycle_length'], 
            $data['period_duration'], 
            $data['last_period_start'] ?? null, 
            $user_id
        ]);
        
        // Re-fetch profile for latest configuration
        $profileStmt = $pdo->prepare("SELECT gender, cycle_length, period_duration, last_period_start FROM profiles WHERE user_id = ?");
        $profileStmt->execute([$user_id]);
        $newProfile = $profileStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true, 
            'message' => 'Config updated.',
            'summary' => getCycleSummary($pdo, $user_id, $newProfile)
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update config: ' . $e->getMessage()]);
    }
}

/**
 * Get cycle summary and predictions
 */
function getCycleSummary($pdo, $user_id, $profile) {
    $cycle_length = (int)($profile['cycle_length'] ?: 28);
    $period_duration = (int)($profile['period_duration'] ?: 5);
    $last_period_start = $profile['last_period_start'];

    if (!$last_period_start) {
        // Fallback: try to find the most recent is_period_day log
        $stmt = $pdo->prepare("SELECT log_date FROM period_logs WHERE user_id = ? AND is_period_day = 1 ORDER BY log_date DESC LIMIT 1");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        $last_period_start = $row ? $row['log_date'] : null;
    }

    $next_period_date = null;
    $current_cycle_day = null;
    $days_until_next = null;
    $fertile_window_start = null;
    $fertile_window_end = null;
    $ovulation_date = null;
    $current_phase = 'unknown';

    if ($last_period_start) {
        $last_start = new DateTime($last_period_start);
        $today = new DateTime(date('Y-m-d'));
        
        $interval = $last_start->diff($today);
        $days_since_start = (int)$interval->format('%a');
        if ($interval->invert) $days_since_start = -$days_since_start;
        
        // Normalize to current cycle
        $current_cycle_day = ($days_since_start % $cycle_length) + 1;
        if ($current_cycle_day < 1) $current_cycle_day += $cycle_length;
        
        // Next period prediction
        $next_start = clone $last_start;
        $cycles_passed = floor($days_since_start / $cycle_length) + 1;
        $next_start->modify('+' . ($cycles_passed * $cycle_length) . ' days');
        $next_period_date = $next_start->format('Y-m-d');
        
        $days_until_next = (int)$today->diff($next_start)->format('%a');

        // Fertile Window & Ovulation (Standard calculation)
        $ovulation_day = $cycle_length - 14;
        $ov_date = clone $next_start;
        $ov_date->modify('-14 days');
        $ovulation_date = $ov_date->format('Y-m-d');

        $fw_start = clone $ov_date;
        $fw_start->modify('-5 days');
        $fertile_window_start = $fw_start->format('Y-m-d');

        $fw_end = clone $ov_date;
        $fw_end->modify('+1 day');
        $fertile_window_end = $fw_end->format('Y-m-d');

        if ($current_cycle_day <= $period_duration) {
            $current_phase = 'period';
        } elseif ($current_cycle_day < ($ovulation_day - 5)) {
            $current_phase = 'follicular';
        } elseif ($current_cycle_day <= ($ovulation_day + 1)) {
            $current_phase = 'ovulation';
        } else {
            $current_phase = 'luteal';
        }
    }

    // --- Historical Trends Logic ---
    $history = [];
    $stmt = $pdo->prepare("
        SELECT log_date 
        FROM period_logs 
        WHERE user_id = ? AND is_period_day = 1 
        ORDER BY log_date ASC
    ");
    $stmt->execute([$user_id]);
    $allPeriodDays = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($allPeriodDays) > 0) {
        $events = [];
        $currentEventStart = $allPeriodDays[0];
        $lastDay = $allPeriodDays[0];

        for ($i = 1; $i < count($allPeriodDays); $i++) {
            $currentDay = $allPeriodDays[$i];
            $diff = (strtotime($currentDay) - strtotime($lastDay)) / 86400;
            
            // If more than 4 days gap, it's a new period event
            if ($diff > 4) {
                $events[] = $currentEventStart;
                $currentEventStart = $currentDay;
            }
            $lastDay = $currentDay;
        }
        $events[] = $currentEventStart; // Add last event

        // Calculate cycle lengths between starts of period events
        for ($i = 0; $i < count($events) - 1; $i++) {
            $start1 = new DateTime($events[$i]);
            $start2 = new DateTime($events[$i+1]);
            $length = (int)$start1->diff($start2)->format('%a');
            
            // Only add reasonable cycle lengths (20-60 days) to avoid data noise
            if ($length >= 20 && $length <= 60) {
                $history[] = [
                    'month' => $start1->format('M'),
                    'length' => $length,
                    'date' => $events[$i]
                ];
            }
        }
        // Take last 4 cycles
        $history = array_slice($history, -4);
    }

    return [
        'last_period_start' => $last_period_start,
        'next_period_date' => $next_period_date,
        'cycle_length' => $cycle_length,
        'period_duration' => $period_duration,
        'current_cycle_day' => $current_cycle_day,
        'fertile_window_start' => $fertile_window_start,
        'fertile_window_end' => $fertile_window_end,
        'ovulation_date' => $ovulation_date,
        'days_until_next_period' => $days_until_next,
        'current_phase' => $current_phase,
        'history' => $history
    ];
}
