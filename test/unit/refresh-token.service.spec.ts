import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from 'src/modules/auth/refresh-token.service';
import { RefreshToken } from 'src/modules/auth/entities/refresh-token.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UserRoles } from 'src/common/utils/roles.enum';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repository: any;

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

  const mockRefreshToken: RefreshToken = {
    id: '1',
    token: 'test-token',
    userId: '1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revoked: false,
    user: mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('7d'),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    repository = module.get(getRepositoryToken(RefreshToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      repository.create.mockReturnValue(mockRefreshToken);
      repository.save.mockResolvedValue(mockRefreshToken);

      const result = await service.createRefreshToken(mockUser);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('validateRefreshToken', () => {
    it('should return token when valid', async () => {
      repository.findOne.mockResolvedValue(mockRefreshToken);

      const result = await service.validateRefreshToken('valid-token');
      expect(result).toEqual(mockRefreshToken);
    });

    it('should return null when token not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.validateRefreshToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null when token is expired', async () => {
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      };
      repository.findOne.mockResolvedValue(expiredToken);

      const result = await service.validateRefreshToken('expired-token');
      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.revokeRefreshToken('test-token');
      expect(repository.update).toHaveBeenCalledWith(
        { token: 'test-token' },
        { revoked: true },
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all user tokens', async () => {
      repository.update.mockResolvedValue({ affected: 1 });

      await service.revokeAllUserTokens('1');
      expect(repository.update).toHaveBeenCalledWith(
        { userId: '1', revoked: false },
        { revoked: true },
      );
    });
  });
});
