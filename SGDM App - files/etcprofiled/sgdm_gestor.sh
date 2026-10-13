# sgdm_gestor.sh  (se instala en /etc/profile.d/)
#   Al iniciar sesión, pregunta a los administradores del SGDM si quieren
#   abrir el gestor del servidor. Solo en sesiones interactivas (no afecta a
#   scp/sftp), solo para root o el grupo sgdm_admins, y no se repite al usar sudo -i.

GESTOR="/usr/local/sbin/gestion_servidor_sgdm.sh"

case $- in
    *i*)
        if [ -z "$SUDO_USER" ] && [ -f "$GESTOR" ] && { [ "$(id -u)" -eq 0 ] || id -nG | grep -qw sgdm_admins; }; then
            printf "¿Desea ejecutar el gestor del servidor SGDM? [s/n]: "
            read -r resp
            if [ "$resp" = "s" ] || [ "$resp" = "S" ]; then
                if [ "$(id -u)" -eq 0 ]; then
                    "$GESTOR"
                else
                    sudo "$GESTOR"
                fi
            fi
            unset resp
        fi
        ;;
esac
unset GESTOR
