<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

/**
 * Clave primaria compuesta (id_equipo, id_participante): find()/update()/
 * delete() de Model no aplican tal cual; usar create()/all() o consultas
 * propias cuando se necesite.
 */
class EquipoParticipante extends Model
{
    protected static string $table = 'equipo_participante';
}
