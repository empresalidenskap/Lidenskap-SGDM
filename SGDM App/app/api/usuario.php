<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Models\Rol;
use App\Models\Usuario;

header('Content-Type: application/json; charset=utf-8');

$sesion = Auth::requireRole('ADMIN');

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Falta el id del usuario.']);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'PUT' || $metodo === 'PATCH') {
    $usuario = Usuario::find($id);
    if ($usuario === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = [];
    }

    $datos = [];
    if (isset($input['nombre']) && trim((string) $input['nombre']) !== '') {
        $datos['nombre'] = trim((string) $input['nombre']);
    }
    if (isset($input['apellido']) && trim((string) $input['apellido']) !== '') {
        $datos['apellido'] = trim((string) $input['apellido']);
    }
    if (isset($input['email']) && trim((string) $input['email']) !== '') {
        $email = strtolower(trim((string) $input['email']));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El correo electrónico no es válido.']);
            exit;
        }
        $existente = Usuario::findBy('email', $email);
        if ($existente !== null && (int) $existente['id_usuario'] !== $id) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Ya existe otra cuenta con ese correo.']);
            exit;
        }
        $datos['email'] = $email;
    }
    if (isset($input['rol'])) {
        $rol = Rol::findBy('nombre_rol', (string) $input['rol']);
        if ($rol === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Rol inválido.']);
            exit;
        }
        $datos['id_rol'] = $rol['id_rol'];
    }

    if ($datos === []) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No hay cambios para guardar.']);
        exit;
    }

    Usuario::update($id, $datos);
    echo json_encode(['success' => true]);
    exit;
}

if ($metodo === 'DELETE') {
    if ($id === (int) $sesion['id_usuario']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No podés desactivar tu propia cuenta.']);
        exit;
    }
    if (Usuario::find($id) === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Usuario no encontrado.']);
        exit;
    }
    // Baja lógica, no DELETE físico: el usuario puede ser organizador de
    // torneos o dueño de un participante/equipo (FK sin ON DELETE CASCADE
    // a propósito, para no perder historial de competencia).
    Usuario::update($id, ['estado' => 'inactivo']);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
