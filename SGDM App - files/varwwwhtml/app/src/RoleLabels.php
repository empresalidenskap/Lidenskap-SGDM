<?php
declare(strict_types=1);

namespace App;

final class RoleLabels
{
    private const LABELS = [
        'ADMIN' => 'Administrador general',
        'ORGANIZADOR' => 'Organizador de torneo',
        'ARBITRO' => 'Árbitro',
        'PARTICIPANTE' => 'Participante',
        'PUBLICO' => 'Usuario público',
    ];

    public static function forCode(string $code): string
    {
        return self::LABELS[$code] ?? $code;
    }
}
