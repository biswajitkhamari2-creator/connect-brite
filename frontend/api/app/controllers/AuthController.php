<?php
declare(strict_types=1);
final class AuthController
{
    private AuthService $service;
    public function __construct() { $this->service = new AuthService(Database::getConnection()); }
    public function register(): void { Response::success($this->service->register(Request::body()), 'Registration successful', 201); }
    public function login(): void { Response::success($this->service->login(Request::body()), 'Login successful'); }
    public function me(): void
    {
        $payload = AuthMiddleware::authenticate();
        $user = (new UserRepository(Database::getConnection()))->findById((int)$payload['sub']);
        if (!$user) Response::error('User not found', 404);
        unset($user['password_hash']);
        Response::success($user, 'Profile fetched');
    }
    public function logout(): void
    {
        $payload = AuthMiddleware::authenticate();
        Logger::audit('user.logout', ['user_id' => $payload['sub']]);
        Response::success(null, 'Logged out');
    }
}