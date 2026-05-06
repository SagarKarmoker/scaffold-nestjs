import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
}

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

    const errorResponse: ErrorResponse = {
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
        path: request.url,
      });
    } else if (is5xx) {
      this.logger.error(`${request.method} ${request.url}`, {
        requestId,
        status,
        stack: exception instanceof Error ? exception.stack : undefined,
        message: exception instanceof Error ? exception.message : 'Unknown error',
      });
    }

    response.status(status).json(errorResponse);
  }
}
