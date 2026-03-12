# Academic DDD — Monorepo

Sistema académico basado en DDD (Domain-Driven Design). Monorepo con backend NestJS + TypeORM/PostgreSQL y frontend React + Vite.

## Requisitos previos

- **Node.js** 20+ y **npm**
- **PostgreSQL** 14+ (para el backend)
- Opcional: **Docker** (para levantar PostgreSQL sin instalación local)

---

## 1. PostgreSQL

### Opción A: PostgreSQL instalado en el sistema

1. Instala PostgreSQL según tu sistema:
   - **macOS (Homebrew):** `brew install postgresql@16` y `brew services start postgresql@16`
   - **Ubuntu/Debian:** `sudo apt install postgresql postgresql-contrib`
   - **Windows:** [Descargar desde postgresql.org](https://www.postgresql.org/download/windows/)

2. Crea el usuario y la base de datos (o usa los valores por defecto del `.env.example`):

```bash
# Conectar como superusuario
psql -U postgres

-- Crear base de datos
CREATE DATABASE academic;

-- Si quieres otro usuario (opcional)
CREATE USER academic_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE academic TO academic_user;
\q
```

### Opción B: PostgreSQL con Docker

```bash
docker run -d \
  --name academic-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=academic \
  -p 5432:5432 \
  postgres:16-alpine
```

---

## 2. Clonar e instalar dependencias

```bash
git clone https://github.com/omarmus/academic-ddd.git
cd academic-ddd

# Instalar dependencias de todos los paquetes (workspaces)
npm install
```

---

## 3. Variables de entorno

### Backend (`packages/backend`)

Copia el ejemplo y ajusta si es necesario:

```bash
cd packages/backend
cp .env.example .env
```

Variables en `.env`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Entorno (development \| production) | `development` |
| `PORT` | Puerto del servidor API | `3000` |
| `TYPEORM_HOST` | Host de PostgreSQL | `localhost` |
| `TYPEORM_PORT` | Puerto de PostgreSQL | `5432` |
| `TYPEORM_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `TYPEORM_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `TYPEORM_DATABASE` | Nombre de la base de datos | `academic` |
| `STUDENT_DEFAULT_PASSWORD` | Contraseña por defecto para nuevos estudiantes | `TempStudent1!` |
| `JWT_SECRET` | Secreto para firmar los JWT (cambiar en producción) | — |

### Frontend (`packages/frontend`)

```bash
cd packages/frontend
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE` | Base URL del backend (ej. `http://localhost:3000`) | `http://localhost:3000` |

---

## 4. Migraciones (TypeORM)

Las migraciones se ejecutan desde la raíz del **backend**. El CLI de TypeORM usa el data-source en `src/contexts/shared/infrastructure/persistence/typeorm/data-source.ts`, que lee las variables `TYPEORM_*` del `.env` en `packages/backend`.

**Importante:** ejecuta estos comandos desde `packages/backend`:

```bash
cd packages/backend
```

### Ejecutar migraciones (crear/actualizar tablas y seeds)

```bash
npm run migrations:run
```

### Ver migraciones pendientes o aplicadas

```bash
npm run migrations:show
```

### Generar una nueva migración (tras cambiar entidades)

```bash
# Sustituye NombreDeLaMigracion por un nombre descriptivo
npm run migrations:generate -- src/contexts/shared/infrastructure/persistence/typeorm/migrations/NombreDeLaMigracion
```

### Eliminar el esquema (¡destructivo! Borra tablas)

```bash
npm run migrations:drop
```

Solo usar en desarrollo si quieres volver a correr migraciones desde cero.

---

## 5. Ejecutar el proyecto

### Desde la raíz del monorepo

```bash
# Backend y frontend a la vez
npm run dev

# Solo backend (API en http://localhost:3000)
npm run dev:backend

# Solo frontend (app en http://localhost:5173; las peticiones van a VITE_API_BASE)
npm run dev:frontend
```

### Por paquetes

**Backend:**

```bash
cd packages/backend
npm run start:dev
```

**Frontend:**

```bash
cd packages/frontend
npm run dev
```

El frontend usa la URL del backend definida en `VITE_API_BASE` (por defecto `http://localhost:3000`). Asegúrate de que el backend esté levantado para que login y datos funcionen.

---

## 6. Build y tests

```bash
# Build de todos los workspaces
npm run build

# Tests de todos los workspaces
npm run test
```

### Tests e2e (Playwright)

Los tests e2e cubren flujos completos con frontend y backend. **Antes de ejecutarlos** asegúrate de tener la app en marcha:

```bash
npm run dev
```

En otra terminal, desde la raíz del repo:

```bash
# Primera vez: descargar navegadores de Playwright
npx playwright install

# Ejecutar tests e2e (Chromium y Firefox)
npm run test:e2e

# Modo UI (depuración)
npm run test:e2e:ui
```

La URL base por defecto es `http://localhost:5173`. Puedes cambiarla con `PLAYWRIGHT_BASE_URL`.

---

## Coverage (cobertura de código)

Desde la **raíz del monorepo** puedes ejecutar el coverage de backend y frontend y ver en consola el listado de archivos con su estado (Stmts, Branch, Funcs, Lines):

```bash
npm run test:coverage
```

Se ejecuta primero el coverage del backend y luego el del frontend; en ambos se imprime la tabla por archivo y el resumen global.

**Backend** (Jest), desde `packages/backend`:

```bash
cd packages/backend
npm run test:cov
```

Genera el reporte en `packages/backend/coverage/` (HTML en `coverage/index.html`, más salida `text`/`text-summary`/`lcov` en consola).

**Frontend** (Vitest + v8):

```bash
cd packages/frontend
npm run test:coverage
```

Genera el reporte en `packages/frontend/coverage/` (HTML y formatos `text`, `text-summary`, `lcov`).

La carpeta `coverage` está en `.gitignore`.

---

## Estructura del monorepo

```
academic-ddd/
├── packages/
│   ├── backend/          # API NestJS, TypeORM, PostgreSQL
│   │   ├── .env.example
│   │   └── src/
│   │       └── contexts/
│   │           └── shared/infrastructure/persistence/typeorm/
│   │               ├── data-source.ts    # DataSource para CLI de migraciones
│   │               └── migrations/       # Migraciones TypeORM
│   └── frontend/         # React, Vite, Tailwind
│       └── .env.example
├── package.json          # Workspaces y scripts globales
└── README.md
```

---

## Resumen rápido

1. Tener Node 20+ y PostgreSQL 14+ (o Docker).
2. `npm install` en la raíz.
3. En `packages/backend`: copiar `.env.example` → `.env` y configurar `TYPEORM_*`.
4. En `packages/backend`: `npm run migrations:run`.
5. En `packages/frontend`: copiar `.env.example` → `.env` (opcional, valores por defecto válidos).
6. Desde la raíz: `npm run dev` (o `dev:backend` / `dev:frontend` por separado).

Si algo falla, revisa que la base `academic` exista, que usuario/contraseña coincidan con `.env` y que las migraciones se hayan ejecutado correctamente con `npm run migrations:show` en `packages/backend`.
