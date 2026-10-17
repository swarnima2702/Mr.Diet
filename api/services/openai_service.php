<?php
// AI provider service. The filename is retained for backwards compatibility.

require_once __DIR__ . '/../config/config.php';

function getAIConfiguration()
{
    global $pdo;

    $config = [
        'provider'       => strtolower(trim((string)(getenv('AI_PROVIDER') ?: 'openai'))),
        'openai_api_key' => trim((string)(getenv('OPENAI_API_KEY') ?: (defined('OPENAI_API_KEY') ? OPENAI_API_KEY : ''))),
        'openai_model'   => trim((string)(getenv('OPENAI_MODEL') ?: 'gpt-4o-mini')),
        'openai_base_url'=> rtrim((string)(getenv('OPENAI_BASE_URL') ?: 'https://api.openai.com/v1'), '/'),
        'gemini_api_key' => trim((string)(getenv('GEMINI_API_KEY') ?: (defined('GEMINI_API_KEY') ? GEMINI_API_KEY : ''))),
        'gemini_model'   => trim((string)(getenv('GEMINI_MODEL') ?: 'gemini-2.5-flash')),
        'gemini_base_url'=> rtrim((string)(getenv('GEMINI_BASE_URL') ?: 'https://generativelanguage.googleapis.com/v1beta'), '/'),
    ];

    if (isset($pdo) && $pdo instanceof PDO) {
        try {
            $keys = ['ai_provider', 'openai_api_key', 'openai_model', 'gemini_api_key', 'gemini_model'];
            $placeholders = implode(',', array_fill(0, count($keys), '?'));
            $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ($placeholders)");
            $stmt->execute($keys);
            foreach ($stmt->fetchAll() as $row) {
                $value = trim((string)$row['setting_value']);
                if ($value === '') continue;
                $key = $row['setting_key'] === 'ai_provider' ? 'provider' : $row['setting_key'];
                $config[$key] = $value;
            }
        } catch (Throwable $e) {
            error_log('Unable to load AI settings: ' . $e->getMessage());
        }
    }

    $config['provider'] = strtolower(trim((string)$config['provider']));
    if (!in_array($config['provider'], ['openai', 'gemini'], true)) {
        $config['provider'] = 'openai';
    }

    return $config;
}

function decodeAIJsonContent($content)
{
    if (!is_string($content) || trim($content) === '') return null;

    $parsed = json_decode($content, true);
    if (is_array($parsed)) return $parsed;

    $jsonStart = strpos($content, '{');
    $jsonEnd = strrpos($content, '}');
    if ($jsonStart !== false && $jsonEnd !== false && $jsonEnd >= $jsonStart) {
        $parsed = json_decode(substr($content, $jsonStart, $jsonEnd - $jsonStart + 1), true);
        if (is_array($parsed)) return $parsed;
    }

    return null;
}

function postAIJson($url, $payload, $headers, $timeout)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);

    $raw = curl_exec($ch);
    $curlError = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($raw === false) {
        error_log('AI provider connection failed: ' . $curlError);
        return ['error' => 'AI provider connection failed. Please try again later.'];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        error_log("AI provider returned invalid JSON (HTTP $status)");
        return ['error' => 'AI provider returned an invalid response.'];
    }

    if ($status < 200 || $status >= 300) {
        $message = $decoded['error']['message'] ?? $decoded['message'] ?? "HTTP $status";
        error_log('AI provider error: ' . $message);
        return ['error' => 'AI provider request failed: ' . $message];
    }

    return ['response' => $decoded];
}

