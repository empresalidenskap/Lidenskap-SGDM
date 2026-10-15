# Administración de Sistemas Operativos: Tercera entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [ ] Políticas de seguridad
- [ ] Implementación de firewall, iptables, antivirus, entre otros dentro del servidor
- [ ] Script de consultas y monitoreo de base de datos dentro del servidor
- [x] Script general de gestión del servidor (`gestion_servidor_sgdm.sh`)
  - Menú único que reúne todos los scripts instalados en `/usr/local/sbin`:
    servicios (`gestionar_servicio.sh`), usuarios del sistema
    (`gestion_usuarios.sh`), respaldos (`respaldo_sgdm.sh`), monitoreo con
    Netdata (`monitoreo_sgdm.sh`) y consultas de la base de datos
    (`consultas_monitoreo_bd_sgdm.sh`, cuando esté instalado).
  - También muestra el estado del servidor (memoria, disco, servicios del
    SGDM y último respaldo), las reglas de firewalld y los logs.
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
