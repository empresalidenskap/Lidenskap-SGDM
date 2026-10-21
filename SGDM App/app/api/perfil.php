<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Database;

/*
 * Estadísticas del perfil, calculadas en vivo (nada guardado):
 *   Admin          -> estado general del sistema.
 *   Usuario público -> su historial en todos los torneos: donde jugó (solo o
 *                     en un equipo), partidos ganados, torneos organizados y
 *                     partidos arbitrados. Solo cuentan resultados validados.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$usuario = Auth::requireLogin();
$pdo = Database::getConnection();
$contar = static function (string $sql, array $params = []) use ($pdo): int {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return (int) $stmt->fetchColumn();
};

if ($usuario['rol'] === 'ADMIN') {
    $estadisticas = [
        'torneosActivos' => $contar("SELECT COUNT(*) FROM torneo WHERE estado IN ('planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso')"),
        'usuarios' => $contar("SELECT COUNT(*) FROM usuario WHERE estado = 'activo'"),
        'solicitudesPendientes' => $contar("SELECT COUNT(*) FROM vista_rol_torneo WHERE estado_solicitud = 'pendiente'")
            + $contar("SELECT COUNT(*) FROM equipo_participante WHERE estado = 'solicitada'"),
        'eventosAuditoria' => $contar('SELECT COUNT(*) FROM auditoria_registro'),
        'resultadosSinValidar' => $contar('SELECT COUNT(*) FROM resultado WHERE validado = 0'),
    ];
} else {
    $yo = $usuario['id_usuario'];

    // Mis inscripciones confirmadas: como participante o como integrante de un equipo
    $stmt = $pdo->prepare("SELECT id_origen FROM vista_rol_torneo WHERE id_usuario = ? AND rol = 'PARTICIPANTE' AND estado_solicitud = 'aprobada'");
    $stmt->execute([$yo]);
    $mias = array_map('intval', $stmt->fetchAll(PDO::FETCH_COLUMN));

    $jugados = 0;
    $ganados = 0;
    if ($mias) {
        $marcas = implode(', ', array_fill(0, count($mias), '?'));
        $stmt = $pdo->prepare(
            "SELECT e.id_inscripcion_local, e.id_inscripcion_visitante, r.puntuacion_local, r.puntuacion_visitante
             FROM enfrentamiento e JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento AND r.validado = 1
             WHERE e.id_inscripcion_visitante IS NOT NULL
               AND (e.id_inscripcion_local IN ($marcas) OR e.id_inscripcion_visitante IN ($marcas))"
        );
        $stmt->execute([...$mias, ...$mias]);
        foreach ($stmt->fetchAll() as $p) {
            $jugados++;
            $soyLocal = in_array((int) $p['id_inscripcion_local'], $mias, true);
            $diferencia = (int) $p['puntuacion_local'] - (int) $p['puntuacion_visitante'];
            if (($soyLocal && $diferencia > 0) || (!$soyLocal && $diferencia < 0)) {
                $ganados++;
            }
        }
    }

    $estadisticas = [
        'torneosJugados' => $contar("SELECT COUNT(DISTINCT id_torneo) FROM vista_rol_torneo WHERE id_usuario = ? AND rol = 'PARTICIPANTE' AND estado_solicitud = 'aprobada'", [$yo]),
        'partidosJugados' => $jugados,
        'partidosGanados' => $ganados,
        'torneosOrganizados' => $contar("SELECT COUNT(*) FROM vista_rol_torneo WHERE id_usuario = ? AND rol = 'ORGANIZADOR' AND estado_solicitud = 'aprobada'", [$yo]),
        'partidosArbitrados' => $contar(
            'SELECT COUNT(*) FROM enfrentamiento e JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento AND r.validado = 1
             WHERE e.id_arbitro = ?', [$yo]),
    ];
}

echo json_encode(['success' => true, 'estadisticas' => $estadisticas]);
