# Implementación con Docker de la aplicación web

Documentación del ítem "Implementación con Docker de la aplicación web" de la
Tercera Entrega. Los archivos están en [`docker/`](./docker/) y los maneja
[`docker_sgdm.sh`](./docker_sgdm.sh), instalado en `/usr/local/sbin`.

```bash
sudo docker_sgdm.sh instalar     # instala Docker CE (una sola vez)
sudo docker_sgdm.sh levantar     # construye la imagen y levanta web + db
sudo docker_sgdm.sh estado       # contenedores, recursos, redes y volúmenes
```

También se puede usar desde el gestor del servidor (`gestion_servidor_sgdm.sh`,
opción **9) Docker**) o instalarlo junto con todo lo demás:
`sudo ./instalar_sgdm.sh --con-docker`.

## 1. Cómo convive con la instalación nativa

El servidor ya sirve el SGDM de forma nativa (Apache + PHP-FPM + MariaDB) en
los puertos 80 y 443, y de eso dependen los scripts de respaldo, consultas,
monitoreo y seguridad. La versión en Docker es **una segunda copia
independiente**, con su propia base de datos, en el puerto **8080**:

```
                    Servidor AlmaLinux 8.10 (1 vCPU, 4 GB)
 ┌───────────────────────────────────────────────────────────────────┐
 │  Nativo                         Docker (proyecto "sgdm")          │
 │  ┌────────────────┐             ┌──────── red frontend ───────┐   │
 │  │ Apache :80/:443│             │  ┌─────────────────────┐    │   │
 │  │ PHP-FPM        │   :8080 ────┼─▶│ web (sgdm-web)      │    │   │
 │  │ MariaDB :3306  │             │  │ Apache + PHP 8.3    │    │   │
 │  └────────────────┘             │  └─────────┬───────────┘    │   │
 │                                 └────────────┼────────────────┘   │
 │                                 ┌─ red backend (interna) ─────┐   │
 │                                 │  ┌─────────▼───────────┐    │   │
 │                                 │  │ db (mariadb:11.4)   │    │   │
 │                                 │  │ volumen db_data     │    │   │
 │                                 │  └─────────────────────┘    │   │
 │                                 └─────────────────────────────┘   │
 └───────────────────────────────────────────────────────────────────┘
```

El código de la imagen se toma de `/var/www/html`, así que Docker sirve
exactamente la misma versión que la instalación nativa.

## 2. Motor: Docker CE

Se instala **Docker CE** desde el repositorio oficial de Docker
(`docker-ce`, `containerd.io` y el plugin `docker compose`). AlmaLinux trae
Podman por defecto, pero se eligió Docker porque es lo que se usa en clase y
en las PCs del equipo, y `docker compose` funciona igual en todos lados.

`/etc/docker/daemon.json`:

