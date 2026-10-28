<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Database;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    cambiarCabezaDeSerie();
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$usuario = Auth::requireLogin();
$pdo = Database::getConnection();

$sql = "SELECT i.id_inscripcion, i.id_torneo, i.estado_inscripcion, i.numero_sorteo, i.cabeza_serie,
               t.nombre_torneo, t.estado AS estado_torneo, t.max_integrantes_equipo,
               c.tipo_competidor, pa.nombre_participante,
               e.id_equipo, e.nombre_equipo,
               CONCAT(cap.nombre, ' ', cap.apellido) AS capitan, e.id_usuario AS id_capitan
        FROM inscripcion i
        JOIN torneo t            ON t.id_torneo     = i.id_torneo
        JOIN competidor c        ON c.id_competidor = i.id_competidor
        LEFT JOIN participante pa ON pa.id_competidor = c.id_competidor
        LEFT JOIN equipo e        ON e.id_competidor  = c.id_competidor
        LEFT JOIN usuario cap     ON cap.id_usuario   = e.id_usuario";
$params = [];
if ($usuario['rol'] !== 'ADMIN') {
    $sql .= " WHERE i.id_torneo IN (SELECT id_torneo FROM vista_rol_torneo
                                    WHERE id_usuario = :yo AND rol = 'ORGANIZADOR' AND activo = 1)";
    $params['yo'] = $usuario['id_usuario'];
}
$sql .= ' ORDER BY t.nombre_torneo, i.fecha_inscripcion';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$plantel = $pdo->prepare(
    "SELECT ep.id_participante, ep.estado, p.nombre_participante, p.id_usuario
     FROM equipo_participante ep
     JOIN participante p ON p.id_participante = ep.id_participante
     WHERE ep.id_equipo = ? AND ep.estado <> 'rechazada'
     ORDER BY p.nombre_participante"
);

$inscripciones = [];
foreach ($stmt->fetchAll() as $fila) {
    $esEquipo = $fila['tipo_competidor'] === 'equipo';
    $integrantes = [];
    if ($esEquipo) {
        $plantel->execute([$fila['id_equipo']]);
        $integrantes = array_map(static fn (array $integrante): array => [
            'idParticipante' => (int) $integrante['id_participante'],
            'nombre' => $integrante['nombre_participante'],
            'estado' => $integrante['estado'],
            'esCapitan' => $fila['id_capitan'] !== null && (int) $integrante['id_usuario'] === (int) $fila['id_capitan'],
        ], $plantel->fetchAll());
    }
    $inscripciones[] = [
        'id' => (int) $fila['id_inscripcion'],
        'idTorneo' => (int) $fila['id_torneo'],
        'torneo' => $fila['nombre_torneo'],
        'estadoTorneo' => $fila['estado_torneo'],
        'tipo' => $fila['tipo_competidor'],
        'nombre' => $esEquipo ? $fila['nombre_equipo'] : $fila['nombre_participante'],
        'idEquipo' => $esEquipo ? (int) $fila['id_equipo'] : null,
        'capitan' => $fila['capitan'],
        'estado' => $fila['estado_inscripcion'],
        'numeroSorteo' => $fila['numero_sorteo'] !== null ? (int) $fila['numero_sorteo'] : null,
        'cabezaSerie' => $fila['cabeza_serie'] !== null ? (int) $fila['cabeza_serie'] : null,
        'maxIntegrantes' => $fila['max_integrantes_equipo'] !== null ? (int) $fila['max_integrantes_equipo'] : null,
        'integrantes' => $integrantes,
    ];
}

echo json_encode(['success' => true, 'inscripciones' => $inscripciones]);

function cambiarCabezaDeSerie(): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    $input = is_array($input) ? $input : [];
    $pdo = Database::getConnection();
    $stmt = $pdo->prepare(
        "SELECT i.*, t.estado AS estado_torneo, t.nombre_torneo,
                (SELECT COUNT(*) FROM ronda r WHERE r.id_torneo = i.id_torneo) AS rondas
         FROM inscripcion i JOIN torneo t ON t.id_torneo = i.id_torneo WHERE i.id_inscripcion = ?"
    );
    $stmt->execute([(int) ($input['id'] ?? 0)]);
    $inscripcion = $stmt->fetch();
    if ($inscripcion === false) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Inscripción no encontrada.']);
        return;
    }
    Auth::requireTorneoRole((int) $inscripcion['id_torneo'], 'ORGANIZADOR');
    if ($inscripcion['estado_torneo'] !== 'inscripcion_cerrada' || (int) $inscripcion['rondas'] > 0
        || $inscripcion['estado_inscripcion'] !== 'confirmada') {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Las cabezas de serie se fijan con las inscripciones cerradas y antes de generar el fixture.']);
        return;
    }
    $cabeza = (int) ($input['cabezaSerie'] ?? 0);
    $pdo->prepare('UPDATE inscripcion SET cabeza_serie = ? WHERE id_inscripcion = ?')
        ->execute([$cabeza > 0 ? $cabeza : null, $inscripcion['id_inscripcion']]);
    Auditoria::registrar('Cabeza de serie ' . ($cabeza > 0 ? $cabeza : 'quitada') . " (inscripción {$inscripcion['id_inscripcion']}): {$inscripcion['nombre_torneo']}", 'inscripcion');
    echo json_encode(['success' => true]);
}
