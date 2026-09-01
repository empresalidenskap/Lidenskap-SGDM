# Aplicación SGDM

Implementación del Sistema de Gestión Deportiva Modular: frontend
(HTML/CSS/JS) y backend PHP, servidos por Apache y conectados a MySQL.

## Estructura

```
app/
├── *.html                  Vistas del sistema
├── api/                     Endpoints PHP (login, registro, torneos, usuarios...)
├── src/
│   ├── Database.php         Conexión PDO (usuario sgdm_app)
│   ├── Model.php             CRUD base compartido
│   ├── Auth.php               Sesión de servidor y verificación de rol
│   ├── Catalogos.php           Traducción código↔nombre (disciplina/formato)
│   └── Models/                Una clase por tabla (16 en total)
└── assets/
    ├── css/styles.css      Hoja de estilos (mobile first, Flexbox/Grid)
    ├── js/main.js          Lógica de interfaz
    ├── img/                Imágenes y logotipos
    └── icons/              Iconografía de disciplinas (SVG)
```

## Ejecución con Docker

Esta carpeta (`SGDM App/`) es autocontenida: trae su propio `Dockerfile`,
`docker-compose.yml` y `db/` con el esquema y los datos de prueba. Desde
acá:

```bash
docker compose up -d
```

Abrir <http://localhost>. Levanta Apache+PHP sirviendo `app/` y una base
MySQL con el esquema, el DCL (usuarios `sgdm_admin`/`sgdm_app`/
`sgdm_consulta`) y las 4 cuentas de demostración ya cargadas. Para bajarlo:
`docker compose down` (agregar `-v` para reiniciar la base desde cero).

Más detalle de las variables de entorno en `../README.md` (la carpeta
`SGDM App/` raíz, no esta).

## Ejecución local sin Docker

No es una opción real hoy: la aplicación ya tiene backend en PHP con
conexión a MySQL (login, registro, torneos, panel), así que un servidor
puramente estático (`python3 -m http.server`) solo serviría el HTML sin
ninguna de esas funciones. Usar Docker.

## Convenciones

- Los nombres de archivo van **siempre en minúsculas**: en un servidor Linux
  las rutas distinguen mayúsculas de minúsculas y `Contacto.html` no es lo
  mismo que `contacto.html`.
- Las rutas a recursos son relativas a la raíz de `app/`, de modo que las
  páginas funcionan igual servidas por Apache que por un servidor local.
- El maquetado sigue la filosofía **mobile first**, usando Flexbox y Grid.
