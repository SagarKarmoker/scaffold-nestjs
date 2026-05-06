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
- `DB_PATH` (default: ./app.db)
- `JWT_SECRET` - Required for auth
- `JWT_EXPIRATION` (default: 1d)
- `JWT_REFRESH_SECRET` - Required for refresh tokens
- `JWT_REFRESH_EXPIRATION` (default: 7d)

## Middleware Enabled

- Helmet (security headers)
- CORS
- Compression
- Rate limiting (10 req/min)
- Caching (5s TTL global)

## Authentication (Passport.js + JWT)

**Auth Endpoints:**
- `POST /api/v1/auth/register` - Register user (returns access + refresh token)
- `POST /api/v1/auth/login` - Login (returns access + refresh token)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (revokes tokens)
- `GET /api/v1/auth/profile` - Get current user (protected)

**Auth Files:**
- `src/auth/auth.service.ts` - Main auth logic
- `src/auth/auth.controller.ts` - Auth endpoints
- `src/auth/auth.module.ts` - Auth module (imports UsersModule, PassportModule, JwtModule)
- `src/auth/strategies/local.strategy.ts` - Local (email/password) strategy
- `src/auth/strategies/jwt.strategy.ts` - JWT validation strategy
- `src/auth/guards/jwt-auth.guard.ts` - JWT auth guard
- `src/auth/guards/roles.guard.ts` - Role-based authorization
- `src/auth/decorators/roles.decorator.ts` - @Roles() decorator
- `src/auth/exceptions/auth.exception.ts` - Custom exceptions
- `src/auth/filters/auth-exception.filter.ts` - Global exception filter
- `src/auth/refresh-token.service.ts` - Refresh token management

**Key Features:**
- Single session: login revokes previous tokens (sessionVersion in DB)
- Role not exposed in API responses (stored in JWT for internal checks)
- Password hashed with bcrypt via `src/utils/password.utils.ts`
- Uses BaseEntity for id, createdAt, updatedAt on entities

**Protecting Routes:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protected')
protectedRoute() {}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoles.ADMIN)
@Get('admin-only')
adminOnly() {}
```

## Database

- TypeORM with better-sqlite3
- Entities use `BaseEntity` from `src/utils/base.entity.ts`
- User entity: `src/users/entities/user.entity.ts`
- Refresh token entity: `src/auth/entities/refresh-token.entity.ts`

## Utilities

- `src/utils/password.utils.ts` - hashPassword, comparePasswords
- `src/utils/base.entity.ts` - BaseEntity with id, createdAt, updatedAt
- `src/utils/roles.enum.ts` - UserRoles enum

## TypeScript

- Target: ES2023
- Module: nodenext
- Strict null checks enabled

## Logging

- Winston with file rotation (`logs/error.log`, `logs/combined.log`)
- Console with colors and timestamp
- Exception filters use Winston logger