import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

/**
 * Extended throttler guard that correctly reads the client IP when the app
 * runs behind a reverse-proxy (nginx, AWS ALB, etc.) using X-Forwarded-For.
 * Register globally in AppModule providers with APP_GUARD.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const forwarded = (req.headers as Record<string, string>)['x-forwarded-for'];
    if (forwarded) {
      return (forwarded as string).split(',')[0].trim();
    }
    return (req.ip as string) ?? 'unknown';
  }

  protected errorMessage = 'Too many requests. Please slow down.';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return super.canActivate(context);
  }
}
