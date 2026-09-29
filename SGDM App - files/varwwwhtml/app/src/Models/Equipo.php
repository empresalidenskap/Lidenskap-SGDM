<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class Equipo extends Model
{
    protected static string $table = 'equipo';
    protected static string $primaryKey = 'id_equipo';
}
