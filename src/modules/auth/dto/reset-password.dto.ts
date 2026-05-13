import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit reset code' })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({ example: 'NewSecure@1', description: 'New password (min 8 chars, upper, lower, digit)' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'newPassword must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword!: string;
}
