<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Database;
use App\Equipos;
use App\Models\Equipo;
use App\Models\Inscripcion;
use App\Models\Torneo;
use App\Models\TorneoArbitro;
use App\Models\Usuario;
use App\RolesTorneo;

const TIPO_POR_ROL = ['ORGANIZADOR' => 'crear_torneo', 'ARBITRO' => 'arbitrar', 'PARTICIPANTE' => 'participar'];
const NOMBRE_TIPO = ['crear_torneo' => 'crear el torneo', 'arbitrar' => 'arbitrar', 'participar' => 'participar', 'unirse_equipo' => 'unirse a un equipo'];
const TABLA_POR_TIPO = ['crear_torneo' => 'torneo', 'arbitrar' => 'torneo_arbitro', 'participar' => 'inscripcion', 'unirse_equipo' => 'equipo_participante'];

const FASES_SOLICITUD = ['participar' => ['inscripcion_abierta'], 'arbitrar' => ['planificado', 'inscripcion_abierta', 'inscripcion_cerrada']];
const FASES_ALTA = ['participar' => ['planificado', 'inscripcion_abierta'], 'arbitrar' => ['planificado', 'inscripcion_abierta', 'inscripcion_cerrada']];

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];
if ($metodo === 'GET') {
    handleList();
} elseif ($metodo === 'POST') {
    handleCreate();
} elseif ($metodo === 'PATCH') {
    handleResolve();
} else {
    fallar(405, 'Método no permitido.');
}
exit;

function fallar(int $status, string $error): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

function leerInput(): array
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : $_POST;
}

function handleList(): void
{
    $usuario = Auth::requireLogin();

    $sql = "SELECT v.rol, v.id_origen, v.id_torneo, v.estado_solicitud, v.activo,
                   t.nombre_torneo, t.estado AS estado_torneo,
                   u.nombre, u.apellido, u.email, e.nombre_equipo
            FROM vista_rol_torneo v
            JOIN torneo t  ON t.id_torneo  = v.id_torneo
            JOIN usuario u ON u.id_usuario = v.id_usuario
            LEFT JOIN inscripcion i ON v.rol = 'PARTICIPANTE' AND i.id_inscripcion = v.id_origen
            LEFT JOIN equipo e      ON e.id_competidor = i.id_competidor";
    $params = [];
    $misTorneos = "SELECT id_torneo FROM vista_rol_torneo WHERE id_usuario = :yo AND rol = 'ORGANIZADOR' AND activo = 1";

    if (($_GET['ambito'] ?? '') === 'mias') {
        $sql .= ' WHERE v.id_usuario = :yo';
        $params['yo'] = $usuario['id_usuario'];
        $equipos = Equipos::solicitudes("u.id_usuario = :yo AND ep.estado <> 'aceptada'", ['yo' => $usuario['id_usuario']]);
    } elseif ($usuario['rol'] === 'ADMIN') {
        $sql .= " WHERE v.estado_solicitud = 'pendiente'";
        $equipos = Equipos::solicitudes("ep.estado = 'solicitada'", []);
    } else {
        $sql .= " WHERE v.estado_solicitud = 'pendiente' AND v.rol <> 'ORGANIZADOR' AND v.id_torneo IN ($misTorneos)";
        $params['yo'] = $usuario['id_usuario'];
        $equipos = Equipos::solicitudes("ep.estado = 'solicitada' AND t.id_torneo IN ($misTorneos)", ['yo' => $usuario['id_usuario']]);
    }
    $sql .= ' ORDER BY t.nombre_torneo, v.rol';

    $stmt = Database::getConnection()->prepare($sql);
    $stmt->execute($params);

    $solicitudes = array_map(static fn (array $fila): array => [
        'tipo' => TIPO_POR_ROL[$fila['rol']],
        'id' => (int) $fila['id_origen'],
        'equipo' => $fila['nombre_equipo'],
        'rol' => $fila['rol'],
        'idTorneo' => (int) $fila['id_torneo'],
        'torneo' => $fila['nombre_torneo'],
        'estadoTorneo' => $fila['estado_torneo'],
        'estado' => $fila['estado_solicitud'],
        'activo' => (bool) $fila['activo'],
        'solicitante' => trim($fila['nombre'] . ' ' . $fila['apellido']),
        'email' => $fila['email'],
    ], $stmt->fetchAll());

    echo json_encode(['success' => true, 'solicitudes' => array_merge($solicitudes, $equipos)]);
}

