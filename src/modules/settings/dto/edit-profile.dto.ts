import { ApiProperty } from "@nestjs/swagger";

export class EditProfileDto {
  @ApiProperty({ required: false, example: "John" })
  firstName: string;

  @ApiProperty({ required: false, example: "Smith" })
  lastName: string;

  @ApiProperty({ required: false, example: "johnsmith@address.com" })
  email: string;

  @ApiProperty({ required: false, example: "+234-987-6543-210" })
  phone: string;

  @ApiProperty({ required: false, example: "National ID" })
  id_type?: string;

  @ApiProperty({ required: false, example: "1234567890" })
  id_number?: string;

  @ApiProperty({ type: "string", format: "binary", required: false })
  id_image?: Express.Multer.File;

  @ApiProperty({ required: false, example: "1, ABC Street, GRA - Ikeja, Lagos." })
  address: string;

  @ApiProperty({ required: false, example: "GRA" })
  landmark: string;

  @ApiProperty({ required: false, example: "Ikeja" })
  city: string;

  @ApiProperty({ required: false, example: "Lagos" })
  state: string;

  @ApiProperty({ type: "string", format: "binary", required: false })
  proof_of_address_image?: Express.Multer.File;
}
