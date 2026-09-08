# Sistema de monitoreo (Netdata)

Documentación de instalación para el ítem "Sistema de monitoreo implementado en
el servidor (Zabbix, Grafana, etc.) Documentar Instalación" de la Segunda Entrega.

## 1. Resumen

Se instala [Netdata](https://www.netdata.cloud/) en el servidor de SGDM para tener
monitoreo en tiempo real de CPU, RAM, disco, red y procesos, además de métricas de
MariaDB. La instalación y configuración están automatizadas en
[`monitoreo_sgdm.sh`](./monitoreo_sgdm.sh); este documento explica qué hace ese
script, por qué se tomaron esas decisiones, y cómo hacerlo a mano si hiciera falta.

## 2. Por qué Netdata y no Zabbix/Grafana

El servidor es una única VM AlmaLinux 8.10 Minimal con **1 vCPU, 4GB RAM y 32GB de
disco thin-provisioned** (ver Primera Entrega), ya usados por Apache + PHP + MariaDB
para la app. No hay presupuesto para un segundo servidor dedicado a monitoreo.

- **Zabbix** necesita su propia base de datos, un frontend PHP y un proceso server
  corriendo todo el tiempo: mucho más pesado en una VM que ya está justa de
  recursos.
- **Grafana + Prometheus** son dos servicios adicionales corriendo en simultáneo
  (el combo más pesado de los tres).
- **Netdata** es un único agente con dashboard web incorporado, sin base de datos
  propia ni proceso servidor separado. Es la opción que mejor entra en el
  presupuesto de recursos ya ajustado de esta VM.

## 3. Qué se instaló y cómo

EPEL **no** empaqueta `netdata` para AlmaLinux/RHEL 8, así que no se pudo usar
`dnf install netdata` directo desde un repo ya confiable del sistema. Se usó el
instalador oficial de Netdata (`kickstart.sh`), pero evitando un `curl | bash`
ciego:

```bash
sudo ./monitoreo_sgdm.sh instalar
```

Internamente, esa acción:

1. Descarga el instalador a un archivo local (`curl -fsSL ... -o /tmp/netdata-kickstart.sh`),
   en vez de ejecutarlo directo desde la red.
2. Registra el hash SHA-256 del archivo descargado en `/var/log/sgdm_monitoreo.log`,
   para poder auditar más adelante exactamente qué se ejecutó.
3. Recién ahí lo ejecuta, con `--non-interactive --disable-telemetry --stable-channel`.

El instalador detecta la distribución y arma paquetes nativos automáticamente
(maneja EPEL como dependencia si hace falta).

## 4. Pasos manuales equivalentes (por si el script falla)

```bash
curl -fsSL https://get.netdata.cloud/kickstart.sh -o /tmp/netdata-kickstart.sh
sha256sum /tmp/netdata-kickstart.sh          # revisar antes de ejecutar
sudo sh /tmp/netdata-kickstart.sh --non-interactive --disable-telemetry --stable-channel

sudo systemctl enable --now netdata
```

Luego, en `/etc/netdata/netdata.conf`:

```ini
[web]
    bind to = 127.0.0.1

[db]
    dbengine multihost disk space MB = 256   # el nombre exacto de esta directiva
                                              # puede variar según la versión instalada

[global]
    anonymous statistics = no
```

```bash
sudo systemctl restart netdata
```

El script `configurar` hace exactamente esto (con detección automática del nombre
de la directiva de retención, que cambió entre versiones de Netdata).

## 5. Seguridad: por qué no se abre un puerto nuevo

El firewall del servidor (firewalld) solo deja pasar los puertos **22, 80 y 443**
entrantes (ver manual del servidor Proxmox del ITS). El dashboard de Netdata usa
el puerto 19999 por defecto, que **no** está en esa lista.

En vez de abrir un puerto nuevo en firewalld o poner un reverse proxy en Apache
(que expondría el dashboard públicamente si no se protege bien), se configuró
Netdata para escuchar solo en `127.0.0.1` (loopback). El único modo de llegar al
dashboard es haciendo un túnel sobre la conexión SSH que ya existe:

## 6. Cómo acceder al dashboard

Desde tu máquina (no desde el servidor):

```bash
ssh -L 19999:localhost:19999 usuario@10.0.0.X
```

(reemplazando `usuario` por tu usuario del servidor y `10.0.0.X` por la IP de la
VM, según el esquema `10.0.0.X/23` del manual de Proxmox — `X` son los últimos 3
dígitos del ID de la VM).

Con el túnel abierto, entrar a `http://localhost:19999` en el navegador local.

## 7. Qué se monitorea

- **Sistema operativo** (siempre activo apenas se instala): CPU, RAM, swap, disco,
  red, procesos, carga del sistema — justo lo que hace falta para vigilar que la
  única vCPU y los 4GB de RAM del servidor no se saturen.
- **MariaDB** (opcional, vía `sudo ./monitoreo_sgdm.sh collectors-mysql`): crea un
  usuario `netdata_monitor@localhost` con permisos **únicamente** de
  `USAGE, PROCESS, REPLICATION CLIENT` — sin acceso a ninguna tabla ni base de
  datos de la app. Mismo principio de privilegio mínimo ya usado en
  `../Primera Entrega/gestion_usuarios.sh`.
- **Apache** (opcional, vía `sudo ./monitoreo_sgdm.sh collectors-apache`): habilita
  `mod_status` (ya viene compilado en `httpd`, no requiere paquete aparte) mediante
  una conf propia en `/etc/httpd/conf.d/status-netdata.conf` que solo permite el
  acceso a `/server-status` desde `localhost` (`Require local`), y apunta el
  collector `go.d/apache` de netdata a `http://127.0.0.1/server-status?auto`. No
  se abre ningún puerto nuevo: `/server-status` se sirve dentro del mismo Apache
  que ya escucha en 80/443, solo que restringido a loopback.

## 8. Mantenimiento

- Log de instalación/configuración: `/var/log/sgdm_monitoreo.log`.
- Estado del servicio: `sudo ./monitoreo_sgdm.sh estado`, o `systemctl status netdata`.
- Para uso interactivo puntual (arrancar/parar/reiniciar netdata a mano),
  `gestionar_servicio.sh` también sirve: ingresando `netdata` como nombre de
  servicio.

## 9. Limitaciones / pendientes

- El nombre exacto de la directiva de retención en disco de `netdata.conf` puede
  variar según la versión de Netdata que instale el kickstart en el momento; el
  script prueba varios nombres conocidos y avisa en el log si no encuentra
  ninguno, para no fallar en silencio.
