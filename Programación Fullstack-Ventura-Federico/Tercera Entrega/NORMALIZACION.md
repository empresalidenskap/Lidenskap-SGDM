# Normalización: cambios de la tercera entrega

Complementa la justificación de normalización hasta 3FN de la segunda
entrega (en [`Programación Fullstack Segunda entrega.pdf`](../Segunda%20Entrega/Programación%20Fullstack%20Segunda%20entrega.pdf)),
que sigue valiendo para todo lo que no se menciona acá. Cubre solo lo que
cambió en el esquema ([`SGDM App/db/01-schema.sql`](../../SGDM%20App/db/01-schema.sql))
y en el [MER de esta entrega](./MER_SGDM_Proyecto.xml). El modelo sigue
teniendo **17 tablas**; la única tabla nueva es `torneo_arbitro`.

## 1. Roles por torneo: no se guardan, se deducen

Organizador, Árbitro y Participante dejaron de ser roles de la cuenta: una
misma persona puede organizar un torneo, arbitrar otro y jugar un tercero,
y el rol se termina cuando el torneo finaliza.

Guardar "rol de un usuario en un torneo" en una tabla propia repetiría
datos que ya existen:

| Rol en el torneo | De dónde sale |
|---|---|
| Organizador | `torneo.id_usuario_organizador` |
| Árbitro | `torneo_arbitro` (nueva) |
| Participante | `inscripcion` del competidor del usuario: su participante, o los integrantes aceptados de su equipo (`equipo_participante`) |

Si además se guardara aparte, cada cambio (aprobar una inscripción, sumar
un integrante, finalizar el torneo) obligaría a actualizar dos lugares
(**anomalía de actualización**), y finalizar un torneo implicaría borrar
roles (**anomalía de borrado**: se perdería el historial). Por eso los roles
se exponen en la vista **`vista_rol_torneo`**, igual que los demás datos
derivados: la columna `activo` sale de `torneo.estado` y se apaga sola al
pasar a `finalizado` o `cancelado`. `usuario.id_rol` queda solo para el rol
global (Administrador o Usuario público).

## 2. Tabla nueva `torneo_arbitro`

`torneo_arbitro (id_torneo_arbitro, id_torneo, id_usuario, estado_solicitud, fecha_solicitud)`

Es la relación N:N **Arbitra** entre USUARIO y TORNEO. La clave candidata
natural es `(id_torneo, id_usuario)` (restricción `UNIQUE`); se usa además
una clave sustituta para identificar cada solicitud con un solo número.

- **1FN:** valores atómicos; `estado_solicitud` es un único valor de un
  dominio cerrado (invitada, pendiente, aprobada, rechazada).
- **2FN:** `estado_solicitud` y `fecha_solicitud` dependen del par completo
  (el mismo árbitro tiene un estado distinto en cada torneo), no de una
  parte.
- **3FN:** no hay dependencias entre atributos no clave.

## 3. Columnas nuevas

| Columna | Depende de | Por qué está bien ahí |
|---|---|---|
| `torneo.marcador_wo_ganador`, `marcador_wo_perdedor` | `id_torneo` | El marcador de walkover lo configura cada torneo (RF-12). |
| `torneo.max_integrantes_equipo` | `id_torneo` | El límite de integrantes por equipo lo fija cada torneo. |
| `inscripcion.cabeza_serie`, `numero_sorteo` | `id_inscripcion` (= par torneo-competidor) | El mismo equipo puede ser cabeza de serie en un torneo y no en otro; el sorteo es de esa inscripción. |
| `equipo_participante.estado` | `(id_equipo, id_participante)` | El estado del pedido o la invitación es de esa persona en ese equipo. |
| `enfrentamiento.id_arbitro` | `id_enfrentamiento` | Clave foránea (relación 1:N **Dirige**): el árbitro asignado a cada partido. |
| `tabla_posiciones.goles_a_favor`, `goles_en_contra` | `id_inscripcion` | Son contadores acumulados, igual que `victorias`, `empates` y `derrotas`. |
| `auditoria_registro.detalle` | `id_auditoria` | Dato propio de cada evento (por ejemplo, el motivo de reabrir una ronda, RF-13). |

Ninguna de estas columnas depende de otra columna no clave, así que todas
las tablas siguen en 3FN.

## 4. Atributos derivados (no se almacenan)

Siguiendo el criterio de la segunda entrega, lo que se calcula a partir de
otros datos se expone en vistas:

- `vista_tabla_posiciones.diferencia_goles` = `goles_a_favor` − `goles_en_contra`
  (se suma a `partidos_jugados` y `puntos_acumulados`).
- `vista_rol_torneo` (punto 1).
- `vista_resultado.ganador` (sin cambios).

## 5. Cambios de opcionalidad

- `equipo.id_usuario` (relación **Capitanea**) pasa a ser opcional: el
  capitán es quien creó el equipo y solo lo anota en un torneo (quién entra
  lo decide el Organizador); un equipo creado por el Organizador no
  tiene.
- `enfrentamiento.id_inscripcion_visitante` (relación **Juega_Visitante**)
  pasa a ser opcional: un partido sin visitante es un partido libre (bye),
  que gana el local sin jugar. La restricción
  `CHECK (id_inscripcion_local <> id_inscripcion_visitante)` se mantiene.

Hacer opcional una clave foránea no agrega dependencias funcionales, así
que no cambia la forma normal.
