# Seguridad del servidor (firewall, iptables, antivirus y otros)

Documentación del ítem "Implementación de firewall, iptables, antivirus, entre
otros dentro del servidor" de la Tercera Entrega. Todo está automatizado en
[`seguridad_sgdm.sh`](./seguridad_sgdm.sh), instalado en `/usr/local/sbin`.

```bash
sudo seguridad_sgdm.sh todo      # aplica todas las medidas
sudo seguridad_sgdm.sh estado    # resumen para verificar
```

También se puede usar desde el gestor del servidor (`gestion_servidor_sgdm.sh`,
opción **7) Seguridad**).

## 1. Resumen

| Medida | Herramienta | Acción del script |
|---|---|---|
| Firewall | firewalld (backend nftables) | `firewall` |
| Bloqueo de ataques de fuerza bruta | fail2ban | `fail2ban` |
| Antivirus | ClamAV (escaneo programado) | `antivirus`, `escanear` |
| Acceso remoto seguro | OpenSSH | `ssh` |
| Parches de seguridad | dnf-automatic | `actualizaciones` |
| Endurecimiento de red | sysctl del kernel | `kernel` |

Además, SELinux queda en modo **Enforcing** (lo verifica `instalar_sgdm.sh`).

El servidor es una VM AlmaLinux 8.10 Minimal con **1 vCPU, 4 GB de RAM y 32 GB
de disco**, que ya corre Apache, PHP-FPM, MariaDB y Netdata. Todas las
decisiones de abajo tienen en cuenta ese límite de recursos.

## 2. Firewall: firewalld e iptables

En AlmaLinux 8, `firewalld` es el firewall del sistema. Es una capa de
administración por encima del filtrado de paquetes del kernel. En versiones
anteriores escribía reglas de **iptables**; en AlmaLinux 8 usa **nftables**, que
lo reemplaza. No se instala el servicio `iptables-services` porque entra en
conflicto con firewalld (los dos intentarían manejar las mismas reglas).

Configuración aplicada:

- Zona `public` solo con los servicios **ssh (22), http (80) y https (443)**.
- Se quitan `cockpit` y `dhcpv6-client`, que vienen abiertos por defecto y no se usan.
- Todo lo demás se **rechaza**: MariaDB (3306) y Netdata (19999) no son
  accesibles desde afuera (Netdata solo por túnel SSH, ver Segunda Entrega).
- `LogDenied=unicast`: los paquetes rechazados quedan registrados en el journal.

Ver las reglas reales que firewalld cargó en el kernel:

```bash
sudo firewall-cmd --list-all
sudo nft list table inet firewalld | less
sudo journalctl -k | grep -i reject      # paquetes rechazados
```

### SSH solo desde una red

Arriba de todo en el script está la variable `SSH_RED_PERMITIDA`. Vacía, SSH
queda abierto desde cualquier lado (protegido por fail2ban y la configuración
de SSH). Si se pone una red, por ejemplo `SSH_RED_PERMITIDA="192.168.1.0/24"`,
el puerto 22 solo acepta conexiones desde esa red.

Lo que haría una empresa: **nunca dejar SSH abierto a internet**. Los
administradores entran por una VPN o por un servidor intermedio ("bastión"), o
el puerto 22 solo se permite desde la red de administración. Aquí se deja
abierto por defecto para no perder el acceso desde fuera del ITS.

## 3. Fail2ban

Fail2ban lee los logs y, si una IP falla demasiadas veces, la bloquea en
firewalld durante **1 hora**. Se instala desde EPEL junto con
`fail2ban-firewalld` (que hace que los bloqueos se apliquen con firewalld).

| Jail | Qué vigila | Intentos | Ventana |
|---|---|---|---|
| `sshd` | Contraseñas incorrectas en SSH | 5 | 10 min |
| `sgdm-login` | Logins fallidos de la app SGDM | 10 | 10 min |

Para la app no hizo falta tocar el código: `api/login.php` ya responde **401**
cuando el correo o la contraseña son incorrectos, y eso queda en el log de
Apache. El filtro `/etc/fail2ban/filter.d/sgdm-login.conf` busca las líneas
`"POST /api/login.php ..." 401` en `sgdm-access.log` y `sgdm-ssl-access.log`.

```bash
sudo fail2ban-client status sgdm-login
sudo fail2ban-client banned
sudo fail2ban-client unban <IP>          # o desde el gestor, opción 7
```

## 4. Antivirus: ClamAV

Se usa **ClamAV** (EPEL), el antivirus libre más usado en servidores Linux.

