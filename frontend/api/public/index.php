<?php
declare(strict_types=1);

// Dynamically resolve base directory to support both local public/ and flattened production environments
$baseDir = file_exists(__DIR__ . '/config/bootstrap.php') ? __DIR__ : dirname(__DIR__);
require_once $baseDir . '/config/bootstrap.php';

// ── CORS — allow the Vite frontend (and any local dev origin / Vercel domain) ──────────────
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isVercel = preg_match('/\.vercel\.app$/', parse_url($origin, PHP_URL_HOST) ?? '');

if (
    $isVercel ||
    in_array($origin, [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
    ], true) ||
    $origin === ''
) {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
} else {
    header('Access-Control-Allow-Origin: http://localhost:8080');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS request — return 200 immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

RateLimitMiddleware::check('global:' . Request::clientIp(), 120, 60);

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Clean "/api" subfolder prefix if present in the path for Namecheap compatibility
$uri = preg_replace('/^\/api/', '', $uri);
$uri = rtrim($uri, '/') ?: '/';

$routes = require $baseDir . '/routes/api.php';
$adminRoutesFile = $baseDir . '/routes/admin.php';
if (file_exists($adminRoutesFile)) {
    $routes = array_merge($routes, require $adminRoutesFile);
}

foreach ($routes as $pattern => $handler) {
    [$rMethod, $rPath] = preg_split('/\s+/', trim($pattern));
    if (strtoupper($rMethod) !== $method) continue;
    $regex = '#^' . preg_replace('#\{[a-z]+\}#', '(\d+)', $rPath) . '$#';
    if (preg_match($regex, $uri, $matches)) {
        array_shift($matches);
        [$class, $fn] = $handler;
        (new $class())->$fn(...array_map('intval', $matches));
        exit;
    }
}
Response::error('Route not found', 404);