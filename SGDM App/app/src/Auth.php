<?php
declare(strict_types=1);

namespace App;

/**
 * Sesión real de servidor (cookie de PHP), independiente del
 * sessionStorage del navegador que usa el front para pintar la UI. Esta
 * es la que de verdad protege los endpoints que escriben datos.
 */
final class Auth
{
    private static function ensureStarted(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    public static function login(array $usuario): void
    {
        self::ensureStarted();
        session_regenerate_id(true);
        $_SESSION['usuario'] = $usuario;
    }

    public static function current(): ?array
    {
        self::ensureStarted();
        return $_SESSION['usuario'] ?? null;
    }

    /**
     * Corta la ejecución con 401/403 si no hay sesión o el rol no matchea.
     */
    public static function requireRole(string ...$roles): array
    {
        $usuario = self::current();
        if ($usuario === null) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Necesitás iniciar sesión.']);
            exit;
        }
        if (!in_array($usuario['rol'], $roles, true)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'No tenés permiso para esta acción.']);
            exit;
        }
        return $usuario;
    }
}
