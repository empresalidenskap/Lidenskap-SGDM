<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Competencia;
use App\Database;
use App\RolesTorneo;

/*
 * Rondas y cruces de un torneo (F6).
 *   GET ?idTorneo=   -> rondas con sus partidos, tabla (liga/suizo) y campeón
 *                       (llaves). Es consulta pública (RF-18): un resultado
 *                       sin validar solo lo ven el Organizador, el Admin y el
 *                       árbitro de ese partido.
 *   POST generar     -> fixture (con las inscripciones cerradas: el torneo
 *                       pasa a en_curso) o la ronda siguiente del suizo.
 *   PATCH cerrar     -> el Organizador cierra una ronda completa (RF-13).
 *   PATCH reabrir    -> solo el Admin, con motivo (queda en la auditoría).
 */

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];
if ($metodo === 'GET') {
    handleList();
} elseif ($metodo === 'POST') {
    handleGenerate(leerInput());
} elseif ($metodo === 'PATCH') {
    handleState(leerInput());
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
    $idTorneo = (int) ($_GET['idTorneo'] ?? 0);
    $torneo = Competencia::torneo($idTorneo);
    $sesion = Auth::current();
    $gestiona = $sesion !== null
        && ($sesion['rol'] === 'ADMIN' || RolesTorneo::tiene($sesion['id_usuario'], $idTorneo, ['ORGANIZADOR']));
    if ($torneo === null || (in_array($torneo['estado'], ['solicitado', 'rechazado'], true) && !$gestiona)) {
        fallar(404, 'Torneo no encontrado.');
    }
    $soyArbitro = $sesion !== null && RolesTorneo::tiene($sesion['id_usuario'], $idTorneo, ['ARBITRO']);

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT * FROM ronda WHERE id_torneo = ? ORDER BY numero_ronda');
    $stmt->execute([$idTorneo]);
    $rondas = $stmt->fetchAll();

    $stmt = $pdo->prepare(
        'SELECT e.*, r.puntuacion_local, r.puntuacion_visitante, r.validado,
                ' . Competencia::nombreSql('il') . ' AS local,
                ' . Competencia::nombreSql('iv') . ' AS visitante,
                CONCAT(ua.nombre, \' \', ua.apellido) AS arbitro
         FROM enfrentamiento e
         JOIN ronda ro            ON ro.id_ronda       = e.id_ronda
         JOIN inscripcion il      ON il.id_inscripcion = e.id_inscripcion_local
         LEFT JOIN inscripcion iv ON iv.id_inscripcion = e.id_inscripcion_visitante
         LEFT JOIN resultado r    ON r.id_enfrentamiento = e.id_enfrentamiento
         LEFT JOIN usuario ua     ON ua.id_usuario = e.id_arbitro
         WHERE ro.id_torneo = ?
         ORDER BY e.id_enfrentamiento'
    );
    $stmt->execute([$idTorneo]);
    $partidosPorRonda = [];
    foreach ($stmt->fetchAll() as $p) {
        $esMio = $soyArbitro && (int) $p['id_arbitro'] === $sesion['id_usuario'];
        $verResultado = $p['puntuacion_local'] !== null && ($p['validado'] || $gestiona || $esMio);
        $partidosPorRonda[$p['id_ronda']][] = [
            'id' => (int) $p['id_enfrentamiento'],
            'idLocal' => (int) $p['id_inscripcion_local'],
            'idVisitante' => $p['id_inscripcion_visitante'] !== null ? (int) $p['id_inscripcion_visitante'] : null,
            'local' => $p['local'],
            'visitante' => $p['visitante'],
            'libre' => $p['id_inscripcion_visitante'] === null,
            'fechaHora' => $p['fecha_hora'],
            'estado' => $p['estado_partido'],
            'idArbitro' => $p['id_arbitro'] !== null ? (int) $p['id_arbitro'] : null,
            'arbitro' => $p['arbitro'],
            'esMio' => $esMio,
            'resultado' => $verResultado ? [
                'local' => (int) $p['puntuacion_local'],
                'visitante' => (int) $p['puntuacion_visitante'],
                'validado' => (bool) $p['validado'],
            ] : null,
        ];
    }

    $salida = array_map(static fn (array $r): array => [
        'id' => (int) $r['id_ronda'],
        'numero' => (int) $r['numero_ronda'],
        'estado' => $r['estado_ronda'],
        'fecha' => $r['fecha_programada'],
        'partidos' => $partidosPorRonda[$r['id_ronda']] ?? [],
    ], $rondas);

    // Campeón de las llaves: ganador de la última ronda si tiene un solo partido validado
    $campeon = null;
    if ($torneo['formato'] === 'eliminacion' && $rondas) {
        $ultima = Competencia::partidos((int) end($rondas)['id_ronda']);
        if (count($ultima) === 1 && ($ultima[0]['validado'] || $ultima[0]['id_inscripcion_visitante'] === null)) {
            $ganador = Competencia::ganador($ultima[0]);
            $nombre = $pdo->prepare('SELECT ' . Competencia::nombreSql('i') . ' FROM inscripcion i WHERE i.id_inscripcion = ?');
            $nombre->execute([$ganador]);
            $campeon = $nombre->fetchColumn();
        }
    }

    // Árbitros aprobados del torneo, para que el Organizador los asigne
    $arbitros = [];
    if ($gestiona) {
        $stmt = $pdo->prepare(
            "SELECT u.id_usuario, CONCAT(u.nombre, ' ', u.apellido) AS nombre FROM torneo_arbitro ta
             JOIN usuario u ON u.id_usuario = ta.id_usuario
             WHERE ta.id_torneo = ? AND ta.estado_solicitud = 'aprobada' ORDER BY nombre"
        );
        $stmt->execute([$idTorneo]);
        $arbitros = array_map(static fn (array $a): array => ['id' => (int) $a['id_usuario'], 'nombre' => $a['nombre']], $stmt->fetchAll());
    }

    // Liga: tabla con desempate; suizo: además récord y estado de cada uno
    $tabla = [];
    $umbral = null;
    if ($rondas && $torneo['formato'] === 'liga') {
        $tabla = Competencia::tabla($idTorneo);
    } elseif ($rondas && $torneo['formato'] === 'suizo') {
        $tabla = Competencia::tablaSuizo($idTorneo);
        $umbral = Competencia::umbralSuizo(count($tabla));
    }
    // Liga y suizo: al finalizar, el campeón es el primero de la tabla
    if ($torneo['estado'] === 'finalizado' && $tabla) {
        $campeon = $tabla[0]['nombre'];
    }

    echo json_encode([
        'success' => true,
        'torneo' => [
            'id' => (int) $torneo['id_torneo'],
            'nombre' => $torneo['nombre_torneo'],
            'estado' => $torneo['estado'],
            'formato' => $torneo['formato'],
            'formatoNombre' => $torneo['nombre_tipo'],
        ],
        'gestiona' => $gestiona,
        'soyArbitro' => $soyArbitro,
        'rondas' => $salida,
        'tabla' => $tabla,
        'umbral' => $umbral,
        'campeon' => $campeon,
        'arbitros' => $arbitros,
    ]);
}

/**
 * Sin rondas: arma el fixture del formato y el torneo empieza (en_curso).
 * Con rondas: solo el suizo pide la ronda siguiente a mano (la liga sale
 * completa y las llaves avanzan solas al validar el último resultado).
 */
function handleGenerate(array $input): void
{
    $idTorneo = (int) ($input['idTorneo'] ?? 0);
    $torneo = Competencia::torneo($idTorneo) ?? fallar(404, 'Torneo no encontrado.');
    Auth::requireTorneoRole($idTorneo, 'ORGANIZADOR');

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare('SELECT * FROM ronda WHERE id_torneo = ? ORDER BY numero_ronda DESC LIMIT 1');
    $stmt->execute([$idTorneo]);
    $ultima = $stmt->fetch();

    $pdo->beginTransaction();
    if ($ultima === false) {
        if ($torneo['estado'] !== 'inscripcion_cerrada') {
            fallar(409, 'Primero hay que cerrar las inscripciones del torneo.');
        }
        $ids = Competencia::confirmadas($idTorneo, $torneo['formato'] === 'eliminacion');
        if (count($ids) < 2) {
            fallar(409, 'Hacen falta al menos 2 inscriptos confirmados.');
        }
        if ($torneo['formato'] === 'liga') {
            foreach (Competencia::rondaRobin($ids) as $i => $partidos) {
                Competencia::crearRonda($idTorneo, $i + 1, Competencia::fechaRonda($torneo, $i + 1), $partidos);
            }
        } else {
            $partidos = $torneo['formato'] === 'eliminacion'
                ? Competencia::primeraLlave($ids)
                : Competencia::emparejarSuizo($idTorneo, $ids, true);
            Competencia::crearRonda($idTorneo, 1, Competencia::fechaRonda($torneo, 1), $partidos);
        }
        $pdo->prepare("UPDATE torneo SET estado = 'en_curso' WHERE id_torneo = ?")->execute([$idTorneo]);
        $texto = 'Generó el fixture y empezó el torneo';
    } else {
        if ($torneo['formato'] !== 'suizo') {
            fallar(409, $torneo['formato'] === 'liga'
                ? 'En una liga el fixture completo ya está generado.'
                : 'En eliminación directa la ronda siguiente se arma sola al validar el último resultado.');
        }
        if ($torneo['estado'] !== 'en_curso') {
            fallar(409, 'El torneo no está en curso.');
        }
        if (!Competencia::rondaCompleta((int) $ultima['id_ronda'])) {
            fallar(409, "Faltan resultados por validar en la ronda {$ultima['numero_ronda']}.");
        }
        $enJuego = array_filter(Competencia::recordSuizo($idTorneo), static fn (array $r): bool => $r['estado'] === 'en_juego');
        if (count($enJuego) < 2) {
            fallar(409, 'La etapa suiza terminó (todos se clasificaron o quedaron eliminados): finalizá el torneo.');
        }
        $numero = (int) $ultima['numero_ronda'] + 1;
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'finalizada' WHERE id_ronda = ?")->execute([$ultima['id_ronda']]);
        Competencia::crearRonda($idTorneo, $numero, Competencia::fechaRonda($torneo, $numero),
            Competencia::emparejarSuizo($idTorneo, Competencia::confirmadas($idTorneo), false));
        $texto = "Generó la ronda $numero";
    }
    Competencia::recalcularTabla($idTorneo);
    $pdo->commit();

    Auditoria::registrar("$texto: {$torneo['nombre_torneo']}", 'ronda');
    echo json_encode(['success' => true]);
}

function handleState(array $input): void
{
    $accion = (string) ($input['accion'] ?? '');
    $stmt = Database::getConnection()->prepare('SELECT * FROM ronda WHERE id_ronda = ?');
    $stmt->execute([(int) ($input['idRonda'] ?? 0)]);
    $ronda = $stmt->fetch() ?: fallar(404, 'Ronda no encontrada.');
    $torneo = Competencia::torneo((int) $ronda['id_torneo']);
    $pdo = Database::getConnection();

    if ($accion === 'cerrar') {
        Auth::requireTorneoRole((int) $torneo['id_torneo'], 'ORGANIZADOR');
        if ($ronda['estado_ronda'] === 'finalizada') {
            fallar(409, 'La ronda ya está cerrada.');
        }
        if (!Competencia::rondaCompleta((int) $ronda['id_ronda'])) {
            fallar(409, 'Para cerrar la ronda todos sus resultados tienen que estar validados.');
        }
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'finalizada' WHERE id_ronda = ?")->execute([$ronda['id_ronda']]);
        Auditoria::registrar("Cerró la ronda {$ronda['numero_ronda']}: {$torneo['nombre_torneo']}", 'ronda');
    } elseif ($accion === 'reabrir') {
        // RF-13: solo el Administrador general reabre, y queda el motivo
        Auth::requireRole('ADMIN');
        $motivo = trim((string) ($input['motivo'] ?? ''));
        if ($motivo === '') {
            fallar(400, 'Indicá el motivo de la reapertura.');
        }
        if ($ronda['estado_ronda'] !== 'finalizada') {
            fallar(409, 'La ronda no está cerrada.');
        }
        if ($torneo['formato'] !== 'liga') {
            $stmt = $pdo->prepare('SELECT COUNT(*) FROM ronda WHERE id_torneo = ? AND numero_ronda > ?');
            $stmt->execute([$torneo['id_torneo'], $ronda['numero_ronda']]);
            if ((int) $stmt->fetchColumn() > 0) {
                fallar(409, 'Ya se jugó la ronda siguiente, que salió de estos resultados: no se puede reabrir.');
            }
        }
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'en_curso' WHERE id_ronda = ?")->execute([$ronda['id_ronda']]);
        Auditoria::registrar("Reabrió la ronda {$ronda['numero_ronda']}: {$torneo['nombre_torneo']}", 'ronda', null, "Motivo: $motivo");
    } else {
        fallar(400, 'Acción inválida.');
    }
    echo json_encode(['success' => true]);
}
