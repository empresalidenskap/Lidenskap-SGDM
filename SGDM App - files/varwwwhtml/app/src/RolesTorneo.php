<?php
declare(strict_types=1);

namespace App;

use App\Models\Competidor;
use App\Models\Inscripcion;
use App\Models\Participante;
use App\Models\Rol;
use App\Models\TorneoArbitro;
use App\Models\Usuario;

final class RolesTorneo
{
    public static function activos(int $idUsuario): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT v.id_torneo, t.nombre_torneo, v.rol
             FROM vista_rol_torneo v
             JOIN torneo t ON t.id_torneo = v.id_torneo
             WHERE v.id_usuario = :id AND v.activo = 1
             ORDER BY t.nombre_torneo'
        );
        $stmt->execute(['id' => $idUsuario]);

        return array_map(static fn (array $fila): array => [
            'idTorneo' => (int) $fila['id_torneo'],
            'torneo' => $fila['nombre_torneo'],
            'rol' => $fila['rol'],
        ], $stmt->fetchAll());
    }

    public static function tiene(int $idUsuario, int $idTorneo, array $roles): bool
    {
        $marcadores = implode(', ', array_fill(0, count($roles), '?'));
        $stmt = Database::getConnection()->prepare(
            "SELECT 1 FROM vista_rol_torneo
             WHERE id_usuario = ? AND id_torneo = ? AND activo = 1 AND rol IN ($marcadores)
             LIMIT 1"
        );
        $stmt->execute([$idUsuario, $idTorneo, ...$roles]);
        return $stmt->fetchColumn() !== false;
    }

    public static function yaVinculado(int $idUsuario, int $idTorneo): bool
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT 1 FROM vista_rol_torneo WHERE id_usuario = :u AND id_torneo = :t
             UNION
             SELECT 1 FROM equipo_participante ep
             JOIN participante p ON p.id_participante = ep.id_participante
             JOIN equipo e       ON e.id_equipo       = ep.id_equipo
             JOIN inscripcion i  ON i.id_competidor   = e.id_competidor
             WHERE p.id_usuario = :u2 AND i.id_torneo = :t2
               AND ep.estado <> 'rechazada' AND i.estado_inscripcion <> 'rechazada'
             LIMIT 1"
        );
        $stmt->execute(['u' => $idUsuario, 't' => $idTorneo, 'u2' => $idUsuario, 't2' => $idTorneo]);
        return $stmt->fetchColumn() !== false;
    }

    public static function cupoLleno(array $torneo): bool
    {
        if ($torneo['cupo_maximo'] === null) {
            return false;
        }
        $stmt = Database::getConnection()->prepare(
            "SELECT COUNT(*) FROM inscripcion WHERE id_torneo = ? AND estado_inscripcion = 'confirmada'"
        );
        $stmt->execute([$torneo['id_torneo']]);
        return (int) $stmt->fetchColumn() >= (int) $torneo['cupo_maximo'];
    }

    public static function cuentaParaSumar(string $email, int $idTorneo): array|string
    {
        $usuario = Usuario::findBy('email', strtolower(trim($email)));
        if ($usuario === null) {
            return 'No hay ninguna cuenta con ese correo.';
        }
        if ($usuario['estado'] !== 'activo') {
            return 'Esa cuenta no está activa.';
        }
        if ((int) $usuario['id_rol'] !== (int) Rol::findBy('nombre_rol', 'PUBLICO')['id_rol']) {
            return 'Los roles de un torneo son para Usuarios públicos, no para un Administrador.';
        }
        if (self::yaVinculado((int) $usuario['id_usuario'], $idTorneo)) {
            return 'Esa cuenta ya tiene un rol, una solicitud o una invitación en este torneo.';
        }
        $usuario['id_usuario'] = (int) $usuario['id_usuario'];
        return $usuario;
    }

    public static function agregarArbitro(int $idUsuario, int $idTorneo, string $estado): int
    {
        return TorneoArbitro::create([
            'id_torneo' => $idTorneo,
            'id_usuario' => $idUsuario,
            'estado_solicitud' => $estado,
        ]);
    }

    public static function participanteDe(array $usuario): array
    {
        $participante = Participante::findBy('id_usuario', $usuario['id_usuario']);
        if ($participante !== null) {
            return $participante;
        }
        $idCompetidor = Competidor::create(['tipo_competidor' => 'participante']);
        $id = Participante::create([
            'id_competidor' => $idCompetidor,
            'id_usuario' => $usuario['id_usuario'],
            'nombre_participante' => trim($usuario['nombre'] . ' ' . $usuario['apellido']),
        ]);
        return Participante::find($id);
    }

    public static function inscribirParticipante(array $usuario, int $idTorneo, string $estado): int
    {
        return Inscripcion::create([
            'id_torneo' => $idTorneo,
            'id_competidor' => self::participanteDe($usuario)['id_competidor'],
            'estado_inscripcion' => $estado,
        ]);
    }
}
