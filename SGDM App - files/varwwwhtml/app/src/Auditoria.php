<?php
declare(strict_types=1);

namespace App;

use App\Models\AuditoriaRegistro;

final class Auditoria
{
    public static function registrar(string $accion, string $tabla, ?int $idUsuario = null, ?string $detalle = null): void
    {
        $idUsuario ??= Auth::current()['id_usuario'] ?? null;

        AuditoriaRegistro::create([
            'id_usuario' => $idUsuario,
            'accion_realizada' => mb_substr($accion, 0, 100),
            'tabla_afectada' => $tabla,
            'detalle' => $detalle !== null ? mb_substr($detalle, 0, 255) : null,
            'ip_origen' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);
    }
}
