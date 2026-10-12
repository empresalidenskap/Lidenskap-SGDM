# SGDM — Cierre de brechas Programación Fullstack / letra de proyecto (Tercera Entrega)

## Contexto

La Tercera Entrega de Programación Fullstack exige "implementación completa
del sistema... con datos de prueba (mínimo 50 registros por cada
componente)" (`Programación Fullstack-Ventura-Federico/Tercera
Entrega/README.md`). Hoy eso no se cumple: la base de datos solo tiene 5
filas (una por rol en `usuario`); cero filas en `torneo`, `equipo`,
`participante`, `inscripcion`, `ronda`, `enfrentamiento`, `resultado` o
`tabla_posiciones`.

Más allá del conteo, comparé el código contra el ESRE vigente ("Ingeniería
de software Segunda entrega", Google Doc, Bloque A — RF-08 a RF-20) y
contra lo que pidió el usuario explícitamente: quién da de alta/aprueba
Participantes y Equipos, y qué le falta a cada panel. Encontré que casi
todos los paneles mencionados son **mock del lado del cliente**: no hay
API para participantes, equipos, inscripciones, rondas, enfrentamientos,
resultados, auditoría ni reportes — solo existen `login`, `register`,
`logout`, `usuario(s)` y `torneo(s)`. Las tablas y vistas (`vista_resultado`,
`vista_tabla_posiciones`) ya están bien modeladas en 3FN; lo que falta es
la capa de API + lógica de negocio + el cableado del frontend.

Decisiones ya confirmadas con el usuario:
1. **Alta de Participante/Equipo**: no será 100% top-down. Se agrega un
   flujo de **solicitud + aprobación**: un usuario Público pide convertirse
   en Participante o crear/unirse a un Equipo; el Organizador (y el Admin,
   por la convención ya vigente en el proyecto de que "el admin puede
   todo") aprueba o rechaza. Esto extiende el RF-15 del ESRE (que solo
   describe el alta por el Organizador) — hay que dejarlo documentado como
   extensión en la próxima entrega de Ingeniería de Software, no solo en
   código.
2. **Árbitro por partido**: se agrega `id_arbitro` (FK nullable a
   `usuario`) en `enfrentamiento`, porque hoy esa tabla no tiene ninguna
   columna para asignar un árbitro a un encuentro específico, lo que hace
   literalmente imposible cumplir RF-11 ("el Árbitro solo puede tocar sus
   encuentros asignados"). Hay que actualizar `01-schema.sql` y el MER
   (`MER_SGDM_Proyecto.xml`).

**Hallazgo adicional importante para el flujo de trabajo**: existe una
carpeta `SGDM App - files/` que es un espejo completo de todo el código ya
mapeado a las rutas reales del servidor (`optsgdm/`, `usrlocalsbin/`,
`varwwwhtml/app/...`) — es lo que se sube al servidor ("Files to upload to
sv", commit `7c68739`). **Todo archivo que se toque dentro de `SGDM App/`
en este plan tiene que replicarse ahí también**, además de la copia de
`01-schema.sql`/`02-users.sh` que ya existe en ese espejo (no hay copia de
schema dentro de `Programación Fullstack-Ventura-Federico/Segunda
Entrega/` a pesar de que el README la linkea — ese link ya está roto hoy,
no es algo que este plan rompa).

---

## Checklist de brechas (diagnóstico)

### Grupo A — depende de que existan Participantes/Equipos reales

| Ítem | RF del ESRE | Estado actual |
|---|---|---|
| Alta/edición/validación de Participantes y Equipos | RF-15 | ❌ Sin API. `panel.html` tiene las pestañas `#participantsRoster`/`#teamsRoster`, pero `main.js:1680-1734` las llena con arrays JS inventados (`firstNames`/`lastNames`/`teamNames`); "Agregar participante/equipo" solo hace `unshift` en memoria, no persiste nada |
| Autorregistro de Participante | RF-15 (extendido) | ❌ Bloqueado a propósito: `api/register.php:53-64` fuerza rol `PUBLICO` con un comentario explícito de que "convertirse en Participante no es una opción del formulario" |
| Inscripción de equipo a un torneo | RF-08, RF-15 | ❌ Explícitamente deshabilitado: `main.js:1354` — el botón de inscripción hace `alert('La inscripción de equipos se habilita en la próxima etapa.')` |
| Flujo secuencial alta torneo → inscripciones → validación → cierre → calendario, bloqueado si no se confirma la fase anterior | RF-08 | ❌ No existe ninguna lógica de fases/gating. Solo existe alta de `torneo` (ADMIN, `torneos.php:92`) |
| Matriz de permisos del Árbitro (solo lee/actualiza sus encuentros asignados, pierde el permiso al cerrar la ronda) | RF-11 | ❌ No verificable: no existe ningún endpoint que escriba `resultado`, para nadie, y la tabla `enfrentamiento` no tiene columna de árbitro asignado (se agrega en este plan) |
| Walkover | RF-12 | ❌ No implementado (sin endpoint de resultados) |
| Bloqueo de rondas cerradas + reapertura solo por Admin + registro en auditoría | RF-13 | ❌ `ronda.estado_ronda` existe en el schema pero sin ninguna lógica que la use |
| Desempate de liga (puntos → dif. gol → enfrentamiento directo → goles a favor → sorteo) | RF-09 | ❌ `tabla_posiciones`/`vista_tabla_posiciones` existen pero nada las escribe ni recalcula |
| Emparejamiento anti-repetición (Sistema Suizo) | RF-10 | ❌ No implementado |
| Generación automática de calendario de liga | RF-16 | ❌ `calendario.html` renderiza `SGDM_SCHEDULE`, un array hardcodeado derivado de `SGDM_TOURNAMENT_DETAILS` (`main.js:1058`) — sin `fetch` alguno |
| Generación y avance de llaves en eliminación directa | RF-17 | ❌ El botón "Generar siguiente ronda" solo muta un objeto `roundState` en memoria (`main.js:1794-1826`) |
| Panel → Resultados | RF-11, RF-12 | ❌ 100% mock (`main.js:1741-1748`, `1775-1780`) — "Cargar resultado" muestra un toast pero no persiste |
| Panel → Rondas y llaves | RF-10, RF-17 | ❌ 100% mock (ver RF-17 arriba) |
| Calendario público | RF-16, RF-18 | ⚠️ La página es pública (cumple RF-18 en el *acceso*), pero el contenido es ficticio porque no hay enfrentamientos reales |
| Consulta pública de torneos | RF-18 | ✅ Parcial: `torneos.php`/`torneo.php` GET son públicos y reales; lo que falta es que calendarios/resultados/tablas detrás de esos torneos también lo sean |

