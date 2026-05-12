import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (configService: ConfigService) => ({
  secret:
    configService.get<string>('JWT_SECRET') ||
    'your-super-secret-jwt-key-change-in-production',
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRATION') || '1d',
  },
});