function requestAIJson($systemPrompt, $userPrompt, $temperature = 0.7, $timeout = 120)
{
    $config = getAIConfiguration();

    if ($config['provider'] === 'gemini') {
        if ($config['gemini_api_key'] === '' || $config['gemini_api_key'] === 'YOUR_GEMINI_KEY_HERE') {
            return ['error' => 'Server Configuration Error: Gemini API Key Missing'];
        }

        $model = preg_replace('/[^a-zA-Z0-9._-]/', '', $config['gemini_model']) ?: 'gemini-2.5-flash';
        $url = $config['gemini_base_url'] . "/models/{$model}:generateContent";
        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemPrompt]],
            ],
            'contents' => [[
                'role' => 'user',
                'parts' => [['text' => $userPrompt]],
            ]],
            'generationConfig' => [
                'temperature' => (float)$temperature,
                'responseMimeType' => 'application/json',
            ],
        ];

        $result = postAIJson($url, $payload, [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $config['gemini_api_key'],
        ], $timeout);
        if (isset($result['error'])) return $result;

        $parts = $result['response']['candidates'][0]['content']['parts'] ?? [];
        $content = '';
        foreach ($parts as $part) {
            if (isset($part['text'])) $content .= $part['text'];
        }
        $parsed = decodeAIJsonContent($content);
        return $parsed ?: ['error' => 'Failed to parse Gemini JSON response'];
    }

    if ($config['openai_api_key'] === '' || $config['openai_api_key'] === 'YOUR_OPENAI_KEY_HERE') {
        return ['error' => 'Server Configuration Error: OpenAI API Key Missing'];
    }

    $payload = [
        'model' => $config['openai_model'] ?: 'gpt-4o-mini',
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ],
        'temperature' => (float)$temperature,
        'response_format' => ['type' => 'json_object'],
    ];

    $result = postAIJson($config['openai_base_url'] . '/chat/completions', $payload, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $config['openai_api_key'],
    ], $timeout);
    if (isset($result['error'])) return $result;

    $content = $result['response']['choices'][0]['message']['content'] ?? '';
    $parsed = decodeAIJsonContent($content);
    return $parsed ?: ['error' => 'Failed to parse OpenAI JSON response'];
}

