# Administración de Sistemas Operativos: Segunda entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [x] Política de respaldos
  - [x] Tipos de respaldo a utilizar
  - [x] Cronograma de respaldo definido
- [x] Script de respaldos y automatización (cron) implementado en el servidor
  (`respaldo_sgdm.sh`)
  - [ ] Definir destino de la copia offsite (sin servidor propio ni
    presupuesto para uno; hoy `OFFSITE_HABILITADO="false"`, solo queda
    copia local con rotación)
- [x] Sistema de monitoreo implementado en el servidor (Zabbix, Grafana, etc.) Documentar Instalación
  (`monitoreo_sgdm.sh`, documentación en `MONITOREO.md`)
  - [x] Collector de MariaDB (`netdata_monitor`@`localhost`, solo metadatos)
  - [x] Collector de Apache (mod_status, restringido a localhost), ver MONITOREO.md
- [x] Gestión de servicios (systemd) en `gestionar_servicio.sh` (start, stop,
      restart, status, enable, disable de forma interactiva).

## Correcciones pendientes de la primera entrega

- El script debe ir dentro de la carpeta de la materia (ya incorporado:
  `../Primera Entrega/gestion_usuarios.sh`).
- Cuidado con el uso de mayúsculas en la tabla.
