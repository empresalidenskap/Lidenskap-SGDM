#!/bin/bash

LOG="/var/log/sgdm_bd.log"
DB_NAME="sgdm"
DIR_BACKUP_DB="/var/backups/sgdm/bd"
UMBRAL_DISCO=85        # % de uso del disco para dar alerta
UMBRAL_RESPALDO=26     # horas máximas desde el último respaldo

VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
SIN_COLOR='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - [${SUDO_USER:-root}] $1" >> "$LOG"
}

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este script debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

salir() {
    echo ""
    echo "Saliendo..."
    exit 0
}

pausa() {
    echo ""
    read -p "Presione Enter para continuar..." _ || salir
}

# Muestra un título y el resultado de la consulta en forma de tabla
consulta() {
    echo -e "\n${AMARILLO}---- $1 ----${SIN_COLOR}"
    mariadb --table "$DB_NAME" -e "$2"
}

# Devuelve un único valor, sin encabezado
valor() {
    mariadb -N -B "$DB_NAME" -e "$1"
}

pedir_torneo() {
    read -p "Id del torneo: " id || salir
    if [[ ! "$id" =~ ^[0-9]+$ ]]; then
        echo -e "${ROJO}El id debe ser un número.${SIN_COLOR}"
        return 1
    fi
}

# ---------------- Consultas ----------------

resumen() {
    consulta "Registros por tabla" "
        SELECT 'Usuarios' AS tabla, COUNT(*) AS total FROM usuario
        UNION ALL SELECT 'Torneos', COUNT(*) FROM torneo
        UNION ALL SELECT 'Equipos', COUNT(*) FROM equipo
        UNION ALL SELECT 'Inscripciones', COUNT(*) FROM inscripcion
        UNION ALL SELECT 'Rondas', COUNT(*) FROM ronda
        UNION ALL SELECT 'Enfrentamientos', COUNT(*) FROM enfrentamiento
        UNION ALL SELECT 'Resultados', COUNT(*) FROM resultado"
    # Rol de la cuenta: solo ADMIN o PUBLICO. Organizador, Árbitro y
    # Participante dependen de cada torneo (vista_rol_torneo) y se apagan
    # solos cuando el torneo termina.
    consulta "Cuentas por rol global" "
        SELECT r.nombre_rol AS rol, COUNT(u.id_usuario) AS cuentas
        FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
        GROUP BY r.id_rol, r.nombre_rol"
    consulta "Roles activos por torneo" "
        SELECT t.nombre_torneo AS torneo, t.estado,
               SUM(v.rol = 'ORGANIZADOR') AS organizadores,
               SUM(v.rol = 'ARBITRO') AS arbitros,
               SUM(v.rol = 'PARTICIPANTE') AS participantes
        FROM vista_rol_torneo v JOIN torneo t ON t.id_torneo = v.id_torneo
        WHERE v.activo = 1
        GROUP BY t.id_torneo, t.nombre_torneo, t.estado
        ORDER BY t.nombre_torneo"
    log "Consulta: resumen."
}

torneos() {
    consulta "Torneos" "
        SELECT t.id_torneo AS id, t.nombre_torneo AS torneo, tt.nombre_tipo AS formato,
               t.estado, t.fecha_inicio AS inicio, t.fecha_fin AS fin
        FROM torneo t JOIN tipo_torneo tt ON tt.id_tipo_torneo = t.id_tipo_torneo
        ORDER BY t.fecha_inicio DESC"
    log "Consulta: torneos."
}

# Orden de RF-09: puntos, diferencia de goles y goles a favor (el
# enfrentamiento directo y el sorteo los aplica la aplicación)
posiciones() {
    pedir_torneo || return
    consulta "Tabla de posiciones del torneo $id" "
        SELECT COALESCE(e.nombre_equipo, p.nombre_participante) AS competidor,
               v.partidos_jugados AS pj, v.victorias AS g, v.empates AS e,
               v.derrotas AS p, v.goles_a_favor AS gf, v.goles_en_contra AS gc,
               v.diferencia_goles AS dg, v.puntos_acumulados AS pts
        FROM vista_tabla_posiciones v
        LEFT JOIN participante p ON p.id_competidor = v.id_competidor
        LEFT JOIN equipo e       ON e.id_competidor = v.id_competidor
        WHERE v.id_torneo = $id
        ORDER BY pts DESC, dg DESC, gf DESC"
    log "Consulta: posiciones del torneo $id."
}

