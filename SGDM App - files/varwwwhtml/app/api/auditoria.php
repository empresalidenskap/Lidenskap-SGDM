<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;
use App\Database;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

Auth::requireRole('ADMIN');

// Los 1000 eventos más recientes; el panel pagina y filtra del lado del cliente.
$filas = Database::getConnection()->query(
    'SELECT a.id_auditoria, a.accion_realizada, a.tabla_afectada, a.fecha_hora, a.ip_origen, u.email
     FROM auditoria_registro a
     LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
     ORDER BY a.fecha_hora DESC, a.id_auditoria DESC
     LIMIT 1000'
)->fetchAll();

$eventos = array_map(static fn (array $fila): array => [
    'id' => (int) $fila['id_auditoria'],
    'fecha' => $fila['fecha_hora'],
    'usuario' => $fila['email'] ?? 'Anónimo',
    'accion' => $fila['accion_realizada'],
    'tabla' => $fila['tabla_afectada'],
    'ip' => $fila['ip_origen'],
], $filas);

echo json_encode(['success' => true, 'eventos' => $eventos]);
