import { ApiProperty } from "@nestjs/swagger";

export class RoleDto {
  @ApiProperty({
    example: "auto dealer",
    enum: ["buyer", "auto dealer", "service provider", "driver", "driver employer"],
  })
  userType: string;
}
