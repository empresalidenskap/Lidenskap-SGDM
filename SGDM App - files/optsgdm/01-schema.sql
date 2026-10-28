SET NAMES utf8mb4;

USE sgdm;

CREATE TABLE rol (
    id_rol      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuario (
    id_usuario  INT AUTO_INCREMENT PRIMARY KEY,
    id_rol      INT NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    apellido    VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    estado      ENUM('activo', 'inactivo', 'suspendido') NOT NULL DEFAULT 'activo',
    fecha_alta  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);

CREATE TABLE auditoria_registro (
    id_auditoria      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NULL,
    accion_realizada  VARCHAR(100) NOT NULL,
    tabla_afectada    VARCHAR(100) NOT NULL,
    detalle           VARCHAR(255) NULL,
    fecha_hora        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen         VARCHAR(45),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE SET NULL
);

CREATE TABLE competidor (
    id_competidor    INT AUTO_INCREMENT PRIMARY KEY,
    tipo_competidor  ENUM('participante', 'equipo') NOT NULL
);

CREATE TABLE participante (
    id_participante      INT AUTO_INCREMENT PRIMARY KEY,
    id_competidor        INT NOT NULL UNIQUE,
    id_usuario           INT NOT NULL,
    nombre_participante  VARCHAR(150) NOT NULL,
    alias                VARCHAR(50),
    fecha_nacimiento     DATE,
    perfil_publico       BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_participante_competidor FOREIGN KEY (id_competidor) REFERENCES competidor(id_competidor)
        ON DELETE CASCADE,
    CONSTRAINT fk_participante_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE equipo (
    id_equipo        INT AUTO_INCREMENT PRIMARY KEY,
    id_competidor    INT NOT NULL UNIQUE,
    id_usuario       INT NULL,
    nombre_equipo    VARCHAR(150) NOT NULL,
    perfil_publico   BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipo_competidor FOREIGN KEY (id_competidor) REFERENCES competidor(id_competidor)
        ON DELETE CASCADE,
    CONSTRAINT fk_equipo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE equipo_participante (
    id_equipo        INT NOT NULL,
    id_participante  INT NOT NULL,
    fecha_ingreso    DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado           ENUM('solicitada', 'invitada', 'aceptada', 'rechazada') NOT NULL DEFAULT 'aceptada',
    PRIMARY KEY (id_equipo, id_participante),
    CONSTRAINT fk_ep_equipo FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo)
        ON DELETE CASCADE,
    CONSTRAINT fk_ep_participante FOREIGN KEY (id_participante) REFERENCES participante(id_participante)
        ON DELETE CASCADE
);

CREATE TABLE tipo_torneo (
    id_tipo_torneo  INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo     VARCHAR(50) NOT NULL UNIQUE,
    descripcion     TEXT,
    puntos_victoria DECIMAL(3,1) NOT NULL DEFAULT 3.0,
    puntos_empate   DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    puntos_derrota  DECIMAL(3,1) NOT NULL DEFAULT 0.0
);

CREATE TABLE modulo_competencia (
    id_modulo      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_modulo  VARCHAR(100) NOT NULL UNIQUE,
    descripcion    TEXT
);

CREATE TABLE torneo (
    id_torneo             INT AUTO_INCREMENT PRIMARY KEY,
    id_tipo_torneo        INT NOT NULL,
    id_usuario_organizador INT NOT NULL,
    nombre_torneo         VARCHAR(150) NOT NULL,
    descripcion           TEXT,
    sede                  VARCHAR(150),
    cupo_maximo           INT,
    fecha_inicio          DATE,
    fecha_fin             DATE,
    estado                ENUM('solicitado', 'rechazado', 'planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso', 'finalizado', 'cancelado') NOT NULL DEFAULT 'planificado',
    marcador_wo_ganador   INT NOT NULL DEFAULT 3,
    marcador_wo_perdedor  INT NOT NULL DEFAULT 0,
    max_integrantes_equipo INT NULL,
    CONSTRAINT fk_torneo_tipo FOREIGN KEY (id_tipo_torneo) REFERENCES tipo_torneo(id_tipo_torneo),
    CONSTRAINT fk_torneo_organizador FOREIGN KEY (id_usuario_organizador) REFERENCES usuario(id_usuario)
);

CREATE TABLE torneo_modulo (
    id_torneo           INT NOT NULL,
    id_modulo           INT NOT NULL,
    reglas_especificas  TEXT,
    habilitado          BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id_torneo, id_modulo),
    CONSTRAINT fk_tm_torneo FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
        ON DELETE CASCADE,
    CONSTRAINT fk_tm_modulo FOREIGN KEY (id_modulo) REFERENCES modulo_competencia(id_modulo)
);

CREATE TABLE torneo_arbitro (
    id_torneo_arbitro  INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo          INT NOT NULL,
    id_usuario         INT NOT NULL,
    estado_solicitud   ENUM('invitada', 'pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    fecha_solicitud    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ta_torneo FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
        ON DELETE CASCADE,
    CONSTRAINT fk_ta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT uq_ta_torneo_usuario UNIQUE (id_torneo, id_usuario)
);

CREATE TABLE ronda (
    id_ronda          INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo         INT NOT NULL,
    numero_ronda      INT NOT NULL,
    estado_ronda      ENUM('pendiente', 'en_curso', 'finalizada') NOT NULL DEFAULT 'pendiente',
    fecha_programada  DATE,
    CONSTRAINT fk_ronda_torneo FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
        ON DELETE CASCADE,
    CONSTRAINT uq_ronda_torneo_numero UNIQUE (id_torneo, numero_ronda)
);

CREATE TABLE inscripcion (
    id_inscripcion      INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo           INT NOT NULL,
    id_competidor       INT NOT NULL,
    fecha_inscripcion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_inscripcion  ENUM('invitada', 'pendiente', 'confirmada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    cabeza_serie        INT NULL,
    numero_sorteo       INT NULL,
    CONSTRAINT fk_inscripcion_torneo FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
        ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_competidor FOREIGN KEY (id_competidor) REFERENCES competidor(id_competidor),
    CONSTRAINT uq_inscripcion_torneo_competidor UNIQUE (id_torneo, id_competidor)
);

CREATE TABLE enfrentamiento (
    id_enfrentamiento        INT AUTO_INCREMENT PRIMARY KEY,
    id_ronda                 INT NOT NULL,
    id_inscripcion_local      INT NOT NULL,
    id_inscripcion_visitante  INT NULL,
    id_arbitro               INT NULL,
    fecha_hora               DATETIME,
    estado_partido           ENUM('programado', 'en_curso', 'finalizado', 'suspendido', 'walkover') NOT NULL DEFAULT 'programado',
    CONSTRAINT fk_enfrentamiento_ronda FOREIGN KEY (id_ronda) REFERENCES ronda(id_ronda)
        ON DELETE CASCADE,
    CONSTRAINT fk_enfrentamiento_arbitro FOREIGN KEY (id_arbitro) REFERENCES usuario(id_usuario)
        ON DELETE SET NULL,
    CONSTRAINT fk_enfrentamiento_local FOREIGN KEY (id_inscripcion_local) REFERENCES inscripcion(id_inscripcion),
    CONSTRAINT fk_enfrentamiento_visitante FOREIGN KEY (id_inscripcion_visitante) REFERENCES inscripcion(id_inscripcion),
    CONSTRAINT chk_enfrentamiento_rivales CHECK (id_inscripcion_local <> id_inscripcion_visitante)
);

CREATE TABLE resultado (
    id_resultado          INT AUTO_INCREMENT PRIMARY KEY,
    id_enfrentamiento     INT NOT NULL UNIQUE,
    puntuacion_local      INT NOT NULL DEFAULT 0,
    puntuacion_visitante  INT NOT NULL DEFAULT 0,
    validado              BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_carga           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resultado_enfrentamiento FOREIGN KEY (id_enfrentamiento) REFERENCES enfrentamiento(id_enfrentamiento)
        ON DELETE CASCADE
);

CREATE TABLE tabla_posiciones (
    id_posicion         INT AUTO_INCREMENT PRIMARY KEY,
    id_inscripcion      INT NOT NULL UNIQUE,
    victorias           INT NOT NULL DEFAULT 0,
    empates             INT NOT NULL DEFAULT 0,
    derrotas            INT NOT NULL DEFAULT 0,
    goles_a_favor       INT NOT NULL DEFAULT 0,
    goles_en_contra     INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_posiciones_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion(id_inscripcion)
        ON DELETE CASCADE
);

CREATE OR REPLACE VIEW vista_resultado AS
SELECT
    r.id_resultado,
    r.id_enfrentamiento,
    r.puntuacion_local,
    r.puntuacion_visitante,
    CASE
        WHEN r.puntuacion_local > r.puntuacion_visitante THEN 'local'
        WHEN r.puntuacion_local < r.puntuacion_visitante THEN 'visitante'
        ELSE 'empate'
    END AS ganador,
    r.validado,
    r.fecha_carga
FROM resultado r;

CREATE OR REPLACE VIEW vista_tabla_posiciones AS
SELECT
    tp.id_posicion,
    tp.id_inscripcion,
    i.id_torneo,
    i.id_competidor,
    tp.victorias,
    tp.empates,
    tp.derrotas,
    tp.goles_a_favor,
    tp.goles_en_contra,
    (tp.goles_a_favor - tp.goles_en_contra) AS diferencia_goles,
    (tp.victorias + tp.empates + tp.derrotas) AS partidos_jugados,
    (tp.victorias * tt.puntos_victoria
   + tp.empates   * tt.puntos_empate
   + tp.derrotas  * tt.puntos_derrota) AS puntos_acumulados
FROM tabla_posiciones tp
JOIN inscripcion i  ON i.id_inscripcion = tp.id_inscripcion
JOIN torneo t       ON t.id_torneo      = i.id_torneo
JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo;

CREATE OR REPLACE VIEW vista_rol_torneo AS
SELECT
    'ORGANIZADOR' AS rol,
    t.id_torneo AS id_origen,
    t.id_usuario_organizador AS id_usuario,
    t.id_torneo,
    CASE t.estado WHEN 'solicitado' THEN 'pendiente' WHEN 'rechazado' THEN 'rechazada' ELSE 'aprobada' END AS estado_solicitud,
    t.estado IN ('planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso') AS activo
FROM torneo t
UNION ALL
SELECT
    'ARBITRO',
    ta.id_torneo_arbitro,
    ta.id_usuario,
    ta.id_torneo,
    ta.estado_solicitud,
    ta.estado_solicitud = 'aprobada' AND t.estado IN ('planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso')
FROM torneo_arbitro ta
JOIN torneo t ON t.id_torneo = ta.id_torneo
UNION ALL
SELECT
    'PARTICIPANTE',
    i.id_inscripcion,
    COALESCE(p.id_usuario, e.id_usuario),
    i.id_torneo,
    CASE i.estado_inscripcion WHEN 'confirmada' THEN 'aprobada' WHEN 'rechazada' THEN 'rechazada' WHEN 'invitada' THEN 'invitada' ELSE 'pendiente' END,
    i.estado_inscripcion = 'confirmada' AND t.estado IN ('planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso')
FROM inscripcion i
JOIN torneo t ON t.id_torneo = i.id_torneo
LEFT JOIN participante p ON p.id_competidor = i.id_competidor
LEFT JOIN equipo e       ON e.id_competidor = i.id_competidor
WHERE p.id_participante IS NOT NULL
   OR (i.estado_inscripcion <> 'confirmada' AND e.id_usuario IS NOT NULL)
UNION ALL
SELECT
    'PARTICIPANTE',
    i.id_inscripcion,
    pm.id_usuario,
    i.id_torneo,
    'aprobada',
    t.estado IN ('planificado', 'inscripcion_abierta', 'inscripcion_cerrada', 'en_curso')
FROM inscripcion i
JOIN torneo t               ON t.id_torneo        = i.id_torneo
JOIN equipo e               ON e.id_competidor    = i.id_competidor
JOIN equipo_participante ep ON ep.id_equipo       = e.id_equipo AND ep.estado = 'aceptada'
JOIN participante pm        ON pm.id_participante = ep.id_participante
WHERE i.estado_inscripcion = 'confirmada';

INSERT INTO rol (nombre_rol) VALUES ('ADMIN'), ('ORGANIZADOR'), ('ARBITRO'), ('PARTICIPANTE'), ('PUBLICO');

INSERT INTO tipo_torneo (nombre_tipo, descripcion, puntos_victoria, puntos_empate, puntos_derrota) VALUES
    ('Liga', 'Todos contra todos', 3.0, 1.0, 0.0),
    ('Eliminación Directa', 'Llaves de eliminación directa', 1.0, 0.0, 0.0),
    ('Sistema Suizo', 'Emparejamiento por rendimiento acumulado', 1.0, 0.5, 0.0);

INSERT INTO modulo_competencia (nombre_modulo) VALUES
    ('Fútbol'), ('Básquetbol'), ('Ajedrez'), ('Tenis'),
    ('Esports'), ('Voleibol'), ('Rugby');
