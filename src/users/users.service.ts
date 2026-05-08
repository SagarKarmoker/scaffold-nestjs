import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, type ClerkClient } from '@clerk/express';
import { User } from './entities/user.entity';
import { UserRoles } from 'src/utils/roles.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly clerkClient: ClerkClient;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.clerkClient = createClerkClient({
      publishableKey: this.configService.get('CLERK_PUBLISHABLE_KEY'),
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
    });
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.find();
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error fetching users:', error.message);
      }
      throw error;
    }
  }

  async findOneById(id: string): Promise<User | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    try {
      return await this.userRepository.findOneBy({ id });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error fetching user:', error.message);
      }
      throw error;
    }
  }

  async findOneByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('User email is required');
    }

    try {
      return await this.userRepository.findOneBy({ email });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error fetching user:', error.message);
      }
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    if (!user) {
      throw new Error('User data is required');
    }

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error creating user:', error.message);
      }
      throw error;
    }
  }

  async update(id: string, user: User): Promise<User | null> {
    if (!id) {
      throw new Error('User ID is required');
    }

    if (!user) {
      throw new Error('User data is required');
    }

    try {
      await this.userRepository.update(id, user);
      return await this.findOneById(id);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error updating user:', error.message);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    if (!id) {
      throw new Error('User ID is required');
    }

    try {
      await this.userRepository.delete(id);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error deleting user:', error.message);
      }
      throw error;
    }
  }

  async findOneByClerkId(clerkId: string): Promise<User | null> {
    if (!clerkId) {
      return null;
    }

    try {
      return await this.userRepository.findOneBy({ clerkId });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error fetching user by Clerk ID:', error.message);
      }
      return null;
    }
  }

  async createFromClerk(clerkUserId: string): Promise<User> {
    const clerkUser = (await this.clerkClient.users.getUser(clerkUserId)) as {
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      emailAddresses: Array<{ emailAddress: string }>;
    };

    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const name =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || email || 'Unknown';

    const user = this.userRepository.create({
      name,
      email,
      clerkId: clerkUserId,
      role: UserRoles.USER,
    });

    return this.userRepository.save(user);
  }
}
