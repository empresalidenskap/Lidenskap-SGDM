# Programación Fullstack — Segunda entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [x] Modelo relacional normalizado — `../db/01-schema.sql` (14 tablas, basado
      en `MER_SGDM_Proyecto.graphml`)
- [x] DCL implementado — `../db/02-users.sh` (GRANT/REVOKE)
- [x] Configuración de usuarios de BD con las restricciones pertinentes —
      usuario `sgdm_app` sin privilegios DDL, solo SELECT/INSERT/UPDATE/DELETE
- [ ] Implementación de los modelos alineados al modelo relacional
- [ ] Integración con PHP utilizando POO (mínimo gestión de usuarios funcionando)
- [x] Implementación con Apache — `../Dockerfile` + `../docker-compose.yml`

## Correcciones de la primera entrega

- [x] **Separar el CSS y el JS en un directorio aparte** — resuelto: el código
      se reorganizó en `../app/`, con `assets/css/`, `assets/js/`, `assets/img/`
      y `assets/icons/`.
- [ ] No abusar del `div`: usar más estructuras semánticas (`header`, `nav`,
      `main`, `section`, `article`, `aside`, `footer`).
- [ ] Falta la carpeta con el esquema de pantallas.
