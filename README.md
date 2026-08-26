# Lidenskap — SGDM (Sistema de Gestión Deportiva Modular)

Repositorio del proyecto de egreso del grupo **Lidenskap**, 3roº año de
**Bachillerato Tecnológico en Tecnologías de la Información** Instituto
Tecnológico Superior "Arias-Balparda", 2026.

---

## El proyecto

El **SGDM** es una plataforma web modular para organizar, administrar y dar
seguimiento a competencias deportivas, mentales y electrónicas desde una única
herramienta.

Hoy un organizador que maneja varios tipos de torneo termina usando planillas
manuales, documentos sueltos y sistemas pensados para una sola disciplina. El
SGDM centraliza esa gestión: inscripción de participantes, generación
automática de enfrentamientos, registro de resultados, publicación de
calendarios y tablas de posiciones, y consulta pública de la información.

La modularidad es el núcleo de la propuesta: cada formato de competencia
(**liga**, **eliminación directa**, **sistema suizo**) es un módulo
independiente, de modo que la plataforma no queda atada a un deporte ni a un
único modelo de competencia.

**Arquitectura:** Modelo-Vista-Controlador
**Stack:** HTML · CSS · JavaScript (frontend) · PHP (backend) · MySQL · Apache · Docker

## Integrantes

| Integrante | |
|---|---|
| Sofía Prieto | |
| Federico Rodríguez | |
| Joaquín Villena | |
| Gastón Visos | |

## Estructura del repositorio

El repositorio está organizado **por materia**, siguiendo la misma estructura
que exige la letra de proyecto para la entrega digital, y dentro de cada
materia se separa por entrega:

```
.
├── Administración de Sistemas Operativos-Ventura-Federico/
│   ├── Primera Entrega/
│   └── Segunda Entrega/
├── Ciberseguridad-Padula-Vladimir/
│   ├── Primera Entrega/
│   └── Segunda Entrega/
├── Ingeniería de Software-Flores-Pablo/
│   ├── Primera Entrega/
│   └── Segunda Entrega/
├── Programación Fullstack-Ventura-Federico/
│   ├── Primera Entrega/
│   ├── Segunda Entrega/
│   └── app/                    ← implementación del sistema
└── Tutoría de Proyecto UTULAB-Flores-Pablo/
    ├── Primera Entrega/
    └── Segunda Entrega/
```

## La aplicación

El código del sistema vive en
[`Programación Fullstack-Ventura-Federico/app/`](./Programación%20Fullstack-Ventura-Federico/app/).

```
app/
├── index.html              Portada
├── torneos.html            Listado de torneos con filtros
├── detalle-torneo.html     Ficha de torneo: fixture, resultados, posiciones
├── crear-competencia.html  Alta y configuración de competencias
├── calendario.html         Calendario de enfrentamientos
├── disciplinas.html        Catálogo de disciplinas
├── panel.html              Panel de administración
├── perfil.html             Perfil del participante
├── contacto.html
├── privacidad.html
├── terminos.html
└── assets/
    ├── css/styles.css
    ├── js/main.js
    ├── img/
    └── icons/
```

### Cómo levantarlo

Al ser por ahora un frontend estático, alcanza con servir la carpeta `app/`:

```bash
cd "Programación Fullstack-Ventura-Federico/app"
python3 -m http.server 8080
```

Y abrir <http://localhost:8080>. También puede abrirse `index.html` directo en
el navegador, aunque se recomienda el servidor local para que las rutas
relativas se comporten igual que en producción.

## Estado

| Entrega | Fecha | Estado |
|---|---|---|
| Primera entrega (digital) | 27 de julio | Entregada |
| Segunda entrega (digital) | 14 de septiembre | En curso |
| Entrega final (impresa) | 23 de octubre | Pendiente |
| Defensa | 3, 4, 5 y 6 de noviembre | Pendiente |
