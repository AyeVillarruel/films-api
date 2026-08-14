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
git clone git@github.com:AyeVillarruel/films-api.git
cd films-repo
npm install
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
| GET | `/movies` | Público | Listar todas las películas |
| GET | `/movies/:id` | Usuario regular | Detalle de una película |
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
| GET | `/favorites` | Usuario autenticado | Listar mis películas favoritas |
| POST | `/favorites/:movieId` | Usuario autenticado | Agregar película a favoritos |
| DELETE | `/favorites/:movieId` | Usuario autenticado | Quitar película de favoritos |

### Ver más tarde

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/watchlist` | Usuario autenticado | Listar películas para ver más tarde |
| POST | `/watchlist/:movieId` | Usuario autenticado | Agregar a ver más tarde |
| DELETE | `/watchlist/:movieId` | Usuario autenticado | Quitar de ver más tarde |

> **Nota sobre cantidad de resultados:** `GET /movies` devuelve **todas** las películas en una sola respuesta (sin paginación). Tras sincronizar con SWAPI suelen ser **6 películas**. `GET /movies/recommendations` acepta `?limit=5` por defecto.

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
| `ADMIN_EMAIL` | Email del admin inicial | `admin@example.com` |
| `ADMIN_PASSWORD` | Contraseña del admin inicial | `admin123` |
| `ADMIN_NAME` | Nombre del admin inicial | `Administrador` |

Todas son opcionales: si no configurás nada, la app funciona con esos valores por defecto

## Tecnologías

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/) + SQLite
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Swagger](https://swagger.io/)
- [SWAPI](https://swapi.dev/)
