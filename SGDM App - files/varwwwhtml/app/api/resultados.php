<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Competencia;
use App\Database;
use App\RolesTorneo;

header('Content-Type: application/json; charset=utf-8');

function fallar(int $status, string $error): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
if (!in_array($metodo, ['POST', 'PATCH'], true)) {
    fallar(405, 'Método no permitido.');
}
$input = json_decode(file_get_contents('php://input'), true);
$input = is_array($input) ? $input : $_POST;

$sesion = Auth::requireLogin();
$partido = Competencia::partido((int) ($input['idEnfrentamiento'] ?? 0)) ?? fallar(404, 'Partido no encontrado.');
$torneo = Competencia::torneo((int) $partido['id_torneo']);
$idTorneo = (int) $torneo['id_torneo'];
if ($partido['id_inscripcion_visitante'] === null) {
    fallar(400, 'Es un partido libre: lo gana el local sin jugar.');
}
if ($partido['estado_ronda'] === 'finalizada') {
    fallar(409, 'La ronda está cerrada: solo el Administrador general puede reabrirla.');
}
$gestiona = $sesion['rol'] === 'ADMIN' || RolesTorneo::tiene($sesion['id_usuario'], $idTorneo, ['ORGANIZADOR']);
$accion = $metodo === 'PATCH' ? 'validar' : (string) ($input['accion'] ?? 'cargar');

$pdo = Database::getConnection();
$guardar = $pdo->prepare(
    'INSERT INTO resultado (id_enfrentamiento, puntuacion_local, puntuacion_visitante, validado) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE puntuacion_local = VALUES(puntuacion_local), puntuacion_visitante = VALUES(puntuacion_visitante),
                             validado = VALUES(validado), fecha_carga = CURRENT_TIMESTAMP'
);
$estadoPartido = $pdo->prepare('UPDATE enfrentamiento SET estado_partido = ? WHERE id_enfrentamiento = ?');
$descripcion = "partido {$partido['id_enfrentamiento']} (ronda {$partido['numero_ronda']})";

$pdo->beginTransaction();
if ($accion === 'cargar') {
    $esSuArbitro = (int) $partido['id_arbitro'] === $sesion['id_usuario']
        && RolesTorneo::tiene($sesion['id_usuario'], $idTorneo, ['ARBITRO']);
    if (!$gestiona && !$esSuArbitro) {
        fallar(403, 'Solo el árbitro asignado a este partido o el Organizador pueden cargar el resultado.');
    }
    $local = filter_var($input['local'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    $visitante = filter_var($input['visitante'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
    if ($local === false || $visitante === false) {
        fallar(400, 'El marcador tiene que ser un número entero, 0 o más.');
    }
    if ($torneo['formato'] === 'eliminacion' && $local === $visitante) {
        fallar(400, 'En eliminación directa no puede haber empate.');
    }
    if ($torneo['formato'] === 'suizo' && !in_array("$local-$visitante", ['2-0', '2-1', '1-2', '0-2'], true)) {
        fallar(400, 'En el sistema suizo cada partido es una serie al mejor de 3: el marcador tiene que ser 2-0, 2-1, 1-2 o 0-2.');
    }
    $validar = $gestiona && !empty($input['validar']);
    $guardar->execute([$partido['id_enfrentamiento'], $local, $visitante, $validar ? 1 : 0]);
    $estadoPartido->execute(['finalizado', $partido['id_enfrentamiento']]);
    $texto = ($partido['puntuacion_local'] === null ? 'Cargó' : 'Corrigió') . " el resultado $local-$visitante" . ($validar ? ' (validado)' : '');
} elseif ($accion === 'walkover') {
    if (!$gestiona) {
        fallar(403, 'Solo el Organizador registra un walkover.');
    }
    $ganaLocal = ($input['ganador'] ?? '') === 'local';
    if (!$ganaLocal && ($input['ganador'] ?? '') !== 'visitante') {
        fallar(400, 'Indicá quién gana por walkover.');
    }
    [$ganador, $perdedor] = [(int) $torneo['marcador_wo_ganador'], (int) $torneo['marcador_wo_perdedor']];
    $guardar->execute([$partido['id_enfrentamiento'], $ganaLocal ? $ganador : $perdedor, $ganaLocal ? $perdedor : $ganador, 1]);
    $estadoPartido->execute(['walkover', $partido['id_enfrentamiento']]);
    $validar = true;
    $texto = 'Registró walkover (gana el ' . ($ganaLocal ? 'local' : 'visitante') . ')';
} elseif ($accion === 'validar') {
    if (!$gestiona) {
        fallar(403, 'Solo el Organizador del torneo valida los resultados.');
    }
    if ($partido['puntuacion_local'] === null) {
        fallar(409, 'El partido todavía no tiene resultado.');
    }
    $pdo->prepare('UPDATE resultado SET validado = 1 WHERE id_enfrentamiento = ?')->execute([$partido['id_enfrentamiento']]);
    $validar = true;
    $texto = 'Validó el resultado';
} else {
    fallar(400, 'Acción inválida.');
}

Competencia::recalcularTabla($idTorneo);
$avanzo = $validar && $torneo['formato'] === 'eliminacion' && Competencia::avanzarLlave($torneo, (int) $partido['id_ronda']);
$pdo->commit();

Auditoria::registrar("$texto del $descripcion: {$torneo['nombre_torneo']}", 'resultado');
echo json_encode(['success' => true, 'rondaNueva' => $avanzo]);
