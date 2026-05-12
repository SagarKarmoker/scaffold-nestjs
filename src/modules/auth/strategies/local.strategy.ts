import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { InvalidCredentialsException } from '../exceptions/auth.exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        this.logger.warn(`Login failed for email: ${email}`);
        throw new InvalidCredentialsException();
      }
      return user;
    } catch (error) {
      this.logger.error(`Local strategy validation error`, error);
      throw error;
    }
  }
}
