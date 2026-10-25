# Hashing, cifrado y firma digital en el SGDM

Documento de especificación de las implementaciones criptográficas del SGDM:
qué se protege, con qué algoritmo, en qué parte del proyecto está hecho y
cómo se comprueba.

Las tres técnicas resuelven problemas distintos:

| Técnica | Qué garantiza | ¿Se puede revertir? |
|---|---|---|
| **Hash** | Integridad: si el dato cambia un solo bit, el hash cambia. Guardar contraseñas sin poder leerlas | No (es de una sola vía) |
| **Cifrado** | Confidencialidad: solo lee el dato quien tiene la clave | Sí, con la clave |
| **Firma digital** | Autenticidad e integridad: el dato lo generó quien tiene la clave privada y nadie lo modificó | Se verifica con la clave pública |

## 1. Resumen

| Qué | Técnica | Algoritmo | Dónde está implementado |
|---|---|---|---|
| Contraseñas de la aplicación | Hash | bcrypt (costo 10, sal aleatoria) | `app/api/register.php`, `usuarios.php`, `login.php` |
| Contraseñas de las cuentas Linux | Hash | SHA-512 crypt (`$6$`) | `/etc/shadow`, `gestion_usuarios.sh` |
| Contraseñas de los usuarios de MariaDB | Hash | `mysql_native_password` | `02-users.sh`, `instalar_sgdm.sh` |
| Navegador ↔ servidor | Cifrado | TLS 1.2/1.3 (HTTPS) | Apache `mod_ssl`, `ssl_sgdm.sh` |
| Administración remota | Cifrado | SSH (AES-GCM / ChaCha20) | OpenSSH, `seguridad_sgdm.sh` |
| Respaldos (BD y app) | Cifrado | AES-256-CBC, clave derivada con PBKDF2 | `respaldo_sgdm.sh` |
| Respaldos (BD y app) | Hash | SHA-256 | `respaldo_sgdm.sh` |
| Respaldos (BD y app) | Firma digital | RSA 4096 + SHA-256 | `respaldo_sgdm.sh` |
| Certificado HTTPS | Firma digital | RSA 4096 + SHA-256 (CA "Lidenskap CA SGDM") | `ssl_sgdm.sh` |
| Paquetes del sistema | Firma digital | GPG (RSA) de AlmaLinux | `dnf` (`gpgcheck=1`), `dnf-automatic` |

## 2. Hashing

### 2.1 Contraseñas de la aplicación (bcrypt)

La contraseña de cada usuario del SGDM nunca se guarda: se guarda su hash
**bcrypt**, en la columna `usuario.password`.

- Al registrarse o cuando el Admin crea una cuenta:
  `password_hash($password, PASSWORD_DEFAULT)` (`api/register.php`,
  `api/usuarios.php`). En PHP 8.3 `PASSWORD_DEFAULT` es bcrypt con costo 10
  (2¹⁰ = 1024 rondas).
- Al iniciar sesión: `password_verify($password, $usuario['password'])`
  (`api/login.php`), que recalcula el hash con la sal guardada y compara en
  tiempo constante.

El resultado tiene la forma `$2y$10$` + 22 caracteres de **sal** + 31 de
hash. La sal es aleatoria para cada usuario: dos personas con la misma
contraseña tienen hashes distintos, y una tabla de hashes precalculados
(*rainbow table*) no sirve. bcrypt es lento a propósito, así que probar
contraseñas por fuerza bruta es muy costoso. Si se roba la tabla `usuario`,
las contraseñas no quedan expuestas.

La columna es `VARCHAR(255)` (y no 60) para que PHP pueda pasar a un
algoritmo más nuevo (por ejemplo Argon2) sin cambiar el esquema.

### 2.2 Contraseñas de las cuentas Linux (SHA-512)

Las contraseñas de los administradores del servidor (grupo `sgdm_admins`) se
guardan en `/etc/shadow` como hash **SHA-512 crypt** (`$6$sal$hash`, 5000
rondas), el método que define `ENCRYPT_METHOD SHA512` en `/etc/login.defs`
de AlmaLinux 8. `/etc/shadow` solo lo puede leer root.

