import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { RolesGuard } from './guards/roles.guard';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, RolesGuard, ClerkAuthGuard],
  exports: [ClerkAuthGuard, RolesGuard, AuthService],
})
export class AuthModule {}