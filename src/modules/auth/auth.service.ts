import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hashPassword, comparePasswords } from 'src/common/utils/password.utils';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenService } from './refresh-token.service';
import {
  InvalidCredentialsException,
  SessionExpiredException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from './exceptions/auth.exception';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponse> {
    try {
      const existingUser = await this.usersService.findOneByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new UserAlreadyExistsException(registerDto.email);
      }

      const hashedPassword = await hashPassword(registerDto.password);
      const user = await this.usersService.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      } as User);

      return this.generateTokens(user);
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        return null;
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${email}`, error);
      throw error;
    }
  }

  async login(user: User): Promise<TokenResponse> {
    try {
      await this.refreshTokenService.revokeAllUserTokens(user.id);
      user.sessionVersion += 1;
      await this.usersService.update(user.id, user);
      return this.generateTokens(user);
    } catch (error) {
      this.handleError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const token =
        await this.refreshTokenService.validateRefreshToken(refreshToken);

      if (!token) {
        throw new InvalidCredentialsException();
      }

      await this.refreshTokenService.revokeRefreshToken(refreshToken);

      const user = await this.usersService.findOneById(token.userId);
      if (!user) {
        throw new UserNotFoundException();
      }

      user.sessionVersion += 1;
      await this.usersService.update(user.id, user);

      return this.generateTokens(user);
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    try {
      if (refreshToken) {
        await this.refreshTokenService.revokeRefreshToken(refreshToken);
      }
      await this.refreshTokenService.revokeAllUserTokens(userId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async validateSession(userId: string, sessionVersion: number): Promise<User> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }
    if (user.sessionVersion !== sessionVersion) {
      throw new SessionExpiredException();
    }
    return user;
  }

  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken =
      await this.refreshTokenService.createRefreshToken(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      this.logger.error(`Auth error: ${error.message}`);
    }
    throw error;
  }
}
