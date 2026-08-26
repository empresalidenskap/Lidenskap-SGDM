<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class TablaPosiciones extends Model
{
    protected static string $table = 'tabla_posiciones';
    protected static string $primaryKey = 'id_posicion';
}
