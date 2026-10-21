<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Catalogos;
use App\Competencia;
use App\Database;

/*
 * Calendario público (RF-18): los partidos de todos los torneos que ya
 * tienen fixture (en curso o finalizados), sin iniciar sesión. Solo se
 * muestra el resultado validado; los partidos libres no se listan porque no
 * se juegan. La fecha es la que programó el Organizador o, si no, la de la
 * ronda.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$stmt = Database::getConnection()->query(
    "SELECT e.id_enfrentamiento, e.fecha_hora, e.estado_partido,
            ro.numero_ronda, ro.fecha_programada,
            (SELECT COUNT(*) FROM enfrentamiento x WHERE x.id_ronda = ro.id_ronda) AS partidos_ronda,
            t.id_torneo, t.nombre_torneo, t.sede, tt.nombre_tipo, mc.nombre_modulo,
            r.puntuacion_local, r.puntuacion_visitante, r.validado,
            " . Competencia::nombreSql('il') . " AS local,
            " . Competencia::nombreSql('iv') . " AS visitante
     FROM enfrentamiento e
     JOIN ronda ro        ON ro.id_ronda       = e.id_ronda
     JOIN torneo t        ON t.id_torneo       = ro.id_torneo
     JOIN tipo_torneo tt  ON tt.id_tipo_torneo = t.id_tipo_torneo
     JOIN inscripcion il  ON il.id_inscripcion = e.id_inscripcion_local
     JOIN inscripcion iv  ON iv.id_inscripcion = e.id_inscripcion_visitante
     LEFT JOIN torneo_modulo tm      ON tm.id_torneo = t.id_torneo
     LEFT JOIN modulo_competencia mc ON mc.id_modulo = tm.id_modulo
     LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
     WHERE t.estado IN ('en_curso', 'finalizado')
       AND COALESCE(e.fecha_hora, ro.fecha_programada) IS NOT NULL
     ORDER BY COALESCE(e.fecha_hora, ro.fecha_programada), e.id_enfrentamiento"
);

$partidos = array_map(static function (array $p): array {
    $formato = Catalogos::codigoFormato($p['nombre_tipo']);
    $oficial = (bool) $p['validado'];
    return [
        'id' => (int) $p['id_enfrentamiento'],
        'torneoId' => (int) $p['id_torneo'],
        'torneo' => $p['nombre_torneo'],
        'sede' => $p['sede'],
        'disciplina' => $p['nombre_modulo'] !== null ? Catalogos::codigoDisciplina($p['nombre_modulo']) : 'personalizada',
        'disciplinaNombre' => $p['nombre_modulo'],
        'formato' => $formato,
        'formatoNombre' => $p['nombre_tipo'],
        'fecha' => substr($p['fecha_hora'] ?? $p['fecha_programada'], 0, 10),
        'hora' => $p['fecha_hora'] !== null ? substr($p['fecha_hora'], 11, 5) : null,
        'fase' => Competencia::nombreRonda($formato, (int) $p['numero_ronda'], (int) $p['partidos_ronda']),
        'local' => $p['local'],
        'visitante' => $p['visitante'],
        'resultado' => $oficial ? "{$p['puntuacion_local']} - {$p['puntuacion_visitante']}" : null,
        'walkover' => $p['estado_partido'] === 'walkover',
    ];
}, $stmt->fetchAll());

echo json_encode(['success' => true, 'partidos' => $partidos]);
