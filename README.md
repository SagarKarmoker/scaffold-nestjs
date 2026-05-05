# Scaffold Nest

A NestJS application scaffold with production-ready middleware and API versioning.

## Features

- **API Versioning** - `/api/v1` prefix with URI-based versioning
- **Swagger** - Auto-generated docs at `/v1/docs`
- **Security** - Helmet, CORS enabled
- **Performance** - Compression, global caching (5s TTL)
- **Rate Limiting** - 10 requests/minute
- **Logging** - Console logger with environment prefix

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

Create `.env` file (defaults shown):

```
PORT=8080
ENVIRONMENT=dev
SERVER_URL=http://localhost
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
- Jest for testing
- ESLint + Prettier

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