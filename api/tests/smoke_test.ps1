param(
    [string]$BaseUrl = 'http://127.0.0.1:8001'
)

$ErrorActionPreference = 'Stop'
$script:Checks = 0

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "Assertion failed: $Message"
    }
}

function Invoke-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [int[]]$ExpectedStatus = @(200)
    )

    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        SkipHttpErrorCheck = $true
    }

    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = $Body | ConvertTo-Json -Depth 30 -Compress
    }

    $response = Invoke-WebRequest @params
    Assert-True ($ExpectedStatus -contains [int]$response.StatusCode) "$Name returned HTTP $($response.StatusCode)"

    $json = $null
    if (-not [string]::IsNullOrWhiteSpace($response.Content)) {
        try {
            $json = $response.Content | ConvertFrom-Json
        } catch {
            throw "$Name did not return valid JSON"
        }
    }

    $script:Checks++
    Write-Host "PASS [$($response.StatusCode)] $Name"
    return $json
}

$suffix = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$email = "codex-smoke-$suffix@example.test"
$password = "SmokeTest-$suffix!"

$publicSettings = Invoke-Api 'Public settings' 'GET' '/api/controllers/settings_public.php'
$publicKeys = @($publicSettings.PSObject.Properties.Name)
Assert-True (-not ($publicKeys | Where-Object { $_ -match 'api_key|secret' })) 'Public settings leaked a secret setting name'

$signup = Invoke-Api 'Signup' 'POST' '/api/controllers/auth.php?action=signup' @{
    email = $email
    password = $password
    data = @{ name = 'Codex Smoke User' }
}
$userId = [int]$signup.user.id
Assert-True ($userId -gt 0) 'Signup did not return a user id'

$login = Invoke-Api 'Login' 'POST' '/api/controllers/auth.php?action=login' @{
    email = $email
    password = $password
}
Assert-True ([int]$login.user.id -eq $userId) 'Login returned the wrong user'

$invalidLogin = Invoke-Api 'Invalid login guard' 'POST' '/api/controllers/auth.php?action=login' @{
    email = $email
    password = 'incorrect-password'
} @(401)
Assert-True ($invalidLogin.message -match 'Invalid') 'Invalid login response was unexpected'

$profile = Invoke-Api 'Create profile' 'POST' '/api/controllers/profiles.php' @{
    user_id = $userId
    name = 'Codex Smoke User'
    email = $email
    age = 31
    gender = 'female'
    height = 165
    weight = 64
    bmi = 23.5
    goal = 'weight-loss'
    activity_level = 'moderate'
    dietary_restrictions = @('vegetarian')
    allergies = 'none'
    meal_preference = 'vegetarian'
    phone = '9999999999'
    city = 'Delhi'
}
$profileId = [int]$profile.id
Assert-True ($profileId -gt 0) 'Profile did not return an id'

$fetchedProfile = Invoke-Api 'Fetch profile' 'GET' "/api/controllers/profiles.php?user_id=$userId"
Assert-True ([int]$fetchedProfile.id -eq $profileId) 'Fetched profile id mismatch'

$preview = Invoke-Api 'Subscription preview' 'GET' "/api/controllers/subscriptions.php?action=preview_change&user_id=$userId&new_plan=weekly"
Assert-True ($preview.mode -eq 'new') 'New user subscription preview was not in new mode'

$endDate = (Get-Date).Date.AddDays(7).ToString('yyyy-MM-dd')
$subscription = Invoke-Api 'Create subscription' 'POST' '/api/controllers/subscriptions.php' @{
    profile_id = $profileId
    user_id = $userId
    plan_type = 'weekly'
    plan_days = 7
    end_date = $endDate
    amount = 599
    payment_method = 'smoke-test'
    payment_status = 'completed'
}
$subscriptionId = [int]$subscription.id
Assert-True ($subscriptionId -gt 0) 'Subscription did not return an id'

$activeSubscription = Invoke-Api 'Fetch active subscription' 'GET' "/api/controllers/subscriptions.php?user_id=$userId"
Assert-True ([int]$activeSubscription.id -eq $subscriptionId) 'Active subscription id mismatch'

$planDate = (Get-Date).Date.ToString('yyyy-MM-dd')
$null = Invoke-Api 'Create daily plan shell' 'POST' '/api/controllers/daily_diet_plans.php' @(
    @{
        subscription_id = $subscriptionId
        day_number = 1
        plan_date = $planDate
        is_unlocked = $true
        user_name = 'Codex Smoke User'
    }
    @{
        subscription_id = $subscriptionId
        day_number = 2
        plan_date = (Get-Date).Date.AddDays(1).ToString('yyyy-MM-dd')
        is_unlocked = $false
        user_name = 'Codex Smoke User'
    }
)

$null = Invoke-Api 'Update daily plan' 'PATCH' "/api/controllers/daily_diet_plans.php?subscription_id=$subscriptionId&day_number=1" @{
    is_unlocked = $true
    meal_plan = @{
        day_title = 'Smoke Test Plan'
        timeline = @()
    }
}

$dailyPlans = Invoke-Api 'Fetch daily plans' 'GET' "/api/controllers/daily_diet_plans.php?subscription_id=$subscriptionId"
Assert-True (@($dailyPlans).Count -eq 2) 'Expected two daily plans'

$checkin = Invoke-Api 'Daily check-in' 'POST' '/api/controllers/checkin.php' @{
    subscription_id = $subscriptionId
    day_number = 1
    weight = 64
    mood = 'good'
    notes = 'smoke test'
}
Assert-True ($checkin.success -eq $true) 'Daily check-in was not saved'

