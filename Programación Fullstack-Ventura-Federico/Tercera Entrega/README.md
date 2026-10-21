# Programación Fullstack: Tercera entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [x] Implementación completa del sistema, de manera portable mediante Docker
  (`docker compose up -d` en [`SGDM App/`](../../SGDM%20App/)): todos los
  módulos trabajan sobre la base real, sin datos de muestra en el código
  - Roles por torneo (Organizador, Árbitro, Participante) con solicitudes,
    invitaciones y revocación automática al finalizar el torneo.
  - Fases del torneo (RF-08), equipos e inscripciones (RF-15).
  - Fixture de liga (RF-16), llaves de eliminación directa (RF-17) y sistema
    suizo sin repetir rivales (RF-10).
  - Resultados por el árbitro asignado con validación del Organizador
    (RF-11), walkover (RF-12), tabla con desempate (RF-09) y cierre y
    reapertura de rondas con auditoría (RF-13).
  - Consulta pública de torneos, fixture, tabla, llaves y calendario (RF-18);
    reportes y auditoría en el panel (RF-19).
- [x] Datos de prueba: [`SGDM App/db/03-seed-demo.sql`](../../SGDM%20App/db/03-seed-demo.sql)
- [ ] Mínimo 50 registros por cada componente: no se hace, por decisión del
  equipo (ver abajo)
- [x] MER y normalización actualizados: [`MER_SGDM_Proyecto.xml`](./MER_SGDM_Proyecto.xml)
  y [`NORMALIZACION.md`](./NORMALIZACION.md) (cambios respecto de la segunda
  entrega)
  - [ ] Pasar estos cambios al documento de normalización entregado (el PDF
    de la segunda entrega sale de un documento de Drive)

Por decisión del equipo **no** se cargan 50 registros por componente: el
seed es un conjunto chico y realista (16 usuarios, 6 torneos, entre 5 y 16
filas por tabla) que alcanza para mostrar cada funcionalidad recién
instalado:
- **Liga en curso** (Copa Demo): 4 equipos, uno creado por el Organizador, con
  fecha 1 cerrada (incluye un walkover), un resultado sin validar y la fecha 3
  programada con árbitros.
- **Eliminación directa finalizada** con cabezas de serie y campeona.
- **Sistema suizo** con la ronda 1 completa (con partido libre).
- **Liga con inscripciones abiertas**, con un equipo por aprobar, un pedido
  para unirse a un equipo, un árbitro postulado y una invitación.
- **Un torneo planificado** y **una solicitud de torneo** para el Admin.
- Cuentas en el modal de inicio de sesión ("Ver cuentas de demostración").

## MER actualizado

[`MER_SGDM_Proyecto.xml`](MER_SGDM_Proyecto.xml) (draw.io) es la copia del MER
de la segunda entrega con los cambios del esquema para esta entrega. Una nota
en el diagrama lista los dominios (ENUM) y los atributos derivados.

- Roles por torneo: relación N:N **Arbitra** (USUARIO–TORNEO, tabla
  `torneo_arbitro`, con `EstadoSolicitud` y `FechaSolicitud`) y relación 1:N
  **Dirige** (USUARIO–ENFRENTAMIENTO, árbitro asignado, opcional).
- TORNEO: `MarcadorWOGanador`/`MarcadorWOPerdedor` (walkover, RF-12); estados
  nuevos `solicitado`, `rechazado`, `inscripcion_abierta`, `inscripcion_cerrada`
  (RF-08). ENFRENTAMIENTO.EstadoPartido suma `walkover`.
- INSCRIPCION: `CabezaSerie` y `NumeroSorteo` (llaves y sorteo, RF-17/RF-08/RF-09).
- TABLA_POSICIONES: `GolesAFavor`, `GolesEnContra` y el derivado
  `DiferenciaGoles` (desempate, RF-09).
- AUDITORIA_REGISTRO: `Detalle` (motivo de la reapertura de una ronda, RF-13).
- Equipos e invitaciones: TORNEO.`MaxIntegrantesEquipo` (límite de integrantes
  por equipo en ese torneo); la relación **Integra** (EQUIPO–PARTICIPANTE) suma
  `Estado` (solicitada, invitada, aceptada, rechazada); EstadoInscripcion y
  Arbitra.EstadoSolicitud suman `invitada` (invitación del Organizador que el
  usuario acepta o rechaza). **Capitanea** pasa a ser opcional: el capitán es
  solo una etiqueta y un equipo creado por el Organizador no tiene.
