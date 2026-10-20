# Programación Fullstack: Tercera entrega

Docente: Federico Ventura

Requisitos de la letra de proyecto para esta entrega:

- [ ] Implementación completa del sistema, de manera portable mediante Docker, con datos de prueba (mínimo 50 registros por cada componente)

La aplicación vive en [`SGDM App/`](../../SGDM%20App/); los datos de prueba
están en `SGDM App/db/03-seed-demo.sql`.

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
- Correcciones del MER anterior: faltaba la relación **Capitanea**
  (USUARIO–EQUIPO, `equipo.id_usuario`) y el atributo `Descripcion` de TORNEO,
  y el atributo `PuntosEmpate` de TIPO_TORNEO figuraba como `PuntosAcumulados`.

## Corrección de la segunda entrega de Programación Fullstack

Todos los puntos de la segunda entrega figuran como resueltos.

- [ ] Correcciones indicadas por el docente sobre la segunda entrega (completar al recibir la devolución)
