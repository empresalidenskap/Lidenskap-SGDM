<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Catalogos;
use App\Database;
use App\Models\ModuloCompetencia;
use App\Models\TipoTorneo;
use App\Models\Torneo;
use App\Models\TorneoModulo;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    handleList();
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleCreate();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
}
exit;

function handleList(): void
{
    $sql = 'SELECT t.id_torneo, t.nombre_torneo, t.descripcion, t.sede,
                   t.cupo_maximo, t.fecha_inicio, t.fecha_fin, t.estado,
                   tt.nombre_tipo,
                   mc.nombre_modulo,
                   (SELECT COUNT(*) FROM inscripcion i WHERE i.id_torneo = t.id_torneo) AS inscriptos
            FROM torneo t
            JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo
            LEFT JOIN torneo_modulo tm ON tm.id_torneo = t.id_torneo
            LEFT JOIN modulo_competencia mc ON mc.id_modulo = tm.id_modulo
            ORDER BY t.fecha_inicio IS NULL, t.fecha_inicio ASC, t.id_torneo DESC';

    $stmt = Database::getConnection()->query($sql);
    $filas = $stmt->fetchAll();

    $disciplina = $_GET['disciplina'] ?? null;
    $formato = $_GET['formato'] ?? null;
    $estado = $_GET['estado'] ?? null;
    $q = isset($_GET['q']) ? mb_strtolower(trim((string) $_GET['q'])) : null;

    $torneos = [];
    foreach ($filas as $fila) {
        $codigoDisciplina = $fila['nombre_modulo'] !== null
            ? Catalogos::codigoDisciplina($fila['nombre_modulo'])
            : null;
        $codigoFormato = Catalogos::codigoFormato($fila['nombre_tipo']);

        if ($disciplina && $codigoDisciplina !== $disciplina) {
            continue;
        }
        if ($formato && $codigoFormato !== $formato) {
            continue;
        }
        if ($estado && $fila['estado'] !== $estado) {
            continue;
        }
        if ($q && !str_contains(mb_strtolower($fila['nombre_torneo']), $q)
            && !str_contains(mb_strtolower((string) $fila['sede']), $q)) {
            continue;
        }

        $torneos[] = [
            'id' => (int) $fila['id_torneo'],
            'nombre' => $fila['nombre_torneo'],
            'descripcion' => $fila['descripcion'],
            'sede' => $fila['sede'],
            'cupoMaximo' => $fila['cupo_maximo'] !== null ? (int) $fila['cupo_maximo'] : null,
            'fechaInicio' => $fila['fecha_inicio'],
            'fechaFin' => $fila['fecha_fin'],
            'estado' => $fila['estado'],
            'formato' => $codigoFormato,
            'formatoNombre' => $fila['nombre_tipo'],
            'disciplina' => $codigoDisciplina,
            'disciplinaNombre' => $fila['nombre_modulo'],
            'inscriptos' => (int) $fila['inscriptos'],
        ];
    }

    echo json_encode(['success' => true, 'torneos' => $torneos]);
}

function handleCreate(): void
{
    $usuario = Auth::requireRole('ADMIN');

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $nombre = trim((string) ($input['nombre'] ?? ''));
    $descripcion = trim((string) ($input['descripcion'] ?? ''));
    $disciplinaCodigo = trim((string) ($input['disciplina'] ?? ''));
    $disciplinaCustom = trim((string) ($input['disciplinaCustom'] ?? ''));
    $formatoCodigo = trim((string) ($input['formato'] ?? ''));
    $cupoMaximo = (int) ($input['cupoMaximo'] ?? 0);
    $fechaInicio = trim((string) ($input['fechaInicio'] ?? ''));
    $sede = trim((string) ($input['sede'] ?? ''));

    if ($nombre === '' || $descripcion === '' || $disciplinaCodigo === ''
        || $formatoCodigo === '' || $cupoMaximo < 2 || $fechaInicio === '' || $sede === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Completá todos los campos requeridos.']);
        return;
    }

    $nombreFormato = Catalogos::nombreFormato($formatoCodigo);
    if ($nombreFormato === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Formato de torneo no soportado todavía.']);
        return;
    }
    $tipoTorneo = TipoTorneo::findBy('nombre_tipo', $nombreFormato);
    if ($tipoTorneo === null) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'No se encontró el tipo de torneo.']);
        return;
    }

    $nombreDisciplina = $disciplinaCodigo === 'custom'
        ? $disciplinaCustom
        : Catalogos::nombreDisciplina($disciplinaCodigo);
    if (!$nombreDisciplina) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Indicá una disciplina válida.']);
        return;
    }

    $modulo = ModuloCompetencia::findBy('nombre_modulo', $nombreDisciplina);
    $idModulo = $modulo !== null
        ? (int) $modulo['id_modulo']
        : ModuloCompetencia::create(['nombre_modulo' => $nombreDisciplina]);

    $idTorneo = Torneo::create([
        'id_tipo_torneo' => $tipoTorneo['id_tipo_torneo'],
        'id_usuario_organizador' => $usuario['id_usuario'],
        'nombre_torneo' => $nombre,
        'descripcion' => $descripcion,
        'sede' => $sede,
        'cupo_maximo' => $cupoMaximo,
        'fecha_inicio' => $fechaInicio,
    ]);

    TorneoModulo::create([
        'id_torneo' => $idTorneo,
        'id_modulo' => $idModulo,
    ]);

    echo json_encode(['success' => true, 'id' => $idTorneo]);
}
