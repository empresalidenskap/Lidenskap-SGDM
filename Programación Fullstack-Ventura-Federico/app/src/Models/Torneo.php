<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class Torneo extends Model
{
    protected static string $table = 'torneo';
    protected static string $primaryKey = 'id_torneo';
}
