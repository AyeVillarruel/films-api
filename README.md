# Films API - Gestión de Películas Star Wars

Backend con **NestJS**, autenticación JWT, roles `user`/`admin`, sincronización con [SWAPI](https://swapi.dev/), favoritos, puntuaciones, watchlist y recomendaciones.

## Requisitos

- Node.js >= 18
- npm >= 9

## Local

```bash
git clone https://github.com/AyeVillarruel/films-api.git
cd films-api
npm install
cp .env.example .env
```

Definí `JWT_SECRET` en `.env` (mínimo 32 caracteres) y arrancá:

```bash
npm run start:dev
```

Swagger: **http://localhost:3000/api/docs**

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | `admin@example.com` | `admin123` |
| Usuario | `POST /auth/register` | — |

### Prueba en Swagger

1. **POST /auth/login** con admin → copiar `accessToken` → **Authorize**
2. **POST /movies/sync**
3. **GET /movies** → copiar un `id`
4. **POST /auth/register** → **Authorize** con el token del usuario
5. **GET /movies/{id}**
6. **POST /favorites/{movieId}**
7. **GET /favorites**
8. **POST /movies/{id}/rating** con `{ "score": 5 }`
9. **GET /movies/ranking**
10. **POST /watchlist/{movieId}**
11. **GET /movies/recommendations**

## Tests

```bash
npm test
npm run test:e2e
```

## Producción

Swagger: **https://films-api-xxxx.onrender.com/api/docs**

Variables en Render: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

Misma secuencia de [Prueba en Swagger](#prueba-en-swagger). Tras cada deploy, repetir el paso 2 (`POST /movies/sync`).

## Endpoints

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| GET | `/movies` | Público |
| GET | `/movies/ranking` | Público |
| GET | `/movies/:id/ratings` | Público |
| GET | `/movies/:id` | Usuario |
| POST | `/movies/sync` | Admin |
| POST/PATCH/DELETE | `/movies` | Admin |
| POST/GET/DELETE | `/movies/:id/rating` | Autenticado |
| GET | `/movies/recommendations` | Autenticado |
| GET/POST/DELETE | `/favorites/:movieId` | Autenticado |
| GET/POST/DELETE | `/watchlist/:movieId` | Autenticado |

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto | `3000` |
| `DB_PATH` | Base SQLite | `films.db` |
| `JWT_SECRET` | Firma JWT (obligatorio, 32+ chars) | — |
| `JWT_EXPIRES_IN` | Expiración del token | `24h` |
| `ADMIN_EMAIL` | Admin inicial | `admin@example.com` |
| `ADMIN_PASSWORD` | Contraseña admin | `admin123` |
| `ADMIN_NAME` | Nombre admin | `Administrador` |
