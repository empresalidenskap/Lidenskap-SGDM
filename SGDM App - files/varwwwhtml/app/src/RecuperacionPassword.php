<?php
declare(strict_types=1);

namespace App;

use App\Models\Usuario;
use Throwable;

final class RecuperacionPassword
{
    public const MINUTOS_VIGENCIA = 15;
    private const MAX_INTENTOS = 5;
    private const MAX_PEDIDOS_CUENTA_HORA = 3;
    private const MAX_PEDIDOS_IP_HORA = 10;
    private const ACCION_PEDIDO = 'Solicitud de recuperación de contraseña';

    private const CODIGO_INVALIDO = 'El código es incorrecto o venció. Revisá el correo o pedí uno nuevo.';

    public static function solicitar(string $email): void
    {
        Auth::ensureStarted();
        unset($_SESSION['recuperacion']);
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;

        if ($ip !== null && self::pedidosUltimaHora('ip_origen', $ip) >= self::MAX_PEDIDOS_IP_HORA) {
            error_log("[SGDM] Recuperación de contraseña bloqueada: límite por IP ({$ip})");
            return;
        }

        $usuario = Usuario::findBy('email', $email);
        if ($usuario === null || $usuario['estado'] !== 'activo') {
            Auditoria::registrar(self::ACCION_PEDIDO, 'usuario', null, 'Correo sin cuenta activa');
            return;
        }
        $idUsuario = (int) $usuario['id_usuario'];
        if (self::pedidosUltimaHora('id_usuario', $idUsuario) >= self::MAX_PEDIDOS_CUENTA_HORA) {
            error_log("[SGDM] Recuperación de contraseña bloqueada: límite por cuenta ({$email})");
            return;
        }

        $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        try {
            self::enviarCodigo($usuario, $codigo);
        } catch (Throwable $error) {
            error_log('[SGDM correo] No se pudo enviar el código de recuperación: ' . $error->getMessage());
            return;
        }

        $_SESSION['recuperacion'] = [
            'id_usuario' => $idUsuario,
            'codigo_hash' => password_hash($codigo, PASSWORD_DEFAULT),
            'intentos' => 0,
            'vence' => time() + self::MINUTOS_VIGENCIA * 60,
            'verificado' => false,
        ];
        Auditoria::registrar(self::ACCION_PEDIDO, 'usuario', $idUsuario);
    }

    public static function verificar(string $codigo): ?string
    {
        if (!preg_match('/^\d{6}$/', $codigo)) {
            return 'El código tiene 6 números.';
        }
        $pedido = self::pedidoVigente();
        if ($pedido === null) {
            return self::CODIGO_INVALIDO;
        }

        if (!password_verify($codigo, $pedido['codigo_hash'])) {
            $intentos = ++$_SESSION['recuperacion']['intentos'];
            $quedan = self::MAX_INTENTOS - $intentos;
            if ($quedan <= 0) {
                unset($_SESSION['recuperacion']);
                return 'Código incorrecto. Se agotaron los intentos: pedí un código nuevo.';
            }
            return 'Código incorrecto. Te ' . ($quedan === 1 ? 'queda 1 intento.' : "quedan {$quedan} intentos.");
        }

        $_SESSION['recuperacion']['verificado'] = true;
        return null;
    }

    public static function restablecer(string $nueva): ?string
    {
        $pedido = self::pedidoVigente();
        if ($pedido === null || !$pedido['verificado']) {
            return self::CODIGO_INVALIDO;
        }
        $problema = Password::validar($nueva);
        if ($problema !== null) {
            return $problema;
        }

        unset($_SESSION['recuperacion']);
        Usuario::update($pedido['id_usuario'], ['password' => password_hash($nueva, PASSWORD_DEFAULT)]);
        Auditoria::registrar('Contraseña restablecida con código por correo', 'usuario', $pedido['id_usuario']);
        Password::avisarCambio(Usuario::find($pedido['id_usuario']), 'con un código de recuperación enviado por correo');
        return null;
    }

    private static function pedidoVigente(): ?array
    {
        Auth::ensureStarted();
        $pedido = $_SESSION['recuperacion'] ?? null;
        if ($pedido === null || $pedido['vence'] < time() || $pedido['intentos'] >= self::MAX_INTENTOS) {
            return null;
        }
        return $pedido;
    }

    private static function pedidosUltimaHora(string $columna, int|string $valor): int
    {
        $soloEnviados = $columna === 'id_usuario' ? ' AND detalle IS NULL' : '';
        $stmt = Database::getConnection()->prepare(
            "SELECT COUNT(*) FROM auditoria_registro
             WHERE accion_realizada = :accion AND {$columna} = :valor{$soloEnviados}
               AND fecha_hora > NOW() - INTERVAL 1 HOUR"
        );
        $stmt->execute(['accion' => self::ACCION_PEDIDO, 'valor' => $valor]);
        return (int) $stmt->fetchColumn();
    }

    private static function enviarCodigo(array $usuario, string $codigo): void
    {
        $nombre = htmlspecialchars($usuario['nombre'], ENT_QUOTES, 'UTF-8');
        $minutos = self::MINUTOS_VIGENCIA;
        $texto = "Hola {$usuario['nombre']}:\n\nTu código para crear una contraseña nueva en Lidenskap SGDM es:\n\n    {$codigo}\n\n"
            . "Vence en {$minutos} minutos y sirve una sola vez.\n\nSi no pediste cambiar la contraseña, ignorá este correo: tu contraseña actual sigue funcionando.\n\nLidenskap SGDM";
        $html = Correo::plantilla(
            'Recuperá tu contraseña',
            "<p>Hola {$nombre}:</p><p>Tu código para crear una contraseña nueva es:</p>"
            . "<p style=\"margin:20px 0;padding:16px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:10px;color:#030303;background:#f5f4f2;border:1px dashed #c3b79d;border-radius:8px;\">{$codigo}</p>"
            . "<p>Vence en <strong>{$minutos} minutos</strong> y sirve una sola vez.</p>"
            . '<p style="color:#666666;">Si no pediste cambiar la contraseña, ignorá este correo: tu contraseña actual sigue funcionando.</p>'
        );
        Correo::enviar($usuario['email'], "{$codigo} es tu código de Lidenskap", $html, $texto);
    }
}
