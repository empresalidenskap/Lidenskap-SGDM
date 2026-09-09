# Programación Fullstack: Segunda entrega

Docente: Federico Ventura

El profesor indicó qué corresponde a cada parte de la entrega: lo que va en
la carpeta del proyecto (este repositorio) y lo que se evalúa en el
servidor con el sistema funcionando.

## Carpeta del proyecto

- [x] Primera entrega corregida y esquema de pantallas (ver
      "Correcciones pendientes de la primera entrega" más abajo)
- [x] Modelo Entidad-Relación (MER): [`MER_SGDM_Proyecto.xml`](./MER_SGDM_Proyecto.xml)
      (diagrama, con COMPETIDOR como supertipo de PARTICIPANTE/EQUIPO) 
      Agregacion con torneo e inscripcion que se relaciona con acumula, tabla posiciones
- [x] Modelo relacional normalizado hasta 3FN, con justificaciones de
      normalización: el modelo está en
      [`01-schema.sql`](./01-schema.sql) (16 tablas, ahora con el rol
      `ARBITRO`) y las justificaciones en
      [`Normalizacion_SGDM_3FN.pdf`](./Normalizacion_SGDM_3FN.pdf), ya
      corregidas según la agregación TORNEO-Recibe-INSCRIPCION del MER
      corregido
- [x] Scripts DDL y DCL: DDL en [`01-schema.sql`](./01-schema.sql), DCL en
      [`02-users.sh`](./02-users.sh) (GRANT/REVOKE, tres niveles de usuario:
      `sgdm_admin`, `sgdm_app`, `sgdm_consulta`). Son copia de los que usa
      la aplicación en [`SGDM App/db/`](../../SGDM%20App/db/), que es de
      donde Docker los toma para inicializar la base

## Servidor / entorno

- [x] Implementación funcional completa según las pautas de la segunda
      entrega: login y registro con sesión de servidor, torneos
      (crear/listar/ver detalle/eliminar) y el módulo de usuarios y roles
      del panel (ahora con el rol Árbitro, ver
      [`RoleLabels.php`](../../SGDM%20App/app/src/RoleLabels.php)), todo
      con POO en PHP
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
- [x] No abusar del `div`: usar más estructuras semánticas (`header`, `nav`,
      `main`, `section`, `article`, `aside`, `footer`). La mayoría de las
      páginas de [`SGDM App/app/`](../../SGDM%20App/app/) ya usaba bastante
      semántica; se hicieron dos pasadas sobre lo que seguía siendo `<div>`:
      - Primera pasada: se promovieron a `<section>` regiones de página
        completas (Disciplinas, Formatos, CTA y resumen del dashboard en
        `index.html` y `panel.html`, el formulario en
        `crear-competencia.html`, el cuerpo de texto en `privacidad.html` /
        `terminos.html`). De paso se corrigió un `<div class="hero-inner">`
        de `index.html` que nunca se cerraba.
      - Segunda pasada: se promovieron a `<header>` los encabezados internos
        de cada módulo del panel (`panel.html`, 8 secciones — Usuarios,
        Torneos, Participantes, Resultados, Rondas, Reportes, Auditoría,
        Configuración) y de la tarjeta de reglamento en
        `detalle-torneo.html`; y a `<section>` los widgets de edición de
        perfil (`perfil.html`) y de acceso restringido
        (`crear-competencia.html`).
      - Tercera pasada: se corrigieron dos usos inconsistentes de `<div>`
        donde el resto del sitio ya usaba una etiqueta más correcta —
        `.section-eyebrow` era `<p>` en 23 lugares y `<div>` solo en 2 (los
        dos en `index.html`), y `.format-name` en las tarjetas de formato de
        `index.html` pasó a `<h3>` para igualar el patrón que ya usaban las
        tarjetas de disciplina. También se llevó `.footer-copy` (texto de
        copyright, `<div>` en las 10 páginas) a `<p>`, la etiqueta correcta
        para una línea de texto. No son de la lista del profesor
        (`header`/`nav`/`main`/`section`/`article`/`aside`/`footer`), pero
        sí son estructuras semánticas reales — no se usó `<span>` (es un
        elemento en línea, no reemplaza al uso de `<div>` en bloques).
      - Cuarta pasada (objetivo: bajar de 200 divs en `SGDM App/app/*.html`):
        se repitió el mismo patrón "eyebrow + título" que ya se había
        convertido a `<header>` en otros lugares, ahora en
        `.calendar-section-heading` (`calendario.html`, 3 veces),
        `.results-heading` (`torneos.html`), `.carrusel-label` y
        `.section-header` (`index.html`) y `.section-header.compact-header`
        (`panel.html`, `disciplinas.html`, `perfil.html`). Se pasaron a
        `<section>` dos pestañas del panel de participantes/equipos
        (`#participantsRoster`/`#teamsRoster`), `.round-status-grid` (para
        igualar a `.report-grid`, que ya era `<section>` y comparte la misma
        regla CSS) y `#profileContent` en `perfil.html`. Se encontraron dos
        usos de `<span>` genuinamente correctos por inconsistencia con un
        patrón ya usado en el propio sitio: `.format-tag` (badge tipo
        píldora, mismo `display: inline-flex; border-radius: 999px` que
        `.status-pill`/`.role-label`, que ya son `<span>`) y `.rules-icon`/
        `.empty-icon` (un solo emoji decorativo, igual que `.file-icon`, que
        ya era `<span>`). Y un caso de `<figure>`/`<figcaption>`: el slide
        del carrusel de `index.html` es exactamente el patrón de imagen con
        leyenda que esas etiquetas existen para resolver.

        `aside` se quedó en 3 — se revisó a propósito buscando contenido
        realmente complementario que siguiera en `<div>`, y no apareció
        ninguno; forzar `<aside>` donde ya correspondía `<section>` (como
        los paneles de filtros) habría sido incorrecto, así que no se tocó.

        Conteo real de etiquetas en `SGDM App/app/*.html`, antes de tocar
        nada hoy → ahora: `header` 8→27, `section` 26→39, `div` 254→200.
- [x] Carpeta con el esquema de pantallas:
      [`esquema-pantallas/`](./esquema-pantallas/) — inventario de pantallas,
      ruta, propósito y acceso por rol, más mapa de navegación, y un manual
      de usuario en PDF ([`SGDM-Manual-Usuario.pdf`](./esquema-pantallas/SGDM-Manual-Usuario.pdf))
      con capturas reales de las 16 pantallas del sistema corriendo en
      Docker (no maquetas), también subido a Google Drive en versión
      resumida.