# Nombre del competidor de una inscripción (equipo o participante)
nombre_de() {
    echo "(SELECT COALESCE(eq.nombre_equipo, pa.nombre_participante) FROM inscripcion i
             LEFT JOIN equipo eq ON eq.id_competidor = i.id_competidor
             LEFT JOIN participante pa ON pa.id_competidor = i.id_competidor
             WHERE i.id_inscripcion = $1)"
}

partidos() {
    pedir_torneo || return
    consulta "Partidos del torneo $id" "
        SELECT r.numero_ronda AS ronda, en.fecha_hora,
               $(nombre_de en.id_inscripcion_local) AS local,
               IFNULL($(nombre_de en.id_inscripcion_visitante), '(libre)') AS visitante,
               en.estado_partido AS estado,
               IFNULL(CONCAT(vr.puntuacion_local, ' - ', vr.puntuacion_visitante,
                             IF(vr.validado, '', ' (sin validar)')), '-') AS marcador
        FROM enfrentamiento en
        JOIN ronda r ON r.id_ronda = en.id_ronda
        LEFT JOIN vista_resultado vr ON vr.id_enfrentamiento = en.id_enfrentamiento
        WHERE r.id_torneo = $id
        ORDER BY r.numero_ronda, en.id_enfrentamiento"
    log "Consulta: partidos del torneo $id."
}

pendientes() {
    consulta "Solicitudes e invitaciones sin resolver" "
        SELECT v.estado_solicitud AS estado, v.rol, u.email AS usuario, t.nombre_torneo AS torneo
        FROM vista_rol_torneo v
        JOIN usuario u ON u.id_usuario = v.id_usuario
        JOIN torneo t  ON t.id_torneo  = v.id_torneo
        WHERE v.estado_solicitud IN ('pendiente', 'invitada')
        ORDER BY t.nombre_torneo, v.rol"
    consulta "Pedidos e invitaciones para unirse a equipos" "
        SELECT ep.estado, e.nombre_equipo AS equipo, p.nombre_participante AS persona
        FROM equipo_participante ep
        JOIN equipo e       ON e.id_equipo       = ep.id_equipo
        JOIN participante p ON p.id_participante = ep.id_participante
        WHERE ep.estado IN ('solicitada', 'invitada')
        ORDER BY e.nombre_equipo"
    consulta "Resultados sin validar" "
        SELECT id_resultado AS id, id_enfrentamiento AS partido,
               CONCAT(puntuacion_local, ' - ', puntuacion_visitante) AS marcador, fecha_carga
        FROM resultado
        WHERE validado = FALSE
        ORDER BY fecha_carga"
    log "Consulta: pendientes."
}

auditoria() {
    consulta "Últimas 20 acciones registradas" "
        SELECT a.fecha_hora, IFNULL(u.email, '-') AS usuario, a.accion_realizada AS accion,
               a.tabla_afectada AS tabla, IFNULL(a.detalle, '-') AS detalle, IFNULL(a.ip_origen, '-') AS ip
        FROM auditoria_registro a LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
        ORDER BY a.fecha_hora DESC
        LIMIT 20"
    log "Consulta: auditoría."
}

# ---------------- Monitoreo ----------------

estado_motor() {
    if systemctl is-active --quiet mariadb; then
        echo -e "MariaDB: ${VERDE}activo${SIN_COLOR}"
    else
        echo -e "MariaDB: ${ROJO}inactivo${SIN_COLOR}"
        return
    fi
    consulta "Motor" "
        SELECT @@version AS version, @@max_connections AS max_conexiones"
    consulta "Estado" "
        SHOW GLOBAL STATUS WHERE Variable_name IN
            ('Uptime', 'Threads_connected', 'Max_used_connections',
             'Questions', 'Slow_queries', 'Aborted_connects')"
    log "Consulta: estado del motor."
}

tamano() {
    consulta "Tamaño por tabla" "
        SELECT table_name AS tabla, table_rows AS filas_aprox,
               ROUND((data_length + index_length) / 1024, 1) AS total_kb
        FROM information_schema.TABLES
        WHERE table_schema = '$DB_NAME' AND table_type = 'BASE TABLE'
        ORDER BY (data_length + index_length) DESC"
    echo ""
    echo "Tamaño total: $(valor "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2)
        FROM information_schema.TABLES WHERE table_schema = '$DB_NAME'") MB"
    log "Consulta: tamaño de las tablas."
}

