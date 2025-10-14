import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Store Name', required: false })
  name?: string;

  @ApiProperty({ example: 'This store is shown on the main page', required: false })
  description?: string;

  @ApiProperty({ example: 'http://res.cloudinary.com/dqaui3vaf/image/upload/v1760195782/cyxlpcga3amnxy6nhknw.png', required: false })
  image?: string;

  @ApiProperty({ example: 'Automobile', required: false })
  category?: string;

  @ApiProperty({ example: '1, ABC Street, GRA - Ikeja, Lagos.', required: false })
  address?: string;

  @ApiProperty({ example: 'Company', required: false })
  subscription_type?: string;

  @ApiProperty({ example: 'AUTOPADI-1234', required: false })
  registration_no?: string;

  @ApiProperty({ example: '+234-987-6543-210', required: false })
  phone?: string;

  @ApiProperty({ example: 'johnsmith@address.com', required: false })
  email?: string;

  @ApiProperty({ example: 'https://www.autopadi.ng', required: false })
  website?: string;

  @ApiProperty({ example: 'John Smith', required: false })
  contact_person_name?: string;

  @ApiProperty({ example: '+234-987-6543-210', required: false })
  contact_person_phone?: string;

  @ApiProperty({ example: '40.714, -74.006', required: false })
  location_coordinates?: string;

  @ApiProperty({ example: 'Padi Plan', required: false })
  subscription_plan?: string;
}
