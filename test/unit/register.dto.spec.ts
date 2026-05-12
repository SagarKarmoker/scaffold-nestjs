import { RegisterDto } from 'src/modules/auth/dto/register.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('RegisterDto', () => {
  it('should validate required fields', async () => {
    const dto = plainToInstance(RegisterDto, {});
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map((e) => e.property)).toContain('email');
    expect(errors.map((e) => e.property)).toContain('password');
    expect(errors.map((e) => e.property)).toContain('name');
  });

  it('should validate email format', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'invalid-email',
      password: 'password123',
      name: 'Test User',
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('should pass with valid data', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });

  it('should validate password minimum length', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'test@example.com',
      password: '123',
      name: 'Test User',
    });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
