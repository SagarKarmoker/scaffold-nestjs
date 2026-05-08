import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { v4 as uuidv4 } from 'uuid';

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
          method: request.method,
          url: request.url,
          status: response.statusCode,
          duration: `${duration}ms`,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
      tap((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(`${request.method} ${request.url}`, {
          requestId,
          method: request.method,
          url: request.url,
          status: response.statusCode,
          duration: `${duration}ms`,
          error: error.message,
        });
      }),
    );
  }
}
