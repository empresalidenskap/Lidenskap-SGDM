<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class Participante extends Model
{
    protected static string $table = 'participante';
    protected static string $primaryKey = 'id_participante';
}
