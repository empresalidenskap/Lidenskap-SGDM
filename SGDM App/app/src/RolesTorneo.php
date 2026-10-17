<?php
declare(strict_types=1);

namespace App;

use App\Models\Competidor;
use App\Models\Inscripcion;
use App\Models\Participante;
use App\Models\TorneoArbitro;

/**
 * Roles por torneo (ORGANIZADOR, ARBITRO, PARTICIPANTE). No se guardan en
 * usuario: se leen de vista_rol_torneo, que los deduce del organizador del
 * torneo, de torneo_arbitro y de las inscripciones. Cuando el torneo
 * termina la vista los marca como inactivos y el usuario vuelve a ser solo
 * Usuario público, con la misma cuenta.
 */
final class RolesTorneo
{
    /** Roles activos del usuario: [{idTorneo, torneo, rol}] */
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

    /** ¿Ya tiene alguna fila (rol o solicitud, en cualquier estado) en ese torneo? */
    public static function yaVinculado(int $idUsuario, int $idTorneo): bool
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT 1 FROM vista_rol_torneo WHERE id_usuario = ? AND id_torneo = ? LIMIT 1'
        );
        $stmt->execute([$idUsuario, $idTorneo]);
        return $stmt->fetchColumn() !== false;
    }

    public static function agregarArbitro(int $idUsuario, int $idTorneo, string $estado): int
    {
        return TorneoArbitro::create([
            'id_torneo' => $idTorneo,
            'id_usuario' => $idUsuario,
            'estado_solicitud' => $estado,
        ]);
    }

    /**
     * Inscribe al usuario como participante individual. Reutiliza su
     * participante si ya jugó otro torneo; si no, crea competidor + participante.
     */
    public static function inscribirParticipante(array $usuario, int $idTorneo, string $estado): int
    {
        $participante = Participante::findBy('id_usuario', $usuario['id_usuario']);
        if ($participante !== null) {
            $idCompetidor = (int) $participante['id_competidor'];
        } else {
            $idCompetidor = Competidor::create(['tipo_competidor' => 'participante']);
            Participante::create([
                'id_competidor' => $idCompetidor,
                'id_usuario' => $usuario['id_usuario'],
                'nombre_participante' => trim($usuario['nombre'] . ' ' . $usuario['apellido']),
            ]);
        }

        return Inscripcion::create([
            'id_torneo' => $idTorneo,
            'id_competidor' => $idCompetidor,
            'estado_inscripcion' => $estado,
        ]);
    }
}