function handleCreate(): void
{
    $input = leerInput();
    $tipo = (string) ($input['tipo'] ?? '');
    if ($tipo === 'invitar') {
        handleInvite($input);
        return;
    }

    $sesion = Auth::requireRole('PUBLICO');
    $idTorneo = (int) ($input['idTorneo'] ?? 0);
    $idEquipo = (int) ($input['idEquipo'] ?? 0);

    if (!in_array($tipo, ['arbitrar', 'participar'], true)) {
        fallar(400, 'Tipo de solicitud inválido.');
    }
    $torneo = $idTorneo > 0 ? Torneo::find($idTorneo) : null;
    if ($torneo === null || !in_array($torneo['estado'], FASES_SOLICITUD[$tipo], true)) {
        fallar(400, $tipo === 'participar' ? 'Las inscripciones de este torneo no están abiertas.' : 'Este torneo no está recibiendo árbitros.');
    }
    if ($tipo === 'participar' && RolesTorneo::cupoLleno($torneo)) {
        fallar(409, 'El torneo ya completó su cupo.');
    }
    if (RolesTorneo::yaVinculado($sesion['id_usuario'], $idTorneo)) {
        fallar(409, 'Ya tenés un rol, una solicitud o una invitación en este torneo.');
    }

    $pdo = Database::getConnection();
    $que = NOMBRE_TIPO[$tipo];
    if ($tipo === 'arbitrar') {
        RolesTorneo::agregarArbitro($sesion['id_usuario'], $idTorneo, 'pendiente');
    } elseif ($idEquipo > 0) {
        $equipo = Equipo::find($idEquipo);
        if ($equipo === null || (int) $equipo['id_usuario'] !== $sesion['id_usuario']) {
            fallar(403, 'Solo quien creó el equipo puede anotarlo en un torneo.');
        }
        if (Equipos::torneoActivo($idEquipo) !== null) {
            fallar(409, 'El equipo ya está anotado en otro torneo que no terminó.');
        }
        $stmt = $pdo->prepare(
            "SELECT p.id_usuario, p.nombre_participante FROM equipo_participante ep
             JOIN participante p ON p.id_participante = ep.id_participante
             WHERE ep.id_equipo = ? AND ep.estado = 'aceptada'"
        );
        $stmt->execute([$idEquipo]);
        $integrantes = $stmt->fetchAll();
        if ($torneo['max_integrantes_equipo'] !== null && count($integrantes) > (int) $torneo['max_integrantes_equipo']) {
            fallar(409, 'El equipo tiene más integrantes de los que permite este torneo.');
        }
        foreach ($integrantes as $integrante) {
            if (RolesTorneo::yaVinculado((int) $integrante['id_usuario'], $idTorneo)) {
                fallar(409, "{$integrante['nombre_participante']} ya tiene un rol o una solicitud en este torneo.");
            }
        }
        Inscripcion::create([
            'id_torneo' => $idTorneo,
            'id_competidor' => $equipo['id_competidor'],
            'estado_inscripcion' => 'pendiente',
        ]);
        $que = "anotar el equipo {$equipo['nombre_equipo']}";
    } else {
        $pdo->beginTransaction();
        RolesTorneo::inscribirParticipante(Usuario::find($sesion['id_usuario']), $idTorneo, 'pendiente');
        $pdo->commit();
    }

    Auditoria::registrar("Solicitud para $que: {$torneo['nombre_torneo']}", TABLA_POR_TIPO[$tipo]);
    echo json_encode(['success' => true]);
}

function handleInvite(array $input): void
{
    $sesion = Auth::requireLogin();
    $rol = (string) ($input['rol'] ?? '');
    $idTorneo = (int) ($input['idTorneo'] ?? 0);
    if (!in_array($rol, ['participar', 'arbitrar'], true)) {
        fallar(400, 'Indicá si es para participar o para arbitrar.');
    }
    $torneo = ($idTorneo > 0 ? Torneo::find($idTorneo) : null) ?? fallar(404, 'Torneo no encontrado.');
    Auth::requireTorneoRole($idTorneo, 'ORGANIZADOR');
    if (!in_array($torneo['estado'], FASES_ALTA[$rol], true)) {
        fallar(409, 'En esta fase del torneo ya no se puede sumar a nadie para ' . NOMBRE_TIPO[$rol] . '.');
    }
    $invitado = RolesTorneo::cuentaParaSumar((string) ($input['email'] ?? ''), $idTorneo);
    if (is_string($invitado)) {
        fallar(409, $invitado);
    }

    $esAdmin = $sesion['rol'] === 'ADMIN';
    if ($rol === 'participar') {
        if (RolesTorneo::cupoLleno($torneo)) {
            fallar(409, 'El torneo ya completó su cupo.');
        }
        $pdo = Database::getConnection();
        $pdo->beginTransaction();
        RolesTorneo::inscribirParticipante($invitado, $idTorneo, $esAdmin ? 'confirmada' : 'invitada');
        $pdo->commit();
    } else {
        RolesTorneo::agregarArbitro($invitado['id_usuario'], $idTorneo, $esAdmin ? 'aprobada' : 'invitada');
    }

    Auditoria::registrar(($esAdmin ? 'Asignó' : 'Invitó') . " a {$invitado['email']} para " . NOMBRE_TIPO[$rol] . ": {$torneo['nombre_torneo']}", TABLA_POR_TIPO[$rol]);
    echo json_encode(['success' => true, 'asignado' => $esAdmin]);
}

