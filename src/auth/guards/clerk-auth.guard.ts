import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { getAuth } from '@clerk/express';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = getAuth(req);

    if (!auth?.userId) {
      throw new UnauthorizedException('Invalid or missing authentication');
    }

    await this.authService.syncUserFromClerk(auth.userId);

    return true;
  }
}