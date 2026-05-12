import { HttpStatus } from '@nestjs/common';
import {
  InvalidCredentialsException,
  TokenExpiredException,
  SessionExpiredException,
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidRefreshTokenException,
  AccountLockedException,
} from 'src/modules/auth/exceptions/auth.exception';

describe('Auth Exceptions', () => {
  describe('InvalidCredentialsException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new InvalidCredentialsException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe('Invalid email or password');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('TokenExpiredException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new TokenExpiredException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe('Token has expired');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('SessionExpiredException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new SessionExpiredException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe('Session expired. Please login again.');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('UserAlreadyExistsException', () => {
    it('should create exception with email in message', () => {
      const exception = new UserAlreadyExistsException('test@example.com');
      const response = exception.getResponse() as any;

      expect(response.message).toBe(
        'User with email test@example.com already exists',
      );
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('UserNotFoundException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new UserNotFoundException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe('User not found');
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('InvalidRefreshTokenException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new InvalidRefreshTokenException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe('Invalid or expired refresh token');
      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('AccountLockedException', () => {
    it('should create exception with correct message and status', () => {
      const exception = new AccountLockedException();
      const response = exception.getResponse() as any;

      expect(response.message).toBe(
        'Account is locked. Please try again later.',
      );
      expect(exception.getStatus()).toBe(HttpStatus.LOCKED);
    });
  });
});
