# Esquema de pantallas — SGDM

Inventario de las pantallas de la aplicación ([`SGDM App/app/`](../../../SGDM%20App/app/)),
con su ruta, propósito y el acceso por rol.

- **[`SGDM-Manual-Usuario.pdf`](SGDM-Manual-Usuario.pdf)** — manual con capturas
  reales de las 16 pantallas (no maquetas), tomadas contra el proyecto corriendo
  en Docker con datos de ejemplo reales. GitHub lo muestra directamente en el
  navegador al abrir el archivo, sin necesidad de descargarlo.
- Copia (versión resumida, 10 pantallas) también disponible en Google Drive:
  ["SGDM Lidenskap — Manual de Usuario (esquema de pantallas)"](https://docs.google.com/document/d/1IrhukKT2CYDr6YSFpD-SDED9QxjaSg49mGFsMRz2PGM/edit).
- Este README complementa el manual con una tabla y un mapa de navegación en
  formato texto. La interfaz real puede verse corriendo el proyecto según
  [`SGDM App/README.md`](../../../SGDM%20App/README.md) (`docker compose up -d`,
  luego `http://localhost`).

Roles: **Admin** (Administrador general), **Org** (Organizador de torneo),
**Árb** (Árbitro), **Part** (Participante), **Púb** (Usuario público / sin
sesión). Los permisos exactos por rol están declarados en
[`SGDM_PERMISSIONS`](../../../SGDM%20App/app/assets/js/main.js) dentro de
`main.js`.

## Mapa de navegación

```
                         ┌──────────────┐
                         │  index.html  │  (portada)
                         └──────┬───────┘
                    ┌───────────┼───────────────┬───────────────┐
                    ▼           ▼                ▼               ▼
             torneos.html  disciplinas.html  calendario.html  crear-competencia.html
                    │           │                                (solo Admin)
                    └─────┬─────┘
                          ▼
                 detalle-torneo.html?id=...
                          │
              (según sesión y rol)
                          ▼
        ┌─────────────┬───────────────┬──────────────┐
        ▼             ▼               ▼              ▼
   perfil.html    panel.html     contacto.html   privacidad.html / terminos.html
  (Part/Org/Árb/   (Admin/Org/       (público)         (público)
   Admin, propia    Árb — módulos
   sesión)          según rol)
```

Nav y footer son comunes a todas las pantallas (logo, buscador de torneos,
disciplinas, calendario, perfil/login y enlaces a privacidad, términos y
contacto).

## Pantallas públicas (sin sesión)

| # | Pantalla | Archivo | Propósito | Elementos principales |
|---|---|---|---|---|
| 1 | Portada | `index.html` | Presentar el SGDM, sus formatos de torneo y el acceso a disciplinas/galería. | Hero, selector de disciplinas, carrusel, formatos de torneo (Liga/Eliminación/Suizo), CTA de registro. |
| 2 | Buscador de torneos | `torneos.html` | Consulta pública de todos los torneos publicados, con filtros. | Filtros (nombre, disciplina, videojuego, formato, estado), grilla de tarjetas de torneo. |
| 3 | Disciplinas | `disciplinas.html` | Explorar torneos agrupados por disciplina. | Selector de disciplina (chips), catálogo de disciplinas con acceso directo a sus torneos. |
| 4 | Calendario | `calendario.html` | Consulta pública de todos los encuentros programados. | Filtros por disciplina/año/mes/fecha/formato/estado, grilla de partidos. |
| 5 | Detalle de torneo | `detalle-torneo.html?id=...` | Ficha completa de un torneo: descripción, reglamento, equipos inscriptos, resumen. | Descripción, reglamento descargable, lista de equipos, resumen (formato/sede/fecha/cupo). Botón "Inscribir mi equipo" (pide login si no hay sesión); botón "Eliminar torneo" solo visible para Admin. |
| 6 | Contacto y soporte | `contacto.html` | Formulario de contacto. | Formulario (nombre, correo, asunto, mensaje). |
| 7 | Política de privacidad | `privacidad.html` | Texto legal de privacidad (Ley 18.331). | Texto informativo. |
| 8 | Términos y condiciones | `terminos.html` | Texto legal de términos de uso. | Texto informativo. |

## Pantallas con sesión requerida

| # | Pantalla | Archivo | Propósito | Acceso | Elementos principales |
|---|---|---|---|---|---|
| 9 | Perfil | `perfil.html` | Ver y editar los datos de la cuenta propia, y un resumen de actividad según el rol. | Cualquier rol autenticado (Admin / Org / Árb / Part). Sin sesión, pide iniciar sesión. | Datos de cuenta, estadísticas resumidas por rol, formulario de edición de perfil. |
| 10 | Crear competencia | `crear-competencia.html` | Alta de un torneo nuevo (disciplina, formato, cupo, fecha, sede, reglamento). | Solo **Admin** (`create_tournament`). Otros roles ven un mensaje de acceso denegado explicando el motivo. | Formulario con datos generales, formato y reglas, subida de reglamento. |
| 11 | Panel de gestión | `panel.html` | Panel interno: usuarios, torneos, participantes, resultados, rondas, reportes y auditoría. | **Admin**, **Organizador** o **Árbitro** (`manage_users`, `manage_tournaments` o `manage_results`). Sin sesión o rol Participante/Público: acceso denegado. | Ver submódulos abajo. |

### Submódulos del panel (`panel.html`)

Todos viven en la misma página y se muestran/ocultan por rol (`data-admin-only`
y la lista `allowedModules` en `main.js`):

| Módulo | Quién lo ve | Qué hace |
|---|---|---|
| Resumen (`#dashboardOverview`) | Todos los que entran al panel | Estadísticas generales y accesos directos a cada módulo. |
| Usuarios y roles (`#panel-users`) | Solo Admin | Alta de cuentas administrativas (Admin, Organizador o **Árbitro**), listado y baja. |
| Torneos (`#panel-tournaments`) | Admin, Organizador | Listado de torneos (todos para Admin, solo los propios para Organizador). |
| Participantes y equipos (`#panel-participants`) | Admin, Organizador | Roster de participantes/equipos inscriptos. |
| Resultados (`#panel-results`) | Admin, Organizador, Árbitro | Carga y corrección de resultados — es el único módulo pensado para el rol Árbitro (RF-11). |
| Rondas y llaves (`#panel-rounds`) | Admin, Organizador | Generación, publicación y cierre de rondas. |
| Reportes (`#panel-reports`) | Admin, Organizador | Indicadores de inscripción, ocupación y partidos por torneo. |
| Auditoría (`#panel-audit`) | Solo Admin | Historial de acciones del sistema. |
| Configuración (`#panel-settings`) | Solo Admin | Módulos de competencia habilitados y ajustes generales. |

> Nota: hoy el panel todavía distingue mayormente Admin vs. no-Admin a nivel de
> interfaz; el filtrado fino de qué tarjetas del resumen ve un Árbitro
> (debería ver solo "Resultados", no Torneos/Participantes/Rondas/Reportes)
> queda como ajuste pendiente, en línea con que el módulo de resultados en sí
> todavía no tiene API propia (ver
> [`SGDM App/app/api/`](../../../SGDM%20App/app/api/)).
