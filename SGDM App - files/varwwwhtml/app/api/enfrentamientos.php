<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Auth;
use App\Competencia;
use App\Database;

header('Content-Type: application/json; charset=utf-8');

function fallar(int $status, string $error): never
{
    http_response_code($status);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    fallar(405, 'Método no permitido.');
}
$input = json_decode(file_get_contents('php://input'), true);
$input = is_array($input) ? $input : [];

$partido = Competencia::partido((int) ($input['id'] ?? 0)) ?? fallar(404, 'Partido no encontrado.');
$torneo = Competencia::torneo((int) $partido['id_torneo']);
Auth::requireTorneoRole((int) $torneo['id_torneo'], 'ORGANIZADOR');
if ($partido['estado_ronda'] === 'finalizada') {
    fallar(409, 'La ronda está cerrada.');
}
if ($partido['id_inscripcion_visitante'] === null) {
    fallar(400, 'Es un partido libre: no se juega.');
}

$idArbitro = (int) ($input['idArbitro'] ?? 0);
if ($idArbitro > 0) {
    $stmt = Database::getConnection()->prepare(
        "SELECT 1 FROM torneo_arbitro WHERE id_torneo = ? AND id_usuario = ? AND estado_solicitud = 'aprobada'"
    );
    $stmt->execute([$torneo['id_torneo'], $idArbitro]);
    if ($stmt->fetchColumn() === false) {
        fallar(400, 'Ese usuario no es árbitro aprobado de este torneo.');
    }
}
$fechaHora = trim((string) ($input['fechaHora'] ?? ''));
if ($fechaHora !== '' && strtotime($fechaHora) === false) {
    fallar(400, 'La fecha y hora no son válidas.');
}

Database::getConnection()
    ->prepare('UPDATE enfrentamiento SET id_arbitro = ?, fecha_hora = ? WHERE id_enfrentamiento = ?')
    ->execute([$idArbitro > 0 ? $idArbitro : null, $fechaHora !== '' ? date('Y-m-d H:i:s', strtotime($fechaHora)) : null, $partido['id_enfrentamiento']]);

Auditoria::registrar("Programó el partido {$partido['id_enfrentamiento']} (ronda {$partido['numero_ronda']}): {$torneo['nombre_torneo']}", 'enfrentamiento');
echo json_encode(['success' => true]);
