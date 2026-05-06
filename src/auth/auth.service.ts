import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(private readonly usersService: UsersService){}

    async validateUser(email: string, passsword: string) : Promise<any> {
        try {
            const user = await this.usersService.findOneByEmail(email);
            if (user && user.password === passsword) {
                const { password, ...result } = user;
                return result;
            }
            return null;
        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('Error validating user:', error.message);
            }
            throw error;
        }
    }
}
