import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from './common/logger.module';
import { AuthModule } from './auth/auth.module';
import { ClerkClientProvider } from './providers/clerk-client.provider';

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
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 10, // 10 requests per minute
        },
      ],
    }),
    CacheModule.register({
      ttl: 5000, // milliseconds
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get<string>('DB_PATH') || './app.db',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('ENVIRONMENT') !== 'prod',
        logging: configService.get<string>('ENVIRONMENT') === 'dev',
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    ClerkClientProvider
  ],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {}
}
