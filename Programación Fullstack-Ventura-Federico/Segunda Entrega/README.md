# Programación Fullstack: Segunda entrega

Docente: Federico Ventura

El profesor indicó qué corresponde a cada parte de la entrega: lo que va en
la carpeta del proyecto (este repositorio) y lo que se evalúa en el
servidor con el sistema funcionando.

## Carpeta del proyecto

- [ ] Primera entrega corregida y esquema de pantallas (ver
      "Correcciones pendientes de la primera entrega" más abajo)
- [x] Modelo Entidad-Relación (MER): [`MER_SGDM_Proyecto.xml`](./MER_SGDM_Proyecto.xml)
      (diagrama, con COMPETIDOR como supertipo de PARTICIPANTE/EQUIPO)
- [x] Modelo relacional normalizado hasta 3FN, con justificaciones de
      normalización: el modelo está en
      [`01-schema.sql`](./01-schema.sql) (16 tablas) y las justificaciones
      en [`Normalizacion_SGDM_3FN.pdf`](./Normalizacion_SGDM_3FN.pdf)
- [x] Scripts DDL y DCL: DDL en [`01-schema.sql`](./01-schema.sql), DCL en
      [`02-users.sh`](./02-users.sh) (GRANT/REVOKE, tres niveles de usuario:
      `sgdm_admin`, `sgdm_app`, `sgdm_consulta`). Son copia de los que usa
      la aplicación en [`SGDM App/db/`](../../SGDM%20App/db/), que es de
      donde Docker los toma para inicializar la base

## Servidor / entorno

- [x] Implementación funcional completa según las pautas de la segunda
      entrega: login y registro con sesión de servidor, torneos
      (crear/listar/ver detalle/eliminar) y el módulo de usuarios y roles
      del panel, todo con POO en PHP
      ([`app/api/`](../../SGDM%20App/app/api),
      [`app/src/Models/`](../../SGDM%20App/app/src/Models)) sobre Apache y
      Docker ([`Dockerfile`](../../SGDM%20App/Dockerfile),
      [`docker-compose.yml`](../../SGDM%20App/docker-compose.yml))
- [x] Actualizaciones y correcciones integradas: separación de CSS y JS en
      `assets/css/`, `assets/js/`, `assets/img/` y `assets/icons/`
- [x] Datos de prueba cargados para la verificación integral del sistema:
      [`db/03-seed-demo.sql`](../../SGDM%20App/db/03-seed-demo.sql), cuentas
      de demostración ya cargadas al levantar el proyecto

El código de la aplicación vive en [`SGDM App/`](../../SGDM%20App/),
aparte de esta carpeta de la materia. Es el mismo sistema para todas las
entregas, no algo exclusivo de esta unidad curricular. Instrucciones para
levantarlo en [`SGDM App/README.md`](../../SGDM%20App/README.md).

## Correcciones pendientes de la primera entrega

- [x] **Separar el CSS y el JS en un directorio aparte**: resuelto, el código
      se reorganizó dentro de `assets/css/`, `assets/js/`, `assets/img/`
      y `assets/icons/`.
- [ ] No abusar del `div`: usar más estructuras semánticas (`header`, `nav`,
      `main`, `section`, `article`, `aside`, `footer`).
- [ ] Falta la carpeta con el esquema de pantallas.
