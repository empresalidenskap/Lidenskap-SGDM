# SGDM App

Esta carpeta es **la aplicación en sí**: el sistema completo (frontend +
backend PHP + base de datos MariaDB) del Sistema de Gestión Deportiva
Modular, ejecutable con un solo comando de Docker. Vive aparte de las
carpetas de cada materia porque es el mismo código para todas. No
pertenece a ninguna entrega en particular, aunque su desarrollo se
documenta y evalúa dentro de **Programación Fullstack**.
(`../Programación Fullstack-Ventura-Federico/`).

## Cómo levantarla

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/)
instalado y corriendo. Desde esta carpeta (`SGDM App/`):

```bash
docker compose up -d
```

Esperar unos 15-20 segundos a que MariaDB termine de inicializar, y abrir
**<http://localhost>**.

Para bajarlo:

```bash
docker compose down
```

Para reiniciar todo desde cero (borra los datos y vuelve a cargar los datos
de demostración):

```bash
docker compose down -v
docker compose up -d
```

## Cuentas de demostración

Ya están cargadas en la base al levantar el proyecto. El sitio no las muestra
(en un servidor real hay que cambiarles la contraseña). Solo el Administrador tiene un rol
global; los demás son Usuarios públicos con roles **dentro de cada torneo**:

| Cuenta | Correo | Contraseña |
|---|---|---|
| Administrador general | `admin@lidenskap.com` | `admin123` |
| Organizador de 4 torneos | `organizador@lidenskap.com` | `org123` |
| Árbitro de Copa Demo | `arbitro@lidenskap.com` | `arb123` |
| Participante de Copa Demo (equipo Halcones del Sur) | `atleta@lidenskap.com` | `user123` |
| Usuario público (con una invitación para arbitrar) | `publico@lidenskap.com` | `guest123` |
| Otros jugadores | `lucia@`, `mateo@`, `sofia@`, `camila@`… (`@lidenskap.com`) | `demo1234` |

Los datos de demostración incluyen un torneo de cada formato y en cada fase:
una liga en curso (con un walkover y un resultado sin validar), una
eliminación directa finalizada con campeona, un sistema suizo con partido
libre, una liga con inscripciones abiertas y pedidos pendientes, un torneo
planificado y una solicitud de torneo para el Administrador.

## Estructura

```
SGDM App/
├── app/                  Código de la aplicación (ver app/README.md)
├── db/
│   ├── 01-schema.sql      Modelo relacional (17 tablas y 3 vistas)
│   ├── 02-users.sh        DCL: usuarios de la base y sus permisos
│   └── 03-seed-demo.sql   Datos de demostración
├── Dockerfile             Apache + PHP 8.3
├── docker-compose.yml
├── .env                   Credenciales locales (no se sube al repo)
└── .env.example           Plantilla de variables de entorno
```

## Variables de entorno

`.env` no se versiona (contiene contraseñas). Al clonar el repo, copiá
`.env.example` a `.env`: ya viene con valores de desarrollo razonables,
solo hace falta cambiarlos para un despliegue real:

| Variable | Uso |
|---|---|
| `DB_NAME` | Nombre de la base (`sgdm`) |
| `DB_ROOT_PASSWORD` | Contraseña de `root` en MariaDB |
| `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` | Usuario con todos los privilegios (mantenimiento) |
| `DB_APP_USER` / `DB_APP_PASSWORD` | Usuario que usa la app PHP (sin DDL) |
| `DB_CONSULTA_USER` / `DB_CONSULTA_PASSWORD` | Usuario de solo lectura pública |

## Estado

Todo funciona sobre la base real, sin datos de muestra en el código:

- Cuentas y roles por torneo, con solicitudes (crear torneo, participar,
  arbitrar, unirse a un equipo), invitaciones del Organizador y asignación
  directa del Administrador.
- Torneos con sus fases (inscripciones abiertas → cerradas → en curso →
  finalizado), equipos e inscripciones.
- Fixture por formato (liga, eliminación directa, sistema suizo), carga de
  resultados por el árbitro asignado, validación del Organizador, walkover,
  tabla de posiciones con desempate, cierre y reapertura de rondas.
- Consulta pública: torneos, fixture, tabla, llaves y calendario.
- Panel: reportes, auditoría y estadísticas reales; perfil con historial.

Pendiente, por ahora fuera de alcance: cambiar o recuperar la contraseña,
contraseñas temporales con envío por correo, subir el reglamento de cada
torneo (la tarjeta del detalle muestra un archivo de ejemplo) y el filtro por
videojuego del calendario (los torneos no guardan el juego).
