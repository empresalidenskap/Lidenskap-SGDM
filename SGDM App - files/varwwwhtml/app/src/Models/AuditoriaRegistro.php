<?php
declare(strict_types=1);

namespace App\Models;

use App\Model;

class AuditoriaRegistro extends Model
{
    protected static string $table = 'auditoria_registro';
    protected static string $primaryKey = 'id_auditoria';
}
