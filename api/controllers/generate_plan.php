<?php

set_time_limit(120);
error_reporting(E_ALL);
ini_set('display_errors', 1);

function logDebug($msg)
{
// error_log(date('[Y-m-d H:i:s] ') . $msg . "\n"); 
}

logDebug("Script started. Method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, Cache-Control, Pragma, Expires");
    header("HTTP/1.1 200 OK");
    exit(0);
}

logDebug("Loading dependencies...");
try {
    require_once __DIR__ . '/../config/db.php';
    require_once __DIR__ . '/../services/openai_service.php';
    logDebug("Dependencies loaded successfully");
}
catch (Throwable $e) {
    logDebug("FATAL ERROR during dependency load: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Backend Dependency Error: ' . $e->getMessage()]);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
$body = $input['body'] ?? $input;

// -------------------------------------------------------
// FEATURE 2: Handle substitute_meal action
// -------------------------------------------------------
$action = $body['action'] ?? '';
if ($action === 'substitute_meal') {
    $subscriptionId = $body['subscription_id'] ?? 0;
    $dayNumber      = $body['day_number']       ?? 1;
    $mealIndex      = $body['meal_index']       ?? 0;
    $userHas        = $body['user_has']         ?? '';
    $targetMacros   = $body['target_macros']    ?? [];

    if (empty($userHas)) {
        http_response_code(400);
        echo json_encode(['error' => 'user_has is required for meal substitution']);
        exit;
    }

    // Call AI for substitution
    $result = generateMealSubstitution($userHas, $targetMacros);

    if (isset($result['error'])) {
        http_response_code(500);
        echo json_encode(['error' => 'Substitution AI Error: ' . $result['error']]);
        exit;
    }

    // Track meal changes in DB (increment meal_changes_count)
    $changesRemaining = 5; // default
    if ($subscriptionId > 0 && $pdo) {
        try {
            // Get current count
            $stmt = $pdo->prepare("SELECT meal_changes_count FROM daily_diet_plans WHERE subscription_id = ? AND day_number = ?");
            $stmt->execute([$subscriptionId, $dayNumber]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $currentCount = $row ? (int)($row['meal_changes_count'] ?? 0) : 0;
            $newCount = $currentCount + 1;
            $changesRemaining = max(0, 5 - $newCount);

            // Update count
            $updateStmt = $pdo->prepare("UPDATE daily_diet_plans SET meal_changes_count = ? WHERE subscription_id = ? AND day_number = ?");
            $updateStmt->execute([$newCount, $subscriptionId, $dayNumber]);
        } catch (Exception $e) {
            logDebug("DB update for meal_changes_count failed: " . $e->getMessage());
        }
    }

    echo json_encode(['meal' => $result, 'changes_remaining' => $changesRemaining]);
    exit;
}

// -------------------------------------------------------
// STANDARD: Generate full meal plan
// -------------------------------------------------------
$userProfile = $body['userProfile'] ?? [];
$dayNumber   = $body['dayNumber']   ?? 1;
$language    = $body['language']    ?? 'English';
$notes       = $body['notes']       ?? '';

// Inject language and notes into userProfile for AI Prompt
$userProfile['language'] = $language;
$userProfile['notes']    = $notes;

logDebug("Processing profile for day $dayNumber");

// Calculate Target Calories
$weight = $userProfile['weight'] ?? 70;
$height = $userProfile['height'] ?? 170;
$age    = $userProfile['age']    ?? 30;

// Normalize height
if ($height < 3)       $height = $height * 100;
else if ($height < 10) $height = $height * 30.48;

$gender   = strtolower($userProfile['gender'] ?? 'male');
$activity = $userProfile['activity_level'] ?? 'moderate';
$goal     = $userProfile['goal'] ?? 'weight-loss';

$bmr = ($gender === 'female' || $gender === 'women')
    ? (10 * $weight) + (6.25 * $height) - (5 * $age) - 161
    : (10 * $weight) + (6.25 * $height) - (5 * $age) + 5;

$multipliers   = ['sedentary' => 1.2, 'light' => 1.375, 'moderate' => 1.55, 'active' => 1.725];
$tdee          = $bmr * ($multipliers[$activity] ?? 1.55);
$targetCalories = ($goal === 'weight-loss') ? $tdee - 500 : (($goal === 'muscle-gain') ? $tdee + 300 : $tdee);
$targetCalories = round($targetCalories);
$userProfile['target_calories'] = $targetCalories;

// -------------------------------------------------------
// FEATURE 5: Inject Period Phase for Women
// -------------------------------------------------------
$userId = $userProfile['user_id'] ?? $userProfile['id'] ?? null;
if (($gender === 'women' || $gender === 'female') && $userId && $pdo) {
    try {
        $stmt = $pdo->prepare("SELECT cycle_length, period_duration, last_period_start FROM profiles WHERE user_id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $periodData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($periodData && !empty($periodData['last_period_start'])) {
            $lastStart   = new DateTime($periodData['last_period_start']);
            $today       = new DateTime();
            $cycleLength = (int)($periodData['cycle_length']    ?? 28);
            $periodDur   = (int)($periodData['period_duration'] ?? 5);

            // Calculate cycle day
            $daysSinceLast = (int)$today->diff($lastStart)->days;
            $cycleDay = ($daysSinceLast % $cycleLength) + 1;

            // Determine phase
            if ($cycleDay <= $periodDur) {
                $phase = 'period';
            } elseif ($cycleDay <= 13) {
                $phase = 'follicular';
            } elseif ($cycleDay <= 16) {
                $phase = 'ovulation';
            } else {
                $phase = 'luteal';
            }

            $daysUntilNext = $cycleLength - $cycleDay;

            $userProfile['period_phase']           = $phase;
            $userProfile['cycle_day']              = $cycleDay;
            $userProfile['cycle_length']           = $cycleLength;
            $userProfile['days_until_next_period'] = $daysUntilNext;
        }
    } catch (Exception $e) {
        logDebug("Period data fetch failed: " . $e->getMessage());
    }
}

// AI Generation
$pastMeals = [];
$subscriptionId = $body['subscription_id'] ?? 0;
if ($subscriptionId > 0 && $pdo) {
    try {
        // Last 7 days of meals from this subscription — to avoid repetition
        $stmt = $pdo->prepare(
            "SELECT day_number, meal_json FROM daily_diet_plans
             WHERE subscription_id = ? AND day_number < ?
             ORDER BY day_number DESC LIMIT 7"
        );
        $stmt->execute([$subscriptionId, $dayNumber]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $plan = json_decode($row['meal_json'], true);
            if (!$plan || empty($plan['timeline'])) continue;
            foreach ($plan['timeline'] as $slot) {
                if (!empty($slot['option_1']['name'])) $pastMeals[] = $slot['option_1']['name'];
                if (!empty($slot['option_2']['name'])) $pastMeals[] = $slot['option_2']['name'];
                if (!empty($slot['name']) && empty($slot['option_1'])) $pastMeals[] = $slot['name'];
            }
        }
        $pastMeals = array_values(array_unique(array_filter($pastMeals)));
    } catch (Exception $e) {
        logDebug("pastMeals fetch failed: " . $e->getMessage());
    }
}
$planType  = $body['planType'] ?? 'starter';
$aiResponse = generateMealPlanAI($userProfile, $dayNumber, $pastMeals, $planType);

if ($aiResponse && !isset($aiResponse['error'])) {
    $mealPlan = $aiResponse;
} else {
    http_response_code(500);
    echo json_encode(['error' => 'AI Generation Failed: ' . ($aiResponse['error'] ?? 'Unknown')]);
    exit;
}

if (!$mealPlan) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to generate AI meal plan']);
    exit;
}

echo json_encode(['mealPlan' => $mealPlan]);
?>
