#!/bin/bash
# gestion_usuarios_sgdm.sh
#   Implementa el principio de privilegio mínimo
#     - Cada integrante del equipo tiene su propia cuenta.
#     - La aplicación corre bajo un usuario de servicio sin acceso interactivo.
#     - El acceso sudo se otorga por grupo, no por usuario individual, para poder revocarlo o auditarlo de forma centralizada.
set -euo pipefail

LOG="/var/log/sgdm_gestion_usuarios.log"
GRUPO_ADMIN="sgdm_admins"
GRUPO_DEV="sgdm_devs"
DIR_APP="/var/www/html"

# Utilidades

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG" >/dev/null
}

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este comando debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

# Verifica que quien ejecuta el script pertenezca al grupo de administración
requiere_rol_admin() {
    local usuario_actual
    usuario_actual=$(id -un)

    if test "$EUID" -eq 0; then
        return
    fi

    if ! id -nG "$usuario_actual" | grep -qw "$GRUPO_ADMIN"; then
        echo "Error: el usuario '$usuario_actual' no pertenece al grupo '$GRUPO_ADMIN' y no es root. Acceso denegado." >&2
        exit 1
    fi

    log "Rol verificado: '$usuario_actual' pertenece a '$GRUPO_ADMIN'."
}

generar_password_temporal() {
    openssl rand -base64 12
}

# Grupos base del proyecto

crear_grupos_base() {
    for g in "$GRUPO_ADMIN" "$GRUPO_DEV"; do
        if ! getent group "$g" > /dev/null; then
            groupadd "$g"
            log "Grupo '$g' creado."
        fi
    done
}

configurar_sudo_admins() {
    local archivo_sudoers="/etc/sudoers.d/${GRUPO_ADMIN}"
    echo "%${GRUPO_ADMIN} ALL=(ALL) ALL" > "$archivo_sudoers"
    chmod 440 "$archivo_sudoers"
    if ! visudo -cf "$archivo_sudoers" > /dev/null; then
        echo "Error de sintaxis al generar $archivo_sudoers" >&2
        rm -f "$archivo_sudoers"
        exit 1
    fi
    log "Privilegios sudo otorgados al grupo '$GRUPO_ADMIN' vía $archivo_sudoers."
}

# Alta de cuentas de administración 

crear_usuario_admin() {
    local usuario=$1
    local nombre_completo=$2

    if id "$usuario" &>/dev/null; then
        log "El usuario '$usuario' ya existe, se omite creación."
        return
    fi

    useradd -m -c "$nombre_completo" -G "$GRUPO_ADMIN,$GRUPO_DEV" -s /bin/bash "$usuario"

    local temp_pass
    temp_pass=$(generar_password_temporal)
    echo "${usuario}:${temp_pass}" | chpasswd
    chage -d 0 "$usuario"

    install -d -m 700 -o "$usuario" -g "$usuario" "/home/${usuario}/.ssh"

    log "Usuario administrador '$usuario' ($nombre_completo) creado. Grupos: $GRUPO_ADMIN,$GRUPO_DEV."
    echo ">> Contraseña temporal para $usuario: ${temp_pass}  (se debe cambiar al primer ingreso)"
}

# Alta de cuentas de servicio

crear_usuario_servicio() {
    local usuario=$1
    local home_dir=$2

    if id "$usuario" &>/dev/null; then
        log "El usuario de servicio '$usuario' ya existe, se omite creación."
        return
    fi

    useradd --system --no-create-home --home-dir "$home_dir" \
            --shell /sbin/nologin --gid "$GRUPO_DEV" "$usuario"

    log "Usuario de servicio '$usuario' creado (home=$home_dir, sin shell interactiva)."
}

asignar_permisos_directorio_app() {
    local dir=$1
    mkdir -p "$dir"
    chown -R svc_sgdm:"$GRUPO_DEV" "$dir"
    chmod -R 750 "$dir"
    log "Permisos de '$dir' asignados a svc_sgdm:${GRUPO_DEV} (750)."
}

