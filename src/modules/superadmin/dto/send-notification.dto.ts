import { ApiProperty } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ example: [1, 2, 3], type: [Number], required: true })
  userIds: number[];

  @ApiProperty({ example: 'booking_update', required: true })
  tag: string;

  @ApiProperty({ example: 'Booking confirmed', required: true })
  title: string;

  @ApiProperty({ example: 'Your booking has been confirmed.', required: true })
  body: string;

  @ApiProperty({
    example: { type: 'booking', entityId: '42' },
    required: false,
    description: 'Arbitrary string key/value pairs delivered with the push.',
  })
  data?: Record<string, string>;
}

export class BroadcastNotificationDto {
  @ApiProperty({
    example: 'driver',
    enum: ['driver', 'auto dealer', 'service provider', 'driver employer'],
    required: false,
    description: 'Omit to broadcast to all users.',
  })
  userType?: 'driver' | 'auto dealer' | 'service provider' | 'driver employer';

  @ApiProperty({ example: 'promo', required: true })
  tag: string;

  @ApiProperty({ example: 'New feature available', required: true })
  title: string;

  @ApiProperty({ example: 'Check out what we just shipped.', required: true })
  body: string;

  @ApiProperty({
    example: { type: 'promo' },
    required: false,
    description: 'Arbitrary string key/value pairs delivered with the push.',
  })
  data?: Record<string, string>;
}
