-- Datos de demostración
-- Solo admin@ tiene un rol global; el resto son Usuarios públicos con roles
-- dentro de cada torneo (ver vista_rol_torneo en 01-schema.sql). Alcanza
-- para mostrar cada funcionalidad recién instalado: un torneo por formato y
-- por fase, equipos, solicitudes e invitaciones pendientes, resultados
-- (validados, walkover y sin validar) y un torneo finalizado con campeón.
--
-- Cuentas: admin@ admin123 · organizador@ org123 · arbitro@ arb123 ·
-- atleta@ user123 · publico@ guest123 · el resto de los jugadores demo1234.
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

-- Jugadores, una organizadora y un segundo árbitro (contraseña: demo1234)
SET @rol_publico = (SELECT id_rol FROM rol WHERE nombre_rol = 'PUBLICO');
SET @demo = '$2y$10$o/4N1fAoAswDKNMbKDBaOupnRBfT9LMH7zbdRhUNKkIFyb.S39NSe';
INSERT INTO usuario (id_rol, nombre, apellido, email, password) VALUES
    (@rol_publico, 'Lucía', 'Fernández', 'lucia@lidenskap.com', @demo),
    (@rol_publico, 'Mateo', 'Rodríguez', 'mateo@lidenskap.com', @demo),
    (@rol_publico, 'Sofía', 'Martínez', 'sofia@lidenskap.com', @demo),
    (@rol_publico, 'Bruno', 'Sosa', 'bruno@lidenskap.com', @demo),
    (@rol_publico, 'Valentina', 'Ruiz', 'valentina@lidenskap.com', @demo),
    (@rol_publico, 'Joaquín', 'Pérez', 'joaquin@lidenskap.com', @demo),
    (@rol_publico, 'Camila', 'Torres', 'camila@lidenskap.com', @demo),
    (@rol_publico, 'Nicolás', 'Méndez', 'nicolas@lidenskap.com', @demo),
    (@rol_publico, 'Agustina', 'Ramos', 'agustina@lidenskap.com', @demo),
    (@rol_publico, 'Martín', 'Suárez', 'martin@lidenskap.com', @demo),
    (@rol_publico, 'Florencia', 'Silva', 'florencia@lidenskap.com', @demo);

SET @u_admin      = (SELECT id_usuario FROM usuario WHERE email = 'admin@lidenskap.com');
SET @u_org        = (SELECT id_usuario FROM usuario WHERE email = 'organizador@lidenskap.com');
SET @u_arbitro    = (SELECT id_usuario FROM usuario WHERE email = 'arbitro@lidenskap.com');
SET @u_diego      = (SELECT id_usuario FROM usuario WHERE email = 'atleta@lidenskap.com');
SET @u_publico    = (SELECT id_usuario FROM usuario WHERE email = 'publico@lidenskap.com');
SET @u_lucia      = (SELECT id_usuario FROM usuario WHERE email = 'lucia@lidenskap.com');
SET @u_mateo      = (SELECT id_usuario FROM usuario WHERE email = 'mateo@lidenskap.com');
SET @u_sofia      = (SELECT id_usuario FROM usuario WHERE email = 'sofia@lidenskap.com');
SET @u_bruno      = (SELECT id_usuario FROM usuario WHERE email = 'bruno@lidenskap.com');
SET @u_valentina  = (SELECT id_usuario FROM usuario WHERE email = 'valentina@lidenskap.com');
SET @u_joaquin    = (SELECT id_usuario FROM usuario WHERE email = 'joaquin@lidenskap.com');
SET @u_camila     = (SELECT id_usuario FROM usuario WHERE email = 'camila@lidenskap.com');
SET @u_nicolas    = (SELECT id_usuario FROM usuario WHERE email = 'nicolas@lidenskap.com');
SET @u_agustina   = (SELECT id_usuario FROM usuario WHERE email = 'agustina@lidenskap.com');
SET @u_martin     = (SELECT id_usuario FROM usuario WHERE email = 'martin@lidenskap.com');
SET @u_florencia  = (SELECT id_usuario FROM usuario WHERE email = 'florencia@lidenskap.com');

