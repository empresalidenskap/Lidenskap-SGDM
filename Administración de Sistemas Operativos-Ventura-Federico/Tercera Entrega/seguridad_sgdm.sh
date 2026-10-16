#!/bin/bash
# seguridad_sgdm.sh
#   Seguridad del servidor del SGDM: firewall (firewalld/nftables), fail2ban,
#   antivirus (ClamAV con escaneos programados), endurecimiento de SSH,
#   actualizaciones de seguridad automáticas y ajustes de red del kernel.
#   Uso: sudo /usr/local/sbin/seguridad_sgdm.sh <accion>
set -Eeuo pipefail

LOG="/var/log/sgdm_seguridad.log"
LOG_ANTIVIRUS="/var/log/sgdm_antivirus.log"

# Red desde la que se permite SSH (ej: "192.168.1.0/24"). Vacío = desde cualquier lado.
SSH_RED_PERMITIDA=""
GRUPO_ADMIN="sgdm_admins"
PUERTO_DOCKER="8080/tcp"

DIR_CUARENTENA="/var/lib/sgdm/cuarentena"
DIRS_ESCANEO=(/var/www/html /home /tmp /var/tmp /opt/sgdm)

SSHD_CONF="/etc/ssh/sshd_config"
CRON_FILE="/etc/cron.d/sgdm_seguridad"
SYSCTL_FILE="/etc/sysctl.d/90-sgdm.conf"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG"
}

# Si algo falla, deja en el log qué comando fue
trap 'log "ERROR en la línea $LINENO: $BASH_COMMAND"' ERR

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este comando debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

firewall() {
    systemctl enable --now firewalld
    firewall-cmd --set-default-zone=public >/dev/null
    for s in cockpit dhcpv6-client; do
        firewall-cmd --permanent --zone=public --remove-service="$s" >/dev/null 2>&1 || true
    done
    # Cierra los puertos abiertos a mano (por ejemplo 3306 de MariaDB),
    # salvo el del SGDM en Docker (docker_sgdm.sh)
    for p in $(firewall-cmd --permanent --zone=public --list-ports); do
        [[ "$p" == "$PUERTO_DOCKER" ]] && continue
        firewall-cmd --permanent --zone=public --remove-port="$p" >/dev/null
        log "Firewall: puerto $p cerrado."
    done
    firewall-cmd --permanent --zone=public --add-service=http --add-service=https >/dev/null

    if [[ -n "$SSH_RED_PERMITIDA" ]]; then
        firewall-cmd --permanent --zone=public --remove-service=ssh >/dev/null 2>&1 || true
        firewall-cmd --permanent --zone=public \
            --add-rich-rule="rule family=\"ipv4\" source address=\"$SSH_RED_PERMITIDA\" service name=\"ssh\" accept" >/dev/null
        log "Firewall: SSH permitido solo desde $SSH_RED_PERMITIDA."
    else
        firewall-cmd --permanent --zone=public --add-service=ssh >/dev/null
    fi

    firewall-cmd --reload >/dev/null
    # Registra en el journal los paquetes rechazados (journalctl -k | grep REJECT)
    firewall-cmd --set-log-denied=unicast >/dev/null
    log "Firewall: zona public con ssh, http y https; el resto se rechaza y queda registrado."
    firewall-cmd --list-all
}

fail2ban() {
    dnf install -y epel-release
    # fail2ban-systemd: la jail sshd lee el journal de systemd
    dnf install -y fail2ban fail2ban-firewalld fail2ban-systemd

    # Los intentos fallidos de login de la app devuelven 401 en el log de Apache
    cat > /etc/fail2ban/filter.d/sgdm-login.conf <<'EOF'
[Definition]
failregex = ^<HOST> \S+ \S+ \[[^\]]+\] "POST /api/login\.php[^"]*" 401\s
ignoreregex =
EOF

    local logs=()
    for f in /var/log/httpd/sgdm-access.log /var/log/httpd/sgdm-ssl-access.log; do
        [[ -f "$f" ]] && logs+=("$f")
    done

    cat > /etc/fail2ban/jail.d/sgdm.local <<EOF
