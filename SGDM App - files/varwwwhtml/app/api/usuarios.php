<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Correo;
use App\Database;
use App\Equipos;
use App\Models\Equipo;
use App\Models\Rol;
use App\Models\Torneo;
use App\Models\Usuario;
use App\Password;
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

    if ($nombre === '' || $apellido === '' || $email === '' || $rolCodigo === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Completá todos los campos.']);
        return;
    }

    if (!in_array($rolCodigo, ['ADMIN', 'ORGANIZADOR', 'ARBITRO', 'PARTICIPANTE'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Rol inválido.']);
        return;
    }

    $idEquipo = (int) ($input['idEquipo'] ?? 0);
    if ($rolCodigo === 'PARTICIPANTE' && $idEquipo > 0) {
        $torneoEquipo = Equipos::torneoActivo($idEquipo);
        if ($torneoEquipo === null || !in_array($torneoEquipo['estado'], ['planificado', 'inscripcion_abierta'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Ese equipo no está anotado en un torneo con las inscripciones abiertas.']);
            return;
        }
        if (Equipos::lleno($idEquipo, $torneoEquipo)) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'El equipo ya está completo.']);
            return;
        }
        $idTorneo = (int) $torneoEquipo['id_torneo'];
    } else {
        $idEquipo = 0;
    }

    $torneo = null;
    if ($rolCodigo !== 'ADMIN') {
        $torneo = $idTorneo > 0 ? Torneo::find($idTorneo) : null;
        if ($torneo === null || !in_array($torneo['estado'], ['planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso'], true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Elegí un torneo vigente para asignarle el rol.']);
            return;
        }
        if ($rolCodigo === 'PARTICIPANTE' && $idEquipo === 0
            && (!in_array($torneo['estado'], ['planificado', 'inscripcion_abierta'], true) || RolesTorneo::cupoLleno($torneo))) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Ese torneo ya no suma participantes (inscripciones cerradas o cupo completo).']);
            return;
        }
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El correo electrónico no es válido.']);
        return;
    }

    $sinPassword = $password === '';
    if ($sinPassword && !Correo::configurado()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'El envío de correos no está configurado en el servidor: poné una contraseña inicial.']);
        return;
    }
    $problema = $sinPassword ? null : Password::validar($password);
    if ($problema !== null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $problema]);
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
        'password' => password_hash($sinPassword ? bin2hex(random_bytes(16)) : $password, PASSWORD_DEFAULT),
    ];
    $id = Usuario::create($datosUsuario);

    if ($rolCodigo === 'ORGANIZADOR') {
        Torneo::update($idTorneo, ['id_usuario_organizador' => $id]);
    } elseif ($rolCodigo === 'ARBITRO') {
        RolesTorneo::agregarArbitro($id, $idTorneo, 'aprobada');
    } elseif ($rolCodigo === 'PARTICIPANTE' && $idEquipo > 0) {
        $participante = RolesTorneo::participanteDe(['id_usuario' => $id] + $datosUsuario);
        Equipos::ponerIntegrante($idEquipo, (int) $participante['id_participante'], 'aceptada');
    } elseif ($rolCodigo === 'PARTICIPANTE') {
        RolesTorneo::inscribirParticipante(['id_usuario' => $id] + $datosUsuario, $idTorneo, 'confirmada');
    }

    $pdo->commit();

    $detalle = $torneo !== null ? " en {$torneo['nombre_torneo']}" : '';
    $mensaje = 'Usuario creado.';
    $enviado = null;
    if ($sinPassword) {
        $equipo = $idEquipo > 0 ? Equipo::find($idEquipo) : null;
        $rolTexto = RoleLabels::forCode($rolCodigo) . ($equipo !== null ? " del equipo {$equipo['nombre_equipo']}" : '') . $detalle;
        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        $urlSitio = ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['SCRIPT_NAME'], 2), '/\\') . '/';
        $enviado = Password::enviarBienvenida($datosUsuario, $rolTexto, $urlSitio);
        $mensaje = $enviado
            ? "Usuario creado. Le mandamos un correo a {$email} para que elija su contraseña."
            : 'Usuario creado, pero no se pudo mandar el correo: que entre con "¿Olvidaste tu contraseña?".';
    }
    Auditoria::registrar(
        'Alta de usuario ' . RoleLabels::forCode($rolCodigo) . "$detalle: $email", 'usuario', null,
        $enviado === null ? null : ($enviado ? 'Sin contraseña: se envió el correo de bienvenida' : 'Sin contraseña: falló el correo de bienvenida')
    );

    echo json_encode(['success' => true, 'id' => $id, 'mensaje' => $mensaje]);
}
