# Scaffold NestJS — High-Level Design

## 1. System Context

```mermaid
C4Context
  title System Context Diagram

  Person(client, "API Client", "Mobile app, web app, or curl")
  Person(admin, "Admin", "Manages system via BullBoard & API")

  System_Boundary(app, "Scaffold NestJS") {
    System(api, "NestJS API", "Handles HTTP requests, auth, business logic")
  }

  SystemDb_Ext(pg, "PostgreSQL", "Primary database")
  SystemDb_Ext(redis, "Redis", "Caching + BullMQ queue backend")
  System_Ext(smtp, "SMTP Server", "Email delivery")

  Rel(client, api, "HTTPS /api/v1/*")
  Rel(admin, api, "HTTPS /bull-board")
  Rel(api, pg, "TypeORM", "Reads/Writes")
  Rel(api, redis, "Keyv / ioredis", "Cache + Queues")
  Rel(api, smtp, "Nodemailer", "Sends emails")
```

## 2. Application Module Architecture

```mermaid
graph TB
  subgraph "Presentation"
    AC("AppController")
  end

  subgraph "Feature Modules"
    AM("AuthModule")
    OM("OrdersModule")
    UM("UsersModule")
    HM("HealthModule")
    MM("MailModule")
    QM("QueuesModule")
  end

  subgraph "Shared"
    CM("CommonModule")
    LOG("LoggerModule")
    BF("BaseEntity")
    PD("PaginationDto")
    UD("@CurrentUser()")
    EF("ExceptionFilters")
    LI("LoggingInterceptor")
    PU("PasswordUtils")
    RE("RolesEnum")
  end

  subgraph "Core"
    DB("DatabaseModule")
    TG("ThrottlerGuard")
    CI("CacheInvalidation")
  end

  subgraph "Config"
    CF("ConfigModule")
    LC("LoggerConfig")
  end

  subgraph "External"
    PG[("PostgreSQL")]
    RD[("Redis")]
    SM("SMTP Server")
  end

  AC --> AM
  AC --> OM
  AC --> HM

  AM --> UM
  AM --> CM
  AM --> CF

  OM --> CM
  OM --> RD
  OM --> QM

  MM --> QM
  MM --> SM

  QM --> RD

  CM --> LOG
  CM --> EF
  CM --> LI

  DB --> PG

  style PG fill:#f96
  style RD fill:#f96
  style SM fill:#f96
```

## 3. Request Lifecycle

```mermaid
sequenceDiagram
  participant Client
  participant Helmet as Helmet (CSP)
  participant CORS
  participant Compress as Compression
  participant LogInt as LoggingInterceptor
  participant Throttle as ThrottlerGuard
  participant Pipe as ValidationPipe
  participant Filter as ExceptionFilter
  participant Route as Route Handler
  participant Service
  participant DB as PostgreSQL
  participant Redis

  Client->>Helmet: HTTPS Request
  Helmet->>CORS: Security headers applied
  CORS->>Compress: Origin checked
  Compress->>LogInt: gzip negotiated
  LogInt->>Throttle: Log request + generate x-request-id
  Throttle->>Pipe: Check rate limit (proxy-aware)
  Pipe->>Filter: Validate + whitelist body/params

  alt Valid Request
    Filter->>Route: Forward to controller
    Route->>Service: Execute business logic
    Service->>DB: TypeORM query

    alt GET with cache
      Service->>Redis: Check cache
      Redis-->>Service: Cache hit
    else POST/PUT/DELETE
      Service->>Redis: Invalidate cache keys
    end

    DB-->>Service: Result
    Service-->>Route: Response
    Route-->>LogInt: 2xx/4xx
    LogInt-->>Client: Log duration + status, return response
  else Invalid Request
    Filter-->>Client: 400/401/403/429/500 JSON error
  end
```

