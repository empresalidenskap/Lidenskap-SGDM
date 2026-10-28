<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Correo;
use App\RecuperacionPassword;

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}

switch ((string) ($input['accion'] ?? '')) {
    case 'solicitar':
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'El correo electrónico no es válido.']);
            exit;
        }
        if (!Correo::configurado()) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => 'El envío de correos no está configurado en el servidor. Avisá al administrador.']);
            exit;
        }
        RecuperacionPassword::solicitar($email);
        echo json_encode(['success' => true, 'minutos' => RecuperacionPassword::MINUTOS_VIGENCIA]);
        exit;

    case 'verificar':
        $error = RecuperacionPassword::verificar(trim((string) ($input['codigo'] ?? '')));
        break;

    case 'restablecer':
        $error = RecuperacionPassword::restablecer((string) ($input['password'] ?? ''));
        break;

    default:
        $error = 'Acción no válida.';
}

if ($error !== null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

echo json_encode(['success' => true]);
