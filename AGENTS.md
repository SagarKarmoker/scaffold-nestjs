# AGENTS.md

## Commands

```bash
pnpm dev          # Hot reload
pnpm build        # Compile to dist/
pnpm start:prod   # Run compiled output

pnpm test         # Unit tests (Jest, *.spec.ts)
pnpm test:e2e     # E2E tests (test/jest-e2e.json, *.e2e-spec.ts)

pnpm lint         # ESLint --fix
pnpm format       # Prettier write
```

## Startup (external deps required)

Requires **PostgreSQL** + **Redis** running. Easiest way:

```bash
docker-compose up postgres redis -d    # start infra only
pnpm dev                                # hot-reload locally

# Or everything together:
docker-compose up --build
```

## Non-Obvious Patterns

- **Real DB is PostgreSQL.** `core/database/` has an unused sqlite provider — ignore it. The active config is `app.module.ts:78` with `type: 'postgres'` + `DATABASE_URL`, connection pool `max: 20`.
- **BullMQ requires Redis.** App will fail to start without Redis, even if you never use queues.
- **Rate limiter is proxy-aware** (`ThrottlerBehindProxyGuard`). Reads `X-Forwarded-For` for real client IP. Custom 429 response.
- **CacheInvalidationInterceptor** is a global interceptor — evicts specified Redis cache keys on any POST/PUT/PATCH/DELETE.
- **Orders module** is a reference pattern for async processing (BullMQ queue + Redis cache). Not a real business feature.
- **Clustering**: in-process via `CLUSTERING=true` env, or external via PM2 (`ecosystem.config.js`). Not both.
- **No CI workflow** defined. `.github/` only has SonarQube MCP instructions.

## Required Env (minimal .env)

```
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/scaffold_nest
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=...              # Min 32 chars in prod
JWT_REFRESH_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

## Endpoints

| Path | Notes |
|---|---|
| `/api/v1/*` | All API routes |
| `/v1/docs` | Swagger UI |
| `/health`, `/health/ready` | Liveness / readiness probes |
| `/bull-board` | BullMQ queue monitoring UI |
