<?php
// Copy this file to config.php and provide secrets through environment variables.

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'mrdietweb');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: '');
define('GEMINI_API_KEY', getenv('GEMINI_API_KEY') ?: '');
define('GOOGLE_CLIENT_ID', getenv('GOOGLE_CLIENT_ID') ?: '');

define('CASHFREE_APP_ID', getenv('CASHFREE_APP_ID') ?: '');
define('CASHFREE_SECRET_KEY', getenv('CASHFREE_SECRET_KEY') ?: '');
define('CASHFREE_API_VERSION', getenv('CASHFREE_API_VERSION') ?: '2023-08-01');
define('CASHFREE_ENV', strtoupper(getenv('CASHFREE_ENV') ?: 'SANDBOX'));
define('CASHFREE_BASE_URL', CASHFREE_ENV === 'PROD'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg');

define('RAZORPAY_KEY_ID', getenv('RAZORPAY_KEY_ID') ?: '');
define('RAZORPAY_KEY_SECRET', getenv('RAZORPAY_KEY_SECRET') ?: '');
define('RAZORPAY_BASE_URL', 'https://api.razorpay.com/v1');

define('ONESIGNAL_APP_ID', getenv('ONESIGNAL_APP_ID') ?: '');
define('ONESIGNAL_REST_API_KEY', getenv('ONESIGNAL_REST_API_KEY') ?: '');
define('CRON_SECRET', getenv('CRON_SECRET') ?: 'change-me');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
