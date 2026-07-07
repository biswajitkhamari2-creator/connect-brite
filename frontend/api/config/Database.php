<?php
declare(strict_types=1);

final class Database
{
    private static ?PDO $instance = null;

    public static function getConnection(): PDO
    {
        if (self::$instance === null) {
            $host = $_ENV['DB_HOST'] ?? $_SERVER['DB_HOST'] ?? null;
            $db   = $_ENV['DB_NAME'] ?? $_SERVER['DB_NAME'] ?? null;
            $user = $_ENV['DB_USER'] ?? $_SERVER['DB_USER'] ?? null;
            $pass = $_ENV['DB_PASS'] ?? $_SERVER['DB_PASS'] ?? '';

            // Handle unconfigured cloud/Vercel serverless environments gracefully
            if (empty($host) || empty($db) || empty($user)) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'message' => 'Database configuration is incomplete. Please set DB_HOST, DB_NAME, DB_USER, and DB_PASS in Vercel settings.'
                ]);
                exit;
            }

            $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";
            
            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'message' => 'Database connection failed: ' . $e->getMessage()
                ]);
                exit;
            }
        }
        return self::$instance;
    }
}