function generateMealPlanAI($userProfile, $dayNumber, $pastMeals = [], $planType = 'starter')
{
    $language = $userProfile['language'] ?? 'English';

    // =========================================================
    // PROFILE EXTRACTION
    // =========================================================
    $userGoal       = $userProfile['goal']           ?? 'General Fitness';
    $targetCalories = $userProfile['target_calories'] ?? 2000;
    $gender         = $userProfile['gender']          ?? 'male';
    $age            = $userProfile['age']             ?? 30;
    $weight         = $userProfile['weight']          ?? 70;
    $height         = $userProfile['height']          ?? 170;
    $activityLevel  = $userProfile['activity_level']  ?? 'moderate';
    $allergies      = $userProfile['allergies']       ?? '';
    $notes          = $userProfile['notes']           ?? '';
    $userName       = $userProfile['name']            ?? 'the client';

    // Extended data
    $extData             = $userProfile['extended_data'] ?? [];
    $dietType            = $extData['dietType']            ?? [];
    $foodsDislike        = $extData['foodsDislike']        ?? '';
    $specialInstructions = $extData['specialInstructions'] ?? '';
    $expectedWeight      = $extData['expectedWeight']      ?? null;
    $medicalConditions   = $extData['medicalConditions']   ?? $extData['medicalHistory']   ?? '';
    $bloodGroup          = $extData['bloodGroup']          ?? '';
    $sleepHours          = $extData['sleepHours']          ?? '';
    $stressLevel         = $extData['stressLevel']         ?? '';
    $waterIntake         = $extData['waterIntake']         ?? '';
    $location            = $extData['location']            ?? $userProfile['city'] ?? $userProfile['state'] ?? '';

    // Dietary restrictions
    $dietaryRestrictions = [];
    if (!empty($userProfile['dietary_restrictions'])) {
        $dr = $userProfile['dietary_restrictions'];
        $dietaryRestrictions = is_array($dr) ? $dr : [$dr];
    }

    // Determine Indian season based on current month for location-specific adjustments
    $month = (int)date('n');
    if ($month >= 3 && $month <= 5)       $season = 'Summer (Garmi ka Mausam)';
    elseif ($month >= 6 && $month <= 9)   $season = 'Monsoon (Barish ka Mausam)';
    elseif ($month >= 10 && $month <= 11) $season = 'Autumn/Post-Monsoon';
    else                                   $season = 'Winter (Sardi ka Mausam)';

    // Daily cuisine rotation — rotates regional focus each day to ensure variety
    $cuisineRotation = [
        'North Indian (Punjabi/UP/Delhi — dal makhani, rajma, chole, paneer dishes, roti, paratha, kadhi-chawal)',
        'South Indian (Tamil/Kerala/Karnataka/Andhra — idli, dosa, uttapam, sambar, rasam, curd rice, appam, pongal, upma)',
        'Bengali (machher jhol if non-veg, shukto, luchi-aloor dom, posto, mishti doi, cholar dal)',
        'Gujarati (dhokla, thepla, undhiyu, khichdi-kadhi, fafda, handvo, khaman, methi muthia)',
        'Maharashtrian (poha, thalipeeth, misal pav, varan-bhaat, sabudana khichdi, puran poli, zunka bhakri)',
        'Rajasthani/Marwari (dal-baati-churma, gatte ki sabzi, ker sangri, bajra roti, pyaaz kachori, bessan gatta)',
        'Mixed Pan-Indian Fusion (lighter, modern combinations — quinoa pulao, paneer wraps, ragi cheela, oats khichdi)',
    ];
    $cuisineFocus = $cuisineRotation[((int)$dayNumber - 1) % count($cuisineRotation)];

    // Weight goal context
    $weightGoalText = '';
    if ($expectedWeight && $expectedWeight != $weight) {
        $diff = abs($weight - $expectedWeight);
        $dir  = $weight > $expectedWeight ? "lose $diff kg" : "gain $diff kg";
        $weightGoalText = "Target: $dir to reach {$expectedWeight}kg goal weight.";
    }

    // =========================================================
    // SYSTEM PROMPT — Ultra-strict JSON enforcer
    // =========================================================
    $systemPrompt = <<<SYSTEM
You are an ultra-precise Indian Clinical Nutritionist & Meal Plan JSON API.

ABSOLUTE OUTPUT RULES (violation = failure):
1. Return ONLY a single valid JSON object. No markdown, no code fences, no explanation text outside JSON.
2. ALL macro values (calories, protein, carbs, fat, fiber) MUST be RAW NUMBERS — no units, no strings.
3. 'benefits' field MUST ALWAYS be an ARRAY of strings (never a single string).
4. 'preparation_steps' MUST ALWAYS be an ARRAY of strings.
5. 'ingredients' MUST ALWAYS be an ARRAY of strings where each item includes a precise quantity (e.g., "150g paneer", "2 medium roti", "1 cup cooked dal").
6. 'water_intake' MUST be a detailed object with keys: total_liters, schedule (array), tips (array).
7. NO emojis anywhere in the JSON.
8. Verify calorie math BEFORE outputting. All meal calories summed MUST equal the target within ±30 kcal.
SYSTEM;

    // =========================================================
    // USER PROMPT — Highly detailed, context-driven
    // =========================================================
    $prompt  = "Generate an evidence-based, highly personalized Daily Diet Plan for Day {$dayNumber} for the following client.\n";
    $prompt .= "MANDATORY LANGUAGE: All textual fields (day_title, day_summary, ingredient names, preparation_steps, benefits, daily_dos, daily_donts) MUST be written in '{$language}'.\n\n";

    // --- FULL CLIENT PROFILE ---
    $prompt .= "=== COMPLETE CLIENT PROFILE ===\n";
    $prompt .= "Name: {$userName} | Age: {$age} | Gender: {$gender} | Weight: {$weight}kg | Height: {$height}cm\n";
    $prompt .= "Primary Goal: {$userGoal}" . ($weightGoalText ? " | {$weightGoalText}" : "") . "\n";
    $prompt .= "Activity Level: {$activityLevel} | Target Calories: {$targetCalories} kcal/day\n";
    if ($bloodGroup)  $prompt .= "Blood Group: {$bloodGroup}\n";
    if ($sleepHours)  $prompt .= "Average Sleep: {$sleepHours} hours/night\n";
    if ($stressLevel) $prompt .= "Stress Level: {$stressLevel}\n";

    // --- DIETARY PROFILE ---
    $prompt .= "\n=== DIETARY PROFILE ===\n";
    if (!empty($dietType)) {
        $prompt .= "Diet Type: " . implode(', ', (array)$dietType) . "\n";
    }
    if (!empty($dietaryRestrictions)) {
        $prompt .= "Dietary Restrictions: " . implode(', ', $dietaryRestrictions) . " — STRICTLY RESPECT THESE. Never suggest any food violating these.\n";
    }
    if ($allergies) {
        $prompt .= "FOOD ALLERGIES (LIFE-CRITICAL): {$allergies} — NEVER include these. Zero tolerance.\n";
    }
    if ($foodsDislike) {
        $prompt .= "Foods Client Dislikes/Avoids: {$foodsDislike} — Do NOT include these in the plan.\n";
    }
    if ($medicalConditions) {
        $prompt .= "Medical Conditions/History: {$medicalConditions} — All food choices MUST be safe and supportive for these conditions.\n";
    }
    if ($specialInstructions) {
        $prompt .= "Special Instructions from Client: {$specialInstructions}\n";
    }

    // --- LOCATION & SEASON CONTEXT ---
    $prompt .= "\n=== LOCATION & SEASONAL CONTEXT ===\n";
    $prompt .= "Country: India | Current Season: {$season}\n";
    if ($location) {
        $prompt .= "Client Location: {$location}\n";
        $prompt .= "MANDATORY: Suggest locally available, affordable foods common in {$location} and across India.\n";
        $prompt .= "Consider regional food culture — e.g., if South India prefer idli/dosa/sambar; if Punjab prefer dal makhani/makki roti; if Gujarat prefer dhokla/khichdi; if Bengali prefer fish/lentils (unless restricted).\n";
    } else {
        $prompt .= "Suggest foods easily available across ALL Indian cities and towns (dal, sabzi, roti, chawal, paneer, dahi, etc.).\n";
    }
    $prompt .= "SEASONAL GUIDANCE for {$season}:\n";
    if ($month >= 3 && $month <= 5) {
        $prompt .= "- Summer: Prioritize cooling foods (cucumber, sattu, pudina, coconut water, lassi, tarbuj, kharbuja, curd-based dishes). Avoid very heavy/oily foods.\n";
        $prompt .= "- Increase water-rich vegetables and hydrating foods. Avoid excessive salt. Add nimbu pani where appropriate.\n";
    } elseif ($month >= 6 && $month <= 9) {
        $prompt .= "- Monsoon: Prioritize immunity-boosting foods (haldi, adrak, tulsi, lahsun). Avoid raw/street salads, prefer cooked vegetables.\n";
        $prompt .= "- Prefer light, easily digestible meals. Include ginger tea, turmeric milk. Avoid leafy greens prone to contamination (prefer cooked or washed thoroughly).\n";
    } else {
        $prompt .= "- Winter: Prioritize warming foods (til, gur, bajra, makki, ghee in moderation, methi, sarson, gond ke laddoo for energy). Include immune boosters.\n";
        $prompt .= "- Root vegetables (gajar, shalgam, chukander) are in season — use them. Include warm soups and kadhas.\n";
    }

    // --- DAILY CHECK-IN NOTES ---
    $prompt .= "\n=== TODAY'S CHECK-IN NOTES (CRITICAL PRIORITY) ===\n";
    if (!empty($notes)) {
        $prompt .= "PRIORITY NOTE/SYMPTOMS FROM CLIENT: \"{$notes}\"\n";
        $prompt .= "INSTRUCTION: This is the most important field. You MUST adapt today's meals to treat these symptoms. \n";
        $prompt .= "- If 'Stress' — Include calming herbs/foods (Tulsi, Ashwagandha, Chamomile-type tea, magnesium foods).\n";
        $prompt .= "- If 'Bloating' / 'Gas' — Exclude cabbage, cauliflower, beans, and high-fiber raw salads. Include Ajwain, ginger, hing, or cumin-infused foods.\n";
        $prompt .= "- If 'Energy Low' / 'Fatigue' — Include iron-rich foods, complex carbs, and natural stimulants like dates/dry fruits.\n";
        $prompt .= "- If 'Constipation' — Increase water-rich foods and cooked fiber (Isabgol, papaya).\n";
        $prompt .= "Directly mention in the 'day_summary' how you addressed the user's symptoms today.\n";
    } else {
        $prompt .= "No specific symptoms today. Follow the goal-based plan strictly.\n";
    }

    // --- STRICT NUTRITIONAL RULES ---
    $prompt .= "\n=== STRICT NUTRITIONAL RULES (MANDATORY) ===\n";
    $prompt .= "R1. CALORIE PRECISION: Total calories summed across ALL meals MUST equal exactly {$targetCalories} kcal (±30 kcal tolerance). Recalculate and adjust before outputting.\n";
    $prompt .= "R2. MACRO BALANCE for '{$userGoal}':\n";
    if ($userGoal === 'weight-loss' || $userGoal === 'fat-loss') {
        $prompt .= "    - High protein (25-30% of calories) to preserve muscle. Moderate carbs (40-45%). Low fat (25-30%). High fiber (30g+).\n";
        $prompt .= "    - Preference: lean proteins (moong dal, chicken breast if non-veg, paneer in moderation), complex carbs (oats, brown rice, jowar roti), lots of fiber-rich sabzis.\n";
    } elseif ($userGoal === 'muscle-gain' || $userGoal === 'weight-gain') {
        $prompt .= "    - High protein (30-35% of calories). Moderate-high carbs (45-50%). Moderate fat (20-25%).\n";
        $prompt .= "    - Preference: calorie-dense foods (peanut butter, milk, eggs if non-veg, dal rice, rajma, paneer), frequent meals, post-workout recovery meal.\n";
    } elseif ($userGoal === 'diabetes' || $userGoal === 'diabetes-management') {
        $prompt .= "    - Low glycemic index (GI) foods ONLY. No white rice, maida, sugar, refined carbs.\n";
        $prompt .= "    - Use: brown rice / bajra / jowar roti, bitter gourd (karela), methi, cinnamon (dalchini), fenugreek seeds. Prioritize fiber (35g+). Split into 5-6 small meals.\n";
    } elseif ($userGoal === 'thyroid' || $userGoal === 'hypothyroid') {
        $prompt .= "    - Avoid raw cruciferous vegetables (gobi, broccoli) — cook them. Avoid soy products. Include selenium-rich foods (sunflower seeds, Brazil nuts if available).\n";
        $prompt .= "    - Include iodine-rich foods (iodized salt, dairy), selenium (sunflower seeds, mushrooms), zinc (pumpkin seeds, legumes).\n";
    } elseif ($userGoal === 'pcod' || $userGoal === 'pcos') {
        $prompt .= "    - Anti-inflammatory diet. Low glycemic index. Include omega-3 (flaxseeds, walnuts, fish if non-veg). Avoid sugar, processed foods, refined carbs.\n";
        $prompt .= "    - Include: spearmint tea, cinnamon, turmeric, high-fiber vegetables, zinc-rich foods (pumpkin seeds).\n";
    } else {
        $prompt .= "    - Balanced macros: 20-25% protein, 50-55% carbs, 25-30% fat. Include diverse Indian foods.\n";
    }
    $prompt .= "R3. INGREDIENT QUANTITIES: EVERY ingredient MUST have a precise quantity (e.g., '150g paneer', '2 medium roti (60g each)', '1 katori (150ml) cooked dal').\n";
    $prompt .= "R4. PREPARATION STEPS (DETAILED): Provide 4-5 clear, sequentially numbered preparation steps for every dish. Include specific Indian cooking techniques, flame settings (low/medium/high), and timing where relevant. For salads/drinks, mention temperature and serving style.\n";
    $prompt .= "R5. GOAL IMPACT (DETAILED BENEFITS): Provide 4-5 specific benefits per dish. Explain EXACTLY how the nutrients in this dish (e.g., fiber, specific vitamins, protein type) impact the user\'s body to achieve '{$userGoal}'. Use scientific yet understandable reasoning (e.g., 'high fiber slows glucose absorption' for diabetes).\n";
    $prompt .= "R6. DUAL OPTIONS: Provide BOTH option_1 AND option_2 for Breakfast, Lunch, and Dinner. Options should be meaningfully different (not just portion changes).\n";
    $prompt .= "R7. FIBER: Every meal option MUST include a 'fiber' field (grams, numeric).\n";
    $prompt .= "R8. WATER INTAKE: Provide a DETAILED water intake plan as a JSON object (not just a string) with: total_liters, schedule[], tips[].\n";
    $prompt .= "R9. COMMON INDIAN MARKET FOODS ONLY: Use ingredients easily purchased from any kirana store, sabzi mandi, or local bazaar. No exotic/imported western ingredients.\n";
    $prompt .= "R10. MEAL TIMING: Use realistic Indian meal timing (6:30-7:00 AM wake-up, 8:00-8:30 AM breakfast, 11:00 AM mid-morning, 1:00-1:30 PM lunch, 4:30-5:00 PM evening snack, 7:30-8:00 PM dinner).\n";

    // --- DAILY CUISINE FOCUS (rotates by day for variety) ---
    $prompt .= "\n=== DAILY CUISINE FOCUS (DAY {$dayNumber}) ===\n";
    $prompt .= "Today's primary regional cuisine: {$cuisineFocus}\n";
    $prompt .= "Lean breakfast, lunch and dinner main dishes towards this regional style while strictly respecting the client's dietary restrictions, allergies, medical conditions, and goal. Mid-morning and evening snacks can stay pan-Indian. This rotation EXISTS to guarantee variety — do not default to generic dishes like poha/paneer bhurji/dal-chawal every day.\n";

    // --- ANTI-REPETITION RULE (R11) — only if we have past meals to avoid ---
    if (!empty($pastMeals)) {
        $avoidList = implode(', ', array_slice($pastMeals, 0, 30));
        $prompt .= "\nR11. ANTI-REPETITION (CRITICAL FOR VARIETY): The client has ALREADY been served these dishes in the last 7 days. You MUST NOT repeat ANY of them today, in either option_1 or option_2 of any meal slot:\n";
        $prompt .= "AVOID THESE DISHES: {$avoidList}\n";
        $prompt .= "Pick completely different dishes — different protein source (e.g., if past meals had paneer, today try moong dal/chickpea/sprouts), different grain (if past had roti/rice, try millet/bajra/jowar/oats), and different cooking style (curry vs dry vs stuffed vs steamed). If similar nutritional profile is required, use a different regional variant or substitute the main ingredient.\n";
    }

    // --- JSON STRUCTURE ---
    $prompt .= "\n=== REQUIRED JSON OUTPUT STRUCTURE ===\n";
    $prompt .= "Return this exact structure. Populate ALL fields with real, detailed, goal-specific content:\n";
    $prompt .= '{
  "day_title": "Catchy professional title for Day ' . $dayNumber . ' in ' . $language . '",
  "daily_objectives": ["Target Focus: Detailed objective with reasoning", "Health Metric: Specific impact for ' . $userGoal . '", "Macro Focus: Protein/Carb strategy for today", "Mindset/Consistency objective", "Metabolic trigger goal"],
  "day_summary": "3-4 concise yet highly professional sentences explaining HOW today\'s entire combination of meals specifically targets ' . $userGoal . '. Explain the synergy between meals and what physiologic responses the client should expect (e.g., energy stability, reduced bloating, muscle synthesis).",
  "target_stats": { "calories": ' . $targetCalories . ', "protein": "<auto-calc>", "carbs": "<auto-calc>", "fat": "<auto-calc>", "fiber": "<auto-calc>" },
  "water_intake": {
    "total_liters": 2.5,
    "schedule": [
      "6:30 AM - 2 glasses (500ml) warm water on empty stomach",
      "8:00 AM - 1 glass (250ml) with breakfast",
      "11:00 AM - 1 glass (250ml) mid-morning",
      "1:00 PM - 1 glass (250ml) before lunch",
      "3:00 PM - 1 glass (250ml) afternoon",
      "5:00 PM - 1 glass (250ml) with evening snack",
      "8:00 PM - 1 glass (250ml) with/after dinner"
    ],
    "tips": [
      "Goal-specific hydration tip 1 in ' . $language . '",
      "Tip about what to add to water (e.g., nimbu, kheera, jeera) relevant to ' . $userGoal . '",
      "Warning about what to avoid (excess tea/coffee) based on ' . $userGoal . '"
    ]
  },
  "timeline": [
    {
      "time": "6:30 AM",
      "title": "Wake-Up Ritual",
      "type": "ritual",
      "items": [
        {
          "name": "Indian ritual drink name",
          "quantity": "200-250ml",
          "instruction": "Detailed preparation instruction",
          "benefit": ["Specific benefit for ' . $userGoal . '", "Metabolic/digestive benefit"]
        }
      ]
    },
    {
      "time": "8:00 AM",
      "title": "Breakfast",
      "type": "meal",
      "name": "Overall breakfast category name",
      "option_1": {
        "name": "Full Indian dish name",
        "calories": 420,
        "protein": 22,
        "carbs": 48,
        "fat": 12,
        "fiber": 6,
        "ingredients": ["150g ingredient with quantity", "2 medium roti (approx 60g each)"],
        "preparation_steps": ["Step 1 with Indian cooking detail", "Step 2", "Step 3"],
        "benefits": ["How this specific dish helps ' . $userGoal . '", "Nutrient-specific benefit", "Energy/recovery benefit"]
      },
      "option_2": {
        "name": "Different Indian dish name",
        "calories": 410,
        "protein": 20,
        "carbs": 50,
        "fat": 11,
        "fiber": 5,
        "ingredients": ["ingredient with quantity"],
        "preparation_steps": ["Step 1", "Step 2"],
        "benefits": ["Benefit 1 for ' . $userGoal . '", "Benefit 2"]
      },
      "suggestions": "Expert nutritionist tip for this meal relevant to ' . $userGoal . '"
    },
    {
      "time": "11:00 AM",
      "title": "Mid-Morning Snack",
      "type": "meal",
      "name": "Snack name",
      "calories": 180,
      "protein": 8,
      "carbs": 22,
      "fat": 6,
      "fiber": 3,
      "ingredients": ["precise quantity ingredient"],
      "preparation_steps": ["Quick prep step"],
      "benefits": ["Benefit for ' . $userGoal . '", "Satiety/energy benefit"]
    },
    {
      "time": "1:30 PM",
      "title": "Lunch",
      "type": "meal",
      "name": "Lunch category",
      "option_1": { "name": "Indian lunch name", "calories": 550, "protein": 28, "carbs": 65, "fat": 16, "fiber": 9, "ingredients": [], "preparation_steps": [], "benefits": [] },
      "option_2": { "name": "Different Indian lunch", "calories": 540, "protein": 25, "carbs": 68, "fat": 14, "fiber": 8, "ingredients": [], "preparation_steps": [], "benefits": [] },
      "suggestions": "Lunch expert tip"
    },
    {
      "time": "4:30 PM",
      "title": "Evening Snack",
      "type": "meal",
      "name": "Snack name",
      "calories": 150,
      "protein": 7,
      "carbs": 18,
      "fat": 5,
      "fiber": 2,
      "ingredients": [],
      "preparation_steps": [],
      "benefits": []
    },
    {
      "time": "7:30 PM",
      "title": "Dinner",
      "type": "meal",
      "name": "Dinner category",
      "option_1": { "name": "Light Indian dinner name", "calories": 480, "protein": 24, "carbs": 58, "fat": 14, "fiber": 7, "ingredients": [], "preparation_steps": [], "benefits": [] },
      "option_2": { "name": "Different dinner option", "calories": 470, "protein": 22, "carbs": 60, "fat": 13, "fiber": 6, "ingredients": [], "preparation_steps": [], "benefits": [] },
      "suggestions": "Dinner timing and digestion tip"
    }
  ],
  "daily_dos": [
    "Specific actionable do for ' . $userGoal . ' today",
    "Timing-related do (e.g., eat within 30 min of waking)",
    "Movement/lifestyle do aligned with ' . $activityLevel . ' activity",
    "Seasonal do for ' . $season . '"
  ],
  "daily_donts": [
    "Specific food to avoid for ' . $userGoal . ' with reason",
    "Habit to avoid today with reason",
    "Seasonal dont for ' . $season . '",
    "Common Indian mistake to avoid"
  ],
  "summary_table": {
    "total_calories": ' . $targetCalories . ',
    "focus": "' . $userGoal . '",
    "expected_result": "Specific expected result for today\'s plan",
    "key_nutrients": "Top 3 nutrients highlighted today and why"
  }
}';

    // --- PERIOD PHASE INJECTION (women only) ---
    if (isset($userProfile['period_phase']) && !empty($userProfile['period_phase'])) {
        $phase         = ucfirst($userProfile['period_phase']);
        $cycleDay      = $userProfile['cycle_day']              ?? '?';
        $cycleLength   = $userProfile['cycle_length']           ?? 28;
        $daysUntilNext = $userProfile['days_until_next_period'] ?? '?';
        $phaseGuidance = [
            'period'     => 'High iron foods (palak, beetroot, pomegranate, rajma, horse gram), warm soups and stews, anti-cramp foods (ginger tea, dark chocolate, banana), avoid cold/raw foods and carbonated drinks. Increase magnesium (banana, dark chocolate, seeds).',
            'follicular' => 'High protein for cell repair (paneer, eggs if non-veg, sprouted moong, soya), energy-boosting complex carbs (oats, quinoa if available else brown rice), fermented foods for gut health (idli, dosa, yoghurt, kanji), fresh colorful salads.',
            'ovulation'  => 'Anti-inflammatory foods (haldi milk, ginger, flaxseeds, walnuts), fiber-rich vegetables (broccoli cooked, carrots, beetroot), balanced macros, antioxidant-rich fruits (pomegranate, amla, berries), stay well hydrated.',
            'luteal'     => 'Complex carbs to combat cravings (brown rice, oats, sweet potato), magnesium-rich foods (dark chocolate in moderation, kaju, akhrot, til), reduce sodium (avoid pickles, papad, extra salt), healthy sweets (dates, anjeer, khajur), anti-PMS herbs (shatavari, ashwagandha if available).',
        ];
        $guidance = $phaseGuidance[strtolower($userProfile['period_phase'])] ?? 'Balanced wholesome nutrition.';
        $prompt .= "\n\n=== MENSTRUAL CYCLE CONTEXT (CRITICAL — ADJUST ENTIRE PLAN) ===\n";
        $prompt .= "Current Phase: {$phase} Phase | Cycle Day: {$cycleDay}/{$cycleLength} | Days Until Next Period: {$daysUntilNext}\n";
        $prompt .= "MANDATORY PHASE ADJUSTMENTS: {$guidance}\n";
        $prompt .= "ACTION: Integrate these phase-specific foods naturally throughout the timeline. Mention the phase and its dietary impact in the day_summary. Add phase-specific daily_dos and daily_donts.\n";
    }

    $prompt .= "\n\n=== FINAL CHECKLIST BEFORE OUTPUTTING ===\n";
    $prompt .= "[ ] Total calories = {$targetCalories} (±30 kcal). Verified? YES\n";
    $prompt .= "[ ] No foods violating dietary restrictions or allergies. Verified? YES\n";
    $prompt .= "[ ] All ingredients have quantities. Verified? YES\n";
    $prompt .= "[ ] water_intake is a JSON object with total_liters + schedule array + tips array. Verified? YES\n";
    $prompt .= "[ ] All benefit fields are arrays. Verified? YES\n";
    $prompt .= "[ ] All preparation_steps are arrays. Verified? YES\n";
    $prompt .= "[ ] Output is pure JSON only — no markdown, no code blocks. Verified? YES\n";

    return requestAIJson($systemPrompt, $prompt, 0.85, 120);
}

