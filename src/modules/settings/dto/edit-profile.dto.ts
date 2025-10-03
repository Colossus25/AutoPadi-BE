import { ApiProperty } from "@nestjs/swagger";

export class EditProfileDto {
  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Smith" })
  lastName: string;

  @ApiProperty({ example: "johnsmith@address.com" })
  email: string;

  @ApiProperty({ example: "+234-987-6543-210" })
  phone: string;

  @ApiProperty({ required: false, example: "NIN" })
  id_type?: string;

  @ApiProperty({ required: false, example: "1234567890" })
  id_number?: string;

  @ApiProperty({ type: "string", format: "binary", required: false })
  id_image?: Express.Multer.File;

  @ApiProperty({ example: "1, ABC Street, GRA - Ikeja, Lagos." })
  address: string;

  @ApiProperty({ example: "GRA" })
  landmark: string;

  @ApiProperty({ example: "Ikeja" })
  city: string;

  @ApiProperty({ example: "Lagos" })
  state: string;

  @ApiProperty({ type: "string", format: "binary", required: false })
  proof_of_address_image?: Express.Multer.File;
}
