import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exception.filter';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as cluster from 'cluster';
import { cpus } from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const winstonLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  const configService = app.get(ConfigService);

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    prefix: 'v',
    type: VersioningType.URI,
  });

  // Security Middleware – Helmet with CSP
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
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS – configurable via env (comma-separated origins)
  const corsOrigins =
    configService.get<string>('CORS_ORIGIN') ||
    configService.get<string>('CORS_ORIGINS') ||
    '';
  const allowedOrigins = corsOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
  });

  app.use(compression());

  // Swagger
  const environment = configService.get<string>('ENVIRONMENT');
  const PORT = configService.get<number>('PORT');
  const SERVER_URL = configService.get<string>('SERVER_URL');

  const config = new DocumentBuilder()
    .setTitle('Scaffold Nest API')
    .setDescription(
      'Production-ready NestJS monolithic API with clustering, Redis cache, BullMQ queues, and PostgreSQL.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, documentFactory);

  await app.listen(PORT!, () => {
    winstonLogger.info(`[Worker ${process.pid}] Environment: ${environment}`);
    winstonLogger.info(`Server running on ${SERVER_URL}:${PORT}`);
    winstonLogger.info(`Swagger UI: ${SERVER_URL}:${PORT}/v1/docs`);
    winstonLogger.info(`BullBoard: ${SERVER_URL}:${PORT}/bull-board`);
  });

  app.enableShutdownHooks();
}

// ─── Clustering ─────────────────────────────────────────────────────────────
// Set CLUSTERING=true in .env to fork one worker per CPU core.
// In Kubernetes / PM2 it is better to manage replicas externally.
const clusterEnabled = process.env.CLUSTERING === 'true';
const clusterModule = cluster as unknown as import('cluster').Cluster;

if (clusterEnabled && clusterModule.isPrimary) {
  const numCPUs = cpus().length;
  console.log(`[Master ${process.pid}] Forking ${numCPUs} workers…`);

  for (let i = 0; i < numCPUs; i++) {
    clusterModule.fork();
  }

  clusterModule.on('exit', (worker, code, signal) => {
    console.warn(
      `[Master] Worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Respawning…`,
    );
    clusterModule.fork();
  });
} else {
  bootstrap();
}
