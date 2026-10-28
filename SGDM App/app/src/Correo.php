<?php
declare(strict_types=1);

namespace App;

use RuntimeException;

/**
 * Envío de correos con la API de Gmail, desde empresalidenskap@gmail.com.
 *
 * Usa la API REST directamente con curl, sin librerías de Google ni Composer:
 *   1. Con el refresh token pide un access token a Google (dura ~1 hora).
 *   2. Arma el correo en formato MIME (texto + HTML), lo codifica en
 *      base64url y lo manda a users.messages.send.
 *
 * Variables de entorno (igual que las de la base: pool de PHP-FPM en el
 * servidor, .env en Docker):
 *   GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN  -> credenciales OAuth
 *   GMAIL_REMITENTE  -> dirección que envía (la cuenta que autorizó el token)
 *   CORREO_MODO      -> "log" = no envía, escribe el correo en el log de PHP
 *                       (para probar sin credenciales). Vacío = Gmail.
 */
final class Correo
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const ENVIO_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
    private const NOMBRE_REMITENTE = 'Lidenskap SGDM';

    private static ?string $accessToken = null;

    private static function modoLog(): bool
    {
        return getenv('CORREO_MODO') === 'log';
    }

    /** true si hay con qué enviar (o si está en modo log). */
    public static function configurado(): bool
    {
        if (self::modoLog()) {
            return true;
        }
        foreach (['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_REMITENTE'] as $variable) {
            if ((string) getenv($variable) === '') {
                return false;
            }
        }
        return true;
    }

    /**
     * Envía un correo. Lanza RuntimeException si Google lo rechaza o no responde.
     * $responderA: a quién va la respuesta (p. ej. quien escribió en Contacto).
     */
    public static function enviar(string $para, string $asunto, string $html, string $texto, ?string $responderA = null): void
    {
        if (!filter_var($para, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Dirección de destino inválida.');
        }

        if (self::modoLog()) {
            error_log("[SGDM correo] Para: {$para} | Asunto: {$asunto}\n{$texto}");
            return;
        }

        [$estado, $respuesta] = self::post(
            self::ENVIO_URL,
            json_encode(['raw' => self::base64url(self::armarMime($para, $asunto, $html, $texto, $responderA))]),
            ['Authorization: Bearer ' . self::accessToken(), 'Content-Type: application/json']
        );
        if ($estado !== 200) {
            throw new RuntimeException("Gmail rechazó el envío (HTTP {$estado}): " . self::resumen($respuesta));
        }
    }

    /**
     * Diseño común de los correos. Estilos en línea porque Gmail y Outlook
     * ignoran las hojas de estilo externas. $contenidoHtml ya viene escapado.
     */
    public static function plantilla(string $titulo, string $contenidoHtml): string
    {
        $titulo = htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8');
        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{$titulo}</title></head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e3e0da;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#030303;padding:18px 24px;font-size:20px;font-weight:bold;letter-spacing:2px;color:#ffffff;">LIDEN<span style="color:#a0001a;">SKAP</span></td></tr>
        <tr><td style="padding:28px 24px 8px;">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#030303;">{$titulo}</h1>
          <div style="font-size:15px;line-height:1.6;color:#333333;">{$contenidoHtml}</div>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;font-size:12px;line-height:1.5;color:#8a8a8a;border-top:1px solid #eeeeee;">
          Este es un correo automático de Lidenskap SGDM. No respondas a este mensaje.<br>
          ITS Arias Balparda · Proyecto de egreso 2026
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
    }

    /** Cambia el refresh token (de larga duración) por un access token. */
    private static function accessToken(): string
    {
        if (self::$accessToken !== null) {
            return self::$accessToken;
        }

        [$estado, $respuesta] = self::post(self::TOKEN_URL, http_build_query([
            'client_id' => getenv('GMAIL_CLIENT_ID'),
            'client_secret' => getenv('GMAIL_CLIENT_SECRET'),
            'refresh_token' => getenv('GMAIL_REFRESH_TOKEN'),
            'grant_type' => 'refresh_token',
        ]), ['Content-Type: application/x-www-form-urlencoded']);

        $datos = json_decode($respuesta, true);
        if ($estado !== 200 || empty($datos['access_token'])) {
            $pista = ($datos['error'] ?? '') === 'invalid_grant'
                ? ' El refresh token venció o fue revocado (si la app de Google Cloud está en "Testing" vence a los 7 días).'
                : '';
            throw new RuntimeException("Google no dio el access token (HTTP {$estado}): " . self::resumen($respuesta) . $pista);
        }

        return self::$accessToken = $datos['access_token'];
    }

    /** @return array{0:int,1:string} [código HTTP, cuerpo] */
    private static function post(string $url, string $cuerpo, array $encabezados): array
    {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $cuerpo,
            CURLOPT_HTTPHEADER => $encabezados,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
        ]);
        $respuesta = curl_exec($curl);
        $estado = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);

        if ($respuesta === false) {
            throw new RuntimeException("Sin conexión con Google: {$error}");
        }
        return [$estado, (string) $respuesta];
    }

    /** Correo en formato MIME (RFC 2822) con versión en texto y en HTML. */
    private static function armarMime(string $para, string $asunto, string $html, string $texto, ?string $responderA): string
    {
        $separador = 'sgdm-' . bin2hex(random_bytes(12));
        // Los encabezados no pueden llevar saltos de línea (evita inyectar un Bcc:)
        $limpio = static fn (string $valor): string => str_replace(["\r", "\n"], '', $valor);
        $codificado = static fn (string $valor): string => '=?UTF-8?B?' . base64_encode($limpio($valor)) . '?=';

        $encabezados = [
            'From: ' . $codificado(self::NOMBRE_REMITENTE) . ' <' . $limpio((string) getenv('GMAIL_REMITENTE')) . '>',
            'To: <' . $limpio($para) . '>',
        ];
        if ($responderA !== null && filter_var($responderA, FILTER_VALIDATE_EMAIL)) {
            $encabezados[] = 'Reply-To: <' . $limpio($responderA) . '>';
        }

        return implode("\r\n", [
            ...$encabezados,
            'Subject: ' . $codificado($asunto),
            'Date: ' . date(DATE_RFC2822),
            'MIME-Version: 1.0',
            "Content-Type: multipart/alternative; boundary=\"{$separador}\"",
            '',
            "--{$separador}",
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            chunk_split(base64_encode($texto)),
            "--{$separador}",
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            chunk_split(base64_encode($html)),
            "--{$separador}--",
        ]);
    }

    private static function base64url(string $datos): string
    {
        return rtrim(strtr(base64_encode($datos), '+/', '-_'), '=');
    }

    private static function resumen(string $respuesta): string
    {
        return mb_substr(preg_replace('/\s+/', ' ', $respuesta) ?? '', 0, 300);
    }
}
