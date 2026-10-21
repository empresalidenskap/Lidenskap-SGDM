<?php
declare(strict_types=1);

namespace App;

/**
 * Rondas, cruces y tabla de posiciones de un torneo (F6). Los endpoints
 * validan permisos y fases; acá vive la lógica de cada formato:
 *   - Liga (RF-16): todas las fechas de una vez, método del círculo.
 *   - Eliminación directa (RF-17): llave por cabezas de serie y sorteo,
 *     con partidos libres para los primeros; el ganador avanza solo.
 *   - Sistema suizo (RF-10): cruce por puntaje sin repetir rivales; con
 *     número impar el libre rota entre los de menor puntaje.
 * Un partido libre es un enfrentamiento sin visitante: lo gana el local.
 */
final class Competencia
{
    /** Nombre del competidor (equipo o participante) de una inscripción, para SQL. */
    private const NOMBRE = 'COALESCE((SELECT eq.nombre_equipo FROM equipo eq WHERE eq.id_competidor = %1$s.id_competidor),
                                     (SELECT pa.nombre_participante FROM participante pa WHERE pa.id_competidor = %1$s.id_competidor))';

    public static function nombreSql(string $aliasInscripcion): string
    {
        return sprintf(self::NOMBRE, $aliasInscripcion);
    }

    /** Torneo con su formato ('liga', 'eliminacion', 'suizo'), o null. */
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

    /** Partido con su ronda, torneo y resultado, o null. */
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

    /**
     * Inscripciones confirmadas (ids). Para las llaves, primero las cabezas de
     * serie en su orden; el resto (y los demás formatos) por número de sorteo.
     */
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

    /**
     * Liga: método del círculo. N-1 fechas (N si es impar: cada fecha uno
     * queda libre y no juega). Devuelve [fecha => [[local, visitante], ...]].
     */
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
                    // Se alterna quién es local de una fecha a la otra
                    $partidos[] = $r % 2 === 0 ? [$a, $b] : [$b, $a];
                }
            }
            $rondas[] = $partidos;
            // Rota todos menos el primero
            array_splice($ids, 1, 0, [array_pop($ids)]);
        }
        return $rondas;
    }

    /**
     * Eliminación directa, primera ronda: llave del tamaño de la potencia de 2
     * siguiente, sembrada como en los torneos (1 contra el último, etc.). Los
     * lugares que sobran son partidos libres para los mejores sembrados.
     */
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

    /** Partidos de una ronda en orden de llave, con su resultado. */
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

    /** Ganador de un partido (id de inscripción) o null si fue empate / no tiene resultado. */
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

    /** ¿Todos los partidos de la ronda tienen resultado validado (o son libres)? */
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

    /** Ganadores de una ronda de llaves, en orden: se cruzan de a dos. */
    public static function siguienteLlave(int $idRonda): array
    {
        $ganadores = array_map([self::class, 'ganador'], self::partidos($idRonda));
        $partidos = [];
        for ($i = 0; $i + 1 < count($ganadores); $i += 2) {
            $partidos[] = [$ganadores[$i], $ganadores[$i + 1]];
        }
        return $partidos;
    }

    /**
     * Sistema suizo. Primera ronda: por número de sorteo, la mitad de arriba
     * contra la de abajo. Siguientes: ordenados por puntos (y sorteo), cada
     * uno contra el más cercano con el que todavía no jugó. Si son impares,
     * queda libre el de menor puntaje que todavía no tuvo libre.
     */
    public static function emparejarSuizo(int $idTorneo, array $ids, bool $primera): array
    {
        $pdo = Database::getConnection();
        if (!$primera) {
            $stmt = $pdo->prepare(
                'SELECT v.id_inscripcion FROM vista_tabla_posiciones v
                 JOIN inscripcion i ON i.id_inscripcion = v.id_inscripcion
                 WHERE v.id_torneo = ? ORDER BY v.puntos_acumulados DESC, i.numero_sorteo, i.id_inscripcion'
            );
            $stmt->execute([$idTorneo]);
            $ids = array_values(array_intersect(array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN)), $ids));
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
            // Libre para el de menor puntaje que no lo tuvo (RF-10)
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

        // Cada uno contra el más cercano en la tabla con el que no jugó; si eso
        // deja a otros sin rival posible, se prueba el siguiente (RF-10). Solo
        // si no hay ninguna combinación sin repetir, se cruza en orden.
        $cruces = self::crucesSinRepetir($ids, $jugados) ?? array_chunk($ids, 2);
        return array_merge($cruces, $partidos);
    }

    /** Empareja la lista (ya ordenada por puntaje) sin repetir rivales, o null si no se puede. */
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

    /**
     * Crea una ronda con sus partidos. Los partidos libres nacen finalizados
     * (los gana el local). Devuelve el id de la ronda.
     */
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

    /**
     * Llaves (RF-17): cuando la última ronda queda completa, se cierra y se
     * arma la siguiente con los ganadores. Devuelve true si se creó una ronda.
     */
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
            return false; // Quedó un solo ganador: es el campeón
        }
        $pdo->prepare("UPDATE ronda SET estado_ronda = 'finalizada' WHERE id_ronda = ?")->execute([$idRonda]);
        self::crearRonda((int) $torneo['id_torneo'], $ultima + 1, self::fechaRonda($torneo, $ultima + 1), $partidos);
        Auditoria::registrar("Generó la ronda " . ($ultima + 1) . " (llave): {$torneo['nombre_torneo']}", 'ronda');
        return true;
    }

    /** Nombre de una ronda: "Fecha N" en liga, "Final"/"Semifinales"/... en llaves. */
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

    /** Fecha programada de la ronda N: una por semana desde el inicio del torneo. */
    public static function fechaRonda(array $torneo, int $numero): ?string
    {
        return $torneo['fecha_inicio'] === null ? null
            : date('Y-m-d', strtotime("{$torneo['fecha_inicio']} +" . (7 * ($numero - 1)) . ' days'));
    }

    /**
     * Recalcula la tabla del torneo desde cero (RF-09): resultados validados,
     * walkovers y libres (cuentan como victoria). Los puntos salen del
     * formato en vista_tabla_posiciones.
     */
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

    /**
     * Tabla ordenada con los criterios de RF-09, en orden estricto: puntos,
     * diferencia de goles, enfrentamiento directo, goles a favor y sorteo.
     */
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

        // Partidos ganados en los cruces directos: $directo[a][b]
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
