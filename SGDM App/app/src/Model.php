<?php
declare(strict_types=1);

namespace App;

/**
 * Base CRUD mínima para las clases de app/src/Models — cada una solo
 * define $table y $primaryKey, alineadas 1 a 1 con db/01-schema.sql.
 */
abstract class Model
{
    protected static string $table;
    protected static string $primaryKey = 'id';

    public static function all(): array
    {
        $stmt = Database::getConnection()->query('SELECT * FROM ' . static::$table);
        return $stmt->fetchAll();
    }

    public static function find(int $id): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM ' . static::$table . ' WHERE ' . static::$primaryKey . ' = :id'
        );
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function findBy(string $column, $value): ?array
    {
        $stmt = Database::getConnection()->prepare(
            'SELECT * FROM ' . static::$table . ' WHERE ' . $column . ' = :value LIMIT 1'
        );
        $stmt->execute(['value' => $value]);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    public static function create(array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(static fn (string $c): string => ':' . $c, $columns);

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            static::$table,
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $stmt = Database::getConnection()->prepare($sql);
        $stmt->execute($data);

        return (int) Database::getConnection()->lastInsertId();
    }

    public static function update(int $id, array $data): bool
    {
        $assignments = implode(', ', array_map(
            static fn (string $c): string => "$c = :$c",
            array_keys($data)
        ));

        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s = :id',
            static::$table,
            $assignments,
            static::$primaryKey
        );

        $data['id'] = $id;
        $stmt = Database::getConnection()->prepare($sql);
        return $stmt->execute($data);
    }

    public static function delete(int $id): bool
    {
        $stmt = Database::getConnection()->prepare(
            'DELETE FROM ' . static::$table . ' WHERE ' . static::$primaryKey . ' = :id'
        );
        return $stmt->execute(['id' => $id]);
    }
}
