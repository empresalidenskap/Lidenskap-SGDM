#!/bin/bash

LOG="/var/log/sgdm_gestion_servidor.log"
DIR_SBIN="/usr/local/sbin"
DIR_BACKUP="/var/backups/sgdm"

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
    log "Fin de la sesión."
    exit 0
}

pausa() {
    echo ""
    read -p "Presione Enter para continuar..." _ || salir
}

confirmar() {
    read -p "$1 [s/N]: " resp || salir
    [[ "$resp" == "s" || "$resp" == "S" ]]
}

ejecutar() {
    local script="$DIR_SBIN/$1"
    if [[ ! -x "$script" ]]; then
        echo -e "${ROJO}No se encontró $script.${SIN_COLOR}"
        return
    fi
    log "Ejecuta: $*"
    shift
    if "$script" "$@"; then
        echo -e "${VERDE}Terminó correctamente.${SIN_COLOR}"
    else
        echo -e "${ROJO}Terminó con error.${SIN_COLOR}"
        log "Error en la ejecución anterior."
    fi
}

estado_servidor() {
    echo "Servidor: $(hostname)  -  IP: $(hostname -I)"
    echo "Encendido: $(uptime -p)"
    echo ""
    echo "---- Memoria ----"
    free -h
    echo ""
    echo "---- Disco ----"
    df -h /
    echo ""
    echo "---- Servicios ----"
    for servicio in httpd mariadb php-fpm firewalld fail2ban crond netdata docker; do
        if systemctl is-active --quiet "$servicio"; then
            echo -e "$servicio: ${VERDE}activo${SIN_COLOR}"
        else
            echo -e "$servicio: ${ROJO}inactivo${SIN_COLOR}"
        fi
    done
    echo ""
    echo "---- Último respaldo ----"
    echo "BD:  $(ls -t $DIR_BACKUP/bd 2>/dev/null | grep '\.enc$' | head -n 1)"
    echo "App: $(ls -t $DIR_BACKUP/app 2>/dev/null | grep '\.enc$' | head -n 1)"
    log "Consulta: estado del servidor."
}

menu_usuarios() {
    echo "1) Listar usuarios"
    echo "2) Crear administrador"
    echo "3) Bloquear usuario"
    echo "4) Desbloquear usuario"
    echo "5) Eliminar usuario"
    echo "0) Volver"
    read -p "Opción: " op || salir
    case $op in
        1) ejecutar gestion_usuarios.sh listar ;;
        2)
            read -p "Usuario: " usuario || salir
            read -p "Nombre completo: " nombre || salir
            ejecutar gestion_usuarios.sh crear-admin "$usuario" "$nombre"
            ;;
        3)
            read -p "Usuario: " usuario || salir
            if confirmar "¿Bloquear a '$usuario'?"; then
                ejecutar gestion_usuarios.sh bloquear "$usuario"
            fi
            ;;
        4)
            read -p "Usuario: " usuario || salir
            ejecutar gestion_usuarios.sh desbloquear "$usuario"
            ;;
        5)
            read -p "Usuario: " usuario || salir
            if confirmar "¿Eliminar a '$usuario' y su carpeta personal?"; then
                ejecutar gestion_usuarios.sh eliminar "$usuario"
            fi
            ;;
    esac
}

menu_respaldos() {
    echo "1) Respaldar base de datos"
    echo "2) Respaldar aplicación y configuración"
    echo "3) Respaldar todo"
    echo "4) Ver respaldos existentes"
    echo "5) Verificar un respaldo (hash y firma digital)"
    echo "6) Descifrar un respaldo (queda en /root)"
    echo "7) Dónde están las claves de los respaldos"
    echo "0) Volver"
    read -p "Opción: " op || salir
    case $op in
        1) ejecutar respaldo_sgdm.sh bd ;;
        2) ejecutar respaldo_sgdm.sh app ;;
        3) ejecutar respaldo_sgdm.sh todo ;;
        4) ls -lh $DIR_BACKUP/bd $DIR_BACKUP/app ;;
        5)
            read -p "Archivo .enc (ruta completa): " archivo || salir
            ejecutar respaldo_sgdm.sh verificar "$archivo"
            ;;
        6)
            read -p "Archivo .enc (ruta completa): " archivo || salir
            ejecutar respaldo_sgdm.sh descifrar "$archivo" "/root/$(basename "${archivo%.enc}")"
            ;;
        7) ejecutar respaldo_sgdm.sh claves ;;
    esac
}

