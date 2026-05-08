import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly usersService: UsersService) {}

  async getOrCreateUserFromClerk(clerkUserId: string): Promise<User> {
    let user = await this.usersService.findOneByClerkId(clerkUserId);

    if (!user) {
      this.logger.log(`Creating new user from Clerk: ${clerkUserId}`);
      user = await this.usersService.createFromClerk(clerkUserId);
    }

    return user;
  }
}
