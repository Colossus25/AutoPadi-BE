import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverJobDto {
  @ApiProperty({ example: 'Personal Driver Needed', required: false })
  title?: string;

  @ApiProperty({ example: 'employer@example.com', required: false })
  email?: string;

  @ApiProperty({ example: '+234-987-6543-210', required: false })
  phone?: string;

  @ApiProperty({ example: '1, ABC Street, Ikeja, Lagos', required: false })
  address?: string;

  @ApiProperty({ example: 'Corporate', required: false })
  employing_type?: string;

  @ApiProperty({ example: 2, required: false })
  number_of_driver_needed?: number;

  @ApiProperty({ example: 'Male', required: false })
  driver_gender?: string;

  @ApiProperty({ example: 30, required: false })
  driver_age?: number;

  @ApiProperty({ example: 'BSc', required: false })
  driver_level_of_education?: string;

  @ApiProperty({ example: 'Married', required: false })
  driver_marital_status?: string;

  @ApiProperty({ example: 'Christianity', required: false })
  religion?: string;

  @ApiProperty({ example: 5, required: false })
  driver_years_of_experience?: number;

  @ApiProperty({ example: true, required: false })
  valid_driver_license?: boolean;

  @ApiProperty({ example: true, required: false })
  driver_must_reside_in_state?: boolean;

  @ApiProperty({ example: false, required: false })
  accomodation_available?: boolean;

  @ApiProperty({ example: ['Sedan', 'SUV'], isArray: true, required: false })
  type_of_vehicles?: string[];

  @ApiProperty({ example: 'Padi Plan', required: false })
  subscription_plan?: string;
}
