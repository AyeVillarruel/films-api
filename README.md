# Films API - Gestión de Películas Star Wars

Backend desarrollado con **NestJS** para gestionar películas, con autenticación JWT, control de acceso por roles y sincronización con la [Star Wars API (SWAPI)](https://swapi.dev/).

## Características

- Autenticación JWT (registro e inicio de sesión)
- Control de acceso basado en roles (`user` / `admin`)
- CRUD de películas con restricciones por rol
- Sincronización de películas desde SWAPI
- Favoritos por usuario (agregar, listar y quitar)
- Puntuaciones y ranking de películas (escala 1–5)
- Ver más tarde (watchlist personal)
- Recomendaciones según puntuaciones, favoritos y ranking global
- Documentación interactiva con Swagger
- Pruebas unitarias
- Base de datos SQLite con migraciones TypeORM (sin `synchronize`)

## Requisitos

- Node.js >= 18
- npm >= 9

## Inicio rápido

```bash
git clone https://github.com/AyeVillarruel/films-api.git
cd films-api
npm install
cp .env.example .env
npm run start:dev
```

La app queda en **http://localhost:3000** y Swagger en **http://localhost:3000/api/docs**.

### Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | `admin@example.com` | `admin123` |
| Usuario regular | Registrarse con `POST /auth/register` | — |

El admin se crea automáticamente al iniciar la app (si ese email no existe). No hace falta configurar nada extra para probar localmente.

**Primer paso recomendado:** iniciar sesión como admin y ejecutar `POST /movies/sync` (desde Swagger o curl) para cargar las 6 películas de SWAPI.

## Instalación (opcional)

Si querés personalizar puerto o credenciales del admin:

```bash
cp .env.example .env
```

## Ejecución

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Documentación Swagger

Una vez iniciada la aplicación, accedé a la documentación interactiva en:

**http://localhost:3000/api/docs**

Desde Swagger podés probar todos los endpoints. Para endpoints protegidos, usá el botón **Authorize** e ingresá el token JWT con el formato: `Bearer <tu-token>`.

## Endpoints

### Autenticación (públicos)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/register` | Registrar nuevo usuario |
| POST | `/auth/login` | Iniciar sesión y obtener JWT |

### Películas

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/movies` | Público | Listar películas (paginado) |
| GET | `/movies/:id` | Usuario regular | Detalle de una película. **El admin queda excluido a propósito** según el enunciado. |
| POST | `/movies` | Administrador | Crear película |
| PATCH | `/movies/:id` | Administrador | Actualizar película |
| DELETE | `/movies/:id` | Administrador | Eliminar película |
| POST | `/movies/sync` | Administrador | Sincronizar desde SWAPI |
| GET | `/movies/ranking` | Público | Ranking por puntuación promedio |
| GET | `/movies/:id/ratings` | Público | Promedio y cantidad de votos |
| POST | `/movies/:id/rating` | Usuario autenticado | Puntuar (1–5, crea o actualiza) |
| GET | `/movies/:id/rating` | Usuario autenticado | Ver mi puntuación |
| DELETE | `/movies/:id/rating` | Usuario autenticado | Eliminar mi puntuación |
| GET | `/movies/recommendations` | Usuario autenticado | Recomendaciones personalizadas |

### Favoritos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/favorites` | Usuario autenticado | Listar mis películas favoritas (paginado) |
| POST | `/favorites/:movieId` | Usuario autenticado | Agregar película a favoritos |
| DELETE | `/favorites/:movieId` | Usuario autenticado | Quitar película de favoritos |

### Ver más tarde

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/watchlist` | Usuario autenticado | Listar películas para ver más tarde (paginado) |
| POST | `/watchlist/:movieId` | Usuario autenticado | Agregar a ver más tarde |
| DELETE | `/watchlist/:movieId` | Usuario autenticado | Quitar de ver más tarde |

> **Nota sobre cantidad de resultados:** `GET /movies`, `GET /favorites` y `GET /watchlist` devuelven respuestas paginadas con `{ data, total, page, limit }`. Parámetros opcionales: `?page=1&limit=20` (máximo 100). Tras sincronizar con SWAPI suelen ser **6 películas**. `GET /movies/recommendations` acepta `?limit=5` por defecto.

> **Recomendaciones:** el score combina afinidad con tus likes (70%) y calidad global normalizada (30%). Detalle en `src/recommendations/recommendations.service.ts`.

## Roles

| Rol | Permisos |
|-----|----------|
| `user` | Ver detalle de películas |
| `admin` | CRUD completo + sincronización SWAPI |

Al registrarse, los usuarios obtienen el rol `user` por defecto. **No es posible registrarse como administrador** vía API pública.

## Flujo de prueba rápido

```bash
# 1. Iniciar la app (crea el admin automáticamente)
npm run start:dev

# 2. Iniciar sesión como administrador
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 3. Sincronizar películas desde Star Wars API
curl -X POST http://localhost:3000/movies/sync \
  -H "Authorization: Bearer <token-del-paso-2>"

# 4. Listar películas (público)
curl http://localhost:3000/movies

# 5. Registrar un usuario regular
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user1234","name":"Usuario"}'

# 6. Ver detalle de película (requiere token de usuario regular)
curl http://localhost:3000/movies/<movie-id> \
  -H "Authorization: Bearer <token-del-usuario>"

# 7. Agregar película a favoritos
curl -X POST http://localhost:3000/favorites/<movie-id> \
  -H "Authorization: Bearer <token-del-usuario>"

# 8. Listar mis favoritos
curl http://localhost:3000/favorites \
  -H "Authorization: Bearer <token-del-usuario>"

# 9. Puntuar una película (1 a 5)
curl -X POST http://localhost:3000/movies/<movie-id>/rating \
  -H "Authorization: Bearer <token-del-usuario>" \
  -H "Content-Type: application/json" \
  -d '{"score":5}'

# 10. Ver ranking (opcional: ?minVotes=2&limit=10)
curl "http://localhost:3000/movies/ranking?minVotes=1"

# 11. Agregar a ver más tarde
curl -X POST http://localhost:3000/watchlist/<movie-id> \
  -H "Authorization: Bearer <token-del-usuario>"

# 12. Obtener recomendaciones personalizadas
curl "http://localhost:3000/movies/recommendations?limit=5" \
  -H "Authorization: Bearer <token-del-usuario>"
```

## Tests

```bash
# Ejecutar pruebas unitarias
npm test

# Ejecutar pruebas end-to-end
npm run test:e2e

# Con coverage
npm run test:cov
```

## Base de datos y migraciones

La app usa **SQLite** (`films.db` por defecto) con **migraciones TypeORM**. Ya no se usa `synchronize: true`.

Al iniciar, las migraciones pendientes se aplican automáticamente (`migrationsRun: true`).

```bash
# Aplicar migraciones manualmente (opcional)
npm run migration:run

# Ver estado de migraciones
npm run migration:show

# Revertir la última migración
npm run migration:revert
```

> Si venías usando una base creada con `synchronize` y falla al migrar, borrá el archivo local y dejá que se recree:
> `rm films.db` y reiniciá la app.

## Estructura del proyecto

```
src/
├── auth/           # Autenticación JWT
├── common/         # Guards, decorators, enums compartidos
├── database/       # Config TypeORM + migraciones
├── movies/         # Módulo de películas + integración SWAPI
├── favorites/      # Películas favoritas por usuario
├── watchlist/      # Ver más tarde
├── ratings/        # Puntuaciones y ranking
├── recommendations/ # Motor de recomendaciones
├── users/          # Gestión de usuarios
├── app.module.ts   # Módulo raíz
└── main.ts         # Bootstrap + Swagger
```

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_PATH` | Ruta de la base SQLite | `films.db` |
| `JWT_SECRET` | Secreto para firmar JWT (**obligatorio**, mínimo 32 caracteres) | — |
| `JWT_EXPIRES_IN` | Expiración del token JWT | `24h` |
| `ADMIN_EMAIL` | Email del admin inicial | `admin@example.com` (solo fuera de producción) |
| `ADMIN_PASSWORD` | Contraseña del admin inicial | `admin123` (solo fuera de producción) |
| `ADMIN_NAME` | Nombre del admin inicial | `Administrador` |

Copiá `.env.example` a `.env` antes de arrancar localmente. En producción, definí al menos `JWT_SECRET` y, si querés seed de admin, `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

## Publicación gratuita (GitHub + Render)

Guía completa para subir el proyecto y dejarlo online.

### Paso 1 — Crear el repositorio en GitHub

1. Entrá a [github.com](https://github.com) e iniciá sesión.
2. Clic en **+** (arriba a la derecha) → **New repository**.
3. Completá:
   - **Repository name:** por ejemplo `films-api` (elegí el nombre que quieras)
   - **Visibility:** Public (o Private si preferís)
   - **No** marques "Add a README" ni ".gitignore" (ya los tenés en el proyecto)
4. Clic en **Create repository**.
5. Copiá la URL que te muestra GitHub. Se ve así:
   - HTTPS: `https://github.com/TU-USUARIO/films-api.git`
   - SSH: `git@github.com:TU-USUARIO/films-api.git`

### Paso 2 — Subir tu código desde la terminal

Abrí la terminal en la carpeta del proyecto (`films-repo`) y ejecutá:

```bash
git init
git add .
git commit -m "$(cat <<'EOF'
feat: API REST de películas Star Wars con NestJS

Backend con autenticación JWT, roles user/admin, CRUD de películas,
sincronización con SWAPI, favoritos, puntuaciones, watchlist y
recomendaciones personalizadas. SQLite con migraciones TypeORM,
documentación Swagger y tests unitarios/e2e.
EOF
)"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/films-api.git
git push -u origin main
```

Reemplazá `TU-USUARIO` y `films-api` por tu usuario y nombre real del repo.

Si GitHub te pide autenticación, usá un **Personal Access Token** como contraseña (Settings → Developer settings → Personal access tokens).

### Paso 3 — Crear cuenta en Render

1. Entrá a [render.com](https://render.com).
2. **Get Started** → registrate con tu cuenta de **GitHub** (es lo más fácil).
3. Autorizá a Render para ver tus repositorios.

### Paso 4 — Crear el Web Service

1. En el dashboard: **New +** → **Web Service**.
2. Conectá el repo `films-api` (o como lo hayas llamado).
3. Completá el formulario:

| Campo | Valor |
|-------|-------|
| **Name** | `films-api` (o el que quieras; define parte de la URL) |
| **Region** | el más cercano a vos |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | **Free** |

4. **Environment Variables:** agregá al menos `JWT_SECRET` (32+ caracteres). Para seed de admin en prod, también `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
5. Clic en **Create Web Service** y esperá el deploy (5–10 min la primera vez).

### Paso 5 — Probar la API publicada

Cuando el deploy termine, Render te da una URL como:

`https://films-api-xxxx.onrender.com`

1. Abrí Swagger: `https://films-api-xxxx.onrender.com/api/docs`
2. **POST /auth/login** con:
   ```json
   { "email": "admin@example.com", "password": "admin123" }
   ```
3. Copiá el `access_token` de la respuesta.
4. Clic en **Authorize** → pegá: `Bearer <tu-token>`
5. Ejecutá **POST /movies/sync** (carga las 6 películas de SWAPI).
6. Verificá con **GET /movies**.

### Paso 6 — Entregar la prueba técnica

Incluí en tu entrega:

- Link al repo: `https://github.com/TU-USUARIO/films-api`
- Link a Swagger: `https://films-api-xxxx.onrender.com/api/docs`
- Credenciales admin: `admin@example.com` / `admin123`

### Qué reemplazar (checklist)

| Placeholder | Dónde | Por qué |
|-------------|-------|---------|
| `TU-USUARIO` | comandos git, URL del repo | Tu usuario de GitHub |
| `films-api` | nombre del repo / servicio | El nombre que elijas |
| `https://github.com/TU-USUARIO/films-api.git` | `git remote add origin` | URL exacta de tu repo nuevo |
| `https://films-api-xxxx.onrender.com` | links de Swagger en la entrega | URL real que te da Render |
| `<token-del-paso-2>` | curl / Authorize en Swagger | Token JWT que devuelve el login (cambia en cada sesión) |
| `<movie-id>` | curl de favoritos, rating, etc. | UUID de una película (lo ves en `GET /movies`) |
| `<token-del-usuario>` | curl del flujo de usuario | Token del usuario registrado, no del admin |
| `<url-del-repositorio>` | README inicio rápido | URL de clonado de tu repo (opcional, solo estética) |

**No tenés que reemplazar nada más** para que funcione, salvo **`JWT_SECRET` en Render** (obligatorio) y las credenciales admin si querés seed en producción.

> **Notas del plan free:** el servicio se duerme tras ~15 min sin uso; la primera request puede tardar 30–60 s. Tras cada redeploy la base SQLite se vacía: volvé a ejecutar **POST /movies/sync**.

## Tecnologías

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/) + SQLite
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Swagger](https://swagger.io/)
- [SWAPI](https://swapi.dev/)
