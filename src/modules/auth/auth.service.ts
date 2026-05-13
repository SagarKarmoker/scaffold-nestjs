import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import {
  hashPassword,
  comparePasswords,
} from 'src/common/utils/password.utils';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenService } from './refresh-token.service';
import {
  AccountLockedException,
  InvalidCredentialsException,
  SessionExpiredException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from './exceptions/auth.exception';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { MailService } from 'src/core/mail/mail.service';

const LOGIN_FAIL_PREFIX = 'login_fails:';
const VERIFY_CODE_PREFIX = 'verify_code:';
const RESET_CODE_PREFIX = 'reset_code:';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TTL_MS = 15 * 60 * 1000; // 15 min
const VERIFY_CODE_TTL_MS = 30 * 60 * 1000; // 30 min
const RESET_CODE_TTL_MS = 15 * 60 * 1000; // 15 min

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
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    try {
      const existingUser = await this.usersService.findOneByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new UserAlreadyExistsException();
      }

      const hashedPassword = await hashPassword(registerDto.password);
      const user = await this.usersService.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      } as User);

      // Send verification email
      const code = this.generateSecureCode();
      await this.cacheManager.set(
        `${VERIFY_CODE_PREFIX}${user.email}`,
        code,
        VERIFY_CODE_TTL_MS,
      );
      await this.mailService.sendVerificationEmail(user.email, user.name, code);

      return { message: 'Registration successful. Please verify your email.' };
    } catch (error) {
      this.handleError(error);
    }
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const stored = await this.cacheManager.get<string>(
      `${VERIFY_CODE_PREFIX}${email}`,
    );
    if (!stored || stored !== code) {
      throw new BadRequestException('Invalid or expired verification code.');
    }
    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UserNotFoundException();

    await this.usersService.verifyEmail(user.id);
    await this.cacheManager.del(`${VERIFY_CODE_PREFIX}${email}`);
    return { message: 'Email verified successfully.' };
  }

  async resendVerificationCode(email: string): Promise<{ message: string }> {
    // Always return the same message to prevent user enumeration
    const message = 'If that account exists and is unverified, a new code has been sent.';

    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.isVerified) return { message };

    // Enforce a cooldown: don't resend if a code was issued recently (last 2 min)
    const existing = await this.cacheManager.get<string>(`${VERIFY_CODE_PREFIX}${email}`);
    const cooldownKey = `verify_cooldown:${email}`;
    const onCooldown = await this.cacheManager.get<boolean>(cooldownKey);
    if (onCooldown && existing) {
      throw new BadRequestException('Please wait before requesting another code.');
    }

    const code = this.generateSecureCode();
    await this.cacheManager.set(`${VERIFY_CODE_PREFIX}${email}`, code, VERIFY_CODE_TTL_MS);
    await this.cacheManager.set(cooldownKey, true, 2 * 60 * 1000); // 2-min cooldown
    await this.mailService.sendVerificationEmail(user.email, user.name, code);

    return { message };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const lockKey = `${LOGIN_FAIL_PREFIX}${email}`;
      const attempts = (await this.cacheManager.get<number>(lockKey)) ?? 0;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new AccountLockedException();
      }

      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        await this.incrementLoginFails(lockKey);
        return null;
      }

      const isValidPassword = await comparePasswords(password, user.password);
      if (!isValidPassword) {
        await this.incrementLoginFails(lockKey);
        return null;
      }

      // Clear fail counter on success
      await this.cacheManager.del(lockKey);
      return user;
    } catch (error) {
      this.logger.error(`Error validating user: ${email}`, error);
      throw error;
    }
  }

  async login(user: User): Promise<TokenResponse> {
    try {
      if (!user.isVerified) {
        throw new ForbiddenException(
          'Please verify your email address before logging in.',
        );
      }
      await this.refreshTokenService.revokeAllUserTokens(user.id);
      user.sessionVersion += 1;
      await this.usersService.update(user.id, user);
      return this.generateTokens(user);
    } catch (error) {
      this.handleError(error);
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // Always return same message to avoid user enumeration
    const message = 'If that email exists, a reset code has been sent.';
    const user = await this.usersService.findOneByEmail(email);
    if (!user) return { message };

    const code = this.generateSecureCode();
    await this.cacheManager.set(
      `${RESET_CODE_PREFIX}${email}`,
      code,
      RESET_CODE_TTL_MS,
    );
    await this.mailService.sendPasswordResetEmail(email, code, user.name);
    return { message };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const stored = await this.cacheManager.get<string>(
      `${RESET_CODE_PREFIX}${email}`,
    );
    if (!stored || stored !== code) {
      throw new BadRequestException('Invalid or expired reset code.');
    }

    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UserNotFoundException();

    const hashed = await hashPassword(newPassword);
    await this.usersService.updatePassword(user.id, hashed);
    await this.cacheManager.del(`${RESET_CODE_PREFIX}${email}`);

    // Invalidate all sessions
    await this.refreshTokenService.revokeAllUserTokens(user.id);
    return { message: 'Password reset successful.' };
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

  private async incrementLoginFails(key: string): Promise<void> {
    const current = (await this.cacheManager.get<number>(key)) ?? 0;
    await this.cacheManager.set(key, current + 1, LOCK_TTL_MS);
  }

  /** Generates a cryptographically secure 6-digit numeric code */
  private generateSecureCode(): string {
    const bytes = crypto.randomBytes(4);
    const num = bytes.readUInt32BE(0) % 1_000_000;
    return num.toString().padStart(6, '0');
  }

  private handleError(error: unknown): never {
    if (
      error instanceof UserAlreadyExistsException ||
      error instanceof InvalidCredentialsException ||
      error instanceof ForbiddenException
    ) {
      throw error;
    }
    if (error instanceof Error) {
      this.logger.error(`Auth error: ${error.message}`);
    }
    throw error;
  }
}
