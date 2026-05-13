import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: 'abc123...', description: 'Refresh token received from login or refresh' })
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}
