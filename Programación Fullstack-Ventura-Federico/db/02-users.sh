#!/bin/bash
# DCL — usuario de aplicación con privilegios mínimos (sin DDL, sin GRANT
# OPTION). La app en PHP se conecta con este usuario, nunca con root.
set -e

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<-EOSQL
    CREATE USER IF NOT EXISTS '${DB_APP_USER}'@'%' IDENTIFIED BY '${DB_APP_PASSWORD}';
    -- Por si el usuario ya existía con otros privilegios de una corrida anterior.
    REVOKE ALL PRIVILEGES, GRANT OPTION FROM '${DB_APP_USER}'@'%';
    -- Solo lectura/escritura de datos: sin CREATE/DROP/ALTER, sin GRANT OPTION.
    GRANT SELECT, INSERT, UPDATE, DELETE ON ${MYSQL_DATABASE}.* TO '${DB_APP_USER}'@'%';
    FLUSH PRIVILEGES;
EOSQL
