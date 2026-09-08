#!/bin/bash
#    No se incluyen logs del sistema/aplicación (rotación aparte via logrotate).
#   Requiere rsync: (sudo dnf install -y rsync mariadb).
set -euo pipefail

LOG="/var/log/sgdm_respaldos.log"

DB_NAME="sgdm"
DB_DEFAULTS_FILE="/etc/mysql/backup.cnf"
DIR_BACKUP_DB="/var/backups/sgdm/bd"
RETENCION_DB=7

DIR_APP="/var/www/html"
CONFIG_PATHS=(/etc/httpd /etc/php /etc/firewalld)  
DIR_BACKUP_APP="/var/backups/sgdm/app"
RETENCION_APP=4

# Copia offsite
# pendiente de dejarlo en true y ponerle las credencaiales de drive
OFFSITE_HABILITADO="false"
OFFSITE_USER="sgdm_backup"
OFFSITE_HOST="backup.lidenskap.local"
OFFSITE_DIR="/srv/backups/sgdm"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG" >/dev/null
}

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este comando debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

# RECORDATORIO pa mi: AlmaLinux Minimal no trae rsync ni el cliente de mariadb por defecto:
# hay que instalarlos con dnf antes del primer uso.
verificar_dependencias() {
    local faltan=()
    command -v gzip >/dev/null || faltan+=("gzip")
    command -v tar >/dev/null || faltan+=("tar")
    command -v mariadb-dump >/dev/null || command -v mysqldump >/dev/null || faltan+=("mariadb (mariadb-dump/mysqldump)")
    if [[ "$OFFSITE_HABILITADO" == "true" ]]; then
        command -v rsync >/dev/null || faltan+=("rsync")
    fi

    if [[ ${#faltan[@]} -gt 0 ]]; then
        log "ERROR: faltan dependencias: ${faltan[*]}."
        echo "Error: faltan dependencias: ${faltan[*]}." >&2
        echo "Instalar con: sudo dnf install -y rsync mariadb" >&2
        exit 1
    fi
}

comando_dump() {
    if command -v mariadb-dump >/dev/null; then
        echo "mariadb-dump"
    else
        echo "mysqldump"
    fi
}

rotar_backups() {
    local dir=$1
    local patron=$2
    local retencion=$3
    ls -1t "$dir"/$patron 2>/dev/null | tail -n +"$((retencion + 1))" | while read -r viejo; do
        rm -f "$viejo"
        log "Rotación: eliminado respaldo antiguo '$viejo' (retención=$retencion)."
    done
}

enviar_offsite() {
    local archivo=$1

    if [[ "$OFFSITE_HABILITADO" != "true" ]]; then
        log "PENDIENTE: copia offsite de '$archivo' no enviada (destino offsite aún sin definir)."
        return 0
    fi

    if ! rsync -az -e ssh "$archivo" "${OFFSITE_USER}@${OFFSITE_HOST}:${OFFSITE_DIR}/"; then
        log "ERROR: no se pudo enviar '$archivo' al servidor offsite ${OFFSITE_HOST}."
        return 1
    fi
    log "Copia offsite de '$archivo' enviada a ${OFFSITE_HOST}:${OFFSITE_DIR}."
}

respaldar_bd() {
    require_root
    mkdir -p "$DIR_BACKUP_DB"
    local fecha destino
    fecha=$(date '+%Y%m%d_%H%M%S')
    destino="${DIR_BACKUP_DB}/bd_${DB_NAME}_${fecha}.sql.gz"

    if ! "$(comando_dump)" --defaults-extra-file="$DB_DEFAULTS_FILE" \
            --single-transaction --routines --triggers "$DB_NAME" | gzip > "$destino"; then
        log "ERROR: falló el respaldo de la base de datos '$DB_NAME'."
        rm -f "$destino"
        exit 1
    fi

    log "Respaldo de base de datos creado: $destino ($(du -h "$destino" | cut -f1))."
    enviar_offsite "$destino" || true
    rotar_backups "$DIR_BACKUP_DB" "bd_${DB_NAME}_*.sql.gz" "$RETENCION_DB"
}

respaldar_app() {
    require_root
    mkdir -p "$DIR_BACKUP_APP"
    local fecha destino
    fecha=$(date '+%Y%m%d_%H%M%S')
    destino="${DIR_BACKUP_APP}/app_sgdm_${fecha}.tar.gz"

    local existentes=()
    for ruta in "$DIR_APP" "${CONFIG_PATHS[@]}"; do
        [[ -e "$ruta" ]] && existentes+=("$ruta")
    done

    if [[ ${#existentes[@]} -eq 0 ]]; then
        log "ERROR: ninguna de las rutas a respaldar existe (app/configuración)."
        exit 1
    fi

    if ! tar --exclude='*/logs/*' -czf "$destino" "${existentes[@]}" 2>>"$LOG"; then
        log "ERROR: falló el respaldo de código/configuración."
        rm -f "$destino"
        exit 1
    fi

    log "Respaldo de código/configuración creado: $destino ($(du -h "$destino" | cut -f1))."
    enviar_offsite "$destino" || true
    rotar_backups "$DIR_BACKUP_APP" "app_sgdm_*.tar.gz" "$RETENCION_APP"
}

instalar_cron() {
    require_root
    local script_path cron_file
    script_path=$(readlink -f "$0")
    cron_file="/etc/cron.d/sgdm_respaldos"

    cat > "$cron_file" <<EOF
# Respaldos automáticos SGDM - generado por $script_path instalar-cron
0 3 * * *   root  $script_path bd  >> $LOG 2>&1
30 3 * * 0  root  $script_path app >> $LOG 2>&1
EOF
    chmod 644 "$cron_file"
    log "Tareas de cron instaladas en $cron_file."
    echo "Cron instalado. BD: diaria 03:00 (retención 7). App/config: domingo 03:30 (retención 4)."
}

uso() {
    cat <<EOF
Uso: sudo $0 <accion>

Acciones:
  bd              Respalda la base de datos '$DB_NAME' (dump + gzip, rotación)
  app             Respalda '$DIR_APP' y la configuración de Apache/PHP/firewalld
  todo            Ejecuta 'bd' y 'app' en secuencia
  instalar-cron   Crea /etc/cron.d/sgdm_respaldos con el cronograma definido

Nota: la copia offsite está pendiente de definir (OFFSITE_HABILITADO="false").
Mientras tanto solo se guarda copia local con rotación.
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        bd)             verificar_dependencias; respaldar_bd ;;
        app)            verificar_dependencias; respaldar_app ;;
        todo)           verificar_dependencias; respaldar_bd; respaldar_app ;;
        instalar-cron)  instalar_cron ;;
        *)              uso; exit 1 ;;
    esac
}

main "$@"
