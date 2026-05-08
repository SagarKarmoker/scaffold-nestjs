import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { AuthService } from './auth.service';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  auth: {
    userId: string;
    sessionId: string;
    orgId?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  async getProfile(@Req() req: AuthRequest) {
    const { userId } = req.auth;
    return this.authService.getOrCreateUserFromClerk(userId);
  }
}
