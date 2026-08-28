<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class Usuario extends Model
{
    protected static string $table = 'usuario';
    protected static string $primaryKey = 'id_usuario';
}
