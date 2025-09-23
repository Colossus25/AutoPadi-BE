import { ApiProperty } from "@nestjs/swagger";

export class CreateAccountDto {
  @ApiProperty({ example: "johnsmith@address.com" })
  email: string;

  @ApiProperty({ example: "password1234" })
  password: string;

  @ApiProperty({ example: "password1234" })
  password_confirmation: string;
}
