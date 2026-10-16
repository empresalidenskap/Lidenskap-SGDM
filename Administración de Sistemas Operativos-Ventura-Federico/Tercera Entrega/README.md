# Administración de Sistemas Operativos: Tercera entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [ ] Políticas de seguridad
- [x] Implementación de firewall, iptables, antivirus, entre otros dentro del servidor
  (`seguridad_sgdm.sh`, documentado en [SEGURIDAD.md](./SEGURIDAD.md))
  - Firewall: firewalld (nftables) solo con ssh, http y https; lo rechazado queda registrado.
  - Fail2ban: bloquea por 1 hora las IPs con muchos intentos fallidos en SSH y
    en el login del SGDM.
  - Antivirus: ClamAV con escaneo diario a las 04:00 y cuarentena (sin demonio
    `clamd`, para ahorrar RAM).
  - SSH sin root y solo para `sgdm_admins`, actualizaciones de seguridad
    automáticas (`dnf-automatic`) y ajustes de red del kernel (sysctl).
  - Uso: `sudo seguridad_sgdm.sh todo` o el gestor del servidor (opción 7).
  - [x] Aplicado en el servidor real (firewall, fail2ban, SSH, actualizaciones y kernel verificados).
  - [ ] Falta probar el antivirus con el archivo EICAR (ver SEGURIDAD.md).
- [x] Script de consultas y monitoreo de base de datos dentro del servidor
- [x] Script general de gestión del servidor (`gestion_servidor_sgdm.sh`)
  - Menú único que reúne todos los scripts instalados en `/usr/local/sbin`:
    servicios (`gestionar_servicio.sh`), usuarios del sistema
    (`gestion_usuarios.sh`), respaldos (`respaldo_sgdm.sh`), monitoreo con
    Netdata (`monitoreo_sgdm.sh`), consultas de la base de datos
    (`consultas_monitoreo_bd_sgdm.sh`) y seguridad (`seguridad_sgdm.sh`).
  - También muestra el estado del servidor (memoria, disco, servicios del
    SGDM y último respaldo), el firewall, las IPs bloqueadas y los logs.
  - Pide confirmación antes de bloquear o eliminar un usuario y registra cada
    acción en `/var/log/sgdm_gestion_servidor.log`.
  - Al iniciar sesión, `sgdm_gestor.sh` (instalado en `/etc/profile.d/`)
    pregunta a root y a los miembros de `sgdm_admins` si quieren abrir el
    gestor `[s/n]`.
  - Uso manual: `sudo /usr/local/sbin/gestion_servidor_sgdm.sh`
- [ ] Implementación con Docker de la aplicación web

## Corrección de la segunda entrega de Administración de Sistemas Operativos

Pendientes arrastrados de la segunda entrega:

- [ ] Activar la copia offsite en el servidor real: `rclone config` (remote `gdrive`) y `OFFSITE_HABILITADO="true"` en `respaldo_sgdm.sh`
- [ ] Correcciones indicadas por el docente sobre la segunda entrega (completar al recibir la devolución)