function autorizarResolucion(string $estado, int $idUsuarioFila, int $idTorneo): bool
{
    if ($estado === 'invitada') {
        if (Auth::requireLogin()['id_usuario'] !== $idUsuarioFila) {
            fallar(403, 'Esta invitación es para otra persona.');
        }
        return true;
    }
    if ($estado !== 'pendiente') {
        fallar(409, 'Esta solicitud ya fue resuelta.');
    }
    Auth::requireTorneoRole($idTorneo, 'ORGANIZADOR');
    return false;
}

function handleResolve(): void
{
    $input = leerInput();
    $tipo = (string) ($input['tipo'] ?? '');
    $id = (int) ($input['id'] ?? 0);
    $aprobar = ($input['accion'] ?? '') === 'aprobar';
    if (!in_array($input['accion'] ?? '', ['aprobar', 'rechazar'], true)) {
        fallar(400, 'Acción inválida.');
    }
    $esInvitacion = false;

    if ($tipo === 'crear_torneo') {
        Auth::requireRole('ADMIN');
        $torneo = Torneo::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        if ($torneo['estado'] !== 'solicitado') {
            fallar(409, 'Esta solicitud ya fue resuelta.');
        }
        Torneo::update($id, ['estado' => $aprobar ? 'planificado' : 'rechazado']);
    } elseif ($tipo === 'arbitrar') {
        $fila = TorneoArbitro::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        $esInvitacion = autorizarResolucion($fila['estado_solicitud'], (int) $fila['id_usuario'], (int) $fila['id_torneo']);
        $torneo = Torneo::find((int) $fila['id_torneo']);
        if ($aprobar && !in_array($torneo['estado'], FASES_ALTA['arbitrar'], true)) {
            fallar(409, 'Este torneo ya no suma árbitros.');
        }
        TorneoArbitro::update($id, ['estado_solicitud' => $aprobar ? 'aprobada' : 'rechazada']);
    } elseif ($tipo === 'participar') {
        $fila = Inscripcion::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        $stmt = Database::getConnection()->prepare(
            'SELECT COALESCE(p.id_usuario, e.id_usuario) FROM inscripcion i
             LEFT JOIN participante p ON p.id_competidor = i.id_competidor
             LEFT JOIN equipo e       ON e.id_competidor = i.id_competidor
             WHERE i.id_inscripcion = ?'
        );
        $stmt->execute([$id]);
        $esInvitacion = autorizarResolucion($fila['estado_inscripcion'], (int) $stmt->fetchColumn(), (int) $fila['id_torneo']);
        $torneo = Torneo::find((int) $fila['id_torneo']);
        if ($aprobar && !in_array($torneo['estado'], FASES_ALTA['participar'], true)) {
            fallar(409, 'Las inscripciones de este torneo ya están cerradas.');
        }
        if ($aprobar && RolesTorneo::cupoLleno($torneo)) {
            fallar(409, 'El torneo ya completó su cupo.');
        }
        Inscripcion::update($id, ['estado_inscripcion' => $aprobar ? 'confirmada' : 'rechazada']);
    } elseif ($tipo === 'unirse_equipo') {
        $idEquipo = (int) ($input['idEquipo'] ?? 0);
        $fila = Equipos::integrante($idEquipo, $id) ?? fallar(404, 'Solicitud no encontrada.');
        $torneo = Equipos::torneoActivo($idEquipo) ?? fallar(409, 'El equipo no está anotado en un torneo activo.');
        $estado = ['solicitada' => 'pendiente', 'invitada' => 'invitada'][$fila['estado']] ?? 'resuelta';
        $esInvitacion = autorizarResolucion($estado, (int) $fila['id_usuario'], (int) $torneo['id_torneo']);
        if ($aprobar && !in_array($torneo['estado'], FASES_ALTA['participar'], true)) {
            fallar(409, 'Las inscripciones de este torneo ya están cerradas.');
        }
        if ($aprobar && Equipos::lleno($idEquipo, $torneo)) {
            fallar(409, 'El equipo ya está completo.');
        }
        Equipos::cambiarEstado($idEquipo, $id, $aprobar ? 'aceptada' : 'rechazada');
    } else {
        fallar(400, 'Tipo de solicitud inválido.');
    }

    $accion = $esInvitacion
        ? ($aprobar ? 'Aceptó la invitación para ' : 'Rechazó la invitación para ')
        : ($aprobar ? 'Aprobó solicitud para ' : 'Rechazó solicitud para ');
    Auditoria::registrar($accion . NOMBRE_TIPO[$tipo] . ": {$torneo['nombre_torneo']}", TABLA_POR_TIPO[$tipo]);
    echo json_encode(['success' => true]);
}
