import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Reflector } from '@nestjs/core';

export const CACHE_INVALIDATE_KEYS = 'cache_invalidate_keys';

/**
 * Decorator – annotate a mutating endpoint with the cache keys to evict.
 * @example @CacheInvalidate('orders_list', 'order_123')
 */
export function CacheInvalidate(...keys: string[]): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(CACHE_INVALIDATE_KEYS, keys, descriptor.value as object);
    return descriptor;
  };
}

/**
 * Global-compatible interceptor that deletes specified cache keys after a
 * successful mutating request (POST / PUT / PATCH / DELETE).
 * The keys to evict are declared with @CacheInvalidate(...keys).
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const method = context
      .switchToHttp()
      .getRequest<{ method: string }>().method.toUpperCase();

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation) {
      return next.handle();
    }

    const keys: string[] | undefined = this.reflector.get<string[]>(
      CACHE_INVALIDATE_KEYS,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(async () => {
        if (keys?.length) {
          await Promise.all(keys.map((k) => this.cache.del(k)));
        }
      }),
    );
  }
}
