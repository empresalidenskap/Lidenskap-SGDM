<?php
declare(strict_types=1);

namespace App;

/**
 * Sesión real de servidor (cookie de PHP), independiente del
 * sessionStorage del navegador que usa el front para pintar la UI. Esta
 * es la que de verdad protege los endpoints que escriben datos.
 *
 * En la sesión solo vive el rol global (ADMIN o PUBLICO). Los roles por
 * torneo se consultan siempre en vivo (RolesTorneo), así un rol revocado al
 * terminar el torneo deja de valer en el próximo request, sin re-login.
 */
final class Auth
{
    private static function ensureStarted(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            // Cookie de sesión: JS no la puede leer (HttpOnly, así un XSS no
            // roba la sesión), no viaja desde otros sitios (SameSite) y por
            // HTTPS solo viaja cifrada (Secure)
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

    /** Usuario de la sesión + sus roles por torneo activos (lo que recibe el front). */
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

    /**
     * Corta la ejecución con 401/403 si no hay sesión o el rol global no matchea.
     */
    public static function requireRole(string ...$roles): array
    {
        $usuario = self::requireLogin();
        if (!in_array($usuario['rol'], $roles, true)) {
            self::deny(403, 'No tenés permiso para esta acción.');
        }
        return $usuario;
    }

    /**
     * Igual que requireRole() pero para un torneo puntual: pasa el Admin o
     * quien tenga alguno de esos roles activos en ESE torneo.
     */
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
