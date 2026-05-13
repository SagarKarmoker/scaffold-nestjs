import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from './common/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './core/mail/mail.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { OrdersModule } from './modules/orders/orders.module';
import { QueuesModule } from './core/queues/queues.module';
import { AdminModule } from './modules/admin/admin.module';
import { ThrottlerBehindProxyGuard } from './core/guards/throttler-behind-proxy.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CacheInvalidationInterceptor } from './core/interceptors/cache-invalidation.interceptor';

const enableBullBoard = process.env.ENABLE_BULL_BOARD === 'true' ||
  process.env.ENVIRONMENT !== 'production';

@Module({
  imports: [
    LoggerModule,

    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      isGlobal: true,
    }),

    // ─── Rate limiting (global, per-IP) ────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE.TTL') ?? 60_000,
            limit: config.get<number>('THROTTLE.LIMIT') ?? 100,
          },
        ],
      }),
    }),

    // ─── Redis-backed cache ─────────────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('REDIS.HOST') ?? 'localhost';
        const port = config.get<number>('REDIS.PORT') ?? 6379;
        const password = config.get<string>('REDIS.PASSWORD') ?? '';
        const url = password
          ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
          : `redis://${host}:${port}`;
        return {
          stores: [createKeyv(url)],
          ttl: 60_000,
        };
      },
    }),

    // ─── Database (PostgreSQL via TypeORM) ─────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('ENVIRONMENT') ?? 'development';
        const isProd = env === 'production' || env === 'prod';
        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          entities: [__dirname + '/**/*.entity.js'],
          synchronize: !isProd,
          logging: !isProd,
          // Connection pool settings
          extra: {
            max: 20, // max pool size
            min: 2, // min idle connections
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
          },
          // Read-replica example:
          // replication: {
          //   master: { url: config.get('DATABASE_URL') },
          //   slaves: [{ url: config.get('DATABASE_REPLICA_URL') }],
          // },
        };
      },
    }),

    // ─── BullMQ (Redis job queues) ──────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS.HOST') ?? 'localhost',
          port: config.get<number>('REDIS.PORT') ?? 6379,
          password: config.get<string>('REDIS.PASSWORD') || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      }),
    }),

    // ─── Feature modules ────────────────────────────────────────────────────────
    HealthModule,
    UsersModule,
    AuthModule,
    MailModule,
    QueuesModule,
    ...(enableBullBoard
      ? [
          BullBoardModule.forRoot({
            route: '/bull-board',
            adapter: ExpressAdapter,
          }),
        ]
      : []),
    OrdersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate-limiting guard (proxy-aware)
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    // Global request/response logging
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Global cache-invalidation interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInvalidationInterceptor,
    },
  ],
})
export class AppModule {}
