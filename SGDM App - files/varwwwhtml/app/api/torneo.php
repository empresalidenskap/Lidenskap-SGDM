<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Catalogos;
use App\Competencia;
use App\Database;
use App\Models\Torneo;

header('Content-Type: application/json; charset=utf-8');

$id = (int) ($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Falta el id del torneo.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    Auth::requireRole('ADMIN');
    $torneoBorrar = Torneo::find($id);
    if ($torneoBorrar === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Torneo no encontrado.']);
        exit;
    }
    $pdo = Database::getConnection();
    $pdo->beginTransaction();
    $pdo->prepare('DELETE FROM ronda WHERE id_torneo = ?')->execute([$id]);
    Torneo::delete($id);
    $pdo->commit();
    Auditoria::registrar("Baja de torneo: {$torneoBorrar['nombre_torneo']}", 'torneo');
    echo json_encode(['success' => true]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $accion = $_GET['accion'] ?? '';
    $torneoFase = Torneo::find($id);
    if ($torneoFase === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Torneo no encontrado.']);
        exit;
    }
    Auth::requireTorneoRole($id, 'ORGANIZADOR');

    $fases = [
        'abrir_inscripciones' => ['planificado', 'inscripcion_abierta', 'Abrió las inscripciones'],
        'cerrar_inscripciones' => ['inscripcion_abierta', 'inscripcion_cerrada', 'Cerró las inscripciones'],
        'finalizar' => ['en_curso', 'finalizado', 'Finalizó el torneo'],
    ];
    if (!isset($fases[$accion])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Acción inválida.']);
        exit;
    }
    [$desde, $hacia, $texto] = $fases[$accion];
    if ($torneoFase['estado'] !== $desde) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'El torneo no está en la fase anterior a esta.']);
        exit;
    }

    $pdo = Database::getConnection();
    $detalle = null;

    if ($accion === 'finalizar') {
        $stmt = $pdo->prepare('SELECT id_ronda, numero_ronda FROM ronda WHERE id_torneo = ? ORDER BY numero_ronda');
        $stmt->execute([$id]);
        $rondas = $stmt->fetchAll();
        if (!$rondas) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'El torneo todavía no tiene fixture.']);
            exit;
        }
        foreach ($rondas as $ronda) {
            if (!Competencia::rondaCompleta((int) $ronda['id_ronda'])) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => "Faltan resultados por validar en la ronda {$ronda['numero_ronda']}."]);
                exit;
            }
        }
        $formato = Competencia::torneo($id)['formato'];
        $final = Competencia::partidos((int) end($rondas)['id_ronda']);
        if ($formato === 'eliminacion' && count($final) !== 1) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'La llave todavía no tiene campeón.']);
            exit;
        }
        if ($formato === 'eliminacion') {
            $stmt = $pdo->prepare('SELECT ' . Competencia::nombreSql('i') . ' FROM inscripcion i WHERE i.id_inscripcion = ?');
            $stmt->execute([Competencia::ganador($final[0])]);
            $campeon = $stmt->fetchColumn();
        } else {
            $tabla = $formato === 'suizo' ? Competencia::tablaSuizo($id) : Competencia::tabla($id);
            $campeon = $tabla[0]['nombre'] ?? null;
        }
        $detalle = $campeon ? "Campeón: $campeon" : null;
    }

    $pdo->beginTransaction();
    if ($accion === 'finalizar') {
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'finalizada' WHERE id_torneo = ?")->execute([$id]);
    }
    if ($accion === 'cerrar_inscripciones') {
        $stmt = $pdo->prepare(
            "UPDATE inscripcion SET estado_inscripcion = 'rechazada'
             WHERE id_torneo = ? AND estado_inscripcion IN ('pendiente', 'invitada')"
        );
        $stmt->execute([$id]);
        $rechazadas = $stmt->rowCount();

        $stmt = $pdo->prepare(
            "UPDATE equipo_participante ep
             JOIN equipo e      ON e.id_equipo     = ep.id_equipo
             JOIN inscripcion i ON i.id_competidor = e.id_competidor AND i.id_torneo = ?
             SET ep.estado = 'rechazada'
             WHERE ep.estado IN ('solicitada', 'invitada')"
        );
        $stmt->execute([$id]);
        $rechazadas += $stmt->rowCount();

        $stmt = $pdo->prepare("SELECT id_inscripcion FROM inscripcion WHERE id_torneo = ? AND estado_inscripcion = 'confirmada'");
        $stmt->execute([$id]);
        $confirmadas = $stmt->fetchAll(PDO::FETCH_COLUMN);
        shuffle($confirmadas);
        $sorteo = $pdo->prepare('UPDATE inscripcion SET numero_sorteo = ? WHERE id_inscripcion = ?');
        foreach ($confirmadas as $posicion => $idInscripcion) {
            $sorteo->execute([$posicion + 1, $idInscripcion]);
        }
        $detalle = "Rechazadas automáticamente: $rechazadas. Sorteo entre " . count($confirmadas) . ' confirmados.';
    }
    Torneo::update($id, ['estado' => $hacia]);
    $pdo->commit();

    Auditoria::registrar("$texto: {$torneoFase['nombre_torneo']}", 'torneo', null, $detalle);
    echo json_encode(['success' => true, 'estado' => $hacia]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$pdo = Database::getConnection();

$stmt = $pdo->prepare(
    'SELECT t.id_torneo, t.nombre_torneo, t.descripcion, t.sede, t.cupo_maximo,
            t.fecha_inicio, t.fecha_fin, t.estado, t.id_usuario_organizador,
            t.max_integrantes_equipo, t.marcador_wo_ganador, t.marcador_wo_perdedor,
            tt.nombre_tipo, tt.puntos_victoria, tt.puntos_empate, tt.puntos_derrota,
            mc.nombre_modulo,
            u.nombre AS organizador_nombre, u.apellido AS organizador_apellido
     FROM torneo t
     JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo
     JOIN usuario u ON u.id_usuario = t.id_usuario_organizador
     LEFT JOIN torneo_modulo tm ON tm.id_torneo = t.id_torneo
     LEFT JOIN modulo_competencia mc ON mc.id_modulo = tm.id_modulo
     WHERE t.id_torneo = :id'
);
$stmt->execute(['id' => $id]);
$torneo = $stmt->fetch();

if ($torneo !== false && in_array($torneo['estado'], ['solicitado', 'rechazado'], true)) {
    $sesion = Auth::current();
    $puedeVerla = $sesion !== null
        && ($sesion['rol'] === 'ADMIN' || $sesion['id_usuario'] === (int) $torneo['id_usuario_organizador']);
    if (!$puedeVerla) {
        $torneo = false;
    }
}

if ($torneo === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Torneo no encontrado.']);
    exit;
}

$stmtInscriptos = $pdo->prepare(
    'SELECT i.id_inscripcion, i.estado_inscripcion, c.tipo_competidor,
            eq.nombre_equipo, pa.nombre_participante
     FROM inscripcion i
     JOIN competidor c ON c.id_competidor = i.id_competidor
     LEFT JOIN equipo eq ON eq.id_competidor = c.id_competidor
     LEFT JOIN participante pa ON pa.id_competidor = c.id_competidor
     WHERE i.id_torneo = :id
     ORDER BY i.fecha_inscripcion ASC'
);
$stmtInscriptos->execute(['id' => $id]);

$inscriptos = array_map(static function (array $fila): array {
    return [
        'nombre' => $fila['tipo_competidor'] === 'equipo' ? $fila['nombre_equipo'] : $fila['nombre_participante'],
        'tipo' => $fila['tipo_competidor'],
        'estado' => $fila['estado_inscripcion'],
    ];
}, $stmtInscriptos->fetchAll());

$confirmados = count(array_filter($inscriptos, static fn (array $i): bool => $i['estado'] === 'confirmada'));
$reglas = [
    'puntos' => [(float) $torneo['puntos_victoria'], (float) $torneo['puntos_empate'], (float) $torneo['puntos_derrota']],
    'walkover' => [(int) $torneo['marcador_wo_ganador'], (int) $torneo['marcador_wo_perdedor']],
    'umbralSuizo' => Competencia::umbralSuizo(max($confirmados, 2)),
];

echo json_encode([
    'success' => true,
    'torneo' => [
        'id' => (int) $torneo['id_torneo'],
        'nombre' => $torneo['nombre_torneo'],
        'descripcion' => $torneo['descripcion'],
        'sede' => $torneo['sede'],
        'cupoMaximo' => $torneo['cupo_maximo'] !== null ? (int) $torneo['cupo_maximo'] : null,
        'maxIntegrantesEquipo' => $torneo['max_integrantes_equipo'] !== null ? (int) $torneo['max_integrantes_equipo'] : null,
        'fechaInicio' => $torneo['fecha_inicio'],
        'fechaFin' => $torneo['fecha_fin'],
        'estado' => $torneo['estado'],
        'formato' => Catalogos::codigoFormato($torneo['nombre_tipo']),
        'formatoNombre' => $torneo['nombre_tipo'],
        'disciplina' => $torneo['nombre_modulo'] !== null ? Catalogos::codigoDisciplina($torneo['nombre_modulo']) : null,
        'disciplinaNombre' => $torneo['nombre_modulo'],
        'organizador' => trim($torneo['organizador_nombre'] . ' ' . $torneo['organizador_apellido']),
        'organizadorId' => (int) $torneo['id_usuario_organizador'],
        'inscriptos' => $inscriptos,
        'reglas' => $reglas,
    ],
]);
