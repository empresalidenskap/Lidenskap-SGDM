#!/bin/bash
# monitoreo_sgdm.sh
#   Instala y configura Netdata (agente de monitoreo en tiempo real) para
#   SGDM, elegido sobre Zabbix/Grafana por el presupuesto de recursos del
#   servidor (1 vCPU / 4GB RAM / 32GB disco thin-provisioned, ver Primera
#   Entrega): es un único agente liviano con dashboard web incorporado,
#   sin base de datos propia ni proceso servidor pesado.
#   El dashboard (puerto 19999) NUNCA se expone en firewalld ni se
#   reverse-proxea por Apache: se ajusta netdata.conf para escuchar solo en
#   127.0.0.1, y el acceso remoto es exclusivamente por túnel SSH:
#     ssh -L 19999:localhost:19999 usuario@ip_servidor
#   (misma idea de superficie de ataque mínima usada en el resto del
#   proyecto: administración solo por SSH, sin abrir puertos nuevos).
#   EPEL no empaqueta netdata para AlmaLinux 8, así que se instala con el
#   instalador oficial (kickstart.sh): se descarga primero a un archivo
#   local (no un pipe ciego curl|bash), se deja registrado su hash en el
#   log para poder auditar qué se ejecutó, y recién ahí se corre.
set -euo pipefail

LOG="/var/log/sgdm_monitoreo.log"

# --- Servicio y dashboard ---
SERVICIO="netdata"
CONF="/etc/netdata/netdata.conf"
CONF_BACKUP="/etc/netdata/netdata.conf.orig"
DASHBOARD_BIND="127.0.0.1"

# --- Retención en disco (disco de 32GB thin-provisioned) ---
RETENCION_DISCO_MB=256

# --- Instalador oficial de Netdata ---
KICKSTART_URL="https://get.netdata.cloud/kickstart.sh"
KICKSTART_LOCAL="/tmp/netdata-kickstart.sh"