# Generado por seguridad_sgdm.sh
[DEFAULT]
bantime  = 1h
findtime = 10m
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled  = true
maxretry = 5
EOF

    if [[ ${#logs[@]} -gt 0 ]]; then
        # fail2ban necesita un log por línea
        {
            echo ""
            echo "[sgdm-login]"
            echo "enabled  = true"
            echo "backend  = auto"
            echo "filter   = sgdm-login"
            echo "port     = http,https"
            echo "maxretry = 10"
            echo "logpath  = ${logs[0]}"
            for f in "${logs[@]:1}"; do
                echo "           $f"
            done
        } >> /etc/fail2ban/jail.d/sgdm.local
    else
        log "AVISO: no se encontraron los logs de Apache del SGDM; no se activa la jail sgdm-login."
    fi

    systemctl enable fail2ban
    systemctl restart fail2ban

    # El servicio tarda unos segundos en aceptar comandos después de arrancar
    local i
    for i in $(seq 1 15); do
        fail2ban-client ping >/dev/null 2>&1 && break
        sleep 1
    done
    if ! fail2ban-client ping >/dev/null 2>&1; then
        log "ERROR: fail2ban no arrancó (ver: journalctl -u fail2ban)."
        exit 1
    fi
    log "Fail2ban activo: jails sshd y sgdm-login (bloqueo de 1 hora por firewalld)."
    fail2ban-client status
}

antivirus() {
    dnf install -y epel-release
    dnf install -y clamav clamav-update
    sed -i '/^Example/d' /etc/freshclam.conf

    # Permite que clamscan lea todo el sistema con SELinux en Enforcing
    command -v setsebool >/dev/null && setsebool -P antivirus_can_scan_system 1

    install -d -m 700 "$DIR_CUARENTENA"

    if freshclam --quiet; then
        log "Firmas de ClamAV actualizadas."
    else
        log "AVISO: freshclam falló (¿sin salida a internet?). Reintentar con: sudo freshclam"
    fi

    local script_path
    script_path=$(readlink -f "$0")
    cat > "$CRON_FILE" <<EOF
# Antivirus SGDM - generado por $script_path
30 2 * * *  root  /usr/bin/freshclam --quiet >> $LOG_ANTIVIRUS 2>&1
0 4 * * *   root  $script_path escanear >/dev/null 2>&1
EOF
    chmod 644 "$CRON_FILE"
    log "ClamAV instalado. Cron: firmas 02:30, escaneo 04:00 (sin demonio clamd, para ahorrar RAM)."
}

escanear() {
    local dirs=() resultado
    for d in "${DIRS_ESCANEO[@]}"; do
        [[ -d "$d" ]] && dirs+=("$d")
    done

    echo "==== Escaneo $(date '+%Y-%m-%d %H:%M:%S') ====" >> "$LOG_ANTIVIRUS"
    # Prioridad baja de CPU y disco para no afectar a la aplicación
    resultado=0
    nice -n 19 ionice -c3 clamscan -r -i --move="$DIR_CUARENTENA" \
        --log="$LOG_ANTIVIRUS" "${dirs[@]}" || resultado=$?

    case $resultado in
        0) log "Antivirus: escaneo sin amenazas." ;;
        1) log "ALERTA: el antivirus encontró archivos infectados, movidos a $DIR_CUARENTENA (ver $LOG_ANTIVIRUS)."
           logger -t sgdm_seguridad "ALERTA: archivos infectados movidos a $DIR_CUARENTENA" ;;
        *) log "ERROR: el escaneo del antivirus terminó con error (ver $LOG_ANTIVIRUS)." ;;
    esac
    return "$resultado"
}

# Hay al menos un miembro de sgdm_admins que puede entrar (para no quedar afuera)
hay_admin_habilitado() {
    local miembros u
    miembros=$(getent group "$GRUPO_ADMIN" | cut -d: -f4 | tr ',' ' ')
    for u in $miembros; do
        if passwd -S "$u" 2>/dev/null | awk '{exit $2 != "PS"}' \
           && [[ "$(getent passwd "$u" | cut -d: -f7)" != */nologin ]]; then
            return 0
        fi
    done
    return 1
}