- Rondas y resultados: la relación **Juega_Visitante** pasa a ser opcional;
  un enfrentamiento sin visitante es un partido libre (bye) que gana el local
  sin jugar (número impar en Sistema Suizo, llaves que no son potencia de 2).
- Correcciones del MER anterior: faltaba la relación **Capitanea**
  (USUARIO–EQUIPO, `equipo.id_usuario`) y el atributo `Descripcion` de TORNEO,
  y el atributo `PuntosEmpate` de TIPO_TORNEO figuraba como `PuntosAcumulados`.

## Fases del desarrollo

La tercera entrega se trabajó en 12 fases (F1 a F12). Cada fase que cambió
el esquema empezó por el MER, que el equipo revisó antes de tocar la base y
el código. Después de cada fase se probó todo con Docker desde una base
nueva, y se actualizó la copia del servidor (`SGDM App - files/`).

| Fase | Fecha y hora | Commit | Qué se hizo |
|---|---|---|---|
| F1 Esquema | 16/10/2026 22:01 | `cd30807` | Tabla `torneo_arbitro`, árbitro por partido (`enfrentamiento.id_arbitro`), estados `solicitado`/`rechazado` y la vista `vista_rol_torneo`. |
| F2 Roles por torneo | 16/10/2026 22:01 | `cd30807` | Globales solo Administrador y Usuario público; Organizador, Árbitro y Participante dependen de cada torneo (`requireTorneoRole()`, `api/sesion.php`). |
| F3 Solicitudes | 16/10/2026 22:01 | `cd30807` | Pedir crear un torneo (aprueba el Admin), participar o arbitrar (aprueba el Organizador); módulo Solicitudes del panel. |
| F4 Auditoría | 16/10/2026 22:01 | `cd30807` | Cada acción queda registrada; el panel muestra la auditoría real. |
| MER y BD | 20/10/2026 18:58 | `fd3e8d6` | MER de la tercera entrega y columnas para las fases siguientes (fases de inscripción, walkover, goles, cabezas de serie y sorteo, detalle de auditoría). |
| MER y BD | 20/10/2026 19:54 | `a351cba` | Equipos e invitaciones: límite de integrantes por torneo, estado de cada integrante, estado `invitada`, capitán opcional. |
| F5 Inscripciones | 20/10/2026 20:57 | `689bb14` | Abrir y cerrar inscripciones (RF-08), "Mis equipos", pedidos para unirse a un equipo, invitaciones del Organizador, asignación del Admin, cupo; plantel real en el panel. |
| MER y BD | 20/10/2026 21:46 | `7625b19` | Partido libre (bye): enfrentamiento sin visitante. |
| F6 Rondas y resultados | 20/10/2026 21:57 | `d9a3cc3` | Fixture de liga, llaves y sistema suizo; resultados del árbitro asignado con validación del Organizador; walkover; tabla con desempate; cierre y reapertura de rondas; fixture, tabla y llaves públicos. |
| F7 Finalizar torneo | 20/10/2026 22:09 | `e8f2e5a` | Solo con todos los resultados validados; los roles del torneo terminan solos y el historial queda. |
| F8 Calendario | 20/10/2026 22:20 | `4058d22` | El calendario muestra los partidos reales (`api/calendario.php`). |
| F9 Reportes y perfil | 20/10/2026 22:29 | `e82b4dc` | Reportes, tarjetas del panel y estadísticas del perfil reales; se borraron los datos de ejemplo del código. |
| F10 Datos de demostración | 20/10/2026 22:41 | `5901edf` | Seed chico y realista (no los 50 registros); corrección del emparejamiento suizo para no repetir rivales. |
| F11 Documentación | 20/10/2026 22:47 | `940b516` | [`NORMALIZACION.md`](./NORMALIZACION.md), consultas de la BD de ASO con roles por torneo, README al día y copia del servidor verificada. |
| F12 Prueba final | 20/10/2026 ≈23:00 | — | Recorrido completo sobre una base nueva, haciendo clic en la interfaz: pedir un torneo, aprobarlo, inscripciones, fixture, resultados, walkover, finalizar y revocación de roles. Todo OK, sin cambios de código. |

Fuera de alcance por ahora: los 50 registros por componente, cambiar o
recuperar la contraseña, contraseñas temporales enviadas por correo, subir el
reglamento de cada torneo y el filtro por videojuego del calendario.

## Corrección de la segunda entrega de Programación Fullstack

Todos los puntos de la segunda entrega figuran como resueltos.

- [ ] Correcciones indicadas por el docente sobre la segunda entrega (completar al recibir la devolución)
