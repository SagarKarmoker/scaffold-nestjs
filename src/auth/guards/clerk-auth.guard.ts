import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { getAuth } from '@clerk/express';
import { Request } from 'express';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = getAuth(req);

    if (!auth?.userId) {
      throw new UnauthorizedException('Invalid or missing authentication');
    }

    return true;
  }
}
