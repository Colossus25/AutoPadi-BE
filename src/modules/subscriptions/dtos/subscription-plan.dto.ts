import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'Basic' })
  name: string;

  @ApiProperty({ example: 50000, description: 'Amount in Naira (kobo)' })
  amount: number;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'yearly', 'quarterly'] })
  billing_interval: string;

  @ApiProperty({ example: 0, description: 'Free trial days (0 = no trial)' })
  free_trial_days: number;

  @ApiProperty({ example: 'Basic subscription plan', required: false })
  description?: string;

  @ApiProperty({
    example: ['Feature 1', 'Feature 2'],
    required: false,
    isArray: true,
  })
  features?: string[];

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status: string;
}

export class UpdateSubscriptionPlanDto {
  @ApiProperty({ example: 'Professional', required: false })
  name?: string;

  @ApiProperty({ example: 100000, required: false })
  amount?: number;

  @ApiProperty({ example: 'monthly', required: false })
  billing_interval?: string;

  @ApiProperty({ example: 7, required: false })
  free_trial_days?: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ isArray: true, required: false })
  features?: string[];

  @ApiProperty({ example: 'active', required: false })
  status?: string;
}