# --- Collector de MariaDB (usuario de solo metadatos) ---
MYSQL_MONITOR_USER="netdata_monitor"
MYSQL_MONITOR_HOST="localhost"
MYSQL_MONITOR_CONF="/etc/netdata/go.d/mysql.conf"

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
    command -v curl >/dev/null || faltan+=("curl")
    command -v openssl >/dev/null || faltan+=("openssl")

    if [[ ${#faltan[@]} -gt 0 ]]; then
        log "ERROR: faltan dependencias: ${faltan[*]}."
        echo "Error: faltan dependencias: ${faltan[*]}." >&2
        echo "Instalar con: sudo dnf install -y ${faltan[*]}" >&2
        exit 1
    fi
}

verificar_netdata_instalado() {
    if ! command -v netdata >/dev/null; then
        echo "Error: netdata no está instalado. Ejecutar primero: sudo $0 instalar" >&2
        exit 1
    fi
}

instalar() {
    require_root
    verificar_dependencias

    if command -v netdata >/dev/null; then
        log "netdata ya está instalado, se omite instalación."
        return
    fi

    curl -fsSL "$KICKSTART_URL" -o "$KICKSTART_LOCAL"
    log "Instalador descargado en $KICKSTART_LOCAL (sha256: $(sha256sum "$KICKSTART_LOCAL" | cut -d' ' -f1))."

    if ! sh "$KICKSTART_LOCAL" --non-interactive --disable-telemetry --stable-channel >>"$LOG" 2>&1; then
        log "ERROR: falló la instalación de netdata."
        exit 1
    fi

    log "netdata instalado correctamente."
}

configurar() {
    require_root
    verificar_netdata_instalado

    systemctl enable --now "$SERVICIO"

    local intentos=0
    until curl -s -o /dev/null "http://127.0.0.1:19999/api/v1/info"; do
        intentos=$((intentos + 1))
        if [[ $intentos -ge 15 ]]; then
            log "ERROR: netdata no respondió en el dashboard local tras esperar."
            exit 1
        fi
        sleep 1
    done

    if [[ ! -f "$CONF_BACKUP" ]]; then
        cp "$CONF" "$CONF_BACKUP"
        log "Backup de configuración original guardado en $CONF_BACKUP."
    fi

    # Trae la config anotada real de esta versión instalada, en vez de asumir
    # nombres de directivas que pueden variar entre versiones de netdata.
    if curl -s "http://127.0.0.1:19999/netdata.conf" -o "$CONF"; then
        log "Config anotada obtenida desde el propio netdata en ejecución."
    else
        log "ADVERTENCIA: no se pudo obtener la config anotada, se edita la instalada por defecto."
    fi

    if grep -qE '^\s*#?\s*bind to\s*=' "$CONF"; then
        sed -i -E "s/^\s*#?\s*bind to\s*=.*/\tbind to = ${DASHBOARD_BIND}/" "$CONF"
        log "Dashboard restringido a ${DASHBOARD_BIND} (acceso solo por túnel SSH)."
    else
        log "ADVERTENCIA: no se encontró la directiva 'bind to' en [web]; revisar $CONF a mano."
    fi

    local directiva_retencion
    for directiva_retencion in "dbengine multihost disk space MB" "dbengine disk space MB" "dbengine tier 0 disk space MB"; do
        if grep -qE "^\s*#?\s*${directiva_retencion}\s*=" "$CONF"; then
            sed -i -E "s/^\s*#?\s*${directiva_retencion}\s*=.*/\t${directiva_retencion} = ${RETENCION_DISCO_MB}/" "$CONF"
            log "Retención en disco limitada a ${RETENCION_DISCO_MB}MB (${directiva_retencion})."
            break
        fi
    done

    if grep -qE '^\s*#?\s*anonymous statistics\s*=' "$CONF"; then
        sed -i -E "s/^\s*#?\s*anonymous statistics\s*=.*/\tanonymous statistics = no/" "$CONF"
        log "Telemetría anónima deshabilitada."
    fi

    systemctl restart "$SERVICIO"
    log "netdata reconfigurado y reiniciado."
}

estado() {
    echo "Estado del servicio '$SERVICIO':"
    systemctl is-active "$SERVICIO" 2>/dev/null || echo "inactivo"
    systemctl is-enabled "$SERVICIO" 2>/dev/null || echo "deshabilitado"
    echo ""
    echo "Para ver el dashboard, abrir un túnel SSH desde tu equipo:"
    echo "  ssh -L 19999:localhost:19999 usuario@ip_servidor"
    echo "y luego entrar a http://localhost:19999 en el navegador."
}

collectors_mysql() {
    require_root
    verificar_netdata_instalado

    local temp_pass
    temp_pass=$(openssl rand -base64 18)

    mariadb <<SQL
CREATE USER IF NOT EXISTS '${MYSQL_MONITOR_USER}'@'${MYSQL_MONITOR_HOST}' IDENTIFIED BY '${temp_pass}';
GRANT USAGE, PROCESS, REPLICATION CLIENT ON *.* TO '${MYSQL_MONITOR_USER}'@'${MYSQL_MONITOR_HOST}';
FLUSH PRIVILEGES;
SQL

    mkdir -p "$(dirname "$MYSQL_MONITOR_CONF")"
    cat > "$MYSQL_MONITOR_CONF" <<EOF
jobs:
  - name: local
    dsn: ${MYSQL_MONITOR_USER}:${temp_pass}@unix(/var/lib/mysql/mysql.sock)/
EOF
    chmod 640 "$MYSQL_MONITOR_CONF"
    chown root:netdata "$MYSQL_MONITOR_CONF" 2>/dev/null || true

    systemctl restart "$SERVICIO"
    log "Collector de MariaDB configurado: usuario '${MYSQL_MONITOR_USER}'@'${MYSQL_MONITOR_HOST}' (solo metadatos, sin acceso a datos)."
}

todo() {
    instalar
    configurar
}

uso() {
    cat <<EOF
Uso: sudo $0 <accion>

Acciones:
  instalar          Instala netdata (instalador oficial, descargado antes de ejecutarse)
  configurar        Ajusta netdata.conf: dashboard solo en 127.0.0.1 y retención en disco limitada
  estado            Muestra si el servicio está activo y recuerda el túnel SSH
  collectors-mysql  Crea '${MYSQL_MONITOR_USER}'@'${MYSQL_MONITOR_HOST}' de solo metadatos para el collector de MariaDB
  todo              Ejecuta 'instalar' y 'configurar' en secuencia

Nota: el dashboard (puerto 19999) nunca se expone en firewalld; se accede
vía túnel SSH. El servicio también puede administrarse con
gestionar_servicio.sh (ingresando 'netdata' como nombre de servicio).
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        instalar)         instalar ;;
        configurar)        configurar ;;
        estado)            estado ;;
        collectors-mysql)  collectors_mysql ;;
        todo)              todo ;;
        *)                 uso; exit 1 ;;
    esac
}

main "$@"
