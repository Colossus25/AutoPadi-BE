import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: 1, required: true })
  service_id: number;

  @ApiProperty({ example: '2026-02-15', required: true })
  booking_date: Date;

  @ApiProperty({ example: '10:00 AM', required: false })
  preferred_time?: string;

  @ApiProperty({ example: 'No. 5, Lekki Phase 1, Lagos', required: false })
  location?: string;

  @ApiProperty({ example: 'Need urgent oil change and filter replacement', required: false })
  description?: string;

  @ApiProperty({ example: 5000, required: false })
  estimated_cost?: number;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ example: 'scheduled', enum: ['scheduled', 'completed', 'cancelled'], required: true })
  status: 'scheduled' | 'completed' | 'cancelled';

  @ApiProperty({ example: 'Service completed successfully', required: false })
  notes?: string;

  @ApiProperty({ example: 6000, required: false })
  final_cost?: number;

  @ApiProperty({ example: 'Customer was not available', required: false })
  declined_reason?: string;

  @ApiProperty({ example: 'Service location was inaccessible', required: false })
  cancelled_reason?: string;
}

export class CreateReviewDto {
  @ApiProperty({ example: 5, enum: [1, 2, 3, 4, 5], required: true })
  rating: number;

  @ApiProperty({ example: 'Excellent service! Very professional and timely.', required: true })
  comment: string;
}

export class CreateReportDto {
  @ApiProperty({ example: 'unprofessional_service', required: true })
  reason: string;

  @ApiProperty({ example: 'Service provider was rude and did not complete the work as agreed', required: false })
  description?: string;
}
