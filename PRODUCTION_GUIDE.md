# Production-Ready NestJS Backend Best Practices Guide

This guide provides a comprehensive reference for building and maintaining production-ready NestJS backend services.

---

## 1. Project Structure & Modularity

Organize by **features**, not technical layers. This creates self-contained modules that scale.

```
src/
├── config/                     # Configuration files
├── common/                    # Shared components
│   ├── filters/               # Exception filters
│   ├── interceptors/         # HTTP interceptors
│   ├── decorators/           # Custom decorators
│   └── constants.ts          # Shared constants
├── modules/                   # Feature modules
│   ├── auth/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── strategies/
│   │   ├── guards/
│   │   ├── dto/
│   │   └── entities/
│   └── users/
├── utils/                     # Shared utilities
├── database/                 # Database config
├── health/                   # Health checks
└── main.ts
```

```typescript
// Example: Feature module structure
// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## 2. Configuration Management

Use `@nestjs/config` with Joi validation for type-safe config at startup.

```typescript
// src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  ENVIRONMENT: Joi.string()
    .valid('dev', 'development', 'staging', 'prod', 'production', 'test')
    .default('dev'),
  PORT: Joi.number().port().default(8080),
  SERVER_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  DB_PATH: Joi.string().default('./app.db'),
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(10),
});
```

```typescript
// src/app.module.ts - ConfigModule setup
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

---

## 3. Error Handling & Exception Filters

Distinguish client errors (4xx) from server errors (5xx), log appropriately, and return consistent responses.

```typescript
// src/common/filters/all-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();

    const isClientError = exception instanceof HttpException;
    const status = isClientError
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const is4xx = status >= 400 && status < 500;
    const is5xx = status >= 500;

    const message = isClientError
      ? exception.message
      : 'An unexpected error occurred';

    const errorResponse = {
      statusCode: status,
      error: is4xx ? 'Client Error' : 'Server Error',
      message: isClientError ? message : 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
    };

    if (is4xx) {
      this.logger.warn(`${request.method} ${request.url} - ${status}: ${message}`, {
        requestId,
        status,
      });
    } else if (is5xx) {
      this.logger.error(`${request.method} ${request.url}`, {
        requestId,
        status,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json(errorResponse);
  }
}
```

---

## 4. Logging & Observability

Structured logging with request correlation, proper log levels, and JSON format for machines.

```typescript
// src/config/logger.config.ts
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context || 'App'}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],
};
```

```typescript
// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    const startTime = Date.now();

    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.http(`${request.method} ${request.url}`, {
          requestId,
          status: response.statusCode,
          duration: `${duration}ms`,
        });
      }),
    );
  }
}
```

---

## 5. Validation & DTOs

Use `class-validator` with `ValidationPipe` for robust input validation.

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;
}
```

```typescript
// src/main.ts - Global ValidationPipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip non-whitelisted properties
    forbidNonWhitelisted: true,   // Throw if non-whitelisted properties present
    transform: true,              // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

## 6. Security Best Practices

### Helmet, Rate Limiting, CORS

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet with CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS
  const allowedOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // Rate Limiting
  app.useGlobalGuards(new ThrottlerGuard());
}
```

```typescript
// src/app.module.ts - ThrottlerModule
ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 60000,  // 1 minute
      limit: 10,  // 10 requests per minute
    },
  ],
}),
```

### JWT Authentication Strategy

```typescript
// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

---

## 7. Database & Transaction Management

TypeORM with connection pooling, proper transactions, and avoid N+1 queries.

```typescript
// src/app.module.ts - TypeORM Configuration
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'better-sqlite3',
    database: configService.get<string>('DB_PATH') || './app.db',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get<string>('ENVIRONMENT') !== 'prod',
    logging: configService.get<string>('ENVIRONMENT') === 'dev',
    // Connection pool settings
    extra: {
      poolSize: 10,
      idleTimeoutMillis: 30000,
    },
  }),
}),
```

```typescript
// Using transactions properly
@Injectable()
export class UsersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createUserWithTransaction(userData: CreateUserDto): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, userData);
      await manager.save(user);
      await manager.insert(ActivityLog, { userId: user.id, action: 'created' });
      return user;
    });
  }
}
```

```typescript
// Avoiding N+1 queries with relations
async findAllUsers(): Promise<User[]> {
  return this.userRepository.find({
    relations: ['profile', 'posts'],  // Eager loading
  });
}

// Or use query builder with joins
async findUsersWithPosts(): Promise<User[]> {
  return this.userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.posts', 'post')
    .getMany();
}
```

---

## 8. Performance & Scalability

### Caching with Redis

```typescript
// src/app.module.ts - CacheModule with Redis
CacheModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    store: await import('cache-manager-redis-store'),
    host: configService.get<string>('REDIS_HOST'),
    port: configService.get<number>('REDIS_PORT'),
    ttl: 5000,
  }),
}),
```

```typescript
// Using cache in services
@Injectable()
export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getUserById(id: string): Promise<User> {
    const cached = await this.cacheManager.get<User>(`user:${id}`);
    if (cached) return cached;

    const user = await this.userRepository.findOneBy({ id });
    if (user) {
      await this.cacheManager.set(`user:${id}`, user, 300); // 5 min TTL
    }
    return user;
  }
}
```

### Timeouts for External Calls

```typescript
// Using axios with timeout
@Injectable()
export class ExternalApiService {
  private readonly http = new AxiosInstance({
    baseURL: 'https://api.example.com',
    timeout: 5000,
  });
}
```

---

## 9. Testing Strategies

### Unit Tests

```typescript
// src/auth/auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual(mockUser);
    });
  });
});
```

### Integration Tests

```typescript
// test/auth/auth.e2e-spec.ts
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/auth/register - should register a new user', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(201);
  });
});
```

---

## 10. Health Checks & Readiness Probes

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.disk.checkStorage('disk', { thresholdPercent: 0.9 }),
      () => this.memory.checkHeap('memory', 150 * 1024 * 1024), // 150MB
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([]);
  }

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }
}
```

---

## 11. Graceful Shutdown

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  await app.listen(PORT);

  // Handle shutdown signals
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}
```

---

## 12. OpenAPI/Swagger Documentation

```typescript
// src/main.ts - Swagger Setup
const config = new DocumentBuilder()
  .setTitle('Scaffold Nest API')
  .setDescription('API documentation for Scaffold Nest application')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('auth', 'Authentication endpoints')
  .addTag('users', 'User management')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('v1/docs', app, document);
```

---

## 13. Deployment & CI/CD

### Multi-stage Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 8080

CMD ["node", "dist/main.js"]
```

---

## Summary Checklist

- [x] Organize by feature modules
- [x] Validate config with Joi at startup
- [x] Distinguish 4xx vs 5xx errors in filters
- [x] Add request correlation IDs
- [x] Use ValidationPipe with whitelist
- [x] Configure Helmet, CORS, rate limiting
- [x] Set up connection pooling
- [x] Implement caching strategy
- [x] Write unit and e2e tests
- [x] Add health check endpoints
- [x] Handle graceful shutdown
- [x] Generate OpenAPI documentation
- [x] Use multi-stage Dockerfile