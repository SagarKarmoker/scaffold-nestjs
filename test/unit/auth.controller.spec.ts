import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService, TokenResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from 'src/users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    role: 'admin',
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokenResponse: TokenResponse = {
    access_token: 'mock-jwt-token',
    refresh_token: 'mock-refresh-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue({})
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      authService.register.mockResolvedValue(mockTokenResponse);
      
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };
      
      const result = await controller.register(registerDto);
      expect(result).toEqual(mockTokenResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      authService.login.mockResolvedValue(mockTokenResponse);
      
      const req = { user: mockUser } as any;
      const result = await controller.login(req);
      expect(result).toEqual(mockTokenResponse);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token', async () => {
      authService.refreshToken.mockResolvedValue(mockTokenResponse);
      
      const result = await controller.refreshToken({ refresh_token: 'token' });
      expect(result).toEqual(mockTokenResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith('token');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      authService.logout.mockResolvedValue();
      
      const req = { user: { id: '1' }, headers: { authorization: 'Bearer token' } } as any;
      const result = await controller.logout(req);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('1', 'token');
    });

    it('should logout without refresh token', async () => {
      authService.logout.mockResolvedValue();
      
      const req = { user: { id: '1' }, headers: {} } as any;
      const result = await controller.logout(req);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(authService.logout).toHaveBeenCalledWith('1', undefined);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      const req = { user: mockUser } as any;
      const result = controller.getProfile(req);
      
      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });
  });

  describe('adminOnly', () => {
    it('should return admin message', () => {
      const result = controller.adminOnly();
      expect(result).toEqual({ message: 'This is an admin-only endpoint' });
    });
  });
});