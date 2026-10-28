<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Correo;
use App\Models\Usuario;
use App\Password;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$sesion = Auth::requireLogin();

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}
$actual = (string) ($input['actual'] ?? '');
$nueva = (string) ($input['nueva'] ?? '');

$usuario = Usuario::find((int) $sesion['id_usuario']);
if ($usuario === null || !password_verify($actual, $usuario['password'])) {
    Auditoria::registrar('Cambio de contraseña fallido (contraseña actual incorrecta)', 'usuario');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña actual no es correcta.']);
    exit;
}

$problema = Password::validar($nueva, $actual);
if ($problema !== null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $problema]);
    exit;
}

Usuario::update((int) $usuario['id_usuario'], ['password' => password_hash($nueva, PASSWORD_DEFAULT)]);
Auditoria::registrar('Cambio de contraseña', 'usuario');
Password::avisarCambio($usuario, 'desde tu perfil');

echo json_encode([
    'success' => true,
    'mensaje' => 'Contraseña actualizada. La próxima vez que inicies sesión usá la nueva.'
        . (Correo::configurado() ? ' Te mandamos un aviso por correo.' : ''),
]);