# Baja / bloqueo / desbloqueo

bloquear_usuario() {
    local usuario=$1
    usermod -L "$usuario"
    usermod -s /sbin/nologin "$usuario"
    log "Usuario '$usuario' bloqueado (login deshabilitado)."
}

desbloquear_usuario() {
    local usuario=$1
    local shell=${2:-/bin/bash}
    usermod -U "$usuario"
    usermod -s "$shell" "$usuario"
    log "Usuario '$usuario' desbloqueado (shell=$shell)."
}

eliminar_usuario() {
    local usuario=$1
    if id "$usuario" &>/dev/null; then
        userdel -r "$usuario" 2>/dev/null || userdel "$usuario"
        log "Usuario '$usuario' eliminado del sistema."
    else
        log "No se eliminó: el usuario '$usuario' no existe."
    fi
}

# Reporte / auditoría

listar_usuarios() {
    echo "---- Usuarios humanos (UID 1000-65533) ----"
    while IFS=: read -r nombre _ uid _ _ _ shell; do
        if test "$uid" -ge 1000 && test "$uid" -lt 65534; then
            echo "$nombre (UID=$uid, shell=$shell)"
        fi
    done < /etc/passwd
    echo
    echo "---- Miembros de ${GRUPO_ADMIN} (sudo) ----"
    getent group "$GRUPO_ADMIN" | cut -d: -f4
    echo
    echo "---- Miembros de ${GRUPO_DEV} ----"
    getent group "$GRUPO_DEV" | cut -d: -f4
    echo
    echo "---- Usuario de servicio de la aplicación ----"
    getent passwd svc_sgdm 2>/dev/null || echo "(no configurado aún)"
}

# Provisión inicial: alta de TODOS los usuarios definidos para el proyecto

provisionar_usuarios_proyecto() {
    require_root
    crear_grupos_base

    crear_usuario_admin "sprieto"    "Sofia Prieto"
    crear_usuario_admin "frodriguez" "Federico Rodriguez"
    crear_usuario_admin "gvisos"     "Gaston Visos"
    crear_usuario_admin "jvillena"   "Joaquin Villena"

    crear_usuario_servicio "svc_sgdm" "$DIR_APP"
    asignar_permisos_directorio_app "$DIR_APP"

    configurar_sudo_admins

    log "Provisión inicial de usuarios del proyecto SGDM completada."
    echo
    listar_usuarios
}

# CLI

uso() {
    cat <<EOF
Uso: sudo $0 <accion> [argumentos]

Acciones:
  provisionar                            Crea todos los usuarios definidos para el proyecto (4 admins + svc_sgdm)
  crear-admin <usuario> "<Nombre>"       Crea un administrador nuevo (sudo + grupo devs)
  crear-servicio <usuario> <home_dir>    Crea un usuario de servicio sin login interactivo
  bloquear <usuario>                     Bloquea el acceso de un usuario
  desbloquear <usuario> [shell]          Reactiva el acceso de un usuario
  eliminar <usuario>                     Elimina un usuario y su directorio home
  listar                                 Lista usuarios y grupos del proyecto (no requiere root)
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        provisionar)     require_root; requiere_rol_admin; provisionar_usuarios_proyecto ;;
        crear-admin)     require_root; requiere_rol_admin; crear_grupos_base; crear_usuario_admin "${2:?falta usuario}" "${3:?falta nombre completo}" ;;
        crear-servicio)  require_root; requiere_rol_admin; crear_grupos_base; crear_usuario_servicio "${2:?falta usuario}" "${3:?falta home_dir}" ;;
        bloquear)        require_root; requiere_rol_admin; bloquear_usuario "${2:?falta usuario}" ;;
        desbloquear)     require_root; requiere_rol_admin; desbloquear_usuario "${2:?falta usuario}" "${3:-}" ;;
        eliminar)        require_root; requiere_rol_admin; eliminar_usuario "${2:?falta usuario}" ;;
        listar)          listar_usuarios ;;
        *)               uso; exit 1 ;;
    esac
}

main "$@"
