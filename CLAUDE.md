# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is the deliverable repo for **SGDM (Sistema de Gestión Deportiva
Modular)**, a school project (3.º BT Tecnologías de la Información, ITS
Arias-Balparda, group "Lidenskap") graded across several subjects. The repo
is organized **by subject**, each with a `Primera Entrega` / `Segunda
Entrega` folder matching the official letra de proyecto:

```
.
├── Administración de Sistemas Operativos-Ventura-Federico/
├── Ciberseguridad-Padula-Vladimir/
├── Ingeniería de Software-Flores-Pablo/
├── Programación Fullstack-Ventura-Federico/
├── Tutoría de Proyecto UTULAB-Flores-Pablo/
├── SGDM App/                ← the actual application (see below)
└── Proyecto-...-2026-actualizado-1.pdf   ← the project brief ("letra de proyecto")
```

`SGDM App/` is the one real codebase; it's shared across every subject's
"Segunda/Tercera Entrega" grading, not owned by a single subject. The other
folders hold documentation, scripts, and shell/monitoring deliverables
specific to each subject — each has its own `README.md` tracking what the
letra de proyecto requires for that entrega and what's still pending.
Several folders also contain a copy of a file that also lives in `SGDM
App/` (e.g. `Programación Fullstack.../Segunda Entrega/01-schema.sql`) —
these are intentional mirrors for the grading folder, kept in sync by hand,
not generated. **When you change schema or roles in `SGDM App/db/`, check
whether a mirrored copy exists elsewhere and update it too.**

Some project context (professor feedback, corrections, the ESRE/UML/Gantt
docs for Ingeniería de Software) lives in Google Drive as Google Docs, not
in this repo — READMEs under each subject's `Segunda Entrega/` note when a
correction is "done in code but still needs pasting into the Drive doc".

## The application (`SGDM App/`)

Full stack: PHP 8.3 (Apache) backend + vanilla HTML/CSS/JS frontend + MySQL
8, all run via Docker Compose. No frontend build step, no bundler, no
framework — plain multi-page HTML with one shared `main.js`.

### Running it

```bash
cd "SGDM App"
docker compose up -d      # http://localhost
docker compose down       # stop
docker compose down -v    # stop AND wipe the db volume
```

**Important gotcha:** MySQL only runs the files in `db/` (schema, DCL,
seed) on a **fresh** volume. If you change `db/01-schema.sql`,
`db/02-users.sh`, or `db/03-seed-demo.sql` and the stack is already up, a
plain `docker compose up -d` will keep using the old data — you must
`docker compose down -v && docker compose up -d` to force re-initialization.

There is no lint/test/build tooling configured (no `composer.json`,
`package.json`, or `phpunit.xml`). To sanity-check a change without a full
`docker compose up`:

```bash
node --check "SGDM App/app/assets/js/main.js"     # JS syntax
php -l "SGDM App/app/src/SomeFile.php"            # PHP syntax — PHP 8.3.33 (CLI) is
                                                   # installed at C:\php, on user PATH
bash -n "path/to/script.sh"                       # shell script syntax
```

Env vars live in `SGDM App/.env` (gitignored; `.env.example` is the
template) — DB host/name and three sets of DB credentials (admin/app/
consulta), consumed by both `docker-compose.yml` and `db/02-users.sh`.

### Architecture

```
app/
├── *.html              One page per view (index, torneos, panel, perfil, ...)
├── api/                 PHP endpoints, one file per resource (login.php,
│                         torneos.php, usuarios.php, ...) — thin, no router
├── src/
│   ├── Database.php      Single PDO connection (lazy singleton), uses the
│   │                      sgdm_app DB user (CRUD only, no DDL)
│   ├── Model.php           Abstract base: all(), find(), findBy(), create(),
│   │                        update(), delete() via PDO prepared statements
│   ├── Auth.php              PHP session auth; Auth::requireRole(...roles)
│   │                          exits with 401/403 JSON if unauthorized
│   ├── RoleLabels.php         Maps role codes -> display labels
│   ├── Catalogos.php           Code <-> name translation for catalog tables
│   └── Models/                 One class per DB table (extends Model, sets
│                                 $table/$primaryKey only) — no business logic
└── assets/{css,js,img,icons}
```

- **Models are 1:1 with tables** in `db/01-schema.sql` — adding a table
  means adding a `Models/X.php` with just `$table`/`$primaryKey`, no more.
- **API endpoints are not a REST framework**: each `api/*.php` file handles
  its own `$_SERVER['REQUEST_METHOD']` switch, calls `Auth::requireRole()`
  up front when the action needs it, and echoes JSON directly.
- **Autoloading** is a tiny `spl_autoload_register` in `src/autoload.php`
  mapping `App\Foo\Bar` → `src/Foo/Bar.php`. No Composer.

### Roles

Five roles: `ADMIN`, `ORGANIZADOR`, `ARBITRO`, `PARTICIPANTE`, `PUBLICO`.
A role is defined in **three places that must stay in sync**:

1. `db/01-schema.sql` — the `rol` table seed (`INSERT INTO rol ...`)
2. `app/src/RoleLabels.php` — code → display label
3. `app/assets/js/main.js` — `SGDM_PERMISSIONS` (code → permission list) and
   the `ROL_LABEL` map used by the admin panel

`Auth::requireRole()` gates backend endpoints; `hasPermission()` /
`SGDM_PERMISSIONS` in `main.js` gates frontend UI and page-level route
guards (`applyRouteGuard()`, keyed by `document.body.dataset.page`). Admin
creates non-self-registering roles (Admin/Organizador/Árbitro) through
`api/usuarios.php`, which has its own allow-list of role codes separate
from `Auth::requireRole('ADMIN')` on the endpoint itself — check both when
adding a role.

### Database

`db/01-schema.sql` is normalized to 3FN (16 tables); derived/computed
values (e.g. match winner, standings points) are **not stored**, they're
exposed via `vista_resultado` and `vista_tabla_posiciones` views instead —
don't add columns for values that can be computed from existing ones,
follow the view pattern. Full normalization justification is in
`Programación Fullstack-Ventura-Federico/Segunda Entrega/Normalizacion_SGDM_3FN.pdf`.

`db/02-users.sh` creates three MySQL users via DCL: `sgdm_admin` (full
privileges, used for backups/maintenance), `sgdm_app` (CRUD only, what the
PHP app connects as), `sgdm_consulta` (read-only, public-data tables only).
