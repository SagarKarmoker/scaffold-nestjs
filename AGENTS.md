# AGENTS.md

## Commands

```bash
# Development
pnpm dev          # Start with hot reload
pnpm start:debug  # Start with debugger

# Build & Run
pnpm build        # Compile to dist/
pnpm start:prod   # Run production build

# Testing
pnpm test         # Unit tests (jest config in package.json)
pnpm test:e2e     # E2E tests (uses test/jest-e2e.json)

# Linting & Formatting
pnpm lint         # ESLint with --fix
pnpm format       # Prettier write
```

## Architecture

- **Entry**: `src/main.ts`
- **Module**: `src/app.module.ts`
- **API Prefix**: `/api/v1` (versioning enabled)
- **Swagger**: `/v1/docs`

## Configuration

Environment variables in `.env`:
- `PORT` (default: 8080)
- `ENVIRONMENT` (default: dev)
- `SERVER_URL` (default: http://localhost)

## Middleware Enabled

- Helmet (security headers)
- CORS
- Compression
- Rate limiting (10 req/min)
- Caching (5s TTL global)

## Testing

- Jest config embedded in `package.json` (rootDir: `src`)
- E2E tests use separate config: `test/jest-e2e.json`
- Run single test: `npx jest --testPathPattern=<name>`

## TypeScript

- Target: ES2023
- Module: nodenext
- Strict null checks enabled