import { ApiProperty } from "@nestjs/swagger";

export class GoogleAuthDto {
  @ApiProperty({ description: "Google ID token obtained client-side via the Google SDK" })
  idToken: string;

  @ApiProperty({
    required: false,
    description: "Role to sign up / sign in as. Defaults to buyer for new accounts.",
    enum: ["buyer", "auto dealer", "service provider", "driver", "driver employer"],
  })
  userType?: string;
}