`gestion_usuarios.sh crear-admin` genera la contraseña temporal con
`openssl rand -base64 12` (generador aleatorio criptográfico), la carga con
`chpasswd` (que aplica el hash SHA-512) y obliga a cambiarla en el primer
ingreso (`chage -d 0`).

### 2.3 Contraseñas de los usuarios de MariaDB

`sgdm_admin`, `sgdm_app` y `sgdm_consulta` se crean con `IDENTIFIED BY`, y
MariaDB guarda solo el hash (`mysql_native_password`). Es un hash viejo (SHA-1
doble, sin sal), por eso el instalador genera contraseñas largas y aleatorias
(`openssl rand -hex 16`, 128 bits) y el puerto 3306 no queda abierto hacia
afuera. Las contraseñas en texto plano solo están en `.env` y
`/etc/mysql/backup.cnf`, con permisos 600 (solo root).

### 2.4 Integridad de los respaldos (SHA-256)

Cada respaldo tiene al lado un archivo `.sha256` con su hash **SHA-256**,
en el formato estándar de `sha256sum`. Sirve para detectar un archivo dañado
(disco, copia incompleta a Google Drive) y se puede comprobar en cualquier
PC sin ninguna clave: `sha256sum -c archivo.enc.sha256`. Ver la sección 5.

## 3. Cifrado

### 3.1 HTTPS (TLS)

Todo el tráfico entre el navegador y el servidor viaja cifrado con **TLS**
(Apache con `mod_ssl`): contraseñas del login, cookie de sesión y datos de los
torneos. `http://` redirige a `https://`. Las políticas criptográficas del
sistema de AlmaLinux 8 (`update-crypto-policies --show` → `DEFAULT`) solo
permiten TLS 1.2 y 1.3, con cifrados como AES-GCM y claves RSA de 2048 bits o
más. Detalle de la instalación en [SSL.md](./SSL.md).

En TLS se combinan las tres técnicas: con el certificado (firma) el navegador
comprueba que habla con el servidor correcto, se acuerda una clave de sesión
y con ella se cifra todo con un algoritmo simétrico (AES); cada mensaje lleva
un código de autenticación que detecta cualquier modificación, y las claves
de sesión se derivan con funciones de hash (SHA-256/384).

La cookie de sesión se envía con `Secure` (solo por HTTPS), `HttpOnly` (el
JavaScript no la puede leer) y `SameSite=Lax` (`app/src/Auth.php`).

### 3.2 SSH

La administración remota del servidor es solo por **SSH**, que cifra toda la
sesión (contraseña incluida) con AES-GCM o ChaCha20-Poly1305, según las mismas
políticas criptográficas del sistema. Además `seguridad_sgdm.sh ssh` impide
entrar como root y deja entrar solo al grupo `sgdm_admins` (ver
`SEGURIDAD.md` de Administración de Sistemas Operativos). Los archivos se
copian con `scp`, que va por el mismo canal cifrado.

### 3.3 Respaldos (AES-256)

`respaldo_sgdm.sh` cifra cada respaldo antes de guardarlo y antes de mandarlo
a Google Drive, así que una copia robada (o la cuenta de Drive comprometida)
no expone la base de datos ni la configuración del servidor.

```bash
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass file:/etc/sgdm/respaldos/cifrado.clave
```

- **AES-256**: cifrado simétrico estándar, clave de 256 bits.
- La contraseña (`cifrado.clave`) son 48 bytes aleatorios
  (`openssl rand -base64 48`), creados la primera vez que se respalda.
- La clave AES se deriva de esa contraseña con **PBKDF2** (100.000
  iteraciones) y una **sal** aleatoria distinta en cada respaldo: dos
  respaldos iguales dan archivos cifrados distintos.