```json
{
  "selinux-enabled": true,
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

- `selinux-enabled`: los contenedores también quedan confinados por SELinux
  (el servidor está en modo Enforcing).
- Logs con tamaño máximo: cada contenedor guarda como mucho 3 archivos de
  10 MB, para no llenar el disco de 32 GB.

## 3. La imagen (`docker/Dockerfile`)

| Línea | Para qué |
|---|---|
| `FROM php:8.3-apache` | Imagen oficial con Apache y PHP 8.3, la misma versión que el servidor |
| `docker-php-ext-install pdo_mysql` | Extensión para conectarse a MariaDB |
| `php.ini-production`, `expose_php = Off` | Configuración de producción: no muestra errores ni la versión de PHP |
| `ServerTokens Prod`, `ServerSignature Off` | Apache no muestra su versión |
| `COPY app/ /var/www/html/` | El código va **dentro** de la imagen, no montado desde el servidor |
| `chown root:www-data`, `chmod o=` | Apache puede leer el código pero no modificarlo |
| `HEALTHCHECK` | Docker prueba cada 30 s que Apache responda |

## 4. Redes

| Red | Contenedores | Para qué |
|---|---|---|
| `sgdm_frontend` | web | Recibe las conexiones del puerto 8080 |
| `sgdm_backend` | web, db | Conexión entre la app y la base. Es `internal: true`: no tiene salida a internet ni se puede entrar desde afuera |

Dentro de la red, la app encuentra a la base por su nombre de servicio
(`DB_HOST=db`): Docker tiene su propio DNS interno.

**La base no publica ningún puerto.** Es importante porque los puertos
publicados por Docker **no pasan por las zonas de firewalld**: Docker agrega
sus propias reglas antes que las del firewall. Por eso no alcanza con cerrar
el 3306 en firewalld; la única forma segura es no publicarlo.

## 5. Volúmenes

| Volumen / montaje | Para qué |
|---|---|
| `sgdm_db_data` → `/var/lib/mysql` | Los datos de MariaDB. Sobreviven a `bajar`, a reconstruir la imagen y a reiniciar el servidor |
| `./db` → `/docker-entrypoint-initdb.d` (solo lectura) | Esquema, usuarios y cuentas demo. MariaDB los ejecuta **solo la primera vez**, con el volumen vacío |

`./db` lleva la opción `:Z` para que SELinux permita al contenedor leerlo.
El `02-users.sh` de Docker es distinto del nativo: crea los usuarios con host
`'%'`, porque la app se conecta desde otro contenedor y no desde `localhost`.

## 6. Variables de entorno

La primera vez, `docker_sgdm.sh levantar` genera `/opt/sgdm/docker/.env` con
contraseñas aleatorias (`openssl rand`), con permisos 600 (solo root).
[`docker/.env.example`](./docker/.env.example) muestra qué variables tiene.

Cada contenedor recibe solo las variables que necesita:

| Contenedor | Variables |
|---|---|
| `web` | `DB_HOST`, `DB_NAME`, `DB_APP_USER`, `DB_APP_PASSWORD` (usuario sin DDL) |
| `db` | Contraseña de root y de los tres usuarios, para crearlos al inicializar |

Así, si alguien lograra ejecutar código en el contenedor web, no tendría la
contraseña de root de la base.

## 7. Recursos

El servidor tiene 1 vCPU y 4 GB de RAM y ya corre el SGDM nativo y Netdata,
así que cada contenedor tiene un límite:

| Contenedor | RAM máxima | CPU máxima | Uso real en reposo |
|---|---|---|---|
| web | 256 MB | 0,5 | ~15 MB |
| db | 512 MB | 0,5 | ~125 MB |

Con los límites, Docker como mucho puede usar 768 MB y media CPU cada uno; un
contenedor con problemas no puede dejar sin recursos a la instalación nativa.

## 8. Arranque y salud

- `restart: unless-stopped`: los contenedores vuelven solos si se caen o si se
  reinicia el servidor (Docker queda habilitado con `systemctl enable docker`).
- La base tiene un healthcheck (`healthcheck.sh --connect --innodb_initialized`)
  y la app espera a que esté **healthy** antes de arrancar
  (`depends_on: condition: service_healthy`).
- `levantar` espera a que la app esté healthy y muestra la URL.

## 9. Comandos

| Acción | Qué hace |
|---|---|
| `instalar` | Instala Docker CE, escribe `daemon.json` y abre el 8080 en firewalld |
| `levantar` | Copia el código y los SQL, genera el `.env`, construye y levanta |
| `bajar` | Detiene y borra los contenedores; los datos quedan en el volumen |
| `estado` | `docker compose ps`, uso de CPU y RAM, redes, volúmenes y prueba HTTP |
| `logs` | Últimas 50 líneas de cada contenedor |
| `respaldo` | `mariadb-dump` dentro del contenedor → `/var/backups/sgdm/docker/` (600) |

Para empezar de cero (borra los datos del contenedor):

```bash
sudo docker compose -f /opt/sgdm/docker/docker-compose.yml down -v
sudo docker_sgdm.sh levantar
```

Log de las acciones: `/var/log/sgdm_docker.log`.

## 10. Prueba

Probado con Docker 29: los dos contenedores quedan healthy, el login con
`admin@lidenskap.com` funciona, la API lee de la base del contenedor, la base
no tiene salida a internet, `sgdm_app` no puede borrar tablas y el respaldo
genera el volcado completo (16 tablas).

En el servidor:

```bash
sudo docker_sgdm.sh estado               # web y db "healthy"
curl -I http://localhost:8080/           # 200
sudo firewall-cmd --list-ports           # 8080/tcp
```

Y abrir `http://<IP del servidor>:8080` desde otra máquina.

## 11. Lo que agregaría una empresa

- Un proxy inverso con HTTPS (Nginx, Traefik) delante del contenedor web, en
  vez de exponer el 8080 en HTTP.
- Un registro privado de imágenes, con la imagen construida una vez y
  desplegada en cada servidor, en vez de construirla en el servidor.
- Escaneo de vulnerabilidades de las imágenes (por ejemplo Trivy).
- Docker en modo rootless o Podman, para que el motor no corra como root.
- Con varios servidores, un orquestador (Kubernetes, Docker Swarm).
