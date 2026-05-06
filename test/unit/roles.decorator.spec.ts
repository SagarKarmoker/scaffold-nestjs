import { SetMetadata } from '@nestjs/common';
import { UserRoles } from 'src/utils/roles.enum';
import { Roles, ROLES_KEY } from './roles.decorator';

jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn().mockImplementation((key, value) => {
    const decorator = () => {};
    Object.defineProperty(decorator, key, { value });
    return decorator;
  }),
}));

describe('Roles Decorator', () => {
  it('should be a function', () => {
    expect(typeof Roles).toBe('function');
  });

  it('should accept multiple roles', () => {
    const result = Roles(UserRoles.ADMIN, UserRoles.MODERATOR);
    expect(result).toBeDefined();
  });

  it('should accept single role', () => {
    const result = Roles(UserRoles.ADMIN);
    expect(result).toBeDefined();
  });
});