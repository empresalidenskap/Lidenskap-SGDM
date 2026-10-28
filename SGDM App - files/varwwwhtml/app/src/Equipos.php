<?php
declare(strict_types=1);

namespace App;

final class Equipos
{
    public static function torneoActivo(int $idEquipo): ?array
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT t.*, i.id_inscripcion, i.estado_inscripcion
             FROM equipo e
             JOIN inscripcion i ON i.id_competidor = e.id_competidor
                               AND i.estado_inscripcion IN ('pendiente', 'confirmada')
             JOIN torneo t      ON t.id_torneo = i.id_torneo
                               AND t.estado NOT IN ('finalizado', 'cancelado')
             WHERE e.id_equipo = ?
             LIMIT 1"
        );
        $stmt->execute([$idEquipo]);
        $fila = $stmt->fetch();
        return $fila === false ? null : $fila;
    }

    public static function aceptados(int $idEquipo): int
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT COUNT(*) FROM equipo_participante WHERE id_equipo = ? AND estado = 'aceptada'"
        );
        $stmt->execute([$idEquipo]);
        return (int) $stmt->fetchColumn();
    }

    public static function lleno(int $idEquipo, array $torneo): bool
    {
        return $torneo['max_integrantes_equipo'] !== null
            && self::aceptados($idEquipo) >= (int) $torneo['max_integrantes_equipo'];
    }

    public static function integrante(int $idEquipo, int $idParticipante): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT ep.*, p.id_usuario, p.nombre_participante, e.nombre_equipo
             FROM equipo_participante ep
             JOIN participante p ON p.id_participante = ep.id_participante
             JOIN equipo e       ON e.id_equipo       = ep.id_equipo
             WHERE ep.id_equipo = ? AND ep.id_participante = ?'
        );
        $stmt->execute([$idEquipo, $idParticipante]);
        $fila = $stmt->fetch();
        return $fila === false ? null : $fila;
    }

    public static function ponerIntegrante(int $idEquipo, int $idParticipante, string $estado): void
    {
        Database::getConnection()->prepare(
            'INSERT INTO equipo_participante (id_equipo, id_participante, estado) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE estado = VALUES(estado), fecha_ingreso = CURRENT_DATE'
        )->execute([$idEquipo, $idParticipante, $estado]);
    }

    public static function cambiarEstado(int $idEquipo, int $idParticipante, string $estado): void
    {
        Database::getConnection()->prepare(
            'UPDATE equipo_participante SET estado = ? WHERE id_equipo = ? AND id_participante = ?'
        )->execute([$estado, $idEquipo, $idParticipante]);
    }

    public static function solicitudes(string $where, array $params): array
    {
        $stmt = Database::getConnection()->prepare(
            "SELECT ep.id_equipo, ep.id_participante, ep.estado, e.nombre_equipo,
                    t.id_torneo, t.nombre_torneo, t.estado AS estado_torneo,
                    u.nombre, u.apellido, u.email
             FROM equipo_participante ep
             JOIN equipo e       ON e.id_equipo       = ep.id_equipo
             JOIN inscripcion i  ON i.id_competidor   = e.id_competidor
                                AND i.estado_inscripcion IN ('pendiente', 'confirmada')
             JOIN torneo t       ON t.id_torneo       = i.id_torneo
                                AND t.estado NOT IN ('finalizado', 'cancelado')
             JOIN participante p ON p.id_participante = ep.id_participante
             JOIN usuario u      ON u.id_usuario      = p.id_usuario
             WHERE $where
             ORDER BY t.nombre_torneo, e.nombre_equipo"
        );
        $stmt->execute($params);

        $estados = ['solicitada' => 'pendiente', 'invitada' => 'invitada', 'aceptada' => 'aprobada', 'rechazada' => 'rechazada'];
        return array_map(static fn (array $fila): array => [
            'tipo' => 'unirse_equipo',
            'id' => (int) $fila['id_participante'],
            'idEquipo' => (int) $fila['id_equipo'],
            'equipo' => $fila['nombre_equipo'],
            'rol' => 'PARTICIPANTE',
            'idTorneo' => (int) $fila['id_torneo'],
            'torneo' => $fila['nombre_torneo'],
            'estadoTorneo' => $fila['estado_torneo'],
            'estado' => $estados[$fila['estado']],
            'activo' => false,
            'solicitante' => trim($fila['nombre'] . ' ' . $fila['apellido']),
            'email' => $fila['email'],
        ], $stmt->fetchAll());
    }
}
