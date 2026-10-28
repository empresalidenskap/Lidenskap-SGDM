<?php
declare(strict_types=1);

namespace App;

use Throwable;

/**
 * Reglas de la contraseña (las mismas que PASSWORD_RULES de main.js muestra
 * en vivo) y los correos de la cuenta: bienvenida y "tu contraseña cambió".
 */
final class Password
{
    /** Devuelve el primer problema de la contraseña, o null si es válida. */
    public static function validar(string $nueva, ?string $actual = null): ?string
    {
        if (mb_strlen($nueva) < 8) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }
        if (strlen($nueva) > 72) {
            return 'La contraseña no puede tener más de 72 caracteres.'; // bcrypt ignora lo que sigue
        }
        if (!preg_match('/\p{L}/u', $nueva)) {
            return 'La contraseña debe tener al menos una letra.';
        }
        if (!preg_match('/\d/', $nueva)) {
            return 'La contraseña debe tener al menos un número.';
        }
        if ($actual !== null && hash_equals($actual, $nueva)) {
            return 'La contraseña nueva tiene que ser distinta de la actual.';
        }
        return null;
    }

    /**
     * Cuenta creada por el Administrador sin contraseña: le llega un enlace
     * que abre "Olvidé mi contraseña" con su correo, y ahí pide el código y
     * elige la suya. $usuario: ['nombre', 'email']; $rol: p. ej.
     * "Participante del equipo Halcones en Copa Demo". true si se envió.
     */
    public static function enviarBienvenida(array $usuario, string $rol, string $urlSitio): bool
    {
        $enlace = $urlSitio . 'index.html#recuperar=' . rawurlencode($usuario['email']);
        $nombre = htmlspecialchars($usuario['nombre'], ENT_QUOTES, 'UTF-8');
        $rolHtml = htmlspecialchars($rol, ENT_QUOTES, 'UTF-8');
        $enlaceHtml = htmlspecialchars($enlace, ENT_QUOTES, 'UTF-8');
        $texto = "Hola {$usuario['nombre']}:\n\nEl Administrador te creó una cuenta en Lidenskap SGDM ({$rol}).\n\n"
            . "Para entrar, elegí tu contraseña en este enlace:\n{$enlace}\n\n"
            . "Te va a llegar un código de 6 números a este correo para confirmar que sos vos.\n\nLidenskap SGDM";
        $html = Correo::plantilla(
            'Te crearon una cuenta',
            "<p>Hola {$nombre}:</p><p>El Administrador te creó una cuenta en Lidenskap SGDM: <strong>{$rolHtml}</strong>.</p>"
            . '<p>Para entrar, elegí tu contraseña:</p>'
            . "<p style=\"margin:20px 0;text-align:center;\"><a href=\"{$enlaceHtml}\" style=\"display:inline-block;padding:12px 22px;background:#a0001a;color:#ffffff;font-weight:bold;text-decoration:none;border-radius:6px;\">Elegir mi contraseña</a></p>"
            . '<p>Te va a llegar un código de 6 números a este correo para confirmar que sos vos.</p>'
            . "<p style=\"color:#666666;font-size:13px;\">Si el botón no funciona, copiá este enlace en el navegador:<br>{$enlaceHtml}</p>"
        );
        try {
            Correo::enviar($usuario['email'], 'Tu cuenta de Lidenskap SGDM', $html, $texto);
            return true;
        } catch (Throwable $error) {
            error_log('[SGDM correo] No se pudo enviar la bienvenida: ' . $error->getMessage());
            return false;
        }
    }

    /**
     * $usuario: la fila de la tabla usuario. Si el correo falla no se corta
     * nada (la contraseña ya cambió): el motivo queda en el log de PHP.
     */
    public static function avisarCambio(array $usuario, string $como): void
    {
        if (!Correo::configurado()) {
            return;
        }
        $nombre = htmlspecialchars($usuario['nombre'], ENT_QUOTES, 'UTF-8');
        $fecha = date('d/m/Y H:i');
        $texto = "Hola {$usuario['nombre']}:\n\nLa contraseña de tu cuenta de Lidenskap SGDM se cambió el {$fecha} ({$como}).\n\n"
            . "Si fuiste vos, no tenés que hacer nada.\nSi no fuiste vos, usá \"¿Olvidaste tu contraseña?\" al iniciar sesión para recuperar el acceso.\n\nLidenskap SGDM";
        $html = Correo::plantilla(
            'Tu contraseña cambió',
            "<p>Hola {$nombre}:</p><p>La contraseña de tu cuenta de Lidenskap SGDM se cambió el <strong>{$fecha}</strong> ({$como}).</p>"
            . '<p>Si fuiste vos, no tenés que hacer nada.</p>'
            . '<p>Si <strong>no</strong> fuiste vos, usá <em>«¿Olvidaste tu contraseña?»</em> al iniciar sesión para recuperar el acceso.</p>'
        );
        try {
            Correo::enviar($usuario['email'], 'Tu contraseña de Lidenskap cambió', $html, $texto);
        } catch (Throwable $error) {
            error_log('[SGDM correo] No se pudo enviar el aviso de cambio de contraseña: ' . $error->getMessage());
        }
    }
}
