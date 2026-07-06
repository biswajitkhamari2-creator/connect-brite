<?php
declare(strict_types=1);
final class RateLimitMiddleware
{
    public static function check(string $key, int $max = 60, int $window = 60): void
    {
        $dir = APP_ROOT . '/storage/ratelimit';
        if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
        $file = $dir . '/' . md5($key) . '.json';
        $now = time();
        $data = ['count' => 0, 'reset' => $now + $window];
        if (file_exists($file)) {
            $s = json_decode((string)file_get_contents($file), true);
            if (is_array($s) && $s['reset'] > $now) $data = $s;
        }
        $data['count']++;
        file_put_contents($file, json_encode($data), LOCK_EX);
        if ($data['count'] > $max) {
            header('Retry-After: ' . max(1, $data['reset'] - $now));
            Response::error('Too many requests. Please slow down.', 429);
        }
    }
}