<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Database;
use App\Models\Rol;
use App\Models\Usuario;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleList();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleCreate();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
}
exit;

function handleList(): void
{
    Auth::requireRole('ADMIN');

    $sql = 'SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, r.nombre_rol
            FROM usuario u
            JOIN rol r ON r.id_rol = u.id_rol
            ORDER BY u.id_usuario ASC';
    $filas = Database::getConnection()->query($sql)->fetchAll();

    $usuarios = array_map(static function (array $fila): array {
        return [
            'id' => (int) $fila['id_usuario'],
            'nombre' => $fila['nombre'],
            'apellido' => $fila['apellido'],
            'email' => $fila['email'],
            'rol' => $fila['nombre_rol'],
            'estado' => $fila['estado'],
        ];
    }, $filas);

    echo json_encode(['success' => true, 'usuarios' => $usuarios]);
}

function handleCreate(): void
{
    Auth::requireRole('ADMIN');

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $nombre = trim((string) ($input['nombre'] ?? ''));
    $apellido = trim((string) ($input['apellido'] ?? ''));
    $email = strtolower(trim((string) ($input['email'] ?? '')));
    $password = (string) ($input['password'] ?? '');
    $rolCodigo = trim((string) ($input['rol'] ?? ''));

    if ($nombre === '' || $apellido === '' || $email === '' || $password === '' || $rolCodigo === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Completá todos los campos.']);
        return;
    }

    // Desde el panel solo se crean cuentas administrativas. Participante se
    // obtiene por inscripción (ver api/register.php) y Publico por
    // autorregistro — no tiene sentido darlas de alta manualmente acá.
    if (!in_array($rolCodigo, ['ADMIN', 'ORGANIZADOR'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Desde acá solo se pueden crear cuentas de Administrador u Organizador.']);
        return;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El correo electrónico no es válido.']);
        return;
    }

    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 8 caracteres.']);
        return;
    }

    if (Usuario::findBy('email', $email) !== null) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Ya existe una cuenta con ese correo.']);
        return;
    }

    $rol = Rol::findBy('nombre_rol', $rolCodigo);
    if ($rol === null) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Rol inválido.']);
        return;
    }

    $id = Usuario::create([
        'id_rol' => $rol['id_rol'],
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
    ]);

    echo json_encode(['success' => true, 'id' => $id]);
}