ssh_endurecer() {
    if ! hay_admin_habilitado; then
        log "AVISO: no hay ningún usuario habilitado en '$GRUPO_ADMIN'; no se cambia SSH (se quedaría sin acceso). Crear los usuarios con gestion_usuarios.sh."
        return 0
    fi

    [[ -f "${SSHD_CONF}.orig" ]] || cp -p "$SSHD_CONF" "${SSHD_CONF}.orig"
    cp -p "$SSHD_CONF" "${SSHD_CONF}.antes"

    cat > /etc/issue.net <<'EOF'
Acceso restringido al personal autorizado de Lidenskap (SGDM).
Toda la actividad queda registrada.
EOF

    # sshd usa el primer valor que encuentra: el bloque va al principio del archivo
    # (si ya existía un bloque de una ejecución anterior, se reemplaza)
    {
        echo "# >>> SGDM (generado por seguridad_sgdm.sh)"
        echo "PermitRootLogin no"
        echo "MaxAuthTries 3"
        echo "LoginGraceTime 30"
        echo "AllowGroups $GRUPO_ADMIN"
        echo "X11Forwarding no"
        echo "ClientAliveInterval 300"
        echo "ClientAliveCountMax 2"
        echo "Banner /etc/issue.net"
        echo "# <<< SGDM"
        sed '/^# >>> SGDM/,/^# <<< SGDM/d' "${SSHD_CONF}.antes"
    } > "${SSHD_CONF}.nuevo"
    cat "${SSHD_CONF}.nuevo" > "$SSHD_CONF"
    rm -f "${SSHD_CONF}.nuevo"

    if ! sshd -t; then
        cat "${SSHD_CONF}.antes" > "$SSHD_CONF"
        log "ERROR: la configuración de SSH no es válida; se restauró la anterior."
        exit 1
    fi
    systemctl reload sshd
    log "SSH endurecido: sin root, 3 intentos, solo el grupo $GRUPO_ADMIN."
    echo "Probar el acceso en OTRA terminal antes de cerrar esta sesión."
}

actualizaciones() {
    dnf install -y dnf-automatic
    sed -i -E 's/^upgrade_type\s*=.*/upgrade_type = security/; s/^apply_updates\s*=.*/apply_updates = yes/' \
        /etc/dnf/automatic.conf
    systemctl enable --now dnf-automatic.timer
    log "Actualizaciones de seguridad automáticas activadas (dnf-automatic, diario)."
}

kernel() {
    cat > "$SYSCTL_FILE" <<'EOF'
# Generado por seguridad_sgdm.sh
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.log_martians = 1
EOF
    sysctl --system >/dev/null
    log "Ajustes de red del kernel aplicados ($SYSCTL_FILE)."
}

estado() {
    echo "---- Firewall ----"
    firewall-cmd --list-all 2>/dev/null || echo "firewalld inactivo"
    echo ""
    echo "---- Fail2ban ----"
    if systemctl is-active --quiet fail2ban; then
        for jail in sshd sgdm-login; do
            fail2ban-client status "$jail" 2>/dev/null | grep -E "Currently banned|Banned IP" | sed "s/^/$jail: /" || true
        done
    else
        echo "fail2ban inactivo"
    fi
    echo ""
    echo "---- Antivirus ----"
    echo "Último escaneo: $(grep '^==== Escaneo' "$LOG_ANTIVIRUS" 2>/dev/null | tail -n 1 || true)"
    grep -E "^Infected files" "$LOG_ANTIVIRUS" 2>/dev/null | tail -n 1 || echo "(todavía no hay escaneos)"
    echo "Archivos en cuarentena: $(ls "$DIR_CUARENTENA" 2>/dev/null | wc -l)"
    echo ""
    echo "---- SSH ----"
    sshd -T 2>/dev/null | grep -Ei "^(permitrootlogin|maxauthtries|allowgroups) " || true
    echo ""
    echo "---- Actualizaciones automáticas ----"
    systemctl is-active dnf-automatic.timer 2>/dev/null || true
    echo ""
    echo "---- Kernel ----"
    sysctl net.ipv4.tcp_syncookies net.ipv4.conf.all.rp_filter net.ipv4.conf.all.accept_redirects
}

uso() {
    cat <<EOF
Uso: sudo $0 <accion>

Acciones:
  firewall          firewalld solo con ssh, http y https; registra lo rechazado
  fail2ban          Bloquea IPs con muchos intentos fallidos (SSH y login del SGDM)
  antivirus         Instala ClamAV, actualiza firmas y programa el escaneo diario
  escanear          Escanea ahora (${DIRS_ESCANEO[*]}); lo infectado va a cuarentena
  ssh               Endurece SSH (sin root, 3 intentos, solo el grupo $GRUPO_ADMIN)
  actualizaciones   Instala las actualizaciones de seguridad automáticamente
  kernel            Ajustes de red del kernel (sysctl)
  estado            Resumen de todo lo anterior
  todo              kernel, firewall, actualizaciones, fail2ban, antivirus y ssh
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        firewall|fail2ban|antivirus|escanear|actualizaciones|kernel|estado)
            require_root; "$accion" ;;
        ssh)  require_root; ssh_endurecer ;;
        todo) require_root; kernel; firewall; actualizaciones; fail2ban; antivirus; ssh_endurecer ;;
        *)    uso; exit 1 ;;
    esac
}

main "$@"
