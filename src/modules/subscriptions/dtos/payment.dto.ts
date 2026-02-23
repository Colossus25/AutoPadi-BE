import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ example: 1, description: 'Subscription plan ID' })
  subscription_plan_id: number;
}

export class VerifyPaymentDto {
  @ApiProperty({ example: 'reference123456', description: 'Paystack reference from payment' })
  reference: string;
}

export class RenewSubscriptionDto {
  @ApiProperty({ example: 1, description: 'Subscription plan ID to renew' })
  subscription_plan_id: number;
}

export class InitiateTrialDto {
  @ApiProperty({ example: 1, description: 'Subscription plan ID' })
  subscription_plan_id: number;
}
