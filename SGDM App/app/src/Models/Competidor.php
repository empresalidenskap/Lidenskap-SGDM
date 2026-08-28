<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class Competidor extends Model
{
    protected static string $table = 'competidor';
    protected static string $primaryKey = 'id_competidor';
}
