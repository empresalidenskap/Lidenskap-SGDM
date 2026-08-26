#!/bin/bash
#############################################################
# Script: gestionar_servicio.sh
# Descripción: Permite gestionar servicios del sistema
#              (systemd) de forma interactiva.
#############################################################

# --- Colores para mensajes ---
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
SIN_COLOR='\033[0m'

# --- Verificar que se ejecuta con permisos adecuados ---
if [[ $EUID -ne 0 ]]; then
    echo -e "${AMARILLO}Advertencia:${SIN_COLOR} algunas acciones (start, stop, restart, enable, disable)"
    echo "requieren privilegios de administrador. Ejecuta el script con 'sudo' si es necesario."
    echo ""
fi

# --- Solicitar el nombre del servicio ---
if ! read -p "Ingrese el nombre del servicio (ej: ssh, apache2, nginx): " servicio; then
    echo ""
    echo -e "${ROJO}Entrada finalizada (EOF). Saliendo del script.${SIN_COLOR}"
    exit 1
fi

if [[ -z "$servicio" ]]; then
    echo -e "${ROJO}Error:${SIN_COLOR} no ingresó ningún nombre de servicio."
    exit 1
fi

# Si el usuario no agrega la extensión .service, se la agregamos
if [[ "$servicio" != *.service ]]; then
    unidad="${servicio}.service"
else
    unidad="$servicio"
    servicio="${servicio%.service}"
fi

# --- Verificar existencia del servicio ---
existe=$(systemctl list-unit-files --type=service | awk '{print $1}' | grep -w "$unidad")

if [[ -z "$existe" ]]; then
    echo -e "${ROJO}Error:${SIN_COLOR} el servicio '$servicio' no existe en el sistema."
    exit 1
fi

echo -e "${VERDE}El servicio '$servicio' existe.${SIN_COLOR}"
echo ""

# --- Menú de acciones ---
echo "Seleccione la acción a realizar:"
echo "1) Iniciar (start)"
echo "2) Detener (stop)"
echo "3) Reiniciar (restart)"
echo "4) Ver estado (status)"
echo "5) Habilitar en el arranque (enable)"
echo "6) Deshabilitar en el arranque (disable)"
echo "7) Salir"

if ! read -p "Opción [1-7]: " opcion; then
    echo ""
    echo -e "${ROJO}Entrada finalizada (EOF). Saliendo del script.${SIN_COLOR}"
    exit 1
fi

case $opcion in
    1) accion="start" ;;
    2) accion="stop" ;;
    3) accion="restart" ;;
    4) accion="status" ;;
    5) accion="enable" ;;
    6) accion="disable" ;;
    7)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo -e "${ROJO}Opción inválida.${SIN_COLOR}"
        exit 1
        ;;
esac

# --- Ejecutar la acción ---
echo ""
echo "Ejecutando: systemctl $accion $unidad"
echo "-----------------------------------------"

if [[ "$accion" == "status" ]]; then
    systemctl status "$unidad" --no-pager
else
    systemctl "$accion" "$unidad"
    resultado=$?
    if [[ $resultado -eq 0 ]]; then
        echo -e "${VERDE}Acción '$accion' realizada correctamente sobre '$servicio'.${SIN_COLOR}"
    else
        echo -e "${ROJO}Ocurrió un error al ejecutar '$accion' sobre '$servicio'.${SIN_COLOR}"
    fi
fi
