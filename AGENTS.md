# AGENTS.md

## Commands

```bash
# Dev -> Build -> Prod
pnpm dev          # Hot reload
pnpm build        # Compile to dist/
pnpm start:prod   # Run production

# Test
pnpm test         # Unit tests
pnpm test:e2e     # E2E tests (uses test/jest-e2e.json)

# Lint & Format
pnpm lint    # ESLint --fix
pnpm format  # Prettier write
```

## Verified Facts

- **Entry**: `src/main.ts` → `src/app.module.ts`
- **API**: `/api/v1` prefix, versioning enabled
- **Swagger**: `/v1/docs`
- **Health**: `/health`, `/ready` (via @nestjs/terminus)

## Non-Obvious Patterns

- **Validation**: ValidationPipe has `forbidNonWhitelisted: true` - extra props on requests fail with 400
- **Logging**: Winston with file rotation (`logs/error.log`, `logs/combined.log`) + correlation via `x-request-id` header
- **Errors**: `AllExceptionsFilter` distinguishes 4xx (warn) vs 5xx (error log), hides internal errors from clients
- **Shutdown**: `app.enableShutdownHooks()` handles SIGTERM gracefully
- **Testing**: Module alias `^src/(.*)$` maps to `<rootDir>/src/$1` in Jest

## Required Env (.env)

```
PORT=8080
JWT_SECRET=...        # Min 32 chars in prod
JWT_REFRESH_SECRET=...
DB_PATH=./app.db
```

## Auth Flow

1. `POST /api/v1/auth/register` → returns access_token + refresh_token
2. `POST /api/v1/auth/login` → same response
3. `GET /api/v1/auth/profile` → Bearer token required

Role protection:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
@Get('admin')
adminOnly() {}
```

## Database

- TypeORM + better-sqlite3 (no external DB)
- Entities in `src/**/entities/*.entity.ts`
- Use `BaseEntity` for id, createdAt, updatedAt

## Refs

- Full guide: `PRODUCTION_GUIDE.md`