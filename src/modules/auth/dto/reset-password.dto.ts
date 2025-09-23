import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '375930' })
  token: string;

  @ApiProperty({ example: 'password1234' })
  password: string;

  @ApiProperty({ example: 'password1234' })
  password_confirmation: string;
}
