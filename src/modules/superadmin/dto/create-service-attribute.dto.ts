import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceAttributeDto {
  @ApiProperty({ example: 'technician_categories', enum: ['technician_categories', 'specialized_in', 'type_of_vehicles'], required: true })
  attribute_type: 'technician_categories' | 'specialized_in' | 'type_of_vehicles';

  @ApiProperty({ example: 'Mechanic', required: true })
  value: string;
}
