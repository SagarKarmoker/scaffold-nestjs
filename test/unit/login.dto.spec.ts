import { LoginDto } from './login.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('LoginDto', () => {
  it('should validate required fields', async () => {
    const dto = plainToInstance(LoginDto, {});
    const errors = await validate(dto);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.map(e => e.property)).toContain('email');
    expect(errors.map(e => e.property)).toContain('password');
  });

  it('should validate email format', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'invalid-email',
      password: 'password123',
    });
    const errors = await validate(dto);
    
    expect(errors.some(e => e.property === 'email')).toBe(true);
  });

  it('should pass with valid data', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'test@example.com',
      password: 'password123',
    });
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });
});