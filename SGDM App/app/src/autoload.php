<?php
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

// Manejo centralizado de errores: un error que ningún endpoint atrapó queda
// en el log de PHP y el front recibe el mismo JSON de siempre, sin detalles
// internos (rutas, consultas) que le sirvan a un atacante.
set_exception_handler(static function (Throwable $error): void {
    error_log('[SGDM] ' . $error);
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['success' => false, 'error' => 'Ocurrió un error en el servidor. Intentá de nuevo y, si sigue pasando, avisá al administrador.']);
});
