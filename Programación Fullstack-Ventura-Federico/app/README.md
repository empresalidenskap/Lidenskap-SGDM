# SGDM — Aplicación

Implementación del Sistema de Gestión Deportiva Modular.

## Estructura

```
app/
├── *.html                  Vistas del sistema
└── assets/
    ├── css/styles.css      Hoja de estilos (mobile first, Flexbox/Grid)
    ├── js/main.js          Lógica de interfaz
    ├── img/                Imágenes y logotipos
    └── icons/              Iconografía de disciplinas (SVG)
```

## Ejecución local

```bash
python3 -m http.server 8080
```

Abrir <http://localhost:8080>.

## Convenciones

- Los nombres de archivo van **siempre en minúsculas**: en un servidor Linux
  las rutas distinguen mayúsculas de minúsculas y `Contacto.html` no es lo
  mismo que `contacto.html`.
- Las rutas a recursos son relativas a la raíz de `app/`, de modo que las
  páginas funcionan igual servidas por Apache que por un servidor local.
- El maquetado sigue la filosofía **mobile first**, usando Flexbox y Grid.
