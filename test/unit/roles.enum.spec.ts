import { UserRoles } from './roles.enum';

describe('UserRoles', () => {
  it('should have ADMIN role', () => {
    expect(UserRoles.ADMIN).toBe('admin');
  });

  it('should have USER role', () => {
    expect(UserRoles.USER).toBe('user');
  });

  it('should have MODERATOR role', () => {
    expect(UserRoles.MODERATOR).toBe('MODERATOR');
  });

  it('should have all expected roles', () => {
    const roles = Object.values(UserRoles);
    expect(roles).toContain('admin');
    expect(roles).toContain('user');
    expect(roles).toContain('MODERATOR');
  });
});