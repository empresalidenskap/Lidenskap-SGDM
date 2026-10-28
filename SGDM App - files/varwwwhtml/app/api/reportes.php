<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Catalogos;
use App\Database;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$usuario = Auth::requireLogin();
$pdo = Database::getConnection();
const ACTIVOS = ['planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso'];

$partidos = static fn (string $condicion): string => "(SELECT COUNT(*) FROM enfrentamiento e
        JOIN ronda ro ON ro.id_ronda = e.id_ronda
        LEFT JOIN resultado re ON re.id_enfrentamiento = e.id_enfrentamiento
        WHERE ro.id_torneo = t.id_torneo AND e.id_inscripcion_visitante IS NOT NULL AND $condicion)";
$todos = $partidos('1 = 1');
$oficiales = $partidos("re.validado = 1 AND e.estado_partido <> 'walkover'");
$walkovers = $partidos("e.estado_partido = 'walkover'");
$sinValidar = $partidos('re.validado = 0');

$sql = "SELECT t.id_torneo, t.nombre_torneo, t.estado, t.cupo_maximo, tt.nombre_tipo, mc.nombre_modulo,
               (SELECT COUNT(*) FROM inscripcion i WHERE i.id_torneo = t.id_torneo AND i.estado_inscripcion = 'confirmada') AS inscriptos,
               $todos AS partidos,
               $oficiales AS oficiales,
               $walkovers AS walkovers,
               $sinValidar AS sin_validar
        FROM torneo t
        JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo
        LEFT JOIN torneo_modulo tm      ON tm.id_torneo = t.id_torneo
        LEFT JOIN modulo_competencia mc ON mc.id_modulo = tm.id_modulo
        WHERE t.estado NOT IN ('solicitado', 'rechazado')";
$params = [];
if ($usuario['rol'] !== 'ADMIN') {
    $sql .= " AND t.id_torneo IN (SELECT id_torneo FROM vista_rol_torneo
                                  WHERE id_usuario = :yo AND rol = 'ORGANIZADOR' AND activo = 1)";
    $params['yo'] = $usuario['id_usuario'];
}
$sql .= ' ORDER BY t.fecha_inicio DESC, t.id_torneo DESC';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$torneos = array_map(static fn (array $f): array => [
    'id' => (int) $f['id_torneo'],
    'nombre' => $f['nombre_torneo'],
    'estado' => $f['estado'],
    'disciplinaNombre' => $f['nombre_modulo'],
    'formato' => Catalogos::codigoFormato($f['nombre_tipo']),
    'inscriptos' => (int) $f['inscriptos'],
    'cupoMaximo' => $f['cupo_maximo'] !== null ? (int) $f['cupo_maximo'] : null,
    'partidos' => (int) $f['partidos'],
    'oficiales' => (int) $f['oficiales'],
    'walkovers' => (int) $f['walkovers'],
    'sinValidar' => (int) $f['sin_validar'],
], $stmt->fetchAll());

$activos = array_values(array_filter($torneos, static fn (array $t): bool => in_array($t['estado'], ACTIVOS, true)));
$ids = array_column($activos, 'id');
$participantes = 0;
$equipos = 0;
if ($ids) {
    $marcas = implode(', ', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT COUNT(DISTINCT id_usuario) FROM vista_rol_torneo WHERE rol = 'PARTICIPANTE' AND activo = 1 AND id_torneo IN ($marcas)");
    $stmt->execute($ids);
    $participantes = (int) $stmt->fetchColumn();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM inscripcion i JOIN equipo e ON e.id_competidor = i.id_competidor
                           WHERE i.estado_inscripcion = 'confirmada' AND i.id_torneo IN ($marcas)");
    $stmt->execute($ids);
    $equipos = (int) $stmt->fetchColumn();
}

echo json_encode([
    'success' => true,
    'torneos' => $torneos,
    'resumen' => [
        'torneosActivos' => count($activos),
        'participantes' => $participantes,
        'equipos' => $equipos,
        'resultadosSinValidar' => array_sum(array_column($activos, 'sinValidar')),
    ],
]);
