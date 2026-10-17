<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class TorneoArbitro extends Model
{
    protected static string $table = 'torneo_arbitro';
    protected static string $primaryKey = 'id_torneo_arbitro';
}
