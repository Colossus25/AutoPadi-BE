import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: '2021 Toyota Corolla', required: true })
  title: string;

  @ApiProperty({ example: 'A clean, neatly used Toyota Corolla 2021 model.', required: false })
  description?: string;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/demo/image/upload/car1.png',
      'https://res.cloudinary.com/demo/image/upload/car2.png',
    ],
    required: false,
    isArray: true,
    type: String,
  })
  media?: string[];

  @ApiProperty({ example: '6.5244, 3.3792', required: false })
  location_coordinates?: string;

  @ApiProperty({ example: 'Automobiles', required: false })
  category?: string;

  @ApiProperty({ example: 'Sale', required: false })
  listing_type?: string;

  @ApiProperty({ example: '4500000', required: false })
  price?: string;

  @ApiProperty({ example: 'Toyota', required: false })
  make?: string;

  @ApiProperty({ example: '2021', required: false })
  year?: string;

  @ApiProperty({ example: 'Compact', required: false })
  type?: string;

  @ApiProperty({ example: 'New', required: false })
  condition?: string;

  @ApiProperty({ example: '45000', required: false })
  mileage?: string;

  @ApiProperty({ example: 'Black', required: false })
  colour?: string;

  @ApiProperty({ example: 'Sedan', required: false })
  body?: string;

  @ApiProperty({ example: 'Petrol', required: false })
  fuel?: string;

  @ApiProperty({ example: 1, required: true })
  store_id: number;
}
