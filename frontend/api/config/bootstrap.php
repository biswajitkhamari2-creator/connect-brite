<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1'); // Enable displaying errors for debugging

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        if (!str_contains($line, '=')) continue;
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        $_ENV[$k] = $v; putenv("{$k}={$v}");
    }
}
require_once __DIR__ . '/constants.php';

spl_autoload_register(function (string $class): void {
    $paths = [
        __DIR__ . '/',
        APP_ROOT . '/app/helpers/',
        APP_ROOT . '/app/services/',
        APP_ROOT . '/app/repositories/',
        APP_ROOT . '/app/models/',
        APP_ROOT . '/app/middleware/',
        APP_ROOT . '/app/controllers/',
        APP_ROOT . '/app/admin/',
    ];
    foreach ($paths as $p) {
        $f = $p . $class . '.php';
        if (file_exists($f)) { require_once $f; return; }
    }
});

if (file_exists(APP_ROOT . '/vendor/autoload.php')) {
    require_once APP_ROOT . '/vendor/autoload.php';
}

set_exception_handler(function (Throwable $e): void {
    // Graceful logging: print exception directly to browser for live debugging on Vercel
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Exception occurred: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'trace' => explode("\n", $e->getTraceAsString())
    ], JSON_PRETTY_PRINT);
    exit;
});