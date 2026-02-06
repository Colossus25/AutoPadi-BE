import { ApiProperty } from '@nestjs/swagger';

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'make', enum: ['make', 'type', 'year', 'colour', 'body', 'fuel'], required: true })
  attribute_type: 'make' | 'type' | 'year' | 'colour' | 'body' | 'fuel';

  @ApiProperty({ example: 'Toyota', required: true })
  value: string;
}