Se usa cifrado **simétrico** porque el mismo servidor cifra y descifra (al
restaurar). La clave tiene que estar guardada también **fuera del servidor**
(gestor de contraseñas del equipo): si se pierde el servidor, sin ella los
respaldos de Google Drive no se pueden abrir.

### 3.4 Lo que no se cifra y cómo se protege

| Qué | Por qué no se cifra | Cómo se protege |
|---|---|---|
| Base de datos en el disco del servidor | MariaDB la tiene que leer todo el tiempo | Permisos de `/var/lib/mysql`, firewall, usuarios de BD con mínimo privilegio |
| `.env`, `/etc/mysql/backup.cnf`, `cifrado.clave` | Los programas necesitan leer la contraseña real | Permisos 600, dueño root |

El siguiente paso, como en una empresa, sería cifrar el disco completo (LUKS).

## 4. Firma digital

Una firma digital se hace calculando el hash del dato y cifrándolo con la
**clave privada**. Cualquiera con la **clave pública** puede verificarla:
si el dato cambió o lo firmó otra clave, la verificación falla.

### 4.1 Certificado del servidor (CA de Lidenskap)

`ssl_sgdm.sh` crea una autoridad certificadora propia, **"Lidenskap CA
SGDM"** (RSA 4096), que **firma** el certificado del servidor (`sgdm.crt`,
firma SHA-256 con RSA). Cada PC importa una vez el certificado público de la
CA; desde ahí el navegador verifica la firma y muestra el candado. Además, en
cada conexión el servidor firma el intercambio de claves con su clave privada
(`sgdm.key`), probando que es el dueño del certificado. Ver [SSL.md](./SSL.md).

### 4.2 Firma de cada respaldo (RSA 4096)

`respaldo_sgdm.sh` firma cada respaldo cifrado con un par de claves propio,
separado de la CA:

```bash
openssl dgst -sha256 -sign   /etc/sgdm/respaldos/firma.key -out archivo.enc.sig archivo.enc
openssl dgst -sha256 -verify /etc/sgdm/respaldos/firma.pub -signature archivo.enc.sig archivo.enc
```

- `firma.key`: clave privada RSA 4096, permisos 600, no sale del servidor.
- `firma.pub`: clave pública, se puede copiar a cualquier PC para verificar.

El hash SHA-256 detecta daños accidentales, pero alguien que modifica un
respaldo también puede recalcular el `.sha256`. La firma no se puede rehacer
sin `firma.key`, así que un respaldo con firma válida **seguro lo generó el
servidor del SGDM y no fue modificado**. Antes de restaurar se verifica la
firma, para no cargar en la base un archivo adulterado.

Se firma el archivo **ya cifrado** (primero cifrar, después firmar): la
copia de Google Drive se puede verificar sin descifrarla.

### 4.3 Paquetes del sistema

`dnf` solo instala paquetes con la firma GPG de AlmaLinux (`gpgcheck=1` en
`/etc/yum.repos.d/`). `dnf-automatic`, que instala las actualizaciones de
seguridad cada día (`seguridad_sgdm.sh`), también verifica esa firma: no se
instala software modificado por un tercero.

### 4.4 Clave de host de SSH

El servidor tiene claves de host (`/etc/ssh/ssh_host_*_key`). En cada
conexión firma el intercambio con ella y el cliente la compara con la que
guardó la primera vez (`known_hosts`). Si alguien se hace pasar por el
servidor, SSH avisa "REMOTE HOST IDENTIFICATION HAS CHANGED" y no conecta.

## 5. Respaldos: cómo queda cada uno

```
mariadb-dump | gzip | AES-256 ──► bd_sgdm_20261025_030000.sql.gz.enc        (cifrado)
                                   └─ sha256sum ──► ….sql.gz.enc.sha256      (hash)
                                   └─ RSA 4096  ──► ….sql.gz.enc.sig         (firma)
```

Lo mismo para el código y la configuración (`app_sgdm_…tar.gz.enc`). Los tres
archivos se guardan en `/var/backups/sgdm/{bd,app}` (permisos 700) y se
mandan juntos a Google Drive. La rotación borra los tres a la vez.

