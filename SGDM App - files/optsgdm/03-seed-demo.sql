-- Cuentas de demostración
-- Solo admin@ tiene un rol global; el resto son Usuarios públicos con un rol
-- dentro del torneo demo (ver vista_rol_torneo en 01-schema.sql).
SET NAMES utf8mb4;
USE sgdm;

INSERT INTO usuario (id_rol, nombre, apellido, email, password) VALUES
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'ADMIN'),
     'Administrador', 'General', 'admin@lidenskap.com',
     '$2y$10$l4a2rk0pTxHpVe64iI.ZpuyJz6u7NEDflA5YwOv38fxacWrdOs7k6'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO'),
     'Organizador', 'Torneo', 'organizador@lidenskap.com',
     '$2y$10$Z6fCNbE/EEhpj6QoWQHcI.P8s2w4RqGunxVKttsQDC5v6UH9Uygnu'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO'),
     'Árbitro', 'Demo', 'arbitro@lidenskap.com',
     '$2b$10$HHrzBYD2qfozGMLOnd6s7uZ6GEcfGOZpEJDC.JWBKWc.JQ0BO8APG'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO'),
     'Diego', 'Silva', 'atleta@lidenskap.com',
     '$2y$10$GCQ.BGhc/t/b8P2Bhc1rtudw/yi7qoprChLw0y16Sl7oVU81YXN4u'),
    ((SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO'),
     'Usuario', 'Publico', 'publico@lidenskap.com',
     '$2y$10$DOQtrUmPcEk0GHCpryYB7.HXLeOXDJqffferhmCVULcz61fwRju.u');

-- Torneo demo: organizador@ lo organiza, arbitro@ lo arbitra y atleta@ juega
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado) VALUES
    ((SELECT id_tipo_torneo FROM tipo_torneo WHERE nombre_tipo = 'Liga'),
     (SELECT id_usuario FROM usuario WHERE email = 'organizador@lidenskap.com'),
     'Copa Demo Lidenskap', 'Torneo de demostración de roles por torneo.', 'Montevideo', 16, '2026-11-07', 'planificado');
SET @torneo_demo = LAST_INSERT_ID();
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES
    (@torneo_demo, (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Fútbol'));

INSERT INTO torneo_arbitro (id_torneo, id_usuario, estado_solicitud) VALUES
    (@torneo_demo, (SELECT id_usuario FROM usuario WHERE email = 'arbitro@lidenskap.com'), 'aprobada');

INSERT INTO competidor (tipo_competidor) VALUES ('participante');
SET @competidor_atleta = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES
    (@competidor_atleta, (SELECT id_usuario FROM usuario WHERE email = 'atleta@lidenskap.com'), 'Diego Silva');
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion) VALUES
    (@torneo_demo, @competidor_atleta, 'confirmada');

-- Solicitud pendiente de publico@ para que el Admin la vea en Solicitudes
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado) VALUES
    ((SELECT id_tipo_torneo FROM tipo_torneo WHERE nombre_tipo = 'Eliminación Directa'),
     (SELECT id_usuario FROM usuario WHERE email = 'publico@lidenskap.com'),
     'Torneo Relámpago de Ajedrez', 'Solicitud de un Usuario público, pendiente de aprobación.', 'Canelones', 8, '2026-11-21', 'solicitado');
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES
    (LAST_INSERT_ID(), (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Ajedrez'));
