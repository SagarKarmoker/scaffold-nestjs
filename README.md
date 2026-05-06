# Scaffold Nest

A NestJS application scaffold with production-ready middleware, API versioning, and JWT authentication.

## Features

- **API Versioning** - `/api/v1` prefix with URI-based versioning
- **Swagger** - Auto-generated docs at `/v1/docs`
- **Authentication** - Passport.js + JWT with refresh tokens
- **Security** - Helmet, CORS enabled, password hashing
- **Single Session** - Login revokes previous tokens
- **Role-based Authorization** - @Roles() decorator for route protection
- **Performance** - Compression, global caching (5s TTL)
- **Rate Limiting** - 10 requests/minute
- **Logging** - Winston with file rotation
- **Error Handling** - Global exception filter with structured responses

## Quick Start

```bash
# Install dependencies
pnpm install

# Development (hot reload)
pnpm dev

# Production build
pnpm build
pnpm start:prod
```

## Configuration

Create `.env` file:

```
PORT=8080
ENVIRONMENT=development
SERVER_URL=http://localhost
DB_PATH=./app.db
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d
```

Uses SQLite with `better-sqlite3` (no external DB required).

## Authentication API

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Login (returns tokens) | No |
| `/auth/refresh` | POST | Refresh access token | No |
| `/auth/logout` | POST | Revoke tokens | Yes |
| `/auth/profile` | GET | Get current user | Yes |

**Register:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John"
  }
}
```

**Protected Route:**
```bash
curl -X GET http://localhost:8080/api/v1/auth/profile \
  -H "Authorization: Bearer <access_token>"
```

## Role-based Authorization

```typescript
// Admin only route
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
@Get('admin')
adminOnly() {}
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Hot reload development |
| `pnpm start:debug` | Debug mode |
| `pnpm build` | Build for production |
| `pnpm start:prod` | Run production build |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run e2e tests |
| `pnpm lint` | Lint with auto-fix |
| `pnpm format` | Prettier formatting |

## API

- Base URL: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/v1/docs`

## Tech Stack

- NestJS 11
- pnpm
- TypeScript (ES2023, strict null checks)
- Passport.js + JWT
- bcrypt for password hashing
- TypeORM + better-sqlite3
- Jest for testing
- ESLint + Prettier
- Winston logging

## SonarQube

```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:latest
```

```bash
docker start sonarqube
```

- Server: http://localhost:9000
- Generate a token in SonarQube UI

```bash
sonar-scanner \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<your-token> \
  -Dsonar.projectKey=scaffold-nest
```