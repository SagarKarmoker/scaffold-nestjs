import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { User } from 'src/modules/users/entities/user.entity';

interface AuthenticatedRequest {
  user: User;
}

@ApiTags('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UsersController {
  @Get('profile')
  @ApiOperation({ summary: 'Get the authenticated user\'s profile' })
  @ApiOkResponse({ description: 'Current user profile', schema: { example: { id: 'uuid', name: 'Alice', email: 'alice@example.com', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getProfile(@Request() req: AuthenticatedRequest) {
    const user = req.user;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