### Grupo B — autocontenidos (no dependen de lo anterior)

| Ítem | Estado actual |
|---|---|
| Panel → Auditoría | ❌ La tabla `auditoria_registro` existe en el schema (`01-schema.sql:28-36`) con su modelo (`AuditoriaRegistro.php`), pero **nada en toda la aplicación escribe en ella** (confirmado por grep en todo `app/`) y **nada la lee** — tampoco hay endpoint. El panel (`main.js:1854-1880`) genera 48 filas sintéticas client-side (`Array.from({length:48}, ...)`) a partir de un array fijo de 6 acciones |
| Panel → Reportes | ❌ No existe `api/reportes.php`. `main.js:1828-1852` calcula los números mostrados reduciendo sobre el mismo mock `SGDM_TOURNAMENTS`/`SGDM_TOURNAMENT_DETAILS` — nada sale de una query real |
| Estadísticas de Perfil | ❌ `perfil.html:39-44` tiene los `<strong id="statValue{N}">` vacíos; `main.js:1395-1446` los llena con un objeto `profileData` fijo por rol con números literales (p. ej. Organizador: "Participantes: 74" hardcodeado). No hay endpoint de stats de perfil; el único `COUNT` real en toda la API es el de inscriptos dentro de `torneos.php:33`, que no se usa aquí |

---

## Plan de implementación

El orden sigue la misma lógica que propuso el usuario: primero Grupo B
(autocontenido, habilita demostrar progreso rápido), después Grupo A en el
orden en que cada pieza depende de la anterior.

### Fase 0 — Esquema

- `SGDM App/db/01-schema.sql`: agregar `id_arbitro INT NULL` + `FK
  id_arbitro → usuario(id_usuario) ON DELETE SET NULL` a `enfrentamiento`.
  Replicar el `ALTER`/`CREATE` en `SGDM App - files/optsgdm/01-schema.sql`.
- Actualizar `MER_SGDM_Proyecto.xml` (drawio) con la nueva relación
  `enfrentamiento`–`usuario` (árbitro asignado).
