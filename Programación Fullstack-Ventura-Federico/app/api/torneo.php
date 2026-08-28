<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Catalogos;
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
    if (Torneo::find($id) === null) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Torneo no encontrado.']);
        exit;
    }
    // Las FK de torneo_modulo/ronda/inscripcion (y en cascada enfrentamiento/
    // resultado/tabla_posiciones) tienen ON DELETE CASCADE: borrar el torneo
    // se lleva puesto todo lo que dependía de él, no queda nada huérfano.
    Torneo::delete($id);
    echo json_encode(['success' => true]);
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
            t.fecha_inicio, t.fecha_fin, t.estado,
            tt.nombre_tipo,
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

if ($torneo === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Torneo no encontrado.']);
    exit;
}

// Nombre de cada inscripto: si el competidor es un equipo usa
// nombre_equipo, si es un participante usa nombre_participante.
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

echo json_encode([
    'success' => true,
    'torneo' => [
        'id' => (int) $torneo['id_torneo'],
        'nombre' => $torneo['nombre_torneo'],
        'descripcion' => $torneo['descripcion'],
        'sede' => $torneo['sede'],
        'cupoMaximo' => $torneo['cupo_maximo'] !== null ? (int) $torneo['cupo_maximo'] : null,
        'fechaInicio' => $torneo['fecha_inicio'],
        'fechaFin' => $torneo['fecha_fin'],
        'estado' => $torneo['estado'],
        'formato' => Catalogos::codigoFormato($torneo['nombre_tipo']),
        'formatoNombre' => $torneo['nombre_tipo'],
        'disciplina' => $torneo['nombre_modulo'] !== null ? Catalogos::codigoDisciplina($torneo['nombre_modulo']) : null,
        'disciplinaNombre' => $torneo['nombre_modulo'],
        'organizador' => trim($torneo['organizador_nombre'] . ' ' . $torneo['organizador_apellido']),
        'inscriptos' => $inscriptos,
    ],
]);
