# Programación Fullstack — Segunda entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [x] Modelo relacional normalizado — `MER_SGDM_Proyecto.graphml` (diagrama,
      con COMPETIDOR como supertipo de PARTICIPANTE/EQUIPO) y
      `../db/01-schema.sql` (16 tablas)
- [x] DCL implementado — `../db/02-users.sh` (GRANT/REVOKE)
- [x] Configuración de usuarios de BD con las restricciones pertinentes — tres
      niveles: `sgdm_admin` (ALL PRIVILEGES), `sgdm_app` (solo
      SELECT/INSERT/UPDATE/DELETE, sin DDL) y `sgdm_consulta` (SELECT de solo
      lectura, limitado a las tablas de datos públicos)
- [x] Implementación de los modelos alineados al modelo relacional —
      `../app/src/Models/` (una clase por tabla, 16 en total, con una clase
      base `Model` compartida)
- [x] Integración con PHP utilizando POO (mínimo gestión de usuarios
      funcionando) — `../app/api/register.php` y `../app/api/login.php`,
      contraseñas con `password_hash`/`password_verify`, conectados al
      modal de login/registro del front-end (antes era 100% simulado)
- [x] Implementación con Apache — `../Dockerfile` + `../docker-compose.yml`

## Correcciones de la primera entrega

- [x] **Separar el CSS y el JS en un directorio aparte** — resuelto: el código
      se reorganizó en `../app/`, con `assets/css/`, `assets/js/`, `assets/img/`
      y `assets/icons/`.
- [ ] No abusar del `div`: usar más estructuras semánticas (`header`, `nav`,
      `main`, `section`, `article`, `aside`, `footer`).
- [ ] Falta la carpeta con el esquema de pantallas.