- Nota para la próxima entrega de Ingeniería de Software: documentar la
  extensión de RF-15 (solicitud + aprobación) en el ESRE — no es parte del
  código, pero el checklist de esa materia debería reflejarlo.
- Recordatorio operativo: tras tocar el schema, el stack necesita
  `docker compose down -v && docker compose up -d` para reinicializar
  (gotcha ya documentado en `SGDM App/README.md`/CLAUDE.md).

### Fase 1 — Auditoría (Grupo B)

- Nuevo `App\Models\AuditoriaRegistro` gana un método estático
  `registrar(?int $idUsuario, string $accion, string $tabla, ?string $ip =
  null)` que hace el `INSERT`.
- Llamar a `AuditoriaRegistro::registrar(...)` desde los puntos donde ya
  hay una acción administrativa: `login.php` (éxito/fracaso), `usuarios.php`
  (alta/baja), `usuario.php` (update/delete), `torneos.php` (alta),
  `torneo.php` (baja), y desde la futura reapertura de ronda (Fase 5, cierra
  RF-13).
- Nuevo `api/auditoria.php`: `GET` paginado, gateado
  `Auth::requireRole('ADMIN')` (según RF-19, el log de auditoría es del
  módulo de administración).
- `main.js`: reemplazar el generador de 48 filas sintéticas (`1854-1880`)
  por un `fetch('api/auditoria.php?...')` real; mantener el export CSV pero
  sobre los datos reales.

### Fase 2 — Reportes (Grupo B)

- Nuevo `api/reportes.php`, `GET`, gateado a `ADMIN`/`ORGANIZADOR` (RF-19 —
  "acceso a reportes generales" es del Admin; el Organizador necesita ver
  los suyos). Agregados reales: torneos por estado, inscripciones por
  torneo, ocupación (`inscriptos / cupo`), partidos jugados/pendientes,
  resultados oficializados — reutilizando el patrón de subquery que ya
  existe en `torneos.php:33`.
- `main.js:1828-1852`: reemplazar el cálculo sobre `SGDM_TOURNAMENTS` mock
  por el `fetch` a `api/reportes.php`.

### Fase 3 — Estadísticas de Perfil (Grupo B)

- Extender `api/usuario.php` (o nuevo `api/perfil.php`) con un endpoint
  `GET` que devuelva stats reales según el rol de la sesión:
  - Organizador: torneos organizados, participantes inscritos en sus
    torneos, resultados pendientes de validar, reportes generados.
  - Participante: torneos jugados, victorias (via `vista_tabla_posiciones`),
    posición histórica, próximo partido (`enfrentamiento` futuro vía su
    `inscripcion`).
  - Admin: conteos globales.
  - Público: ocultar la sección o mostrar stats públicas genéricas.
- `main.js:1395-1446`: eliminar el objeto `profileData` hardcodeado;
  `perfil.html` pasa a pintarse desde el `fetch`.

### Fase 4 — Participantes, Equipos e Inscripciones (Grupo A, base)

- Nuevos endpoints `api/participantes.php`, `api/equipos.php`,
  `api/inscripciones.php`:
  - `POST /inscripciones.php` (acción "solicitar"): un usuario autenticado
    (cualquier rol, pero pensado para Público) crea su propio
    `participante`/`equipo` + fila `inscripcion` en estado `pendiente` —
    implementa la solicitud de autorregistro acordada.
  - `PATCH /inscripciones.php` (acción "validar"/"rechazar"): gateado
    `Auth::requireRole('ADMIN','ORGANIZADOR')` — cambia
    `estado_inscripcion` a `confirmada`/`rechazada`. (Se reutilizan los
    valores de enum ya existentes — `pendiente/confirmada/rechazada` — en
    vez de renombrarlos a los términos del ESRE "Preinscripto/Validado/
    Rechazado"; son equivalentes semánticos y renombrar el ENUM no aporta
    nada funcional.)
  - CRUD de `participantes.php`/`equipos.php` (edición de datos, alta de
    roster de equipo vía `equipo_participante`) gateado
    `ADMIN`/`ORGANIZADOR`.
  - Implementa RF-08 (el torneo no genera calendario/llaves si quedan
    inscripciones sin validar — el "cierre de plazo" bloquea el alta de
    nuevas inscripciones).
