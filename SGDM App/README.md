# SGDM App

Esta carpeta es **la aplicación en sí**: el sistema completo (frontend +
backend PHP + base de datos MySQL) del Sistema de Gestión Deportiva
Modular, ejecutable con un solo comando de Docker. Vive aparte de las
carpetas de cada materia porque es el mismo código para todas — no
pertenece a ninguna entrega en particular, aunque su desarrollo se
documenta y evalúa dentro de **Programación Fullstack**
(`../Programación Fullstack-Ventura-Federico/`).

## Cómo levantarla

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/)
instalado y corriendo. Desde esta carpeta (`SGDM App/`):

```bash
docker compose up -d
```

Esperar unos 15-20 segundos a que MySQL termine de inicializar, y abrir
**<http://localhost>**.

Para bajarlo:

```bash
docker compose down
```

Para reiniciar todo desde cero (borra los datos y vuelve a cargar solo las
cuentas de demostración):

```bash
docker compose down -v
docker compose up -d
```

## Cuentas de demostración

Ya están cargadas en la base al levantar el proyecto (ver "Iniciar
sesión" en el sitio):

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador general | `admin@lidenskap.com` | `admin123` |
| Organizador de torneo | `organizador@lidenskap.com` | `org123` |
| Participante | `atleta@lidenskap.com` | `user123` |
| Usuario público | `publico@lidenskap.com` | `guest123` |

## Estructura

```
SGDM App/
├── app/                  Código de la aplicación (ver app/README.md)
├── db/
│   ├── 01-schema.sql      Modelo relacional (16 tablas)
│   ├── 02-users.sh        DCL: usuarios de la base y sus permisos
│   └── 03-seed-demo.sql   Cuentas de demostración
├── Dockerfile             Apache + PHP 8.3
├── docker-compose.yml
├── .env                   Credenciales locales (no se sube al repo)
└── .env.example           Plantilla de variables de entorno
```

## Variables de entorno

`.env` no se versiona (contiene contraseñas). Al clonar el repo, copiá
`.env.example` a `.env` — ya viene con valores de desarrollo razonables,
solo hace falta cambiarlos para un despliegue real:

| Variable | Uso |
|---|---|
| `DB_NAME` | Nombre de la base (`sgdm`) |
| `DB_ROOT_PASSWORD` | Contraseña de `root` en MySQL |
| `DB_ADMIN_USER` / `DB_ADMIN_PASSWORD` | Usuario con todos los privilegios (mantenimiento) |
| `DB_APP_USER` / `DB_APP_PASSWORD` | Usuario que usa la app PHP (sin DDL) |
| `DB_CONSULTA_USER` / `DB_CONSULTA_PASSWORD` | Usuario de solo lectura pública |

## Estado

Conectado a la base real: autenticación (login/registro con sesión de
servidor), torneos (crear/listar/ver detalle/eliminar) y el módulo de
usuarios y roles del panel de administración. Todavía con datos de
muestra: calendario, participantes/equipos, resultados, rondas, reportes
y auditoría del panel, y las estadísticas de perfil.
