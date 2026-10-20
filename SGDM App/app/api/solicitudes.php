<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Database;
use App\Models\Inscripcion;
use App\Models\Torneo;
use App\Models\TorneoArbitro;
use App\Models\Usuario;
use App\RolesTorneo;

/*
 * Solicitudes de rol por torneo. Cada solicitud es una fila de
 * vista_rol_torneo con estado_solicitud = 'pendiente':
 *   crear_torneo -> torneo 'solicitado'          (aprueba solo el Admin)
 *   arbitrar     -> torneo_arbitro 'pendiente'   (aprueba el Organizador o el Admin)
 *   participar   -> inscripcion 'pendiente'      (aprueba el Organizador o el Admin)
 * El id de cada solicitud es el de su fila de origen (vista_rol_torneo.id_origen).
 */

const TIPO_POR_ROL = ['ORGANIZADOR' => 'crear_torneo', 'ARBITRO' => 'arbitrar', 'PARTICIPANTE' => 'participar'];
const NOMBRE_TIPO = ['crear_torneo' => 'crear el torneo', 'arbitrar' => 'arbitrar', 'participar' => 'participar'];
const TABLA_POR_TIPO = ['crear_torneo' => 'torneo', 'arbitrar' => 'torneo_arbitro', 'participar' => 'inscripcion'];

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

/**
 * ?ambito=mias -> todos mis roles y solicitudes (para el perfil).
 * Sin ámbito   -> pendientes que me toca resolver: el Admin ve todas; el
 *                 Organizador, las de árbitro/participante de sus torneos.
 */
function handleList(): void
{
    $usuario = Auth::requireLogin();

    $sql = 'SELECT v.rol, v.id_origen, v.id_torneo, v.estado_solicitud, v.activo,
                   t.nombre_torneo, t.estado AS estado_torneo,
                   u.nombre, u.apellido, u.email
            FROM vista_rol_torneo v
            JOIN torneo t  ON t.id_torneo  = v.id_torneo
            JOIN usuario u ON u.id_usuario = v.id_usuario';
    $params = [];

    if (($_GET['ambito'] ?? '') === 'mias') {
        $sql .= ' WHERE v.id_usuario = :yo';
        $params['yo'] = $usuario['id_usuario'];
    } elseif ($usuario['rol'] === 'ADMIN') {
        $sql .= " WHERE v.estado_solicitud = 'pendiente'";
    } else {
        $sql .= " WHERE v.estado_solicitud = 'pendiente' AND v.rol <> 'ORGANIZADOR'
                  AND v.id_torneo IN (SELECT id_torneo FROM vista_rol_torneo
                                      WHERE id_usuario = :yo AND rol = 'ORGANIZADOR' AND activo = 1)";
        $params['yo'] = $usuario['id_usuario'];
    }
    $sql .= ' ORDER BY t.nombre_torneo, v.rol';

    $stmt = Database::getConnection()->prepare($sql);
    $stmt->execute($params);

    $solicitudes = array_map(static fn (array $fila): array => [
        'tipo' => TIPO_POR_ROL[$fila['rol']],
        'id' => (int) $fila['id_origen'],
        'rol' => $fila['rol'],
        'idTorneo' => (int) $fila['id_torneo'],
        'torneo' => $fila['nombre_torneo'],
        'estadoTorneo' => $fila['estado_torneo'],
        'estado' => $fila['estado_solicitud'],
        'activo' => (bool) $fila['activo'],
        'solicitante' => trim($fila['nombre'] . ' ' . $fila['apellido']),
        'email' => $fila['email'],
    ], $stmt->fetchAll());

    echo json_encode(['success' => true, 'solicitudes' => $solicitudes]);
}

