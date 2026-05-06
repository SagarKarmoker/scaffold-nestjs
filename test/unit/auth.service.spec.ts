import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { RefreshTokenService } from 'src/auth/refresh-token.service';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidCredentialsException,
} from 'src/auth/exceptions/auth.exception';
import { comparePasswords } from 'src/utils/password.utils';
import { UserRoles } from 'src/utils/roles.enum';

jest.mock('src/utils/password.utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
  comparePasswords: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: UserRoles.USER,
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
            findOneById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            createRefreshToken: jest
              .fn()
              .mockResolvedValue('mock-refresh-token'),
            validateRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            revokeAllUserTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    refreshTokenService = module.get(RefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      refreshTokenService.createRefreshToken.mockResolvedValue('refresh-token');

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const result = await service.register(registerDto);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UserAlreadyExistsException when email exists', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      (comparePasswords as jest.Mock).mockResolvedValueOnce(true);
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password123',
      );
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      (comparePasswords as jest.Mock).mockResolvedValueOnce(false);
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user and generate tokens', async () => {
      refreshTokenService.revokeAllUserTokens.mockResolvedValue();
      usersService.update.mockResolvedValue(mockUser);
      refreshTokenService.createRefreshToken.mockResolvedValue('refresh-token');

      const result = await service.login(mockUser);
      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      refreshTokenService.validateRefreshToken.mockResolvedValue({
        id: '1',
        token: 'test',
        userId: '1',
        expiresAt: new Date(),
        revoked: false,
        user: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      refreshTokenService.revokeRefreshToken.mockResolvedValue();
      usersService.findOneById.mockResolvedValue(mockUser);
      usersService.update.mockResolvedValue(mockUser);
      refreshTokenService.createRefreshToken.mockResolvedValue(
        'new-refresh-token',
      );

      const result = await service.refreshToken('valid-refresh-token');
      expect(result.access_token).toBeDefined();
    });

    it('should throw when refresh token is invalid', async () => {
      refreshTokenService.validateRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        InvalidCredentialsException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      refreshTokenService.revokeRefreshToken.mockResolvedValue();
      refreshTokenService.revokeAllUserTokens.mockResolvedValue();

      await service.logout('1', 'refresh-token');
      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith('1');
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      const userWithVersion = { ...mockUser, sessionVersion: 0 };
      usersService.findOneById.mockResolvedValue(userWithVersion);

      const result = await service.validateSession('1', 0);
      expect(result).toEqual(userWithVersion);
    });

    it('should throw when user not found', async () => {
      usersService.findOneById.mockResolvedValue(null);

      await expect(service.validateSession('999', 0)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should throw when session version mismatch', async () => {
      const userWithVersion = { ...mockUser, sessionVersion: 5 };
      usersService.findOneById.mockResolvedValue(userWithVersion);

      await expect(service.validateSession('1', 999)).rejects.toThrow();
    });
  });
});
