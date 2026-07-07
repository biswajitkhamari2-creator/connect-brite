<?php
declare(strict_types=1);
define('APP_NAME', 'ClaimForSure');
define('APP_ROOT', dirname(__DIR__));
define('UPLOAD_DIR', APP_ROOT . '/storage/uploads');
define('LOG_DIR', APP_ROOT . '/storage/logs');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024);
define('ALLOWED_MIME', [
    'application/pdf' => 'pdf',
    'image/jpeg'      => 'jpg',
    'image/png'       => 'png',
    'application/zip' => 'zip',
]);
define('JWT_TTL', 3600);