// -----------------------------------------------------------
// Feature 2: generateMealSubstitution()
// -----------------------------------------------------------
function generateMealSubstitution($userHas, $targetMacros)
{
    $cal  = $targetMacros['calories'] ?? 500;
    $prot = $targetMacros['protein']  ?? 25;
    $carb = $targetMacros['carbs']    ?? 60;
    $fat  = $targetMacros['fat']      ?? 15;

    $prompt  = "You are an expert Indian Nutritionist. A user has available: \"{$userHas}\".\n";
    $prompt .= "Their meal targets are: Calories={$cal} kcal, Protein={$prot}g, Carbs={$carb}g, Fat={$fat}g.\n";
    $prompt .= "Calculate EXACT quantities of the available food to match these targets as closely as possible.\n";
    $prompt .= "Return ONLY a JSON object (no markdown) with these exact fields:\n";
    $prompt .= '{ "name": "Dish Name", "calories": 500, "protein": 25, "carbs": 60, "fat": 15, "fiber": 5, "ingredients": ["200g dal", "1 cup rice (150g cooked)"], "preparation_steps": ["Step 1", "Step 2"], "quantity_tips": "Quick tip on portions", "benefits": ["Benefit 1", "Benefit 2"] }';

    $systemPrompt = 'You are a precise nutrition JSON API. Return ONLY raw JSON. No markdown, no code blocks. All macro values must be raw numbers (no units).';
    return requestAIJson($systemPrompt, $prompt, 0.3, 60);
}
?>