## 4. Authentication Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'noteTextColor': '#1a1a2e', 'noteBkgColor': '#fff'}}}%%
sequenceDiagram
  participant Client
  participant AuthCtrl as AuthController
  participant AuthSvc as AuthService
  participant JwtStrategy as JwtStrategy
  participant LocalStrategy as LocalStrategy
  participant RTService as RefreshTokenService
  participant DB as PostgreSQL
  participant Redis

  rect rgb(230, 242, 255)
    Note over Client,DB: Register / Login
    Client->>AuthCtrl: POST /auth/register | /auth/login
    AuthCtrl->>LocalStrategy: Validate credentials
    LocalStrategy->>AuthSvc: validateUser(email, password)
    AuthSvc->>DB: Find user by email
    AuthSvc->>AuthSvc: bcrypt compare
    AuthSvc-->>LocalStrategy: User or throw
    LocalStrategy-->>AuthCtrl: User object
    AuthCtrl->>AuthSvc: login(user)
    AuthSvc->>AuthSvc: Generate JWT (sub, email, role, sessionVersion)
    AuthSvc->>RTService: createRefreshToken(userId)
    RTService->>DB: INSERT refresh_tokens
    RTService-->>AuthSvc: token string
    AuthSvc-->>AuthCtrl: { access_token, refresh_token }
    AuthCtrl-->>Client: 201 / 200
  end

  rect rgb(204, 229, 255)
    Note over Client,DB: Authenticated Request
    Client->>AuthCtrl: GET /auth/profile (Authorization: Bearer [jwt])
    AuthCtrl->>JwtStrategy: Validate JWT
    JwtStrategy->>Database: Check sessionVersion
    Database-->>JwtStrategy: User record
    JwtStrategy-->>AuthCtrl: User payload
    AuthCtrl->>AuthSvc: getProfile(userId)
    AuthSvc-->>AuthCtrl: User profile
    AuthCtrl-->>Client: 200
  end

  rect rgb(179, 215, 255)
    Note over Client,DB: Refresh Token
    Client->>AuthCtrl: POST /auth/refresh { refresh_token }
    AuthCtrl->>RTService: validateRefreshToken(token)
    RTService->>DB: Query token + check expiry + revoked
    DB-->>RTService: Valid token
    RTService-->>AuthCtrl: User
    AuthCtrl->>AuthSvc: Generate new JWT + refresh token
    AuthSvc->>RTService: Revoke old, create new
    AuthSvc-->>AuthCtrl: { access_token, refresh_token }
    AuthCtrl-->>Client: 200
  end
```

## 5. Async Job Processing (BullMQ)

```mermaid
flowchart LR
  subgraph API
    OC("OrdersController")
    NC("NotifyController")
  end

  subgraph Queues
    EQ("email queue")
    OQ("order-processing queue")
  end

  subgraph Redis
    RK("Keyspace")
  end

  subgraph Workers
    EP("EmailProcessor")
    OP("OrderProcessor")
  end

  subgraph External
    SMTP("SMTP Server")
    PG[("PostgreSQL")]
  end

  OC -->|add job| OQ
  NC -->|add job| EQ
  OQ --> RK
  EQ --> RK
  RK --> EP
  RK --> OP
  EP --> SMTP
  OP --> PG

  style EQ fill:#bbf
  style OQ fill:#bbf
  style RK fill:#f9f
```

## 6. Deployment Architecture

```mermaid
graph TB
  subgraph Client
    LB("Load Balancer")
  end

  subgraph Host
    subgraph App
      A1("NestJS Instance 1")
      A2("NestJS Instance 2")
      A3("NestJS Instance N")
    end
  end

  subgraph Data
    PG[("PostgreSQL")]
    RE[("Redis")]
  end

  subgraph Monitoring
    BB("BullBoard UI")
    HC("Health Checks")
  end

  subgraph Scaling
    HPA("K8s HPA 2-10 replicas")
    PM2("PM2 Cluster Mode")
    CLU("In-process cluster")
  end

  LB --> A1
  LB --> A2
  LB --> A3

  A1 --> PG
  A2 --> PG
  A3 --> PG

  A1 --> RE
  A2 --> RE
  A3 --> RE

  A1 --> BB
  A2 --> BB
  A3 --> BB

  A1 --> HC
  A2 --> HC
  A3 --> HC
```

## 7. Data Model

```mermaid
erDiagram
  User {
    uuid id PK
    string name
    string email UK
    string password
    enum role "user | admin | moderator"
    int sessionVersion
    datetime createdAt
    datetime updatedAt
  }

  RefreshToken {
    uuid id PK
    string token UK
    uuid userId FK
    datetime expiresAt
    boolean revoked
    datetime createdAt
  }

  Order {
    uuid id PK
    string title
    text description "nullable"
    enum status "pending | processing | completed | cancelled | failed"
    uuid userId FK "nullable"
    decimal amount
    datetime createdAt
    datetime updatedAt
  }

  User ||--o{ RefreshToken : has
  User ||--o{ Order : places
```

## 8. Directory Map

```
src/
├── main.ts                         # Entry point + optional clustering
├── app.module.ts                   # Root module (wires everything)
├── app.controller.ts               # Root routes
│
├── config/                         # Env config + Joi validation + Winston
│
├── common/                         # Shared cross-cutting concerns
│   ├── logger.module.ts            #   Global Winston
│   ├── decorators/                 #   @CurrentUser()
│   ├── dto/                        #   PaginationDto
│   ├── entities/                   #   BaseEntity
│   ├── filters/                    #   4xx/5xx exception handlers
│   ├── interceptors/               #   Request logging
│   └── utils/                      #   bcrypt, roles enum
│
├── core/                           # Core infrastructure
│   ├── database/                   #   DataSource (postgres, unused sqlite)
│   ├── guards/                     #   Proxy-aware throttler
│   └── interceptors/               #   Cache invalidation
│
└── modules/                        # Feature modules
    ├── auth/                       #   AuthN/AuthZ + JWT strategies
    ├── users/                      #   User entity + CRUD
    ├── orders/                     #   Order CRUD + async processing
    ├── health/                     #   Health checks (Terminus)
    ├── mail/                       #   Async email via BullMQ
    └── queues/                     #   Queue definitions + BullBoard
```
