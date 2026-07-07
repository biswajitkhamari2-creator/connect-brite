<?php
declare(strict_types=1);
final class Request
{
    public static function body(): array
    {
        $ct = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($ct, 'application/json')) {
            $data = json_decode(file_get_contents('php://input'), true);
            return is_array($data) ? $data : [];
        }
        return $_POST;
    }
    public static function clientIp(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    public static function userAgent(): string
    {
        return substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 255);
    }
}