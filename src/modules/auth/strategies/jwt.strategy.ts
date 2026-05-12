import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/entities/user.entity';
import {
  SessionExpiredException,
  UserNotFoundException,
} from '../exceptions/auth.exception';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      const user = await this.usersService.findOneById(payload.sub);
      if (!user) {
        throw new UserNotFoundException();
      }
      if (user.sessionVersion !== payload.sessionVersion) {
        throw new SessionExpiredException();
      }
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error`, error);
      throw error;
    }
  }
}
