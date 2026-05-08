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
import { clerkMiddleware } from '@clerk/express'

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
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    prefix: 'v',
    type: VersioningType.URI,
  });

  // Security Middleware - Helmet with CSP
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

  // CORS - configurable via env
  const allowedOrigins =
    configService.get<string>('CORS_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // compression middleware
  app.use(compression());

  // Clerk Middleware
  app.use(clerkMiddleware());

  // Configuration
  const environment = configService.get<string>('ENVIRONMENT');
  const PORT = configService.get<number>('PORT');
  const SERVER_URL = configService.get<string>('SERVER_URL');

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Scaffold Nest API')
    .setDescription('API documentation for Scaffold Nest application')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, documentFactory);

  // Start the server
  await app.listen(PORT!, () => {
    winstonLogger.info(`Environment: ${environment}`);
    winstonLogger.info(`Server is running on ${SERVER_URL}:${PORT}`);
    winstonLogger.info(`Swagger UI available at ${SERVER_URL}:${PORT}/v1/docs`);
  });

  // Graceful shutdown
  app.enableShutdownHooks();
}
bootstrap();
