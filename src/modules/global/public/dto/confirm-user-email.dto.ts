import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUserEmailDto {
  @ApiProperty({ example: '123456' })
  token: string;

  @ApiProperty({ example: 'johnsmith@address.com' })
  email: string;
}