-- Ficha de jugador (participante) de cada persona que compite: la misma en
-- todos los torneos y equipos
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_diego = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_diego, @u_diego, 'Diego Silva'); SET @p_diego = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_lucia = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_lucia, @u_lucia, 'Lucía Fernández'); SET @p_lucia = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_mateo = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_mateo, @u_mateo, 'Mateo Rodríguez'); SET @p_mateo = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_sofia = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_sofia, @u_sofia, 'Sofía Martínez'); SET @p_sofia = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_bruno = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_bruno, @u_bruno, 'Bruno Sosa'); SET @p_bruno = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_joaquin = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_joaquin, @u_joaquin, 'Joaquín Pérez'); SET @p_joaquin = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_camila = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_camila, @u_camila, 'Camila Torres'); SET @p_camila = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_nicolas = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_nicolas, @u_nicolas, 'Nicolás Méndez'); SET @p_nicolas = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_agustina = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_agustina, @u_agustina, 'Agustina Ramos'); SET @p_agustina = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('participante'); SET @c_florencia = LAST_INSERT_ID();
INSERT INTO participante (id_competidor, id_usuario, nombre_participante) VALUES (@c_florencia, @u_florencia, 'Florencia Silva'); SET @p_florencia = LAST_INSERT_ID();

SET @liga     = (SELECT id_tipo_torneo FROM tipo_torneo WHERE nombre_tipo = 'Liga');
SET @llaves   = (SELECT id_tipo_torneo FROM tipo_torneo WHERE nombre_tipo = 'Eliminación Directa');
SET @suizo    = (SELECT id_tipo_torneo FROM tipo_torneo WHERE nombre_tipo = 'Sistema Suizo');

-- ---------------------------------------------------------------------------
-- 1. Copa Demo Lidenskap: liga de fútbol EN CURSO, 4 equipos.
--    organizador@ la organiza, arbitro@ y Martín arbitran, atleta@ juega
--    en Halcones del Sur. Fecha 1 cerrada (con un walkover), fecha 2 con un
--    resultado sin validar, fecha 3 programada.
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado, max_integrantes_equipo) VALUES
    (@liga, @u_org, 'Copa Demo Lidenskap', 'Liga de fútbol 5 todos contra todos. Torneo de demostración de roles por torneo.', 'Complejo Deportivo Central, Montevideo', 8, '2026-10-10', 'en_curso', 5);
SET @t1 = LAST_INSERT_ID();
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES (@t1, (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Fútbol'));
INSERT INTO torneo_arbitro (id_torneo, id_usuario, estado_solicitud) VALUES (@t1, @u_arbitro, 'aprobada'), (@t1, @u_martin, 'aprobada');

-- Equipos: tres creados por un Usuario público (su capitán) y uno por el Organizador (sin capitán)
INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_halcones = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_halcones, @u_diego, 'Halcones del Sur'); SET @e_halcones = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_parque = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_parque, @u_sofia, 'Club del Parque'); SET @e_parque = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_norte = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_norte, NULL, 'Atlético Norte'); SET @e_norte = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_racing = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_racing, @u_nicolas, 'Racing Juvenil'); SET @e_racing = LAST_INSERT_ID();
INSERT INTO equipo_participante (id_equipo, id_participante, estado) VALUES
    (@e_halcones, @p_diego, 'aceptada'), (@e_halcones, @p_lucia, 'aceptada'), (@e_halcones, @p_mateo, 'aceptada'),
    (@e_parque, @p_sofia, 'aceptada'), (@e_parque, @p_bruno, 'aceptada'),
    (@e_norte, @p_joaquin, 'aceptada'), (@e_norte, @p_camila, 'aceptada'),
    (@e_racing, @p_nicolas, 'aceptada'), (@e_racing, @p_agustina, 'aceptada');

INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t1, @c_halcones, 'confirmada', 1); SET @i_halcones = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t1, @c_parque, 'confirmada', 2);   SET @i_parque = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t1, @c_norte, 'confirmada', 3);    SET @i_norte = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t1, @c_racing, 'confirmada', 4);   SET @i_racing = LAST_INSERT_ID();

