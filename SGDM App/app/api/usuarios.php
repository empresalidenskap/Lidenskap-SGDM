<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Database;
use App\Models\Rol;
use App\Models\Torneo;
use App\Models\Usuario;
use App\RoleLabels;
use App\RolesTorneo;

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

    $pdo = Database::getConnection();
    $sql = 'SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.estado, r.nombre_rol
            FROM usuario u
            JOIN rol r ON r.id_rol = u.id_rol
            ORDER BY u.id_usuario ASC';
    $filas = $pdo->query($sql)->fetchAll();

    // Roles por torneo activos de todos los usuarios, agrupados por usuario
    $rolesPorUsuario = [];
    $roles = $pdo->query(
        'SELECT v.id_usuario, v.rol, t.nombre_torneo
         FROM vista_rol_torneo v
         JOIN torneo t ON t.id_torneo = v.id_torneo
         WHERE v.activo = 1'
    )->fetchAll();
    foreach ($roles as $rol) {
        $rolesPorUsuario[$rol['id_usuario']][] = ['rol' => $rol['rol'], 'torneo' => $rol['nombre_torneo']];
    }

    $usuarios = array_map(static function (array $fila) use ($rolesPorUsuario): array {
        return [
            'id' => (int) $fila['id_usuario'],
            'nombre' => $fila['nombre'],
            'apellido' => $fila['apellido'],
            'email' => $fila['email'],
            'rol' => $fila['nombre_rol'],
            'rolesTorneo' => $rolesPorUsuario[$fila['id_usuario']] ?? [],
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
    $idTorneo = (int) ($input['idTorneo'] ?? 0);

    if ($nombre === '' || $apellido === '' || $email === '' || $password === '' || $rolCodigo === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Completá todos los campos.']);
        return;
    }

    // Admin es el único rol global que se crea desde acá. Organizador, Árbitro
    // y Participante son roles de un torneo: la cuenta queda como Usuario
    // público y se le asigna el rol en el torneo elegido.
    if (!in_array($rolCodigo, ['ADMIN', 'ORGANIZADOR', 'ARBITRO', 'PARTICIPANTE'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Rol inválido.']);
        return;
    }

    $torneo = null;
    if ($rolCodigo !== 'ADMIN') {
        $torneo = $idTorneo > 0 ? Torneo::find($idTorneo) : null;
        if ($torneo === null || !in_array($torneo['estado'], ['planificado', 'en_curso'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Elegí un torneo vigente para asignarle el rol.']);
            return;
        }
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

    $rol = Rol::findBy('nombre_rol', $rolCodigo === 'ADMIN' ? 'ADMIN' : 'PUBLICO');
    if ($rol === null) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Rol inválido.']);
        return;
    }

    $pdo = Database::getConnection();
    $pdo->beginTransaction();

    $datosUsuario = [
        'id_rol' => $rol['id_rol'],
        'nombre' => $nombre,
        'apellido' => $apellido,
        'email' => $email,
        'password' => password_hash($password, PASSWORD_DEFAULT),
    ];
    $id = Usuario::create($datosUsuario);

    if ($rolCodigo === 'ORGANIZADOR') {
        Torneo::update($idTorneo, ['id_usuario_organizador' => $id]);
    } elseif ($rolCodigo === 'ARBITRO') {
        RolesTorneo::agregarArbitro($id, $idTorneo, 'aprobada');
    } elseif ($rolCodigo === 'PARTICIPANTE') {
        RolesTorneo::inscribirParticipante(['id_usuario' => $id] + $datosUsuario, $idTorneo, 'confirmada');
    }

    $pdo->commit();

    $detalle = $torneo !== null ? " en {$torneo['nombre_torneo']}" : '';
    Auditoria::registrar('Alta de usuario ' . RoleLabels::forCode($rolCodigo) . "$detalle: $email", 'usuario');

    echo json_encode(['success' => true, 'id' => $id]);
}
