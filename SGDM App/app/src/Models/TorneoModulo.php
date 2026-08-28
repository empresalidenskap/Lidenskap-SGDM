<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

/**
 * Clave primaria compuesta (id_torneo, id_modulo): find()/update()/delete()
 * de Model no aplican tal cual; usar create()/all() o consultas propias.
 */
class TorneoModulo extends Model
{
    protected static string $table = 'torneo_modulo';
}