| Archivo | Qué es | Permisos |
|---|---|---|
| `/etc/sgdm/respaldos/cifrado.clave` | Contraseña de cifrado AES-256 (guardar una copia fuera del servidor) | 600, root |
| `/etc/sgdm/respaldos/firma.key` | Clave privada de firma, RSA 4096 | 600, root |
| `/etc/sgdm/respaldos/firma.pub` | Clave pública para verificar la firma | 644 |

Las claves se crean solas en el primer respaldo. **No se deben volver a
crear**: los respaldos anteriores no se podrían descifrar ni verificar.

```bash
sudo respaldo_sgdm.sh bd                       # respaldo cifrado, con hash y firma
sudo respaldo_sgdm.sh verificar ARCHIVO.enc    # hash SHA-256 + firma digital
sudo respaldo_sgdm.sh descifrar ARCHIVO.enc    # verifica y, si está bien, descifra
sudo respaldo_sgdm.sh claves                   # dónde están las claves
```

Desde el gestor del servidor: Respaldos → 5 (verificar), 6 (descifrar) y
7 (claves).

Restaurar la base de datos desde un respaldo:

```bash
sudo respaldo_sgdm.sh descifrar /var/backups/sgdm/bd/bd_sgdm_FECHA.sql.gz.enc /root/bd.sql.gz
gunzip -c /root/bd.sql.gz | sudo mariadb --defaults-extra-file=/etc/mysql/backup.cnf sgdm
sudo rm /root/bd.sql.gz
```

Los respaldos hechos antes de este cambio (`.sql.gz` y `.tar.gz` sin `.enc`)
no están cifrados: una vez que haya respaldos nuevos, borrarlos del servidor
y de la carpeta `sgdm-backups` de Google Drive.

## 6. Cómo comprobarlo

**Hash de contraseñas**

```sql
SELECT email, password FROM usuario LIMIT 3;   -- $2y$10$..., nunca la contraseña
```

```bash
sudo grep '^sprieto:' /etc/shadow              # sprieto:$6$...
```

**Cifrado**

```bash
openssl s_client -connect IP_DEL_SERVIDOR:443 -brief </dev/null   # Protocol version: TLSv1.3, Ciphersuite: TLS_AES_256_GCM_SHA384
ssh -v -o BatchMode=yes USUARIO@IP_DEL_SERVIDOR exit 2>&1 | grep 'cipher:'   # kex: server->client cipher: aes256-gcm@openssh.com
sudo sh -c 'head -c 8 "$(ls -t /var/backups/sgdm/bd/*.enc | head -n 1)"'; echo   # Salted__ (no se ve el SQL)
```

**Firma digital**

```bash
sudo respaldo_sgdm.sh verificar /var/backups/sgdm/bd/bd_sgdm_FECHA.sql.gz.enc
# Hash SHA-256:  OK (el archivo no cambió)
# Firma digital: OK (lo generó este servidor)
```

Para mostrar que se detecta un cambio, se copia un respaldo (con su `.sha256`
y su `.sig`) y se le agrega un byte a la copia:

```bash
sudo mkdir -p /root/prueba
sudo sh -c 'cp /var/backups/sgdm/bd/bd_sgdm_FECHA.sql.gz.enc* /root/prueba/'
echo X | sudo tee -a /root/prueba/bd_sgdm_FECHA.sql.gz.enc >/dev/null
sudo respaldo_sgdm.sh verificar /root/prueba/bd_sgdm_FECHA.sql.gz.enc
# Hash SHA-256:  FALLA (archivo dañado o modificado)
# Firma digital: FALLA (no lo firmó este servidor o fue modificado)
```

`descifrar` también se niega a abrir la copia modificada.

Certificado: el candado del navegador → "La conexión es segura" → emitido por
**Lidenskap CA SGDM**; en el servidor, `sudo ssl_sgdm.sh estado` muestra
`sgdm.crt: OK` (la firma de la CA es válida).
