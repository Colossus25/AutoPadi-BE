import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Payment } from './entities/payment.entity';
import { SubscriptionPlanService } from './services/subscription-plan.service';
import { PaystackService } from './services/paystack.service';
import { PaymentService } from './services/payment.service';
import { UserSubscriptionService } from './services/user-subscription.service';
import { SubscriptionRenewalService } from './services/subscription-renewal.service';
import { SubscriptionNotificationService } from './services/subscription-notification.service';
import { SubscriptionPlanController } from './controllers/subscription-plan.controller';
import { UserSubscriptionController } from './controllers/user-subscription.controller';
import { WebhookController } from './controllers/webhook.controller';
import { SuperadminSubscriptionController } from './controllers/superadmin-subscription.controller';
import { SuperAdmin } from '../superadmin/entities/super-admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, Payment, SuperAdmin]),
    ConfigModule,
  ],
  providers: [
    SubscriptionPlanService,
    PaystackService,
    PaymentService,
    UserSubscriptionService,
    SubscriptionRenewalService,
    SubscriptionNotificationService,
  ],
  controllers: [
    UserSubscriptionController,
    WebhookController,
    SubscriptionPlanController,
    SuperadminSubscriptionController,
  ],
  exports: [
    SubscriptionPlanService,
    PaystackService,
    PaymentService,
    UserSubscriptionService,
    SubscriptionRenewalService,
    SubscriptionNotificationService,
  ],
})
export class SubscriptionsModule {}
