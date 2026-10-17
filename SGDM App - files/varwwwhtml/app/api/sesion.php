<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auth;

header('Content-Type: application/json; charset=utf-8');

// El front la consulta al cargar cada página para refrescar los roles por
// torneo guardados en sessionStorage (p. ej. si un torneo terminó o le
// aprobaron una solicitud). user = null si la sesión del servidor expiró.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

echo json_encode(['success' => true, 'user' => Auth::currentWithRoles()]);
