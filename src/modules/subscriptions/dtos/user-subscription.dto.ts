import { ApiProperty } from '@nestjs/swagger';

export class ExtendSubscriptionDto {
  @ApiProperty({ example: 30, description: 'Number of days to extend subscription by' })
  days: number;

  @ApiProperty({ example: 'Promotional extension', description: 'Reason for extension', required: false })
  reason?: string;
}
