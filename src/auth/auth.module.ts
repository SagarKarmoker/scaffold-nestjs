import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [ClerkAuthGuard, RolesGuard, AuthService],
  exports: [ClerkAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}
