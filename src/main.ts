import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ConsoleLogger, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: 'Scaffold Nest',
      colors: true,
      // json: true,
    }),
  });

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  
  // API Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    defaultVersion: '1',
    prefix: 'v',
    type: VersioningType.URI
  })
  
  // Security Middleware
  app.use(helmet());
  app.enableCors();
  
  // compression middleware
  app.use(compression());
  
  // Configuration and Logging
  let logger = new Logger("Entry Point");
  const configService = app.get(ConfigService);
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
    logger.verbose(`Environment: ${environment}`);
    logger.verbose(`Server is running on ${SERVER_URL}:${PORT}`);
    logger.verbose(`Swagger UI available at ${SERVER_URL}:${PORT}/v1/docs`);
  });

  // Graceful shutdown
  app.enableShutdownHooks();
}
bootstrap();
