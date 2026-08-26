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

$nombre = trim((string) ($input['nombre'] ?? ''));
$apellido = trim((string) ($input['apellido'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($nombre === '' || $apellido === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Completá todos los campos.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'El correo electrónico no es válido.']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 8 caracteres.']);
    exit;
}

if (Usuario::findBy('email', $email) !== null) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Ya existe una cuenta con ese correo.']);
    exit;
}

$rolParticipante = Rol::findBy('nombre_rol', 'PARTICIPANTE');
if ($rolParticipante === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'No se encontró el rol por defecto.']);
    exit;
}

$idUsuario = Usuario::create([
    'id_rol' => $rolParticipante['id_rol'],
    'nombre' => $nombre,
    'apellido' => $apellido,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
]);

$iniciales = strtoupper(mb_substr($nombre, 0, 1) . mb_substr($apellido, 0, 1));

echo json_encode([
    'success' => true,
    'user' => [
        'id_usuario' => $idUsuario,
        'nombre' => $nombre,
        'email' => $email,
        'rol' => 'PARTICIPANTE',
        'rolNombre' => RoleLabels::forCode('PARTICIPANTE'),
        'iniciales' => $iniciales,
    ],
]);
