<?php
declare(strict_types=1);

namespace App;

final class Auth
{
    public static function ensureStarted(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_set_cookie_params([
                'httponly' => true,
                'samesite' => 'Lax',
                'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            ]);
            ini_set('session.use_strict_mode', '1');
            session_start();
        }
    }

    private static function deny(int $status, string $error): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => $error]);
        exit;
    }

    public static function login(array $usuario): void
    {
        self::ensureStarted();
        session_regenerate_id(true);
        $_SESSION['usuario'] = $usuario;
    }

    public static function logout(): void
    {
        self::ensureStarted();
        $_SESSION = [];
        session_destroy();
    }

    public static function current(): ?array
    {
        self::ensureStarted();
        return $_SESSION['usuario'] ?? null;
    }

    public static function currentWithRoles(): ?array
    {
        $usuario = self::current();
        if ($usuario === null) {
            return null;
        }
        $usuario['rolesTorneo'] = RolesTorneo::activos($usuario['id_usuario']);
        return $usuario;
    }

    public static function requireLogin(): array
    {
        return self::current() ?? self::deny(401, 'Necesitás iniciar sesión.');
    }

    public static function requireRole(string ...$roles): array
    {
        $usuario = self::requireLogin();
        if (!in_array($usuario['rol'], $roles, true)) {
            self::deny(403, 'No tenés permiso para esta acción.');
        }
        return $usuario;
    }

    public static function requireTorneoRole(int $idTorneo, string ...$roles): array
    {
        $usuario = self::requireLogin();
        if ($usuario['rol'] !== 'ADMIN'
            && !RolesTorneo::tiene($usuario['id_usuario'], $idTorneo, $roles)) {
            self::deny(403, 'No tenés permiso sobre este torneo.');
        }
        return $usuario;
    }
}
