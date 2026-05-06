Act as a senior backend architect specializing in NestJS. Provide a production-ready best practices guide for building and maintaining a NestJS backend service. Cover the following areas in detail, with concrete code examples, configuration snippets, and reasoning:

Project structure & modularity – How to organize modules, shared features, and feature modules for scalability.

Configuration management – Using @nestjs/config with validation (Joi/Zod), environment-specific files, and secrets handling.

Error handling & exception filters – Global exception filter that distinguishes client errors (4xx) from server errors (5xx), logs appropriately without exposing internals, and returns a consistent error response schema.

Logging & observability – Structured logging (e.g., with Pino or Winston), request ID correlation, log levels per error type, integration with OpenTelemetry or Datadog, and metric emission.

Validation & DTOs – Using class-validator and class-transformer with ValidationPipe options (whitelist, forbidNonWhitelisted, transform). Show how to handle validation errors.

Security best practices – Helmet, rate limiting, CORS configuration, JWT authentication, input sanitization, CSRF protection, and secure HTTP headers.

Database & transaction management – TypeORM/Prisma/MikroORM integration, connection pooling, retries, transaction boundaries, and avoiding N+1 queries.

Performance & scalability – Caching (in-memory, Redis), asynchronous queues (Bull), lazy loading, clustering or horizontal scaling (with stateless design), and timeouts for external calls.

Testing strategies – Unit tests, integration tests (Testcontainers, in-memory DB), e2e tests with @nestjs/testing, and mocking external services.

Health checks & readiness probes – Exposing /health and /ready endpoints for Kubernetes or cloud orchestration.

Graceful shutdown – Handling SIGTERM, closing database connections, draining HTTP server, and completing ongoing requests.

Documentation – OpenAPI/Swagger generation with @nestjs/swagger, keeping DTOs and responses in sync.

Deployment & CI/CD – Dockerfile multi-stage builds, non-root user, environment‑aware configuration, and secrets injection.

For each point, explain why the practice matters in production and provide a short, working code snippet when relevant. Prioritize actionable advice over theory. Format the answer as a clear, structured guide.