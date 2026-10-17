<?php
/**
 * Web Cron Trigger for send_reminders.php
 * 
 * Trigger this via:
 *  1. cron-job.org (free) — set URL: https://mrdietplan.in/api/cron/trigger.php?secret=YOUR_SECRET
 *  2. UptimeRobot (free) — monitor this URL every 5 mins
 *  3. Any HTTP cron service
 * 
 * Set CRON_SECRET in config.php to protect this endpoint.
 */

// Allow CLI execution without secret
$isCli = (php_sapi_name() === 'cli');

if (!$isCli) {
    // Require secret key for web access
    require_once __DIR__ . '/../config/config.php';
    $expectedSecret = defined('CRON_SECRET') ? CRON_SECRET : 'change_this_secret_in_config';
    $providedSecret = $_GET['secret'] ?? '';

    if ($providedSecret !== $expectedSecret) {
        http_response_code(403);
        die(json_encode(['error' => 'Forbidden']));
    }

    // Rate limit: only run if last run was more than 4 minutes ago
    $lockFile = sys_get_temp_dir() . '/cron_reminders.lock';
    if (file_exists($lockFile) && (time() - filemtime($lockFile)) < 240) {
        echo json_encode(['status' => 'skipped', 'reason' => 'Too soon since last run']);
        exit;
    }
    touch($lockFile);
}

// Capture output
ob_start();
require_once __DIR__ . '/send_reminders.php';
$output = ob_get_clean();

if (!$isCli) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'ran_at' => date('Y-m-d H:i:s'),
        'output' => $output
    ]);
}
