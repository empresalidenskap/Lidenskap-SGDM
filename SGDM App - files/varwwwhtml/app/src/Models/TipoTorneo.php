<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class TipoTorneo extends Model
{
    protected static string $table = 'tipo_torneo';
    protected static string $primaryKey = 'id_tipo_torneo';
}
