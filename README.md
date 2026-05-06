# Scaffold Nest

A production-ready NestJS application scaffold with JWT authentication, API versioning, and best practices.

## Features

- **API Versioning** - `/api/v1` prefix with URI-based versioning
- **Swagger** - Auto-generated docs at `/v1/docs`
- **Authentication** - Passport.js + JWT with refresh tokens (single session)
- **Security** - Helmet, CORS, rate limiting (10 req/min), bcrypt
- **Validation** - class-validator with whitelist + forbidNonWhitelisted
- **Logging** - Winston with file rotation + request correlation (`x-request-id`)
- **Error Handling** - Global filter distinguishes 4xx (warn) vs 5xx (error)
- **Health Checks** - `/health`, `/ready`, `/live` via @nestjs/terminus
- **Graceful Shutdown** - Handles SIGTERM/SIGINT

## Quick Start

```bash
pnpm install
pnpm dev
```

## Configuration

Create `.env`:

```env
PORT=8080
ENVIRONMENT=development
SERVER_URL=http://localhost
DB_PATH=./app.db
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Hot reload |
| `pnpm build` | Compile to dist/ |
| `pnpm start:prod` | Run production |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | E2E tests |
| `pnpm lint` | ESLint --fix |
| `pnpm format` | Prettier write |

## API

- Base: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/v1/docs`
- Health: `http://localhost:8080/health`

### Auth Endpoints

| Endpoint | Method | Auth |
|----------|--------|------|
| `/auth/register` | POST | No |
| `/auth/login` | POST | No |
| `/auth/refresh` | POST | No |
| `/auth/profile` | GET | Yes |
| `/auth/logout` | POST | Yes |

### Role Protection

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
@Get('admin')
adminOnly() {}
```

## Tech Stack

- NestJS 11
- pnpm + TypeScript (ES2023, strict null checks)
- Passport.js + JWT + bcrypt
- TypeORM + better-sqlite3
- Winston + Jest

## Refs

- Agent instructions: `AGENTS.md`
- Production guide: `PRODUCTION_GUIDE.md`