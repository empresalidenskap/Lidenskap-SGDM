#!/bin/bash
set -euo pipefail
umask 077

LOG="/var/log/sgdm_respaldos.log"

DB_NAME="sgdm"
DB_DEFAULTS_FILE="/etc/mysql/backup.cnf"
DIR_BACKUP_DB="/var/backups/sgdm/bd"
RETENCION_DB=7

DIR_APP="/var/www/html"
CONFIG_PATHS=(/etc/httpd /etc/php /etc/firewalld)
DIR_BACKUP_APP="/var/backups/sgdm/app"
RETENCION_APP=4

DIR_CLAVES="/etc/sgdm/respaldos"
CLAVE_CIFRADO="$DIR_CLAVES/cifrado.clave"
FIRMA_KEY="$DIR_CLAVES/firma.key"
FIRMA_PUB="$DIR_CLAVES/firma.pub"

OFFSITE_HABILITADO="false"
OFFSITE_RCLONE_REMOTE="gdrive"
OFFSITE_RCLONE_PATH="sgdm-backups"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG" >/dev/null
}

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este comando debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

verificar_dependencias() {
    local faltan=()
    command -v gzip >/dev/null || faltan+=("gzip")
    command -v tar >/dev/null || faltan+=("tar")
    command -v openssl >/dev/null || faltan+=("openssl")
    command -v sha256sum >/dev/null || faltan+=("coreutils (sha256sum)")
    command -v mariadb-dump >/dev/null || command -v mysqldump >/dev/null || faltan+=("mariadb (mariadb-dump/mysqldump)")
    if [[ "$OFFSITE_HABILITADO" == "true" ]]; then
        command -v rclone >/dev/null || faltan+=("rclone")
    fi

    if [[ ${#faltan[@]} -gt 0 ]]; then
        log "ERROR: faltan dependencias: ${faltan[*]}."
        echo "Error: faltan dependencias: ${faltan[*]}." >&2
        echo "Instalar con: sudo dnf install -y rclone mariadb openssl" >&2
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

preparar_claves() {
    mkdir -p "$DIR_CLAVES"
    chmod 700 "$DIR_CLAVES"
    if [[ ! -f "$CLAVE_CIFRADO" ]]; then
        openssl rand -base64 48 > "$CLAVE_CIFRADO"
        log "Clave de cifrado creada: $CLAVE_CIFRADO (guardar una copia fuera del servidor)."
    fi
    if [[ ! -f "$FIRMA_KEY" ]]; then
        openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out "$FIRMA_KEY" 2>/dev/null
        log "Clave privada de firma creada: $FIRMA_KEY (RSA 4096)."
    fi
    if [[ ! -f "$FIRMA_PUB" ]]; then
        openssl pkey -in "$FIRMA_KEY" -pubout -out "$FIRMA_PUB"
        chmod 644 "$FIRMA_PUB"
    fi
}

cifrar() {
    openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass file:"$CLAVE_CIFRADO"
}

sellar() {
    local archivo=$1
    (cd "$(dirname "$archivo")" && sha256sum "$(basename "$archivo")" > "$(basename "$archivo").sha256")
    openssl dgst -sha256 -sign "$FIRMA_KEY" -out "$archivo.sig" "$archivo"
}

verificar() {
    local archivo=$1 errores=0
    [[ -f "$archivo" ]] || { echo "Error: no existe '$archivo'." >&2; return 1; }

    if (cd "$(dirname "$archivo")" && sha256sum -c --quiet "$(basename "$archivo").sha256" >/dev/null 2>&1); then
        echo "Hash SHA-256:  OK (el archivo no cambió)"
    else
        echo "Hash SHA-256:  FALLA (archivo dañado o modificado)"
        errores=1
    fi
    if openssl dgst -sha256 -verify "$FIRMA_PUB" -signature "$archivo.sig" "$archivo" >/dev/null 2>&1; then
        echo "Firma digital: OK (lo generó este servidor)"
    else
        echo "Firma digital: FALLA (no lo firmó este servidor o fue modificado)"
        errores=1
    fi

    if [[ $errores -eq 0 ]]; then
        log "Verificación OK: '$archivo'."
    else
        log "ERROR: verificación fallida de '$archivo'."
    fi
    return $errores
}

descifrar() {
    local archivo=$1 salida
    salida=${2:-$(basename "${archivo%.enc}")}
    if ! verificar "$archivo"; then
        echo "Error: no se descifra un respaldo que no pasó la verificación." >&2
        exit 1
    fi
    openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass file:"$CLAVE_CIFRADO" \
        -in "$archivo" -out "$salida"
    log "Respaldo descifrado: '$archivo' -> '$salida'."
    echo "Descifrado en: $salida"
}

rotar_backups() {
    local dir=$1
    local patron=$2
    local retencion=$3
    ls -1t "$dir"/$patron 2>/dev/null | tail -n +"$((retencion + 1))" | while read -r viejo; do
        rm -f "$viejo" "$viejo.sha256" "$viejo.sig"
        log "Rotación: eliminado respaldo antiguo '$viejo' (retención=$retencion)."
    done
}

enviar_offsite() {
    local archivo=$1 f

    if [[ "$OFFSITE_HABILITADO" != "true" ]]; then
        log "PENDIENTE: copia offsite de '$archivo' no enviada (falta correr 'rclone config' y habilitar OFFSITE_HABILITADO)."
        return 0
    fi

    for f in "$archivo" "$archivo.sha256" "$archivo.sig"; do
        if ! rclone copy "$f" "${OFFSITE_RCLONE_REMOTE}:${OFFSITE_RCLONE_PATH}/" --quiet; then
            log "ERROR: no se pudo enviar '$f' a Google Drive (remote '${OFFSITE_RCLONE_REMOTE}')."
            return 1
        fi
    done
    log "Copia offsite de '$archivo' (+ .sha256 y .sig) enviada a Google Drive (${OFFSITE_RCLONE_REMOTE}:${OFFSITE_RCLONE_PATH})."
}

respaldar_bd() {
    require_root
    preparar_claves
    mkdir -p "$DIR_BACKUP_DB"
    local fecha destino
    fecha=$(date '+%Y%m%d_%H%M%S')
    destino="${DIR_BACKUP_DB}/bd_${DB_NAME}_${fecha}.sql.gz.enc"

    if ! "$(comando_dump)" --defaults-extra-file="$DB_DEFAULTS_FILE" \
            --single-transaction --routines --triggers "$DB_NAME" | gzip | cifrar > "$destino"; then
        log "ERROR: falló el respaldo de la base de datos '$DB_NAME'."
        rm -f "$destino"
        exit 1
    fi
    sellar "$destino"

    log "Respaldo de base de datos creado: $destino ($(du -h "$destino" | cut -f1), cifrado, con hash y firma)."
    enviar_offsite "$destino" || true
    rotar_backups "$DIR_BACKUP_DB" "bd_${DB_NAME}_*.sql.gz.enc" "$RETENCION_DB"
}

respaldar_app() {
    require_root
    preparar_claves
    mkdir -p "$DIR_BACKUP_APP"
    local fecha destino
    fecha=$(date '+%Y%m%d_%H%M%S')
    destino="${DIR_BACKUP_APP}/app_sgdm_${fecha}.tar.gz.enc"

    local existentes=()
    for ruta in "$DIR_APP" "${CONFIG_PATHS[@]}"; do
        [[ -e "$ruta" ]] && existentes+=("$ruta")
    done

    if [[ ${#existentes[@]} -eq 0 ]]; then
        log "ERROR: ninguna de las rutas a respaldar existe (app/configuración)."
        exit 1
    fi

    if ! tar --exclude='*/logs/*' -czf - "${existentes[@]}" 2>>"$LOG" | cifrar > "$destino"; then
        log "ERROR: falló el respaldo de código/configuración."
        rm -f "$destino"
        exit 1
    fi
    sellar "$destino"

    log "Respaldo de código/configuración creado: $destino ($(du -h "$destino" | cut -f1), cifrado, con hash y firma)."
    enviar_offsite "$destino" || true
    rotar_backups "$DIR_BACKUP_APP" "app_sgdm_*.tar.gz.enc" "$RETENCION_APP"
}

mostrar_claves() {
    require_root
    preparar_claves
    cat <<EOF
Clave de cifrado (AES-256): $CLAVE_CIFRADO
Clave privada de firma:     $FIRMA_KEY
Clave pública de firma:     $FIRMA_PUB

Guardar una copia de $CLAVE_CIFRADO y de $FIRMA_PUB FUERA del servidor
(por ejemplo, en el gestor de contraseñas del equipo). Si el servidor se
pierde, sin la clave de cifrado los respaldos de Google Drive no sirven.
La clave privada de firma no sale del servidor.
EOF
}

instalar_cron() {
    require_root
    local script_path cron_file
    script_path=$(readlink -f "$0")
    cron_file="/etc/cron.d/sgdm_respaldos"

    cat > "$cron_file" <<EOF
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
  bd                         Respalda la base de datos '$DB_NAME' (dump + gzip + cifrado, rotación)
  app                        Respalda '$DIR_APP' y la configuración de Apache/PHP/firewalld
  todo                       Ejecuta 'bd' y 'app' en secuencia
  verificar <archivo.enc>    Comprueba el hash SHA-256 y la firma digital de un respaldo
  descifrar <archivo.enc> [destino]
                             Verifica y descifra un respaldo (deja el .sql.gz / .tar.gz)
  claves                     Muestra dónde están las claves de cifrado y firma
  instalar-cron              Crea /etc/cron.d/sgdm_respaldos con el cronograma definido

Cada respaldo queda cifrado con AES-256 (.enc), con su hash SHA-256 (.sha256)
y firmado con RSA 4096 (.sig). Claves en $DIR_CLAVES (solo root).

Nota: la copia offsite a Google Drive está definida (rclone, remote
'$OFFSITE_RCLONE_REMOTE') pero deshabilitada hasta correr 'rclone config'
en el servidor y poner OFFSITE_HABILITADO="true". Mientras tanto solo se
guarda copia local con rotación.
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        bd)             verificar_dependencias; respaldar_bd ;;
        app)            verificar_dependencias; respaldar_app ;;
        todo)           verificar_dependencias; respaldar_bd; respaldar_app ;;
        verificar)      require_root; [[ -n "${2:-}" ]] || { uso; exit 1; }; verificar "$2" ;;
        descifrar)      require_root; [[ -n "${2:-}" ]] || { uso; exit 1; }; descifrar "$2" "${3:-}" ;;
        claves)         mostrar_claves ;;
        instalar-cron)  instalar_cron ;;
        *)              uso; exit 1 ;;
    esac
}

main "$@"