-- Fixture del método del círculo (el mismo que arma api/rondas.php)
INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t1, 1, 'finalizada', '2026-10-10'); SET @r1 = LAST_INSERT_ID();
INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t1, 2, 'en_curso', '2026-10-17');   SET @r2 = LAST_INSERT_ID();
INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t1, 3, 'en_curso', '2026-10-24');   SET @r3 = LAST_INSERT_ID();

INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r1, @i_halcones, @i_racing, @u_arbitro, '2026-10-10 18:00:00', 'finalizado'); SET @m1 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r1, @i_parque, @i_norte, @u_martin, '2026-10-10 20:00:00', 'walkover'); SET @m2 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r2, @i_norte, @i_halcones, @u_martin, '2026-10-17 18:00:00', 'finalizado'); SET @m3 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r2, @i_parque, @i_racing, @u_arbitro, '2026-10-17 20:00:00', 'finalizado'); SET @m4 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r3, @i_halcones, @i_parque, @u_arbitro, '2026-10-24 18:00:00', 'programado'),
    (@r3, @i_norte, @i_racing, @u_martin, '2026-10-24 20:00:00', 'programado');

-- Halcones 2-1 Racing; Club del Parque no se presentó: walkover 0-3 para
-- Atlético Norte; Norte 1-1 Halcones; Parque 2-0 Racing cargado por el
-- árbitro y todavía sin validar (no cuenta en la tabla)
INSERT INTO resultado (id_enfrentamiento, puntuacion_local, puntuacion_visitante, validado, fecha_carga) VALUES
    (@m1, 2, 1, TRUE, '2026-10-10 19:50:00'),
    (@m2, 0, 3, TRUE, '2026-10-10 20:15:00'),
    (@m3, 1, 1, TRUE, '2026-10-17 19:50:00'),
    (@m4, 2, 0, FALSE, '2026-10-17 21:50:00');

INSERT INTO tabla_posiciones (id_inscripcion, victorias, empates, derrotas, goles_a_favor, goles_en_contra) VALUES
    (@i_halcones, 1, 1, 0, 3, 2),
    (@i_parque,   0, 0, 1, 0, 3),
    (@i_norte,    1, 1, 0, 4, 1),
    (@i_racing,   0, 0, 1, 1, 2);

-- ---------------------------------------------------------------------------
-- 2. Solicitud de publico@ para crear un torneo: la resuelve el Admin
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado) VALUES
    (@llaves, @u_publico, 'Torneo Relámpago de Ajedrez', 'Solicitud de un Usuario público, pendiente de aprobación.', 'Canelones', 8, '2026-11-21', 'solicitado');
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES
    (LAST_INSERT_ID(), (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Ajedrez'));

-- ---------------------------------------------------------------------------
-- 3. Open de Tenis Primavera: eliminación directa FINALIZADA, con cabezas de
--    serie. Campeona: Florencia Silva. Los roles de este torneo ya terminaron.
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado) VALUES
    (@llaves, @u_valentina, 'Open de Tenis Primavera', 'Torneo individual al mejor de tres sets.', 'Carrasco Lawn Tennis', 4, '2026-09-05', 'finalizado');
SET @t3 = LAST_INSERT_ID();
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES (@t3, (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Tenis'));
INSERT INTO torneo_arbitro (id_torneo, id_usuario, estado_solicitud) VALUES (@t3, @u_martin, 'aprobada');

INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, cabeza_serie, numero_sorteo) VALUES (@t3, @c_florencia, 'confirmada', 1, 3); SET @i_florencia = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, cabeza_serie, numero_sorteo) VALUES (@t3, @c_bruno, 'confirmada', 2, 1);     SET @i_bruno = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t3, @c_camila, 'confirmada', 2);                 SET @i_camila = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t3, @c_mateo, 'confirmada', 4);                  SET @i_mateo = LAST_INSERT_ID();

INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t3, 1, 'finalizada', '2026-09-05'); SET @r3_1 = LAST_INSERT_ID();
INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t3, 2, 'finalizada', '2026-09-12'); SET @r3_2 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r3_1, @i_florencia, @i_mateo, @u_martin, '2026-09-05 10:00:00', 'finalizado'); SET @s1 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r3_1, @i_bruno, @i_camila, @u_martin, '2026-09-05 12:00:00', 'finalizado'); SET @s2 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, id_arbitro, fecha_hora, estado_partido) VALUES
    (@r3_2, @i_florencia, @i_camila, @u_martin, '2026-09-12 11:00:00', 'finalizado'); SET @s3 = LAST_INSERT_ID();
INSERT INTO resultado (id_enfrentamiento, puntuacion_local, puntuacion_visitante, validado, fecha_carga) VALUES
    (@s1, 6, 2, TRUE, '2026-09-05 11:30:00'),
    (@s2, 4, 6, TRUE, '2026-09-05 13:40:00'),
    (@s3, 6, 3, TRUE, '2026-09-12 12:30:00');
INSERT INTO tabla_posiciones (id_inscripcion, victorias, empates, derrotas, goles_a_favor, goles_en_contra) VALUES
    (@i_florencia, 2, 0, 0, 12, 5),
    (@i_bruno,     0, 0, 1, 4, 6),
    (@i_camila,    1, 0, 1, 9, 10),
    (@i_mateo,     0, 0, 1, 2, 6);

-- ---------------------------------------------------------------------------
-- 4. Suizo de Ajedrez Invierno: etapa suiza EN CURSO con 5 jugadores, series
--    al mejor de 3 (con 2 victorias se clasifica, con 2 derrotas queda
--    eliminado). Ronda 1 completa (Sofía quedó libre); el Organizador ya
--    puede generar la ronda 2 desde el panel.
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado, marcador_wo_ganador, marcador_wo_perdedor) VALUES
    (@suizo, @u_org, 'Suizo de Ajedrez Invierno', 'Series al mejor de 3 partidas a 30 minutos. Cruces entre jugadores con el mismo récord, sin repetir rivales.', 'Club de Ajedrez Montevideo', 8, '2026-10-15', 'en_curso', 2, 0);
SET @t4 = LAST_INSERT_ID();
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES (@t4, (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Ajedrez'));

INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t4, @c_lucia, 'confirmada', 1);    SET @a_lucia = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t4, @c_joaquin, 'confirmada', 2);  SET @a_joaquin = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t4, @c_agustina, 'confirmada', 3); SET @a_agustina = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t4, @c_nicolas, 'confirmada', 4);  SET @a_nicolas = LAST_INSERT_ID();
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion, numero_sorteo) VALUES (@t4, @c_sofia, 'confirmada', 5);    SET @a_sofia = LAST_INSERT_ID();

INSERT INTO ronda (id_torneo, numero_ronda, estado_ronda, fecha_programada) VALUES (@t4, 1, 'en_curso', '2026-10-15'); SET @r4_1 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, fecha_hora, estado_partido) VALUES
    (@r4_1, @a_lucia, @a_agustina, '2026-10-15 19:00:00', 'finalizado'); SET @w1 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, fecha_hora, estado_partido) VALUES
    (@r4_1, @a_joaquin, @a_nicolas, '2026-10-15 19:00:00', 'finalizado'); SET @w2 = LAST_INSERT_ID();
INSERT INTO enfrentamiento (id_ronda, id_inscripcion_local, id_inscripcion_visitante, estado_partido) VALUES
    (@r4_1, @a_sofia, NULL, 'finalizado');
INSERT INTO resultado (id_enfrentamiento, puntuacion_local, puntuacion_visitante, validado, fecha_carga) VALUES
    (@w1, 2, 0, TRUE, '2026-10-15 20:10:00'),
    (@w2, 2, 1, TRUE, '2026-10-15 20:25:00');
INSERT INTO tabla_posiciones (id_inscripcion, victorias, empates, derrotas, goles_a_favor, goles_en_contra) VALUES
    (@a_lucia,    1, 0, 0, 2, 0),
    (@a_joaquin,  1, 0, 0, 2, 1),
    (@a_agustina, 0, 0, 1, 0, 2),
    (@a_nicolas,  0, 0, 1, 1, 2),
    (@a_sofia,    1, 0, 0, 0, 0);

