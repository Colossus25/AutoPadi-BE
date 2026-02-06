import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Premium Auto Service', required: false })
  name?: string;

  @ApiProperty({ example: 'Professional auto repair and maintenance services', required: false })
  description?: string;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/demo/image/upload/service1.png',
      'https://res.cloudinary.com/demo/image/upload/service2.png',
    ],
    required: false,
    isArray: true,
    type: String,
  })
  media?: string[];

  @ApiProperty({ example: ['Repair', 'Maintenance'], isArray: true, required: false })
  category?: string[];

  @ApiProperty({ example: 'Lagos', required: false })
  region?: string;

  @ApiProperty({ example: '1, ABC Street, GRA - Ikeja, Lagos.', required: false })
  address?: string;

  @ApiProperty({ example: 'Individual', required: false })
  subscription_type?: string;

  @ApiProperty({ example: ['Mechanic', 'Electrician'], isArray: true, required: false })
  technician_categories?: string[];

  @ApiProperty({ example: ['Engine Repair', 'Brake Service'], isArray: true, required: false })
  specialized_in?: string[];

  @ApiProperty({ example: ['Cars', 'Trucks', 'SUVs'], isArray: true, required: false })
  type_of_vehicles?: string[];

  @ApiProperty({ example: 'Both', required: false })
  service_location?: string;

  @ApiProperty({ example: 'Specific Price', required: false })
  pricing?: string;

  @ApiProperty({ example: 'Per Service', required: false })
  specify_price_type?: string;

  @ApiProperty({ example: 'John Smith', required: false })
  contact_person_name?: string;

  @ApiProperty({ example: '+234-987-6543-210', required: false })
  contact_person_phone?: string;

  @ApiProperty({ example: '6.5244, 3.3792', required: false })
  location_coordinates?: string;

  @ApiProperty({ example: 'Padi Plan', required: false })
  subscription_plan?: string;
}
