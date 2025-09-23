import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johnsmith@address.com' })
  email: string;

  @ApiProperty({ example: 'password1234' })
  password: string;
}
