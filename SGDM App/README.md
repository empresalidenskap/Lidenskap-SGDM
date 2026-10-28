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
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN` | Credenciales OAuth de la API de Gmail (ver abajo) |
| `GMAIL_REMITENTE` | Cuenta que envía: `empresalidenskap@gmail.com` |
| `CORREO_MODO` | `log` = no envía, escribe el correo en el log de PHP (para probar) |

## Contraseñas y correo (API de Gmail)

- **Olvidé mi contraseña** (en la ventana de inicio de sesión): el usuario
  escribe su correo, le llega un código de 6 números desde
  empresalidenskap@gmail.com, lo ingresa y elige una contraseña nueva.
- **Cambiar contraseña** (Perfil, o menú Mi Perfil → Cambiar contraseña): pide
  la actual y la nueva. Después de cualquier cambio llega un aviso por correo.
- **Cuenta creada por el Administrador** (Panel → Usuarios y roles → Crear
  usuario, también para sumar a alguien a un equipo): la contraseña es
  opcional. Si se deja vacía, la cuenta queda con una contraseña al azar que
  nadie conoce y a la persona le llega un correo de bienvenida con el botón
  **Elegir mi contraseña**: abre "Olvidé mi contraseña" con su correo, pide el
  código y elige la suya. Sin el correo configurado hay que poner una inicial.
- Reglas, iguales al registrarse: al menos 8 caracteres, una letra y un número.
- **Contacto** (`contacto.html`): el mensaje llega a empresalidenskap@gmail.com
  y **Responder** le contesta directo a quien escribió (encabezado `Reply-To`).
  Hasta 5 mensajes por hora por IP; cada uno queda en la auditoría.

```
app/api/contacto.php             formulario de Contacto → casilla del sistema
app/api/recuperar-password.php   pasos solicitar / verificar / restablecer
app/api/cambiar-password.php     cambio desde el perfil (con sesión)
app/src/RecuperacionPassword.php código, vencimiento, intentos y límites
app/src/Password.php             reglas y aviso "tu contraseña cambió"
app/src/Correo.php               envío con la API REST de Gmail (curl, sin librerías)
```

Seguridad:

- Contraseñas y códigos guardados **con hash** (`password_hash`), nunca en texto plano.
- El código **vence a los 15 minutos**, sirve **una vez** y admite **5 intentos**.
  Vive en la sesión de PHP de quien lo pidió (del lado del servidor).
- Hasta **3 pedidos por hora por cuenta** y **10 por IP**, contados en
  `auditoria_registro`: no sirve para mandar spam. Todo queda auditado.
- **Misma respuesta exista o no el correo**, y las cuentas inactivas no reciben código.
- Los encabezados del correo no aceptan saltos de línea (no se puede inyectar un `Bcc:`).
- Permiso mínimo de Google: `gmail.send` deja enviar, **no leer** la casilla.

### Credenciales de Google (una sola vez)

Todo con la cuenta **empresalidenskap@gmail.com**:

1. <https://console.cloud.google.com/> → Proyecto nuevo `Lidenskap SGDM` →
   **APIs y servicios → Biblioteca → Gmail API → Habilitar**.
2. **Google Auth Platform** (pantalla de consentimiento): tipo Externo, nombre
   `Lidenskap SGDM`; permiso (*Data access*)
   `https://www.googleapis.com/auth/gmail.send`.
3. **Audience → Publicar app → "En producción"**. En modo *Testing* el token
   vence a los 7 días y los correos dejan de salir (`invalid_grant` en el log).
4. **Credenciales → ID de cliente de OAuth → Aplicación web**, URI de
   redireccionamiento `https://developers.google.com/oauthplayground` →
   guardar el **ID** y el **secreto**.
5. <https://developers.google.com/oauthplayground> → ⚙️ **Use your own OAuth
   credentials** (pegar ID y secreto) → scope
   `https://www.googleapis.com/auth/gmail.send` → **Authorize APIs** con
   empresalidenskap@gmail.com (si avisa "Google no verificó esta app":
   *Configuración avanzada → Ir a Lidenskap SGDM*) → **Exchange authorization
   code for tokens** → copiar el **Refresh token** (empieza con `1//`).

El refresh token permite mandar correos desde la cuenta: **no subirlo a GitHub**.

### Dónde se cargan

- **Docker (esta carpeta):** completar las variables `GMAIL_*` en `.env` y
  `docker compose up -d`. Para probar sin Google: `CORREO_MODO=log` y el
  código aparece en `docker compose logs web`.
- **Servidor (AlmaLinux):** agregar al final de `/root/.sgdm_credenciales`

  ```bash
  GMAIL_CLIENT_ID="xxxx.apps.googleusercontent.com"
  GMAIL_CLIENT_SECRET="GOCSPX-xxxx"
  GMAIL_REFRESH_TOKEN="1//xxxx"
  ```

  y volver a correr `sudo ./instalar_sgdm.sh` (no toca la base). Agrega las
  variables al pool de PHP-FPM y activa `httpd_can_network_connect` en
  SELinux, que por defecto no deja a PHP conectarse a Google.
  Probar la salida: `curl -sI https://oauth2.googleapis.com | head -1`.

Las cuentas de demostración usan correos `@lidenskap.com`, que no existen.
Para la demo, registrar una cuenta con una casilla real, o cambiarle el correo
a una cuenta desde Panel → Usuarios.

Si no llega el correo, mirar `sudo tail /var/log/php-fpm/www-error.log`
(Docker: `docker compose logs web`) y la carpeta de spam:

| Dice | Qué hacer |
|---|---|
| "El envío de correos no está configurado" (lo ve el usuario) | Faltan variables `GMAIL_*` |
| `invalid_grant` | Token vencido (app en Testing) o revocado: publicar la app y sacar otro |
| `invalid_client` | ID o secreto mal copiados |
| `HTTP 403` al enviar | Gmail API sin habilitar, o falta el permiso `gmail.send` |
| `Sin conexión con Google` | SELinux (`httpd_can_network_connect`) o sin salida a internet por el 443 |

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
- Consulta pública: torneos, fixture, tabla, llaves, calendario y el
  reglamento de cada torneo (armado con su formato, puntos y walkover).
- Panel: reportes, auditoría y estadísticas reales; perfil con historial.
- Cambiar y recuperar la contraseña, con código y aviso por correo (API de Gmail).
- Formulario de Contacto que llega por correo a la casilla del sistema.

Pendiente, por ahora fuera de alcance: subir un reglamento propio en PDF y el
filtro por videojuego del calendario (los torneos no guardan el juego).
