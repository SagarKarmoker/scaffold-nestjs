import { UserRoles } from 'src/utils/roles.enum';

export class AuthResponseDto {
  access_token!: string;
  refresh_token?: string;
  user!: {
    id: string;
    email: string;
    name: string;
  };
}

export class UserPayload {
  sub!: string;
  email!: string;
  role!: UserRoles;
  iat?: number;
  exp?: number;
}
