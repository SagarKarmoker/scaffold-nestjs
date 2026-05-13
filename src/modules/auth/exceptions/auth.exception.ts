import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.UNAUTHORIZED,
  ) {
    super(
      {
        statusCode,
        message,
        error: 'Authentication Error',
      },
      statusCode,
    );
  }
}

export class InvalidCredentialsException extends AuthException {
  constructor() {
    super('Invalid email or password', HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends AuthException {
  constructor() {
    super('Token has expired', HttpStatus.UNAUTHORIZED);
  }
}

export class SessionExpiredException extends AuthException {
  constructor() {
    super('Session expired. Please login again.', HttpStatus.UNAUTHORIZED);
  }
}

export class UserAlreadyExistsException extends AuthException {
  constructor() {
    super('Registration failed. Please check your details and try again.', HttpStatus.BAD_REQUEST);
  }
}

export class UserNotFoundException extends AuthException {
  constructor() {
    super('User not found', HttpStatus.NOT_FOUND);
  }
}

export class InvalidRefreshTokenException extends AuthException {
  constructor() {
    super('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
  }
}

export class AccountLockedException extends AuthException {
  constructor() {
    super('Account is locked. Please try again later.', HttpStatus.LOCKED);
  }
}
