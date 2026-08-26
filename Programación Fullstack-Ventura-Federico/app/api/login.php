<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Models\Rol;
use App\Models\Usuario;
use App\RoleLabels;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

$usuario = $email !== '' ? Usuario::findBy('email', $email) : null;

if ($usuario === null || !password_verify($password, $usuario['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Correo o contraseña incorrectos.']);
    exit;
}

if ($usuario['estado'] !== 'activo') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Esta cuenta no está activa.']);
    exit;
}

$rol = Rol::find((int) $usuario['id_rol']);
$rolCodigo = $rol['nombre_rol'] ?? 'PUBLICO';
$iniciales = strtoupper(mb_substr($usuario['nombre'], 0, 1) . mb_substr($usuario['apellido'], 0, 1));

echo json_encode([
    'success' => true,
    'user' => [
        'id_usuario' => (int) $usuario['id_usuario'],
        'nombre' => $usuario['nombre'],
        'email' => $usuario['email'],
        'rol' => $rolCodigo,
        'rolNombre' => RoleLabels::forCode($rolCodigo),
        'iniciales' => $iniciales,
    ],
]);
