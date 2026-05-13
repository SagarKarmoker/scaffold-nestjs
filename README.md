# Scaffold NestJS

A **production-ready NestJS monolith** with Redis caching, BullMQ job queues, PostgreSQL, clustering, Kubernetes support, and full observability.

## Architecture

| Feature | Implementation |
|---|---|
| **Clustering** | Node.js `cluster` (in-process) or PM2 cluster mode |
| **Rate Limiting** | `@nestjs/throttler` – 100 req/min/IP, proxy-aware |
| **Caching** | `@nestjs/cache-manager` + Redis (`@keyv/redis`) |
| **Job Queues** | BullMQ + Redis, BullBoard UI at `/bull-board` |
| **Database** | TypeORM + PostgreSQL with connection pool (max 20) |
| **Security** | Helmet, CORS, ValidationPipe (`whitelist` + `forbidNonWhitelisted`) |
| **Logging** | Winston, file rotation, `x-request-id` correlation |
| **Health** | `/health` (DB + Redis), `/health/ready` |
| **API Docs** | Swagger at `/v1/docs` |

## Quick Start

```bash
# Install
pnpm install
cp .env.example .env

# Start infra (PostgreSQL + Redis) and app
docker-compose up --build

# Or run infra in background, app with hot-reload
docker-compose up postgres redis -d
pnpm dev
```

- **API**: `http://localhost:8080/api/v1`
- **Swagger**: `http://localhost:8080/v1/docs`
- **BullBoard**: `http://localhost:8080/bull-board`

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register → access + refresh tokens |
| `POST` | `/auth/login` | No | Login |
| `POST` | `/auth/refresh` | No | Refresh tokens |
| `POST` | `/auth/logout` | Yes | Revoke tokens |
| `GET` | `/auth/profile` | Yes | Current user |
| `POST` | `/orders` | Yes | Create order (queues background job, returns 201) |
| `GET` | `/orders` | Yes | List orders (paginated) |
| `GET` | `/orders/:id` | Yes | Get order (Redis cached 60 s) |
| `PUT` | `/orders/:id` | Yes | Update order (invalidates cache) |
| `DELETE` | `/orders/:id` | Yes | Delete order |
| `POST` | `/notify` | No | Queue email notification (returns 202) |
| `GET` | `/notify/metrics` | No | Email queue metrics |
| `GET` | `/health` | No | Liveness probe (DB + Redis) |
| `GET` | `/health/ready` | No | Readiness probe |

## Scaling

```bash
# Option 1 – In-process clustering
CLUSTERING=true node dist/main.js

# Option 2 – PM2 (recommended for VMs)
pnpm build && pm2 start ecosystem.config.js

# Option 3 – Kubernetes
kubectl apply -f k8s/   # HPA: 2-10 replicas, CPU > 70%
```

## Commands

```bash
pnpm dev          # Hot reload
pnpm build        # Compile to dist/
pnpm start:prod   # Run compiled output
pnpm test         # Unit tests (Jest, *.spec.ts)
pnpm test:e2e     # E2E tests (test/jest-e2e.json)
pnpm lint         # ESLint --fix
pnpm format       # Prettier write
```

## Database Migrations

Migrations are the **single source of truth** for schema changes. `synchronize` is permanently disabled for PostgreSQL — never rely on auto-sync against a real database.

```bash
# Generate a migration after changing an entity
pnpm migration:generate src/migrations/<MigrationName>

# Create a blank migration manually
pnpm migration:create src/migrations/<MigrationName>

# Apply all pending migrations
pnpm migration:run

# Revert the last applied migration
pnpm migration:revert

# Show applied / pending status
pnpm migration:show
```

**Workflow after editing an entity:**
1. Modify `*.entity.ts`
2. Run `pnpm migration:generate src/migrations/<DescriptiveName>`
3. Review the generated file in `src/migrations/`
4. Run `pnpm migration:run` to apply

> **`synchronize` behaviour:** disabled (`false`) for PostgreSQL in all environments. Only enabled for SQLite local dev. Never enable it against a real database — it can silently drop columns.

The CLI data source config is at `src/core/database/data-source.ts`. Entities glob: `src/**/*.entity.{ts,js}`. Migrations: `src/migrations/*`.

## Tech Stack

NestJS 11 | TypeScript (ES2023) | pnpm | PostgreSQL + TypeORM | Redis + BullMQ | Passport.js + JWT | Winston | Jest + Supertest | Docker + K8s

## Agent Setup

See `AGENTS.md` for developer instructions tailored for LLM coding sessions.
