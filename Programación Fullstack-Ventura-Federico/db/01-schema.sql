-- Modelo relacional del SGDM (Segunda Entrega — Programación Fullstack)
-- Basado en MER_SGDM_Proyecto.graphml, con el agregado de COMPETIDOR como
-- supertipo de PARTICIPANTE/EQUIPO: una inscripción puede ser individual
-- (ajedrez) o de equipo (fútbol) sin columnas nulas ni relaciones ambiguas.
-- ENFRENTAMIENTO y TABLA_POSICIONES referencian INSCRIPCION (no COMPETIDOR
-- directo), y EQUIPO_PARTICIPANTE / TORNEO_MODULO son las tablas
-- intermedias de las relaciones N:N "Integra" y "Configura" del MER.

USE sgdm;

-- ROL ------------------------------------------------------------------
CREATE TABLE rol (
    id_rol      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol  VARCHAR(50) NOT NULL UNIQUE
);

-- USUARIO ----------------------------------------------------------------
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

-- AUDITORIA_REGISTRO ------------------------------------------------------
CREATE TABLE auditoria_registro (
    id_auditoria      INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario        INT NULL,
    accion_realizada  VARCHAR(100) NOT NULL,
    tabla_afectada    VARCHAR(100) NOT NULL,
    fecha_hora        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen         VARCHAR(45),
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
        ON DELETE SET NULL
);

-- COMPETIDOR (supertipo de PARTICIPANTE / EQUIPO) -------------------------
CREATE TABLE competidor (
    id_competidor    INT AUTO_INCREMENT PRIMARY KEY,
    tipo_competidor  ENUM('participante', 'equipo') NOT NULL
);

-- PARTICIPANTE -------------------------------------------------------------
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

-- EQUIPO -------------------------------------------------------------------
CREATE TABLE equipo (
    id_equipo        INT AUTO_INCREMENT PRIMARY KEY,
    id_competidor    INT NOT NULL UNIQUE,
    id_usuario       INT NOT NULL,
    nombre_equipo    VARCHAR(150) NOT NULL,
    perfil_publico   BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_equipo_competidor FOREIGN KEY (id_competidor) REFERENCES competidor(id_competidor)
        ON DELETE CASCADE,
    CONSTRAINT fk_equipo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

-- EQUIPO_PARTICIPANTE (plantilla: relación "Integra" N:N del MER) --------
CREATE TABLE equipo_participante (
    id_equipo        INT NOT NULL,
    id_participante  INT NOT NULL,
    fecha_ingreso    DATE NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (id_equipo, id_participante),
    CONSTRAINT fk_ep_equipo FOREIGN KEY (id_equipo) REFERENCES equipo(id_equipo)
        ON DELETE CASCADE,
    CONSTRAINT fk_ep_participante FOREIGN KEY (id_participante) REFERENCES participante(id_participante)
        ON DELETE CASCADE
);

-- TIPO_TORNEO (formato: liga, eliminación directa, sistema suizo) --------
CREATE TABLE tipo_torneo (
    id_tipo_torneo  INT AUTO_INCREMENT PRIMARY KEY,
    nombre_tipo     VARCHAR(50) NOT NULL UNIQUE,
    descripcion     TEXT
);

-- MODULO_COMPETENCIA (disciplina: fútbol, ajedrez, esports...) -----------
CREATE TABLE modulo_competencia (
    id_modulo      INT AUTO_INCREMENT PRIMARY KEY,
    nombre_modulo  VARCHAR(100) NOT NULL UNIQUE,
    descripcion    TEXT
);

-- TORNEO -------------------------------------------------------------------
-- descripcion/sede/cupo_maximo no estaban en el MER original: se agregan
-- porque el formulario real de creación de torneo (crear-competencia.html)
-- los pide como campos obligatorios. Ver MER_SGDM_Proyecto.graphml, que
-- se actualizó con estos 3 atributos para no quedar desalineado del SQL.
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
    estado                ENUM('planificado', 'en_curso', 'finalizado', 'cancelado') NOT NULL DEFAULT 'planificado',
    CONSTRAINT fk_torneo_tipo FOREIGN KEY (id_tipo_torneo) REFERENCES tipo_torneo(id_tipo_torneo),
    CONSTRAINT fk_torneo_organizador FOREIGN KEY (id_usuario_organizador) REFERENCES usuario(id_usuario)
);

-- TORNEO_MODULO (relación "Configura" N:N del MER, con atributos propios) -
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

-- RONDA ----------------------------------------------------------------
-- NumeroRonda identifica la ronda dentro de SU torneo (no es único global,
-- por eso se agrega id_ronda como clave sustituta y se resguarda la
-- unicidad real con UNIQUE(id_torneo, numero_ronda)).
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

