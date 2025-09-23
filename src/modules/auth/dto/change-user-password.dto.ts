import { ApiProperty } from '@nestjs/swagger';

export class ChangeUserPasswordDto {
  @ApiProperty({ example: 'password1234' })
  old_password: string;

  @ApiProperty({ example: 'password1234' })
  new_password: string;

  @ApiProperty({ example: 'password1234' })
  new_password_confirmation?: string;
}
