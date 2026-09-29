
set -e

mariadb -u root -p"${MARIADB_ROOT_PASSWORD}" <<-EOSQL
    DROP USER IF EXISTS 'sgdm_admin'@'localhost';
    DROP USER IF EXISTS 'sgdm_app'@'localhost';
    DROP USER IF EXISTS 'sgdm_consulta'@'localhost';

    -- Administrador de la base: mantenimiento y respaldos
    CREATE USER IF NOT EXISTS 'sgdm_admin'@'localhost' IDENTIFIED BY 'ESTO_ES_UNA_CONTRASEÑA_FUERTE_01ADMIN';
    GRANT ALL PRIVILEGES ON sgdm.* TO 'sgdm_admin'@'localhost';

    -- Usuario de la aplicacion PHP: solo operaciones CRUD, sin DDL
    CREATE USER IF NOT EXISTS 'sgdm_app'@'localhost'IDENTIFIED BY 'ESTO_ES_UNA_CONTRASEÑA_FUERTE_02APP';
    GRANT SELECT, INSERT, UPDATE, DELETE ON sgdm.* TO 'sgdm_app'@'localhost';

    -- Usuario de consulta publica: solo lectura de lo que se publica
    CREATE USER IF NOT EXISTS 'sgdm_consulta'@'localhost' IDENTIFIED BY 'ESTO_ES_UNA_CONTRASEÑA_FUERTE_03CONSULTA';
    GRANT SELECT ON sgdm.torneo             TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.tipo_torneo        TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.modulo_competencia TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.torneo_modulo      TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.ronda              TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.inscripcion        TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.enfrentamiento     TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.resultado          TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.tabla_posiciones   TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.competidor         TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.participante       TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.equipo             TO 'sgdm_consulta'@'localhost';
    GRANT SELECT ON sgdm.equipo_participante TO 'sgdm_consulta'@'localhost';

    FLUSH PRIVILEGES;
EOSQL