- `main.js`: reemplazar el roster mock (`1680-1734`) por `fetch`;
  reactivar el botón de `main.js:1354` para llamar a `inscripciones.php` en
  vez del `alert`.
- `register.php`: ya no cambia su comportamiento de fondo (sigue dando de
  alta solo PUBLICO), pero el modal de registro gana un paso/CTA posterior
  ("solicitar ser Participante" / "crear equipo") que dispara el nuevo
  endpoint tras loguearse.

### Fase 5 — Rondas, Enfrentamientos y Resultados (Grupo A)

- `api/rondas.php`: generación de ronda (ADMIN/ORGANIZADOR) — implementa
  RF-16 (round-robin liga) y RF-17 (llave de eliminación directa, con
  cabezas de serie si existen, avance automático del ganador al cargar
  resultado). Cierre de ronda bloquea escritura (RF-13); reapertura
  exclusiva de ADMIN y dispara `AuditoriaRegistro::registrar(...)`.
- `api/enfrentamientos.php`: alta de encuentro dentro de una ronda,
  incluye asignación de `id_arbitro` (la columna nueva de la Fase 0).
- `api/resultados.php`:
  - `POST`/`PATCH` gateado para ADMIN/ORGANIZADOR sin restricción, y para
    ARBITRO **solo si** `enfrentamiento.id_arbitro === $_SESSION['id_usuario']`
    y `ronda.estado_ronda !== 'finalizada'` — esto es la implementación
    literal de RF-11.
  - Soporte de Walkover (RF-12): marca `estado_partido = 'suspendido'`/un
    flag WO y fija el marcador configurado por torneo.
  - Tras cada resultado válido, recalcular `tabla_posiciones` aplicando el
    desempate de RF-09 (puntos → dif. gol → enfrentamiento directo → goles
    a favor → sorteo) y, en modo eliminación, avanzar al ganador a la
    siguiente llave (RF-17).
  - Sistema Suizo (RF-10): función de emparejamiento que evita repetir
    rivales ya enfrentados, usada por `rondas.php` al generar la ronda N+1
    en torneos de ese formato.
- `main.js`: cablear `panel-results`/`panel-rounds` a estos endpoints en
  vez de los objetos mock (`1741-1826`).

### Fase 6 — Calendario real

- `calendario.html`/`main.js`: una vez que existen `enfrentamiento` reales
  (Fase 5), reemplazar `SGDM_SCHEDULE` por un `fetch` público a un nuevo
  endpoint de solo lectura (puede vivir en `torneo.php` ampliado o en
  `enfrentamientos.php` con método GET sin `Auth::requireRole`, ya que RF-18
  exige consulta pública sin autenticación).

### Fase 7 — Datos de prueba (≥50 por componente)

- Ampliar `SGDM App/db/03-seed-demo.sql` con ≥50 filas por tabla relevante
  (`torneo`, `equipo`, `participante`, `inscripcion`, `ronda`,
  `enfrentamiento`, `resultado`, `tabla_posiciones`), generadas una vez que
  las Fases 4-5 definen la forma real de los datos (para que el seed no
  quede desincronizado de la lógica de negocio).
- Esto es lo que cierra el único punto explícito de la letra de proyecto
  para esta entrega.

### Replicación obligatoria a `SGDM App - files/`

Cada archivo nuevo o modificado dentro de `SGDM App/app/...` y
`SGDM App/db/...` en las fases anteriores debe copiarse al path espejo
correspondiente dentro de `SGDM App - files/` (`varwwwhtml/app/...`,
`optsgdm/...`) antes de dar la fase por cerrada — es lo que se sube al
servidor real.

---

## Verificación

- Sintaxis: `php -l` sobre cada archivo PHP nuevo/tocado;
  `node --check "SGDM App/app/assets/js/main.js"` tras cada cambio de JS.
- Funcional: `docker compose down -v && docker compose up -d` (fuerza
  reinicialización del volumen con el nuevo schema/seed) y probar en el
  navegador, por rol, cada flujo tocado: login como Público → solicitar
  Participante/Equipo → login como Organizador → validar la solicitud →
  generar ronda → login como Árbitro asignado → cargar resultado (y
  confirmar que un Árbitro NO asignado no puede) → verificar que
  `tabla_posiciones`/calendario público reflejan el resultado → revisar que
  Auditoría y Reportes muestren esa actividad real.
- Confirmar que `SGDM App - files/` quedó en sync (diff manual contra
  `SGDM App/`).