-- ---------------------------------------------------------------------------
-- 5. Liga de Básquet Otoño: INSCRIPCIONES ABIERTAS. Pendientes para el
--    Organizador: un equipo por aprobar, un pedido para unirse a un equipo y
--    un árbitro que se postuló. publico@ tiene una invitación para arbitrar.
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado, max_integrantes_equipo) VALUES
    (@liga, @u_org, 'Liga de Básquet Otoño', 'Liga de básquetbol 3x3 para equipos amateur.', 'Gimnasio Malvín', 6, '2026-11-14', 'inscripcion_abierta', 5);
SET @t5 = LAST_INSERT_ID();
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES (@t5, (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Básquetbol'));

INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_tigres = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_tigres, @u_camila, 'Los Tigres'); SET @e_tigres = LAST_INSERT_ID();
INSERT INTO competidor (tipo_competidor) VALUES ('equipo'); SET @c_malvin = LAST_INSERT_ID();
INSERT INTO equipo (id_competidor, id_usuario, nombre_equipo) VALUES (@c_malvin, @u_mateo, 'Malvín Básquet'); SET @e_malvin = LAST_INSERT_ID();
INSERT INTO equipo_participante (id_equipo, id_participante, estado) VALUES
    (@e_tigres, @p_camila, 'aceptada'), (@e_tigres, @p_florencia, 'aceptada'),
    (@e_tigres, @p_joaquin, 'solicitada'),
    (@e_malvin, @p_mateo, 'aceptada');
INSERT INTO inscripcion (id_torneo, id_competidor, estado_inscripcion) VALUES
    (@t5, @c_tigres, 'confirmada'),
    (@t5, @c_malvin, 'pendiente');
INSERT INTO torneo_arbitro (id_torneo, id_usuario, estado_solicitud) VALUES
    (@t5, @u_publico, 'invitada'),
    (@t5, @u_martin, 'pendiente');

-- ---------------------------------------------------------------------------
-- 6. Copa Lidenskap VALORANT: PLANIFICADA (todavía sin inscripciones). El
--    Organizador puede abrirlas desde el detalle del torneo.
-- ---------------------------------------------------------------------------
INSERT INTO torneo (id_tipo_torneo, id_usuario_organizador, nombre_torneo, descripcion, sede, cupo_maximo, fecha_inicio, estado, max_integrantes_equipo) VALUES
    (@llaves, @u_org, 'Copa Lidenskap VALORANT', 'Torneo de esports 5 contra 5, series al mejor de tres.', 'Online', 8, '2026-12-05', 'planificado', 5);
INSERT INTO torneo_modulo (id_torneo, id_modulo) VALUES
    (LAST_INSERT_ID(), (SELECT id_modulo FROM modulo_competencia WHERE nombre_modulo = 'Esports'));

-- Auditoría: algunas acciones anteriores, para que el panel no arranque vacío
INSERT INTO auditoria_registro (id_usuario, accion_realizada, tabla_afectada, detalle, fecha_hora, ip_origen) VALUES
    (@u_admin, 'Alta de torneo: Open de Tenis Primavera', 'torneo', NULL, '2026-08-20 10:15:00', '127.0.0.1'),
    (@u_valentina, 'Finalizó el torneo: Open de Tenis Primavera', 'torneo', 'Campeón: Florencia Silva', '2026-09-12 13:00:00', '127.0.0.1'),
    (@u_org, 'Cerró las inscripciones: Copa Demo Lidenskap', 'torneo', 'Rechazadas automáticamente: 0. Sorteo entre 4 confirmados.', '2026-10-08 18:00:00', '127.0.0.1'),
    (@u_org, 'Generó el fixture y empezó el torneo: Copa Demo Lidenskap', 'ronda', NULL, '2026-10-08 18:05:00', '127.0.0.1'),
    (@u_org, 'Registró walkover (gana el visitante) del partido 2 (ronda 1): Copa Demo Lidenskap', 'resultado', NULL, '2026-10-10 20:15:00', '127.0.0.1'),
    (@u_arbitro, 'Cargó el resultado 2-0 del partido 4 (ronda 2): Copa Demo Lidenskap', 'resultado', NULL, '2026-10-17 21:50:00', '127.0.0.1');