**Por qué escaneos programados y no el demonio `clamd`:** `clamd` mantiene
todas las firmas cargadas en memoria todo el tiempo, entre 1 y 1,5 GB de RAM.
En una VM de 4 GB que ya corre la aplicación completa, eso le quitaría memoria
a MariaDB y Apache. Con `clamscan` programado la memoria solo se usa durante el
escaneo, de madrugada.

- `freshclam` actualiza las firmas todos los días a las **02:30**.
- `clamscan` revisa `/var/www/html`, `/home`, `/tmp`, `/var/tmp` y `/opt/sgdm`
  todos los días a las **04:00** (después de los respaldos de las 03:00 y
  03:30), con prioridad baja de CPU y disco (`nice`/`ionice`).
- Lo infectado se mueve a `/var/lib/sgdm/cuarentena` (solo root), y queda una
  ALERTA en `/var/log/sgdm_seguridad.log` y en el journal (`journalctl -t sgdm_seguridad`).
- Con SELinux en Enforcing se activa el booleano `antivirus_can_scan_system`
  para que ClamAV pueda leer todo el sistema.

Prueba con el archivo de prueba estándar EICAR (no es un virus real, todos los
antivirus lo detectan a propósito):

```bash
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > /tmp/eicar.txt
sudo seguridad_sgdm.sh escanear
sudo ls /var/lib/sgdm/cuarentena        # el archivo aparece acá
sudo tail /var/log/sgdm_antivirus.log
```

## 5. SSH

Se agrega un bloque al principio de `/etc/ssh/sshd_config` (en AlmaLinux 8,
sshd usa el primer valor que encuentra; el original queda en `sshd_config.orig`):

| Directiva | Valor | Motivo |
|---|---|---|
| `PermitRootLogin` | `no` | Cada administrador entra con su cuenta y usa `sudo` (queda registrado quién hizo qué) |
| `AllowGroups` | `sgdm_admins` | Solo el equipo puede entrar por SSH |
| `MaxAuthTries` | `3` | Menos intentos por conexión |
| `LoginGraceTime` | `30` | Corta las conexiones que no se autentican |
| `X11Forwarding` | `no` | El servidor no tiene entorno gráfico |
| `ClientAliveInterval` / `CountMax` | `300` / `2` | Cierra sesiones colgadas a los 10 minutos |
| `Banner` | `/etc/issue.net` | Aviso legal de acceso restringido |

Para no dejar el servidor sin acceso, el script **no cambia nada** si el grupo
`sgdm_admins` no tiene al menos un usuario habilitado, y valida la
configuración con `sshd -t` antes de aplicarla (si falla, restaura la
anterior). Siempre probar el acceso en otra terminal antes de cerrar la sesión.

Siguiente paso, como en una empresa: entrar solo con **llaves SSH**
(`PasswordAuthentication no`). Por ahora se mantienen las contraseñas porque el
equipo usa las contraseñas temporales de `gestion_usuarios.sh`.

## 6. Actualizaciones de seguridad automáticas

`dnf-automatic` se ejecuta todos los días e instala **solo las
actualizaciones de seguridad** (`upgrade_type = security`), para cerrar
vulnerabilidades conocidas sin cambiar versiones de forma inesperada. Las
actualizaciones del kernel necesitan reiniciar el servidor a mano.

```bash
systemctl list-timers dnf-automatic*
```

## 7. Ajustes de red del kernel

Archivo `/etc/sysctl.d/90-sgdm.conf`:

| Parámetro | Para qué |
|---|---|
| `tcp_syncookies = 1` | Resiste ataques SYN flood (un tipo de DoS) |
| `rp_filter = 1` | Descarta paquetes con IP de origen falsificada |
| `accept_redirects = 0`, `send_redirects = 0` | Evita que se modifique la ruta del servidor con ICMP |
| `accept_source_route = 0` | Rechaza paquetes que eligen su propia ruta |
| `icmp_echo_ignore_broadcasts = 1` | Evita ser usado en ataques "smurf" |
| `log_martians = 1` | Registra paquetes con direcciones imposibles |

## 8. Lo que agregaría una empresa

- VPN o bastión para SSH, y solo llaves SSH.
- Un WAF (por ejemplo ModSecurity en Apache) delante de la aplicación.
- Un IDS/IPS como Suricata o Wazuh, con alertas centralizadas.
- Antivirus con escaneo en tiempo real (`clamd` + `clamonacc`) si el servidor
  tiene RAM suficiente o si la app aceptara archivos subidos por usuarios.