/** Un Usuario público pide arbitrar o participar en un torneo. */
function handleCreate(): void
{
    $sesion = Auth::requireRole('PUBLICO');
    $input = leerInput();
    $tipo = (string) ($input['tipo'] ?? '');
    $idTorneo = (int) ($input['idTorneo'] ?? 0);

    if (!in_array($tipo, ['arbitrar', 'participar'], true)) {
        fallar(400, 'Tipo de solicitud inválido.');
    }
    $torneo = $idTorneo > 0 ? Torneo::find($idTorneo) : null;
    if ($torneo === null || !in_array($torneo['estado'], ['planificado', 'inscripcion_abierta'], true)) {
        fallar(400, 'Este torneo no está recibiendo solicitudes.');
    }
    // Cubre también al organizador (ya figura en la vista) y evita que un
    // árbitro participe en el mismo torneo o al revés.
    if (RolesTorneo::yaVinculado($sesion['id_usuario'], $idTorneo)) {
        fallar(409, 'Ya tenés un rol o una solicitud en este torneo.');
    }

    if ($tipo === 'arbitrar') {
        RolesTorneo::agregarArbitro($sesion['id_usuario'], $idTorneo, 'pendiente');
    } else {
        $pdo = Database::getConnection();
        $pdo->beginTransaction();
        RolesTorneo::inscribirParticipante(Usuario::find($sesion['id_usuario']), $idTorneo, 'pendiente');
        $pdo->commit();
    }

    Auditoria::registrar('Solicitud para ' . NOMBRE_TIPO[$tipo] . ": {$torneo['nombre_torneo']}", TABLA_POR_TIPO[$tipo]);
    echo json_encode(['success' => true]);
}

/** Aprobar o rechazar una solicitud pendiente. */
function handleResolve(): void
{
    $input = leerInput();
    $tipo = (string) ($input['tipo'] ?? '');
    $id = (int) ($input['id'] ?? 0);
    $aprobar = ($input['accion'] ?? '') === 'aprobar';
    if (!in_array($input['accion'] ?? '', ['aprobar', 'rechazar'], true)) {
        fallar(400, 'Acción inválida.');
    }

    if ($tipo === 'crear_torneo') {
        Auth::requireRole('ADMIN');
        $torneo = Torneo::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        if ($torneo['estado'] !== 'solicitado') {
            fallar(409, 'Esta solicitud ya fue resuelta.');
        }
        Torneo::update($id, ['estado' => $aprobar ? 'planificado' : 'rechazado']);
    } elseif ($tipo === 'arbitrar') {
        $fila = TorneoArbitro::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        Auth::requireTorneoRole((int) $fila['id_torneo'], 'ORGANIZADOR');
        if ($fila['estado_solicitud'] !== 'pendiente') {
            fallar(409, 'Esta solicitud ya fue resuelta.');
        }
        TorneoArbitro::update($id, ['estado_solicitud' => $aprobar ? 'aprobada' : 'rechazada']);
        $torneo = Torneo::find((int) $fila['id_torneo']);
    } elseif ($tipo === 'participar') {
        $fila = Inscripcion::find($id) ?? fallar(404, 'Solicitud no encontrada.');
        Auth::requireTorneoRole((int) $fila['id_torneo'], 'ORGANIZADOR');
        if ($fila['estado_inscripcion'] !== 'pendiente') {
            fallar(409, 'Esta solicitud ya fue resuelta.');
        }
        $torneo = Torneo::find((int) $fila['id_torneo']);
        if ($aprobar && $torneo['cupo_maximo'] !== null && confirmados((int) $torneo['id_torneo']) >= (int) $torneo['cupo_maximo']) {
            fallar(409, 'El torneo ya completó su cupo.');
        }
        Inscripcion::update($id, ['estado_inscripcion' => $aprobar ? 'confirmada' : 'rechazada']);
    } else {
        fallar(400, 'Tipo de solicitud inválido.');
    }

    Auditoria::registrar(($aprobar ? 'Aprobó' : 'Rechazó') . ' solicitud para ' . NOMBRE_TIPO[$tipo] . ": {$torneo['nombre_torneo']}", TABLA_POR_TIPO[$tipo]);
    echo json_encode(['success' => true]);
}

function confirmados(int $idTorneo): int
{
    $stmt = Database::getConnection()->prepare(
        "SELECT COUNT(*) FROM inscripcion WHERE id_torneo = ? AND estado_inscripcion = 'confirmada'"
    );
    $stmt->execute([$idTorneo]);
    return (int) $stmt->fetchColumn();
}
