import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

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

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, { isVerified: true });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(id, { password: hashedPassword });
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
}
