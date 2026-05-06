import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY } from './roles.guard';
import { UserRoles } from 'src/utils/roles.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (user: any, handler: any = {}, classVal: any = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => classVal,
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ role: 'user' });
    
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should return true when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRoles.ADMIN]);
    const context = createMockContext({ role: 'admin' });
    
    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user lacks required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRoles.ADMIN]);
    const context = createMockContext({ role: 'user' });
    
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});