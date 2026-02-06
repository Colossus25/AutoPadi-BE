import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverProfileDto {
  @ApiProperty({ example: 'John Doe', required: false })
  name?: string;

  @ApiProperty({ example: 'john@doe.com', required: false })
  email?: string;

  @ApiProperty({ example: '+234-987-6543-210', required: false })
  phone_number?: string;

  @ApiProperty({ example: 'Male', required: false })
  gender?: string;

  @ApiProperty({ example: '1, ABC Street, Ikeja, Lagos', required: false })
  address?: string;

  @ApiProperty({ example: 'BSc', required: false })
  level_of_education?: string;

  @ApiProperty({ example: 'Yoruba', required: false })
  tribe?: string;

  @ApiProperty({ example: 30, required: false })
  age?: number;

  @ApiProperty({ example: 'Single', required: false })
  marital_status?: string;

  @ApiProperty({ example: 'Christianity', required: false })
  religion?: string;

  @ApiProperty({ example: 5, required: false })
  years_of_experience?: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/license.png', required: false })
  valid_driver_license?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/utility-bill.png', required: false })
  utility_bill?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/cv.pdf', required: false })
  cv?: string;

  @ApiProperty({ example: true, required: false })
  open_to_relocation?: boolean;

  @ApiProperty({ example: 'Ogun', required: false })
  relocation_state?: string;

  @ApiProperty({ example: ['Sedan', 'SUV'], isArray: true, required: false })
  type_of_vehicles?: string[];

  @ApiProperty({ example: 'Padi Plan', required: false })
  subscription_plan?: string;
}
