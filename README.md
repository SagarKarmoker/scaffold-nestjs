# Scaffold NestJS

A **production-ready, scalable NestJS monolith** with Redis caching, BullMQ job queues, PostgreSQL, clustering, Kubernetes support, and full observability.

## Architecture Highlights

| Feature | Implementation |
|---|---|
| **Clustering** | Node.js `cluster` module (or PM2 in cluster mode) |
| **Rate Limiting** | `@nestjs/throttler` – 100 req/min/IP (proxy-aware) |
| **Caching** | `@nestjs/cache-manager` + Redis (`@keyv/redis`) |
| **Job Queues** | `@nestjs/bullmq` + Redis, BullBoard UI at `/bull-board` |
| **Database** | TypeORM + PostgreSQL with connection pooling |
| **Security** | Helmet, CORS, ValidationPipe (`whitelist`, `forbidNonWhitelisted`) |
| **Logging** | Winston + structured JSON + request correlation |
| **Health** | `/health` (DB + Redis), `/health/ready` |
| **API Docs** | Swagger at `/v1/docs` |
| **Observability** | Request/response logging interceptor, BullBoard |

## Quick Start

### 1. Install dependencies

```bash
pnpm install
# or
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env – fill in DATABASE_URL, Redis settings, JWT secrets
```

### 3. Run locally (Docker Compose)

```bash
# Starts app + PostgreSQL + Redis
docker-compose up --build

# Or run services only and app locally
docker-compose up postgres redis -d
pnpm dev
```

Endpoints:
- **API**: `http://localhost:8080/api/v1`
- **Swagger UI**: `http://localhost:8080/v1/docs`
- **BullBoard**: `http://localhost:8080/bull-board`
- **Health**: `http://localhost:8080/health`

## API Overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register → returns access + refresh tokens |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/profile` | Current user (Bearer required) |
| `POST` | `/api/v1/orders` | Create order (queues background job, returns 201) |
| `GET` | `/api/v1/orders` | List orders (paginated) |
| `GET` | `/api/v1/orders/:id` | Get order (Redis cached 60 s) |
| `PUT` | `/api/v1/orders/:id` | Update order (invalidates cache) |
| `DELETE` | `/api/v1/orders/:id` | Delete order |
| `POST` | `/api/v1/notify` | Queue email notification (returns 202) |
| `GET` | `/api/v1/notify/metrics` | Email queue metrics |
| `GET` | `/health` | Liveness probe (DB + Redis) |
| `GET` | `/health/ready` | Readiness probe |

## Scaling

### Option 1 – Node.js Cluster (in-process)

```bash
# Build first
pnpm build

# Enable in-process clustering
CLUSTERING=true node dist/main.js
```

### Option 2 – PM2 Cluster Mode (recommended for VMs)

```bash
# Install PM2
pnpm add -g pm2

# Build and start with cluster mode
pnpm build
pm2 start ecosystem.config.js

# Monitor
pm2 monit
pm2 logs scaffold-nest
```

### Option 3 – Kubernetes

```bash
# Build and push image
docker build -t scaffold-nest:latest .
docker tag scaffold-nest:latest <registry>/scaffold-nest:latest
docker push <registry>/scaffold-nest:latest

# Apply manifests
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

# Check status
kubectl get pods -l app=scaffold-nest
kubectl get hpa scaffold-nest-hpa
```

The HPA scales between 2–10 replicas when CPU > 70% or memory > 80%.

## Load Testing with k6

Save as `load-test.js` and run with `k6 run load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up
    { duration: '2m',  target: 200 },  // sustained load
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = 'http://localhost:8080/api/v1';

export default function () {
  // Health check
  const health = http.get(`http://localhost:8080/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // List orders
  const orders = http.get(`${BASE}/orders`, {
    headers: { Authorization: `Bearer ${__ENV.JWT_TOKEN}` },
  });
  check(orders, { 'orders 200': (r) => r.status === 200 });

  sleep(0.5);
}
```

```bash
# Install k6: https://k6.io/docs/getting-started/installation/
JWT_TOKEN=<your-token> k6 run load-test.js
```

## Development Commands

```bash
pnpm dev          # Hot reload (ts-node watch)
pnpm build        # Compile TypeScript → dist/
pnpm start:prod   # Run compiled output
pnpm test         # Unit tests
pnpm test:e2e     # End-to-end tests
pnpm lint         # ESLint --fix
pnpm format       # Prettier write
```

## Configuration Reference

See `.env.example` for all variables. Key ones:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` | Primary DB connection string |
| `DATABASE_REPLICA_URL` | _(empty)_ | Optional read-replica URL |
| `REDIS_HOST` | `localhost` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | _(empty)_ | Redis auth password |
| `THROTTLE_TTL` | `60000` | Rate-limit window (ms) |
| `THROTTLE_LIMIT` | `100` | Max requests per window per IP |
| `CLUSTERING` | `false` | Enable Node.js in-process cluster |
| `JWT_SECRET` | — | Min 32 chars in production |
| `CORS_ORIGIN` | _(empty = allow all)_ | Comma-separated allowed origins |

```env
PORT=8080
ENVIRONMENT=development
SERVER_URL=http://localhost
DB_PATH=./app.db
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
MAIL_HOST=smtp.example.com
MAIL_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-password
APP_NAME=MyApp
DASHBOARD_URL=http://localhost:3000/dashboard
RESET_URL=http://localhost:3000/reset-password
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
- BullMQ + nodemailer
- Winston + Jest + Supertest

## Refs

- Agent instructions: `AGENTS.md`
- Production guide: `PRODUCTION_GUIDE.md`