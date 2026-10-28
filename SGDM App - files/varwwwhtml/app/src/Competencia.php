<?php
declare(strict_types=1);

namespace App;

final class Competencia
{
    private const NOMBRE = 'COALESCE((SELECT eq.nombre_equipo FROM equipo eq WHERE eq.id_competidor = %1$s.id_competidor),
                                     (SELECT pa.nombre_participante FROM participante pa WHERE pa.id_competidor = %1$s.id_competidor))';

    public static function nombreSql(string $aliasInscripcion): string
    {
        return sprintf(self::NOMBRE, $aliasInscripcion);
    }

    public static function torneo(int $idTorneo): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT t.*, tt.nombre_tipo FROM torneo t
             JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo WHERE t.id_torneo = ?'
        );
        $stmt->execute([$idTorneo]);
        $torneo = $stmt->fetch();
        if ($torneo === false) {
            return null;
        }
        $torneo['formato'] = Catalogos::codigoFormato($torneo['nombre_tipo']);
        return $torneo;
    }

    public static function partido(int $idEnfrentamiento): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT e.*, ro.id_torneo, ro.numero_ronda, ro.estado_ronda,
                    r.puntuacion_local, r.puntuacion_visitante, r.validado
             FROM enfrentamiento e
             JOIN ronda ro ON ro.id_ronda = e.id_ronda
             LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
             WHERE e.id_enfrentamiento = ?'
        );
        $stmt->execute([$idEnfrentamiento]);
        $partido = $stmt->fetch();
        return $partido === false ? null : $partido;
    }

    public static function confirmadas(int $idTorneo, bool $porSiembra = false): array
    {
        $orden = $porSiembra
            ? '(cabeza_serie IS NULL), cabeza_serie, numero_sorteo, id_inscripcion'
            : 'numero_sorteo, id_inscripcion';
        $stmt = Database::getConnection()->prepare(
            "SELECT id_inscripcion FROM inscripcion
             WHERE id_torneo = ? AND estado_inscripcion = 'confirmada' ORDER BY $orden"
        );
        $stmt->execute([$idTorneo]);
        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    public static function rondaRobin(array $ids): array
    {
        if (count($ids) % 2 === 1) {
            $ids[] = null;
        }
        $n = count($ids);
        $rondas = [];
        for ($r = 0; $r < $n - 1; $r++) {
            $partidos = [];
            for ($i = 0; $i < $n / 2; $i++) {
                [$a, $b] = [$ids[$i], $ids[$n - 1 - $i]];
                if ($a !== null && $b !== null) {
                    $partidos[] = $r % 2 === 0 ? [$a, $b] : [$b, $a];
                }
            }
            $rondas[] = $partidos;
            array_splice($ids, 1, 0, [array_pop($ids)]);
        }
        return $rondas;
    }

    public static function primeraLlave(array $ids): array
    {
        $tamano = 2;
        while ($tamano < count($ids)) {
            $tamano *= 2;
        }
        $posiciones = [1];
        while (count($posiciones) < $tamano) {
            $siguiente = [];
            $total = count($posiciones) * 2 + 1;
            foreach ($posiciones as $semilla) {
                array_push($siguiente, $semilla, $total - $semilla);
            }
            $posiciones = $siguiente;
        }
        $partidos = [];
        for ($i = 0; $i < $tamano; $i += 2) {
            $partidos[] = [$ids[$posiciones[$i] - 1], $ids[$posiciones[$i + 1] - 1] ?? null];
        }
        return $partidos;
    }

    public static function partidos(int $idRonda): array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT e.*, r.puntuacion_local, r.puntuacion_visitante, r.validado
             FROM enfrentamiento e
             LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
             WHERE e.id_ronda = ? ORDER BY e.id_enfrentamiento'
        );
        $stmt->execute([$idRonda]);
        return $stmt->fetchAll();
    }

    public static function ganador(array $partido): ?int
    {
        if ($partido['id_inscripcion_visitante'] === null) {
            return (int) $partido['id_inscripcion_local'];
        }
        if ($partido['puntuacion_local'] === null) {
            return null;
        }
        [$local, $visitante] = [(int) $partido['puntuacion_local'], (int) $partido['puntuacion_visitante']];
        if ($local === $visitante) {
            return null;
        }
        return (int) ($local > $visitante ? $partido['id_inscripcion_local'] : $partido['id_inscripcion_visitante']);
    }

    public static function rondaCompleta(int $idRonda): bool
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT COUNT(*) FROM enfrentamiento e
             LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
             WHERE e.id_ronda = ? AND e.id_inscripcion_visitante IS NOT NULL
               AND (r.validado IS NULL OR r.validado = 0)'
        );
        $stmt->execute([$idRonda]);
        return (int) $stmt->fetchColumn() === 0;
    }

    public static function siguienteLlave(int $idRonda): array
    {
        $ganadores = array_map([self::class, 'ganador'], self::partidos($idRonda));
        $partidos = [];
        for ($i = 0; $i + 1 < count($ganadores); $i += 2) {
            $partidos[] = [$ganadores[$i], $ganadores[$i + 1]];
        }
        return $partidos;
    }

    public static function emparejarSuizo(int $idTorneo, array $ids, bool $primera): array
    {
        $pdo = Database::getConnection();
        if (!$primera) {
            $record = array_filter(self::recordSuizo($idTorneo), static fn (array $r): bool => $r['estado'] === 'en_juego');
            uasort($record, static fn (array $a, array $b): int =>
                [$b['victorias'], $a['derrotas'], $a['sorteo']] <=> [$a['victorias'], $b['derrotas'], $b['sorteo']]);
            $ids = array_keys($record);
        }

        $stmt = $pdo->prepare(
            'SELECT e.id_inscripcion_local, e.id_inscripcion_visitante FROM enfrentamiento e
             JOIN ronda r ON r.id_ronda = e.id_ronda WHERE r.id_torneo = ?'
        );
        $stmt->execute([$idTorneo]);
        $jugados = [];
        $tuvoLibre = [];
        foreach ($stmt->fetchAll() as $fila) {
            if ($fila['id_inscripcion_visitante'] === null) {
                $tuvoLibre[(int) $fila['id_inscripcion_local']] = true;
            } else {
                $jugados[$fila['id_inscripcion_local'] . '-' . $fila['id_inscripcion_visitante']] = true;
                $jugados[$fila['id_inscripcion_visitante'] . '-' . $fila['id_inscripcion_local']] = true;
            }
        }

        $partidos = [];
        if (count($ids) % 2 === 1) {
            $libre = null;
            for ($i = count($ids) - 1; $i >= 0; $i--) {
                if (!isset($tuvoLibre[$ids[$i]])) {
                    $libre = $i;
                    break;
                }
            }
            $libre ??= count($ids) - 1;
            $partidos[] = [$ids[$libre], null];
            array_splice($ids, $libre, 1);
        }

        if ($primera) {
            $mitad = intdiv(count($ids), 2);
            $cruces = [];
            for ($i = 0; $i < $mitad; $i++) {
                $cruces[] = [$ids[$i], $ids[$i + $mitad]];
            }
            return array_merge($cruces, $partidos);
        }

        $cruces = self::crucesSinRepetir($ids, $jugados) ?? array_chunk($ids, 2);
        return array_merge($cruces, $partidos);
    }

    public static function umbralSuizo(int $inscriptos): int
    {
        return match (true) {
            $inscriptos <= 8 => 2,
            $inscriptos <= 16 => 3,
            $inscriptos <= 32 => 4,
            default => 5,
        };
    }

    public static function recordSuizo(int $idTorneo): array
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare(
            "SELECT id_inscripcion, numero_sorteo FROM inscripcion
             WHERE id_torneo = ? AND estado_inscripcion = 'confirmada'"
        );
        $stmt->execute([$idTorneo]);
        $record = [];
        foreach ($stmt->fetchAll() as $fila) {
            $record[(int) $fila['id_inscripcion']] = ['victorias' => 0, 'derrotas' => 0, 'sorteo' => (int) $fila['numero_sorteo']];
        }
        $umbral = self::umbralSuizo(count($record));

        $stmt = $pdo->prepare(
            'SELECT e.id_inscripcion_local AS l, e.id_inscripcion_visitante AS v, r.puntuacion_local AS pl, r.puntuacion_visitante AS pv, r.validado
             FROM enfrentamiento e
             JOIN ronda ro ON ro.id_ronda = e.id_ronda
             LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
             WHERE ro.id_torneo = ?'
        );
        $stmt->execute([$idTorneo]);
        foreach ($stmt->fetchAll() as $p) {
            $l = (int) $p['l'];
            if ($p['v'] === null) {
                if (isset($record[$l])) {
                    $record[$l]['victorias']++;
                }
                continue;
            }
            $v = (int) $p['v'];
            if (!$p['validado'] || (int) $p['pl'] === (int) $p['pv'] || !isset($record[$l], $record[$v])) {
                continue;
            }
            [$ganador, $perdedor] = (int) $p['pl'] > (int) $p['pv'] ? [$l, $v] : [$v, $l];
            $record[$ganador]['victorias']++;
            $record[$perdedor]['derrotas']++;
        }

        foreach ($record as &$r) {
            $r['estado'] = $r['victorias'] >= $umbral ? 'clasificado' : ($r['derrotas'] >= $umbral ? 'eliminado' : 'en_juego');
        }
        unset($r);
        return $record;
    }

    public static function tablaSuizo(int $idTorneo): array
    {
        $tabla = self::tabla($idTorneo);
        $record = self::recordSuizo($idTorneo);
        foreach ($tabla as $i => $fila) {
            $r = $record[$fila['idInscripcion']] ?? ['victorias' => 0, 'derrotas' => 0, 'estado' => 'en_juego'];
            $tabla[$i] += ['victorias' => $r['victorias'], 'derrotas' => $r['derrotas'], 'estadoSuizo' => $r['estado'], 'orden' => $i];
        }
        usort($tabla, static fn (array $a, array $b): int =>
            [$b['victorias'], $a['derrotas'], $a['orden']] <=> [$a['victorias'], $b['derrotas'], $b['orden']]);
        foreach ($tabla as $i => $fila) {
            $tabla[$i]['posicion'] = $i + 1;
            unset($tabla[$i]['orden']);
        }
        return $tabla;
    }

    private static function crucesSinRepetir(array $ids, array $jugados): ?array
    {
        if (!$ids) {
            return [];
        }
        $a = array_shift($ids);
        foreach ($ids as $posicion => $b) {
            if (isset($jugados["$a-$b"])) {
                continue;
            }
            $resto = $ids;
            array_splice($resto, $posicion, 1);
            $siguientes = self::crucesSinRepetir($resto, $jugados);
            if ($siguientes !== null) {
                return array_merge([[$a, $b]], $siguientes);
            }
        }
        return null;
    }

    public static function crearRonda(int $idTorneo, int $numero, ?string $fecha, array $partidos): int
    {
        $pdo = Database::getConnection();
        $pdo->prepare("INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (?, ?, 'en_curso', ?)")
            ->execute([$idTorneo, $numero, $fecha]);
        $idRonda = (int) $pdo->lastInsertId();
        $stmt = $pdo->prepare('INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, estado_partido) VALUES (?, ?, ?, ?)');
        foreach ($partidos as [$local, $visitante]) {
            $stmt->execute([$idRonda, $local, $visitante, $visitante === null ? 'finalizado' : 'programado']);
        }
        return $idRonda;
    }

    public static function avanzarLlave(array $torneo, int $idRonda): bool
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare('SELECT MAX(numero_ronda) FROM ronda WHERE id_torneo = ?');
        $stmt->execute([$torneo['id_torneo']]);
        $ultima = (int) $stmt->fetchColumn();
        $ronda = $pdo->prepare('SELECT * FROM ronda WHERE id_ronda = ?');
        $ronda->execute([$idRonda]);
        $ronda = $ronda->fetch();
        if ((int) $ronda['numero_ronda'] !== $ultima || !self::rondaCompleta($idRonda)) {
            return false;
        }
        $partidos = self::siguienteLlave($idRonda);
        if (!$partidos) {
            return false;
        }
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'finalizada' WHERE id_ronda = ?")->execute([$idRonda]);
        self::crearRonda((int) $torneo['id_torneo'], $ultima + 1, self::fechaRonda($torneo, $ultima + 1), $partidos);
        Auditoria::registrar("Generó la ronda " . ($ultima + 1) . " (llave): {$torneo['nombre_torneo']}", 'ronda');
        return true;
    }

    public static function nombreRonda(string $formato, int $numero, int $partidos): string
    {
        if ($formato === 'eliminacion') {
            $nombres = [1 => 'Final', 2 => 'Semifinales', 4 => 'Cuartos de final'];
            if (isset($nombres[$partidos])) {
                return $nombres[$partidos];
            }
        }
        return ($formato === 'liga' ? 'Fecha ' : 'Ronda ') . $numero;
    }

    public static function fechaRonda(array $torneo, int $numero): ?string
    {
        return $torneo['fecha_inicio'] === null ? null
            : date('Y-m-d', strtotime("{$torneo['fecha_inicio']} +" . (7 * ($numero - 1)) . ' days'));
    }

    public static function recalcularTabla(int $idTorneo): void
    {
        $pdo = Database::getConnection();
        $stats = array_fill_keys(self::confirmadas($idTorneo), ['v' => 0, 'e' => 0, 'd' => 0, 'gf' => 0, 'gc' => 0]);

        $stmt = $pdo->prepare(
            'SELECT e.id_inscripcion_local AS l, e.id_inscripcion_visitante AS v,
                    r.puntuacion_local AS pl, r.puntuacion_visitante AS pv, r.validado
             FROM enfrentamiento e
             JOIN ronda ro ON ro.id_ronda = e.id_ronda
             LEFT JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento
             WHERE ro.id_torneo = ?'
        );
        $stmt->execute([$idTorneo]);
        foreach ($stmt->fetchAll() as $p) {
            $l = (int) $p['l'];
            if (!isset($stats[$l])) {
                continue;
            }
            if ($p['v'] === null) {
                $stats[$l]['v']++;
                continue;
            }
            $v = (int) $p['v'];
            if (!$p['validado'] || !isset($stats[$v])) {
                continue;
            }
            [$pl, $pv] = [(int) $p['pl'], (int) $p['pv']];
            $stats[$l]['gf'] += $pl; $stats[$l]['gc'] += $pv;
            $stats[$v]['gf'] += $pv; $stats[$v]['gc'] += $pl;
            if ($pl === $pv) {
                $stats[$l]['e']++; $stats[$v]['e']++;
            } else {
                $stats[$pl > $pv ? $l : $v]['v']++;
                $stats[$pl > $pv ? $v : $l]['d']++;
            }
        }

        $guardar = $pdo->prepare(
            'INSERT INTO tabla_posiciones (id_inscripcion, victorias, empates, derrotas, goles_a_favor, goles_en_contra)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE victorias = VALUES(victorias), empates = VALUES(empates), derrotas = VALUES(derrotas),
                                     goles_a_favor = VALUES(goles_a_favor), goles_en_contra = VALUES(goles_en_contra)'
        );
        foreach ($stats as $id => $s) {
            $guardar->execute([$id, $s['v'], $s['e'], $s['d'], $s['gf'], $s['gc']]);
        }
    }

    public static function tabla(int $idTorneo): array
    {
        $pdo = Database::getConnection();
        $stmt = $pdo->prepare(
            'SELECT v.*, i.numero_sorteo, ' . self::nombreSql('i') . ' AS nombre
             FROM vista_tabla_posiciones v
             JOIN inscripcion i ON i.id_inscripcion = v.id_inscripcion
             WHERE v.id_torneo = ?'
        );
        $stmt->execute([$idTorneo]);
        $filas = $stmt->fetchAll();

        $stmt = $pdo->prepare(
            'SELECT e.id_inscripcion_local AS l, e.id_inscripcion_visitante AS v, r.puntuacion_local AS pl, r.puntuacion_visitante AS pv
             FROM enfrentamiento e JOIN ronda ro ON ro.id_ronda = e.id_ronda
             JOIN resultado r ON r.id_enfrentamiento = e.id_enfrentamiento AND r.validado = 1
             WHERE ro.id_torneo = ? AND e.id_inscripcion_visitante IS NOT NULL'
        );
        $stmt->execute([$idTorneo]);
        $directo = [];
        foreach ($stmt->fetchAll() as $p) {
            if ((int) $p['pl'] !== (int) $p['pv']) {
                [$g, $q] = (int) $p['pl'] > (int) $p['pv'] ? [$p['l'], $p['v']] : [$p['v'], $p['l']];
                $directo[$g][$q] = ($directo[$g][$q] ?? 0) + 1;
            }
        }

        usort($filas, static function (array $a, array $b) use ($directo): int {
            [$ia, $ib] = [$a['id_inscripcion'], $b['id_inscripcion']];
            return [(float) $b['puntos_acumulados'], (int) $b['diferencia_goles'], $directo[$ib][$ia] ?? 0, (int) $b['goles_a_favor'], (int) $a['numero_sorteo']]
                <=> [(float) $a['puntos_acumulados'], (int) $a['diferencia_goles'], $directo[$ia][$ib] ?? 0, (int) $a['goles_a_favor'], (int) $b['numero_sorteo']];
        });

        return array_map(static fn (array $f, int $i): array => [
            'posicion' => $i + 1,
            'idInscripcion' => (int) $f['id_inscripcion'],
            'nombre' => $f['nombre'],
            'jugados' => (int) $f['partidos_jugados'],
            'ganados' => (int) $f['victorias'],
            'empatados' => (int) $f['empates'],
            'perdidos' => (int) $f['derrotas'],
            'golesAFavor' => (int) $f['goles_a_favor'],
            'golesEnContra' => (int) $f['goles_en_contra'],
            'diferencia' => (int) $f['diferencia_goles'],
            'puntos' => (float) $f['puntos_acumulados'],
        ], $filas, array_keys($filas));
    }
}
