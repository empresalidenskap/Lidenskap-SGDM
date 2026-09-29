<?php
declare(strict_types=1);

namespace App;

/**
 * Traduce los códigos cortos que ya usa el front-end (assets/js/main.js:
 * discipline="futbol", format="liga", etc., usados en los <select> y en
 * los filtros de torneos.html/calendario.html) a los nombres reales
 * guardados en modulo_competencia / tipo_torneo.
 */
final class Catalogos
{
    private const DISCIPLINAS = [
        'futbol' => 'Fútbol',
        'basquet' => 'Básquetbol',
        'ajedrez' => 'Ajedrez',
        'tenis' => 'Tenis',
        'esports' => 'Esports',
        'voleibol' => 'Voleibol',
        'rugby' => 'Rugby',
    ];

    private const FORMATOS = [
        'liga' => 'Liga',
        'eliminacion' => 'Eliminación Directa',
        'suizo' => 'Sistema Suizo',
    ];

    public static function nombreDisciplina(string $codigo): ?string
    {
        return self::DISCIPLINAS[$codigo] ?? null;
    }

    public static function nombreFormato(string $codigo): ?string
    {
        return self::FORMATOS[$codigo] ?? null;
    }

    public static function codigoDisciplina(string $nombreModulo): string
    {
        $codigo = array_search($nombreModulo, self::DISCIPLINAS, true);
        return $codigo !== false ? $codigo : 'personalizada';
    }

    public static function codigoFormato(string $nombreTipo): string
    {
        $codigo = array_search($nombreTipo, self::FORMATOS, true);
        return $codigo !== false ? $codigo : 'otro';
    }
}