procesos() {
    consulta "Consultas en ejecución" "
        SELECT ID AS id, USER AS usuario, DB AS base, TIME AS seg, LEFT(INFO, 60) AS consulta
        FROM information_schema.PROCESSLIST
        WHERE COMMAND <> 'Sleep' AND ID <> CONNECTION_ID()"
    echo ""
    echo "Para cortar una consulta colgada: mariadb -e 'KILL <id>'"
    log "Consulta: procesos."
}

# Chequeo rápido. Las alertas quedan en el log (pensado también para cron).
chequeo() {
    local alertas=0 disco ultimo horas

    if systemctl is-active --quiet mariadb; then
        echo -e "${VERDE}[OK]${SIN_COLOR} Servicio MariaDB activo"
    else
        echo -e "${ROJO}[ALERTA]${SIN_COLOR} El servicio MariaDB no está activo"
        log "ALERTA: el servicio MariaDB no está activo."
        return 1
    fi

    if valor "SELECT 1" >/dev/null 2>&1; then
        echo -e "${VERDE}[OK]${SIN_COLOR} Conexión a la base '$DB_NAME'"
    else
        echo -e "${ROJO}[ALERTA]${SIN_COLOR} No se pudo conectar a la base '$DB_NAME'"
        log "ALERTA: no se pudo conectar a la base '$DB_NAME'."
        return 1
    fi

    disco=$(df --output=pcent /var/lib/mysql | tail -n 1 | tr -dc '0-9')
    if [[ $disco -ge $UMBRAL_DISCO ]]; then
        echo -e "${ROJO}[ALERTA]${SIN_COLOR} Disco de la base al ${disco}%"
        log "ALERTA: disco de la base al ${disco}%."
        alertas=$((alertas + 1))
    else
        echo -e "${VERDE}[OK]${SIN_COLOR} Disco de la base al ${disco}%"
    fi

    ultimo=$(ls -t "$DIR_BACKUP_DB"/bd_${DB_NAME}_*.sql.gz 2>/dev/null | head -n 1)
    if [[ -z "$ultimo" ]]; then
        echo -e "${ROJO}[ALERTA]${SIN_COLOR} No hay respaldos en $DIR_BACKUP_DB"
        log "ALERTA: no hay respaldos en $DIR_BACKUP_DB."
        alertas=$((alertas + 1))
    else
        horas=$(( ($(date +%s) - $(stat -c %Y "$ultimo")) / 3600 ))
        if [[ $horas -ge $UMBRAL_RESPALDO ]]; then
            echo -e "${ROJO}[ALERTA]${SIN_COLOR} El último respaldo tiene $horas horas"
            log "ALERTA: el último respaldo tiene $horas horas."
            alertas=$((alertas + 1))
        else
            echo -e "${VERDE}[OK]${SIN_COLOR} Último respaldo hace $horas horas"
        fi
    fi

    log "Chequeo: $alertas alerta(s)."
    [[ $alertas -eq 0 ]]
}

require_root

if [[ "${1:-}" == "chequeo" ]]; then
    chequeo
    exit $?
fi

while true; do
    clear
    echo "========================================"
    echo "   SGDM - Consultas y monitoreo de la BD"
    echo "========================================"
    echo " Consultas"
    echo "  1) Resumen general"
    echo "  2) Torneos"
    echo "  3) Tabla de posiciones de un torneo"
    echo "  4) Partidos de un torneo"
    echo "  5) Pendientes (solicitudes, invitaciones y resultados)"
    echo "  6) Auditoría"
    echo " Monitoreo"
    echo "  7) Estado del motor"
    echo "  8) Tamaño de las tablas"
    echo "  9) Consultas en ejecución"
    echo " 10) Chequeo rápido"
    echo "  0) Salir"
    read -p "Opción: " opcion || salir
    case $opcion in
        1) resumen ;;
        2) torneos ;;
        3) posiciones ;;
        4) partidos ;;
        5) pendientes ;;
        6) auditoria ;;
        7) estado_motor ;;
        8) tamano ;;
        9) procesos ;;
        10) chequeo ;;
        0) salir ;;
        *) echo -e "${ROJO}Opción inválida.${SIN_COLOR}" ;;
    esac
    pausa
done
