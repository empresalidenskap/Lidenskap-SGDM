# Lidenskap SGDM (Sistema de Gestión Deportiva Modular)

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

| Integrantes | |
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
│   └── Segunda Entrega/
├── SGDM App/                    ← la aplicación en sí (ver más abajo)
└── Tutoría de Proyecto UTULAB-Flores-Pablo/
    ├── Primera Entrega/
    └── Segunda Entrega/
```

`SGDM App/` vive aparte de las carpetas por materia porque es un único
código que corre para todo el proyecto. No es un entregable exclusivo de
una unidad curricular en particular, aunque su desarrollo se documenta y
evalúa dentro de Programación Fullstack.

## La aplicación

El código del sistema vive en [`SGDM App/`](./SGDM%20App/).

```
SGDM App/
├── app/
│   ├── index.html              Portada
│   ├── torneos.html            Listado de torneos con filtros
│   ├── detalle-torneo.html     Ficha de torneo: fixture, resultados, posiciones
│   ├── crear-competencia.html  Alta y configuración de competencias
│   ├── calendario.html         Calendario de enfrentamientos
│   ├── disciplinas.html        Catálogo de disciplinas
│   ├── panel.html              Panel de administración
│   ├── perfil.html             Perfil del participante
│   ├── contacto.html / privacidad.html / terminos.html
│   ├── api/                    Endpoints PHP (login, torneos, usuarios...)
│   ├── src/                    Modelos y clases PHP (POO)
│   └── assets/
│       ├── css/styles.css
│       ├── js/main.js
│       ├── img/
│       └── icons/
├── db/                          Esquema SQL, DCL y datos de prueba
├── Dockerfile
└── docker-compose.yml
```

### Cómo levantarlo

Requiere [Docker Desktop](https://www.docker.com/products/docker-desktop/)
instalado y corriendo. Desde `SGDM App/`:

```bash
cd "SGDM App"
docker compose up -d
```

Esperar unos 15-20 segundos a que MySQL inicialice, y abrir
<http://localhost>. Para bajarlo, `docker compose down`. Detalle completo
(cuentas de demostración, variables de entorno) en
[`SGDM App/README.md`](./SGDM%20App/README.md).

## Estado

| Entrega | Fecha | Estado |
|---|---|---|
| Primera entrega (digital) | 27 de julio | Entregada |
| Segunda entrega (digital) | 14 de septiembre | En curso |
| Entrega final (impresa) | 23 de octubre | Pendiente |
| Defensa | 3, 4, 5 y 6 de noviembre | Pendiente |