menu_seguridad() {
    echo "1) Estado de la seguridad"
    echo "2) Reglas del firewall"
    echo "3) IPs bloqueadas (fail2ban)"
    echo "4) Desbloquear una IP"
    echo "5) Escanear con el antivirus ahora"
    echo "6) HTTPS: estado del certificado"
    echo "7) HTTPS: cómo importar la CA en una PC"
    echo "0) Volver"
    read -p "Opción: " op || salir
    case $op in
        1) ejecutar seguridad_sgdm.sh estado ;;
        2) firewall-cmd --list-all ;;
        3) fail2ban-client banned ;;
        4)
            read -p "IP: " ip || salir
            if confirmar "¿Desbloquear la IP '$ip'?"; then
                log "Desbloquea la IP: $ip"
                fail2ban-client unban "$ip"
            fi
            ;;
        5) ejecutar seguridad_sgdm.sh escanear ;;
        6) ejecutar ssl_sgdm.sh estado ;;
        7) ejecutar ssl_sgdm.sh ca ;;
    esac
}

menu_docker() {
    echo "1) Estado de los contenedores"
    echo "2) Levantar (construir y arrancar)"
    echo "3) Detener"
    echo "4) Ver logs de los contenedores"
    echo "5) Respaldar la base del contenedor"
    echo "0) Volver"
    read -p "Opción: " op || salir
    case $op in
        1) ejecutar docker_sgdm.sh estado ;;
        2) ejecutar docker_sgdm.sh levantar ;;
        3)
            if confirmar "¿Detener el SGDM en Docker (puerto 8080)?"; then
                ejecutar docker_sgdm.sh bajar
            fi
            ;;
        4) ejecutar docker_sgdm.sh logs ;;
        5) ejecutar docker_sgdm.sh respaldo ;;
    esac
}

ver_logs() {
    for archivo in /var/log/sgdm_respaldos.log /var/log/sgdm_monitoreo.log \
                   /var/log/sgdm_gestion_usuarios.log /var/log/sgdm_seguridad.log \
                   /var/log/sgdm_antivirus.log /var/log/sgdm_docker.log \
                   /var/log/httpd/sgdm-error.log "$LOG"; do
        echo "---- $archivo ----"
        tail -n 20 "$archivo" 2>/dev/null || echo "(no existe todavía)"
        echo ""
    done
}

require_root
log "Inicio de la sesión."

while true; do
    clear
    echo "========================================"
    echo "   SGDM - Gestión del servidor"
    echo "========================================"
    echo "1) Estado del servidor"
    echo "2) Servicios"
    echo "3) Usuarios del sistema"
    echo "4) Respaldos"
    echo "5) Monitoreo (Netdata)"
    echo "6) Consultas de la base de datos"
    echo "7) Seguridad (firewall, fail2ban, antivirus)"
    echo "8) Ver logs"
    echo "9) Docker (app en contenedores)"
    echo "0) Salir"
    read -p "Opción: " opcion || salir
    echo ""
    case $opcion in
        1) estado_servidor ;;
        2) ejecutar gestionar_servicio.sh ;;
        3) menu_usuarios ;;
        4) menu_respaldos ;;
        5) ejecutar monitoreo_sgdm.sh estado ;;
        6)
            if [[ -x "$DIR_SBIN/consultas_monitoreo_bd_sgdm.sh" ]]; then
                ejecutar consultas_monitoreo_bd_sgdm.sh
            else
                echo -e "${AMARILLO}El script de consultas de la base de datos todavía no está instalado.${SIN_COLOR}"
            fi
            ;;
        7) menu_seguridad ;;
        8) ver_logs ;;
        9) menu_docker ;;
        0) salir ;;
        *) echo -e "${ROJO}Opción inválida.${SIN_COLOR}" ;;
    esac
    pausa
done
