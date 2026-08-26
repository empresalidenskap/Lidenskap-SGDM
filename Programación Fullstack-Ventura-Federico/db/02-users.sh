#!/bin/bash
# DCL — usuarios de la base de datos y sus permisos.
# (cambiar las contraseñas antes de usar en el servidor real)
#
# Host '%' en vez de 'localhost': en docker-compose la app PHP (contenedor
# "web") y MySQL (contenedor "db") son hosts distintos en la red interna
# de Docker, nunca "localhost" entre sí. Si el día de mañana Apache y MySQL
# pasan a convivir en la misma máquina (por ejemplo, el servidor real),
# ahí sí correspondería restringir a 'localhost'.
set -e

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    DROP USER IF EXISTS '${DB_ADMIN_USER}'@'%';
    DROP USER IF EXISTS '${DB_APP_USER}'@'%';
    DROP USER IF EXISTS '${DB_CONSULTA_USER}'@'%';

    -- Administrador de la base: mantenimiento y respaldos
    CREATE USER '${DB_ADMIN_USER}'@'%' IDENTIFIED BY '${DB_ADMIN_PASSWORD}';
    GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${DB_ADMIN_USER}'@'%';

    -- Usuario de la aplicacion PHP: solo operaciones CRUD, sin DDL
    CREATE USER '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
    GRANT SELECT, INSERT, UPDATE, DELETE ON ${MYSQL_DATABASE}.* TO '${DB_APP_USER}'@'%';

    -- Usuario de consulta publica: solo lectura de lo que se publica
    CREATE USER '${DB_CONSULTA_USER}'@'%' IDENTIFIED BY '${DB_CONSULTA_PASSWORD}';
    GRANT SELECT ON ${MYSQL_DATABASE}.torneo           TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.tipo_torneo       TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.ronda             TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.enfrentamiento    TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.resultado         TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.tabla_posiciones  TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.participante      TO '${DB_CONSULTA_USER}'@'%';
    GRANT SELECT ON ${MYSQL_DATABASE}.equipo            TO '${DB_CONSULTA_USER}'@'%';

    FLUSH PRIVILEGES;
EOSQL