$unlockAt = [DateTimeOffset]::UtcNow.AddMinutes(30).ToUnixTimeMilliseconds()
$timer = Invoke-Api 'Create generation timer' 'POST' '/api/controllers/timers.php' @{
    subscription_id = $subscriptionId
    day_number = 1
    unlock_at = $unlockAt
}
Assert-True ($timer.success -eq $true) 'Timer was not created'

$fetchedTimer = Invoke-Api 'Fetch generation timer' 'GET' "/api/controllers/timers.php?subscription_id=$subscriptionId&day_number=1"
Assert-True ($null -ne $fetchedTimer.timer) 'Timer was not fetched'

$deletedTimer = Invoke-Api 'Delete generation timer' 'DELETE' "/api/controllers/timers.php?subscription_id=$subscriptionId&day_number=1"
Assert-True ($deletedTimer.success -eq $true) 'Timer was not deleted'

$savedPreferences = Invoke-Api 'Save notification preferences' 'POST' '/api/controllers/notifications.php' @{
    user_id = $userId
    water_reminder_enabled = $true
    water_reminder_interval = 90
    meal_reminder_enabled = $true
    period_reminder_enabled = $true
    notifications_paused = $false
}
Assert-True ($savedPreferences.success -eq $true) 'Notification preferences were not saved'

$preferences = Invoke-Api 'Fetch notification preferences' 'GET' "/api/controllers/notifications.php?user_id=$userId"
Assert-True ($preferences.water_reminder_enabled -eq $true) 'Notification preference did not persist'

$cycleConfig = Invoke-Api 'Update period cycle config' 'POST' '/api/controllers/period_tracker.php?action=update_cycle_config' @{
    action = 'update_cycle_config'
    user_id = $userId
    cycle_length = 28
    period_duration = 5
    last_period_start = (Get-Date).Date.AddDays(-3).ToString('yyyy-MM-dd')
}
Assert-True ($cycleConfig.success -eq $true) 'Cycle config was not saved'

$periodLog = Invoke-Api 'Save period log' 'POST' '/api/controllers/period_tracker.php' @{
    user_id = $userId
    log_date = $planDate
    is_period_day = $true
    flow_level = 'medium'
    symptoms = @('cramps')
    mood = 'okay'
    notes = 'smoke test'
}
Assert-True ($periodLog.success -eq $true) 'Period log was not saved'

$periodSummary = Invoke-Api 'Fetch period summary' 'GET' "/api/controllers/period_tracker.php?action=summary&user_id=$userId"
Assert-True ($null -ne $periodSummary.current_phase) 'Period summary was incomplete'

$coupon = Invoke-Api 'Invalid coupon guard' 'POST' '/api/controllers/coupons.php?action=validate' @{
    code = 'NOT-A-REAL-COUPON'
    plan_type = 'weekly'
    amount = 599
}
Assert-True ($coupon.valid -eq $false) 'Unknown coupon was unexpectedly accepted'

$partner = Invoke-Api 'Partner dashboard' 'GET' "/api/controllers/partner.php?action=stats&user_id=$userId"
Assert-True ($null -ne $partner.stats) 'Partner dashboard response was incomplete'

$aiPlan = Invoke-Api 'Gemini diet-plan generation' 'POST' '/api/controllers/generate_plan.php' @{
    userProfile = @{
        user_id = $userId
        name = 'Codex Smoke User'
        age = 31
        gender = 'female'
        height = 165
        weight = 64
        goal = 'weight-loss'
        activity_level = 'moderate'
    }
    subscription_id = $subscriptionId
    dayNumber = 1
    language = 'English'
    notes = 'No symptoms'
    planType = 'weekly'
}
Assert-True ($aiPlan.mealPlan.provider -eq 'gemini') 'Diet plan did not use Gemini'
Assert-True ($aiPlan.mealPlan.system_instruction -eq $true) 'Gemini system instruction was not sent'
Assert-True ($aiPlan.mealPlan.json_mode -eq $true) 'Gemini JSON mode was not enabled'

$adminSettings = Invoke-Api 'Admin settings' 'GET' '/api/controllers/admin/settings.php?admin_id=1'
Assert-True ($adminSettings.ai_provider -eq 'gemini') 'Admin AI provider setting was not readable'

$adminEndpoints = @(
    @{ Name = 'Admin analytics'; Path = '/api/controllers/admin/analytics.php?admin_id=1' },
    @{ Name = 'Admin users'; Path = '/api/controllers/admin/users.php?admin_id=1' },
    @{ Name = 'Admin profiles'; Path = '/api/controllers/admin/profiles.php?admin_id=1' },
    @{ Name = 'Admin coupons'; Path = '/api/controllers/admin/coupons.php?admin_id=1' },
    @{ Name = 'Admin transactions'; Path = '/api/controllers/admin/transactions.php?admin_id=1' },
    @{ Name = 'Admin withdrawals'; Path = '/api/controllers/admin/withdrawals.php?admin_id=1' },
    @{ Name = 'Admin health metrics'; Path = "/api/controllers/admin/health_metrics.php?admin_id=1&profile_id=$profileId" },
    @{ Name = 'CMS pages'; Path = '/api/controllers/admin/cms.php' }
)

foreach ($endpoint in $adminEndpoints) {
    $null = Invoke-Api $endpoint.Name 'GET' $endpoint.Path
}

$invalidPayment = Invoke-Api 'Payment request validation' 'POST' '/api/controllers/payment.php?action=create_order' $null @(400)
Assert-True ($invalidPayment.error -match 'Invalid JSON') 'Payment endpoint validation failed'

Write-Host "Smoke test completed: $script:Checks API checks passed. Test user id: $userId"