-- INSCRIPCION ------------------------------------------------------------
CREATE TABLE inscripcion (
    id_inscripcion      INT AUTO_INCREMENT PRIMARY KEY,
    id_torneo           INT NOT NULL,
    id_competidor       INT NOT NULL,
    fecha_inscripcion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_inscripcion  ENUM('pendiente', 'confirmada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_inscripcion_torneo FOREIGN KEY (id_torneo) REFERENCES torneo(id_torneo)
        ON DELETE CASCADE,
    CONSTRAINT fk_inscripcion_competidor FOREIGN KEY (id_competidor) REFERENCES competidor(id_competidor),
    CONSTRAINT uq_inscripcion_torneo_competidor UNIQUE (id_torneo, id_competidor)
);

-- ENFRENTAMIENTO ---------------------------------------------------------
-- Local y visitante apuntan a INSCRIPCION (no directo a COMPETIDOR): para
-- jugar un partido de un torneo hay que estar inscripto en ESE torneo
-- (relaciones "Juega_Local"/"Juega_Visitante" del MER).
CREATE TABLE enfrentamiento (
    id_enfrentamiento        INT AUTO_INCREMENT PRIMARY KEY,
    id_ronda                 INT NOT NULL,
    id_inscripcion_local      INT NOT NULL,
    id_inscripcion_visitante  INT NOT NULL,
    fecha_hora               DATETIME,
    estado_partido           ENUM('programado', 'en_curso', 'finalizado', 'suspendido') NOT NULL DEFAULT 'programado',
    CONSTRAINT fk_enfrentamiento_ronda FOREIGN KEY (id_ronda) REFERENCES ronda(id_ronda)
        ON DELETE CASCADE,
    CONSTRAINT fk_enfrentamiento_local FOREIGN KEY (id_inscripcion_local) REFERENCES inscripcion(id_inscripcion),
    CONSTRAINT fk_enfrentamiento_visitante FOREIGN KEY (id_inscripcion_visitante) REFERENCES inscripcion(id_inscripcion),
    CONSTRAINT chk_enfrentamiento_rivales CHECK (id_inscripcion_local <> id_inscripcion_visitante)
);

-- RESULTADO --------------------------------------------------------------
CREATE TABLE resultado (
    id_resultado          INT AUTO_INCREMENT PRIMARY KEY,
    id_enfrentamiento     INT NOT NULL UNIQUE,
    puntuacion_local      INT NOT NULL DEFAULT 0,
    puntuacion_visitante  INT NOT NULL DEFAULT 0,
    ganador               ENUM('local', 'visitante', 'empate'),
    validado              BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_carga           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resultado_enfrentamiento FOREIGN KEY (id_enfrentamiento) REFERENCES enfrentamiento(id_enfrentamiento)
        ON DELETE CASCADE
);

-- TABLA_POSICIONES --------------------------------------------------------
-- 1:1 con INSCRIPCION (relación "Acumula" del MER): la inscripción ya
-- identifica torneo + competidor, no hace falta repetirlos acá.
CREATE TABLE tabla_posiciones (
    id_posicion         INT AUTO_INCREMENT PRIMARY KEY,
    id_inscripcion      INT NOT NULL UNIQUE,
    partidos_jugados    INT NOT NULL DEFAULT 0,
    victorias           INT NOT NULL DEFAULT 0,
    empates             INT NOT NULL DEFAULT 0,
    derrotas            INT NOT NULL DEFAULT 0,
    puntos_acumulados   INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_posiciones_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion(id_inscripcion)
        ON DELETE CASCADE
);

-- Roles base -----------------------------------------------------------
-- Los 4 roles que ya usa el front-end (SGDM_PERMISSIONS en main.js): el
-- código va en mayúsculas porque main.js lo usa tal cual, sin traducir.
INSERT INTO rol (nombre_rol) VALUES ('ADMIN'), ('ORGANIZADOR'), ('PARTICIPANTE'), ('PUBLICO');

-- Catálogo de formatos de torneo -----------------------------------------
-- Los 3 formatos obligatorios según la letra del proyecto (liga,
-- eliminación directa, sistema suizo). "Fase de grupos + playoffs" queda
-- fuera: la letra la lista como formato opcional/fuera de esta etapa.
INSERT INTO tipo_torneo (nombre_tipo, descripcion) VALUES
    ('Liga', 'Todos contra todos'),
    ('Eliminación Directa', 'Llaves de eliminación directa'),
    ('Sistema Suizo', 'Emparejamiento por rendimiento acumulado');

-- Catálogo de disciplinas --------------------------------------------
-- Las mismas 7 que ya ofrece el <select> de crear-competencia.html /
-- torneos.html. "Personalizada/Custom" no se precarga: se crea al vuelo
-- cuando alguien la escribe en el formulario.
INSERT INTO modulo_competencia (nombre_modulo) VALUES
    ('Fútbol'), ('Básquetbol'), ('Ajedrez'), ('Tenis'),
    ('Esports'), ('Voleibol'), ('Rugby');
