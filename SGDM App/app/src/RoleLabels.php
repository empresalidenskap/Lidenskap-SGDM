<?php
declare(strict_types=1);

namespace App;

/**
 * Nombres para mostrar de cada código de rol. Los códigos (ADMIN,
 * ORGANIZADOR, PARTICIPANTE, PUBLICO) son los mismos que usa
 * SGDM_PERMISSIONS en assets/js/main.js — no traducir ni renombrar sin
 * actualizar ese archivo también.
 */
final class RoleLabels
{
    private const LABELS = [
        'ADMIN' => 'Administrador general',
        'ORGANIZADOR' => 'Organizador de torneo',
        'PARTICIPANTE' => 'Participante',
        'PUBLICO' => 'Usuario público',
    ];

    public static function forCode(string $code): string
    {
        return self::LABELS[$code] ?? $code;
    }
}
