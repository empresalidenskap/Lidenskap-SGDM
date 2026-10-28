<?php
declare(strict_types=1);

require_once __DIR__ . '/../src/autoload.php';

use App\Auditoria;
use App\Correo;
use App\Database;

header('Content-Type: application/json; charset=utf-8');

/*
 * Formulario de Contacto (sin sesión). POST con JSON
 * { nombre, email, motivo, mensaje }: el mensaje llega por correo a la casilla
 * del sistema (GMAIL_REMITENTE) y "Responder" le contesta a quien escribió.
 */
const MOTIVOS = [
    'soporte' => 'Soporte técnico',
    'organizacion' => 'Consulta sobre organización de torneos',
    'cuenta' => 'Problemas con mi cuenta',
    'otro' => 'Otro motivo',
];
const ACCION = 'Mensaje de contacto';
const MAX_MENSAJES_IP_HORA = 5;

function responder(int $codigo, string $error): void
{
    http_response_code($codigo);
    echo json_encode(['success' => false, 'error' => $error]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responder(405, 'Método no permitido.');
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}
$nombre = trim((string) ($input['nombre'] ?? ''));
$email = strtolower(trim((string) ($input['email'] ?? '')));
$motivo = (string) ($input['motivo'] ?? '');
$mensaje = trim((string) ($input['mensaje'] ?? ''));

if ($nombre === '' || mb_strlen($nombre) > 100) {
    responder(400, 'Escribí tu nombre (hasta 100 caracteres).');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, 'El correo electrónico no es válido.');
}
if (!isset(MOTIVOS[$motivo])) {
    responder(400, 'Elegí el motivo de la consulta.');
}
if (mb_strlen($mensaje) < 10 || mb_strlen($mensaje) > 2000) {
    responder(400, 'El mensaje tiene que tener entre 10 y 2000 caracteres.');
}

$destino = (string) getenv('GMAIL_REMITENTE');
if (!Correo::configurado() || !filter_var($destino, FILTER_VALIDATE_EMAIL)) {
    responder(503, 'El envío de correos no está configurado en el servidor. Probá más tarde.');
}

// Límite por IP, contado del registro de auditoría (igual que la recuperación de contraseña)
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$stmt = Database::getConnection()->prepare(
    'SELECT COUNT(*) FROM auditoria_registro
     WHERE accion_realizada = ? AND ip_origen = ? AND fecha_hora > NOW() - INTERVAL 1 HOUR'
);
$stmt->execute([ACCION, $ip]);
if ((int) $stmt->fetchColumn() >= MAX_MENSAJES_IP_HORA) {
    responder(429, 'Ya enviaste varios mensajes en la última hora. Probá más tarde.');
}

$e = static fn (string $texto): string => htmlspecialchars($texto, ENT_QUOTES, 'UTF-8');
$html = Correo::plantilla('Nuevo mensaje de contacto',
    '<p><strong>De:</strong> ' . $e($nombre) . ' &lt;' . $e($email) . '&gt;<br>'
    . '<strong>Motivo:</strong> ' . $e(MOTIVOS[$motivo]) . '</p>'
    . '<p style="white-space:pre-line;padding:12px 14px;background:#f5f4f2;border-radius:8px;">' . $e($mensaje) . '</p>'
    . '<p>Respondé este correo para contestarle directamente.</p>');
$texto = "Nuevo mensaje de contacto\n\nDe: {$nombre} <{$email}>\nMotivo: " . MOTIVOS[$motivo] . "\n\n{$mensaje}\n";

try {
    Correo::enviar($destino, 'Contacto: ' . MOTIVOS[$motivo] . ' · ' . $nombre, $html, $texto, $email);
} catch (Throwable $error) {
    error_log('[SGDM correo] No se pudo enviar el mensaje de contacto: ' . $error->getMessage());
    responder(502, 'No se pudo enviar el mensaje. Intentá de nuevo en unos minutos.');
}

Auditoria::registrar(ACCION, 'contacto', null, MOTIVOS[$motivo] . ' · ' . $email);
echo json_encode(['success' => true]);
