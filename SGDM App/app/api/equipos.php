<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Database;
use App\Equipos;
use App\Models\Competidor;
use App\Models\Equipo;
use App\Models\Inscripcion;
use App\Models\Torneo;
use App\Models\Usuario;
use App\RolesTorneo;

/*
 * Equipos. El capitán es solo una etiqueta (quien lo creó); quién entra al
 * equipo lo decide el Organizador del torneo donde está anotado:
 *   - un Usuario público pide unirse     -> 'solicitada' (resuelve el Organizador)
 *   - el Organizador invita a una cuenta -> 'invitada'   (resuelve la persona)
 *   - el Admin asigna                    -> 'aceptada'
 * Las solicitudes/invitaciones se resuelven en api/solicitudes.php
 * (tipo 'unirse_equipo'). Un equipo juega un solo torneo activo a la vez.
 */

// Mientras el torneo está en estas fases se puede cambiar el plantel
const FASES_PLANTEL = ['planificado', 'inscripcion_abierta'];

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];
if ($metodo === 'GET') {
    handleList();
} elseif ($metodo === 'POST') {
    $input = leerInput();
    $accion = (string) ($input['accion'] ?? '');
    if ($accion === 'crear') {
        handleCreate($input);
    } elseif ($accion === 'unirse') {
        handleJoin($input);
    } elseif ($accion === 'invitar') {
        handleInvite($input);
    } else {
        fallar(400, 'Acción inválida.');
    }
} elseif ($metodo === 'DELETE') {
    handleRemove();
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
 * ?mios=1      -> equipos donde soy capitán o integrante, con su plantel.
 * ?idTorneo=N  -> equipos confirmados en ese torneo (consulta pública), con
 *                 cuántos integrantes tienen, para "Solicitar unirme".
 */
function handleList(): void
{
    $pdo = Database::getConnection();

    if (isset($_GET['idTorneo'])) {
        $stmt = $pdo->prepare(
            "SELECT e.id_equipo, e.nombre_equipo,
                    (SELECT COUNT(*) FROM equipo_participante ep
                     WHERE ep.id_equipo = e.id_equipo AND ep.estado = 'aceptada') AS integrantes
             FROM inscripcion i
             JOIN equipo e ON e.id_competidor = i.id_competidor
             WHERE i.id_torneo = ? AND i.estado_inscripcion = 'confirmada'
             ORDER BY e.nombre_equipo"
        );
        $stmt->execute([(int) $_GET['idTorneo']]);
        $equipos = array_map(static fn (array $fila): array => [
            'id' => (int) $fila['id_equipo'],
            'nombre' => $fila['nombre_equipo'],
            'integrantes' => (int) $fila['integrantes'],
        ], $stmt->fetchAll());
        echo json_encode(['success' => true, 'equipos' => $equipos]);
        return;
    }

    $usuario = Auth::requireLogin();
    $stmt = $pdo->prepare(
        "SELECT DISTINCT e.id_equipo, e.nombre_equipo, e.id_usuario
         FROM equipo e
         LEFT JOIN equipo_participante ep ON ep.id_equipo = e.id_equipo AND ep.estado = 'aceptada'
         LEFT JOIN participante p         ON p.id_participante = ep.id_participante
         WHERE e.id_usuario = :yo OR p.id_usuario = :yo2
         ORDER BY e.nombre_equipo"
    );
    $stmt->execute(['yo' => $usuario['id_usuario'], 'yo2' => $usuario['id_usuario']]);

    $plantel = $pdo->prepare(
        "SELECT ep.id_participante, ep.estado, p.nombre_participante, p.id_usuario
         FROM equipo_participante ep
         JOIN participante p ON p.id_participante = ep.id_participante
         WHERE ep.id_equipo = ? AND ep.estado <> 'rechazada'
         ORDER BY p.nombre_participante"
    );
    $equipos = [];
    foreach ($stmt->fetchAll() as $fila) {
        $idEquipo = (int) $fila['id_equipo'];
        $plantel->execute([$idEquipo]);
        $torneo = Equipos::torneoActivo($idEquipo);
        $equipos[] = [
            'id' => $idEquipo,
            'nombre' => $fila['nombre_equipo'],
            'soyCapitan' => (int) $fila['id_usuario'] === $usuario['id_usuario'],
            'integrantes' => array_map(static fn (array $integrante): array => [
                'idParticipante' => (int) $integrante['id_participante'],
                'nombre' => $integrante['nombre_participante'],
                'estado' => $integrante['estado'],
                'soyYo' => (int) $integrante['id_usuario'] === $usuario['id_usuario'],
                'esCapitan' => (int) $integrante['id_usuario'] === (int) $fila['id_usuario'],
            ], $plantel->fetchAll()),
            'torneo' => $torneo === null ? null : [
                'id' => (int) $torneo['id_torneo'],
                'nombre' => $torneo['nombre_torneo'],
                'estado' => $torneo['estado'],
                'inscripcion' => $torneo['estado_inscripcion'],
                'maxIntegrantes' => $torneo['max_integrantes_equipo'] !== null ? (int) $torneo['max_integrantes_equipo'] : null,
            ],
        ];
    }
    echo json_encode(['success' => true, 'equipos' => $equipos]);
}

/**
 * Sin idTorneo: un Usuario público crea su equipo (queda como capitán e
 * integrante) y después lo anota en un torneo con api/solicitudes.php.
 * Con idTorneo: el Organizador/Admin crea un equipo sin capitán, ya
 * confirmado en su torneo.
 */
function handleCreate(array $input): void
{
    $nombre = trim((string) ($input['nombre'] ?? ''));
    $idTorneo = (int) ($input['idTorneo'] ?? 0);
    if ($nombre === '' || mb_strlen($nombre) > 150) {
        fallar(400, 'Indicá un nombre de equipo (hasta 150 caracteres).');
    }

    $pdo = Database::getConnection();
    if ($idTorneo > 0) {
        $torneo = Torneo::find($idTorneo) ?? fallar(404, 'Torneo no encontrado.');
        Auth::requireTorneoRole($idTorneo, 'ORGANIZADOR');
        if (!in_array($torneo['estado'], FASES_PLANTEL, true)) {
            fallar(409, 'Las inscripciones de este torneo ya están cerradas.');
        }
        if (RolesTorneo::cupoLleno($torneo)) {
            fallar(409, 'El torneo ya completó su cupo.');
        }
        $pdo->beginTransaction();
        $idCompetidor = Competidor::create(['tipo_competidor' => 'equipo']);
        $idEquipo = Equipo::create(['id_competidor' => $idCompetidor, 'id_usuario' => null, 'nombre_equipo' => $nombre]);
        Inscripcion::create(['id_torneo' => $idTorneo, 'id_competidor' => $idCompetidor, 'estado_inscripcion' => 'confirmada']);
        $pdo->commit();
        Auditoria::registrar("Alta de equipo $nombre en {$torneo['nombre_torneo']}", 'equipo');
    } else {
        $sesion = Auth::requireRole('PUBLICO');
        $pdo->beginTransaction();
        $idCompetidor = Competidor::create(['tipo_competidor' => 'equipo']);
        $idEquipo = Equipo::create(['id_competidor' => $idCompetidor, 'id_usuario' => $sesion['id_usuario'], 'nombre_equipo' => $nombre]);
        $participante = RolesTorneo::participanteDe(Usuario::find($sesion['id_usuario']));
        Equipos::ponerIntegrante($idEquipo, (int) $participante['id_participante'], 'aceptada');
        $pdo->commit();
        Auditoria::registrar("Alta de equipo $nombre", 'equipo');
    }

    echo json_encode(['success' => true, 'id' => $idEquipo]);
}

/** Torneo activo del equipo con el plantel abierto, o corta con el error. */
function torneoConPlantelAbierto(int $idEquipo): array
{
    $torneo = Equipos::torneoActivo($idEquipo) ?? fallar(409, 'El equipo no está anotado en ningún torneo activo.');
    if (!in_array($torneo['estado'], FASES_PLANTEL, true)) {
        fallar(409, 'Las inscripciones de este torneo ya están cerradas.');
    }
    return $torneo;
}

/** Un Usuario público pide unirse a un equipo que no está completo. */
function handleJoin(array $input): void
{
    $sesion = Auth::requireRole('PUBLICO');
    $idEquipo = (int) ($input['idEquipo'] ?? 0);
    $equipo = Equipo::find($idEquipo) ?? fallar(404, 'Equipo no encontrado.');
    $torneo = torneoConPlantelAbierto($idEquipo);
    if ($torneo['estado'] !== 'inscripcion_abierta') {
        fallar(409, 'Las inscripciones de este torneo no están abiertas.');
    }
    if (Equipos::lleno($idEquipo, $torneo)) {
        fallar(409, 'El equipo ya está completo.');
    }
    if (RolesTorneo::yaVinculado($sesion['id_usuario'], (int) $torneo['id_torneo'])) {
        fallar(409, 'Ya tenés un rol, una solicitud o una invitación en este torneo.');
    }

    $participante = RolesTorneo::participanteDe(Usuario::find($sesion['id_usuario']));
    Equipos::ponerIntegrante($idEquipo, (int) $participante['id_participante'], 'solicitada');
    Auditoria::registrar("Solicitud para unirse al equipo {$equipo['nombre_equipo']}: {$torneo['nombre_torneo']}", 'equipo_participante');
    echo json_encode(['success' => true]);
}

/** El Organizador invita a una cuenta al equipo; el Admin la suma directo. */
function handleInvite(array $input): void
{
    $sesion = Auth::requireLogin();
    $idEquipo = (int) ($input['idEquipo'] ?? 0);
    $equipo = Equipo::find($idEquipo) ?? fallar(404, 'Equipo no encontrado.');
    $torneo = torneoConPlantelAbierto($idEquipo);
    Auth::requireTorneoRole((int) $torneo['id_torneo'], 'ORGANIZADOR');

    $invitado = RolesTorneo::cuentaParaSumar((string) ($input['email'] ?? ''), (int) $torneo['id_torneo']);
    if (is_string($invitado)) {
        fallar(409, $invitado);
    }
    $esAdmin = $sesion['rol'] === 'ADMIN';
    if ($esAdmin && Equipos::lleno($idEquipo, $torneo)) {
        fallar(409, 'El equipo ya está completo.');
    }

    $pdo = Database::getConnection();
    $pdo->beginTransaction();
    $participante = RolesTorneo::participanteDe($invitado);
    Equipos::ponerIntegrante($idEquipo, (int) $participante['id_participante'], $esAdmin ? 'aceptada' : 'invitada');
    $pdo->commit();

    Auditoria::registrar(($esAdmin ? 'Asignó' : 'Invitó') . " a {$invitado['email']} al equipo {$equipo['nombre_equipo']}: {$torneo['nombre_torneo']}", 'equipo_participante');
    echo json_encode(['success' => true, 'asignado' => $esAdmin]);
}

/**
 * ?idEquipo=&idParticipante= : sacar a un integrante (Organizador/Admin) o
 * salir uno mismo del equipo, mientras el plantel esté abierto.
 */
function handleRemove(): void
{
    $sesion = Auth::requireLogin();
    $idEquipo = (int) ($_GET['idEquipo'] ?? 0);
    $fila = Equipos::integrante($idEquipo, (int) ($_GET['idParticipante'] ?? 0)) ?? fallar(404, 'Integrante no encontrado.');
    $torneo = Equipos::torneoActivo($idEquipo);
    if ($torneo !== null && !in_array($torneo['estado'], FASES_PLANTEL, true)) {
        fallar(409, 'Las inscripciones de este torneo ya están cerradas: el plantel no se puede cambiar.');
    }

    $esUnoMismo = (int) $fila['id_usuario'] === $sesion['id_usuario'];
    if (!$esUnoMismo) {
        if ($torneo === null) {
            Auth::requireRole('ADMIN');
        } else {
            Auth::requireTorneoRole((int) $torneo['id_torneo'], 'ORGANIZADOR');
        }
    }

    Database::getConnection()
        ->prepare('DELETE FROM equipo_participante WHERE id_equipo = ? AND id_participante = ?')
        ->execute([$idEquipo, $fila['id_participante']]);
    $accion = $esUnoMismo ? 'Salió del equipo ' : "Sacó a {$fila['nombre_participante']} del equipo ";
    Auditoria::registrar($accion . $fila['nombre_equipo'], 'equipo_participante');
    echo json_encode(['success' => true]);
}
