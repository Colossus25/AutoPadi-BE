import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, IsNull } from 'typeorm';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';
import { Payment, PaymentStatus, PaymentType } from '../entities/payment.entity';
import { PaystackService } from './paystack.service';
import { SubscriptionNotificationService } from './subscription-notification.service';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

@Injectable()
export class SubscriptionRenewalService {
  private readonly logger = new Logger(SubscriptionRenewalService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    private readonly paystackService: PaystackService,
    private readonly notificationService: SubscriptionNotificationService,
  ) {}

  /**
   * Run every day at 2:00 AM to check and renew expired subscriptions
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleSubscriptionRenewal() {
    this.logger.log('Starting subscription renewal check...');

    try {
      const now = new Date();

      // Find subscriptions that are due for renewal (next_charge_date is today or earlier)
      const subscriptionsToRenew = await this.userSubscriptionRepository.find({
        where: {
          next_charge_date: LessThanOrEqual(now),
          status: UserSubscriptionStatus.ACTIVE,
          paystack_authorization_code: Not(IsNull()),
        },
        relations: ['subscription_plan', 'user'],
      });

      this.logger.log(`Found ${subscriptionsToRenew.length} subscriptions to renew`);

      for (const subscription of subscriptionsToRenew) {
        await this.renewSubscription(subscription);
      }

      this.logger.log('Subscription renewal check completed');
    } catch (error) {
      this.logger.error(`Error during subscription renewal: ${error.message}`, error.stack);
    }
  }

  /**
   * Renew a single subscription using stored authorization code
   */
  private async renewSubscription(subscription: UserSubscription) {
    const reference = `RENEW-${subscription.user_id}-${subscription.id}-${Date.now()}`;

    try {
      this.logger.log(`Attempting to renew subscription ${subscription.id} for user ${subscription.user_id}`);

      // Get subscription plan details
      const plan = subscription.subscription_plan;

      // Attempt to charge the authorization code
      const chargeResponse = await this.paystackService.chargeAuthorization({
        authorization_code: subscription.paystack_authorization_code,
        email: subscription.user.email,
        amount: plan.amount,
        reference,
      });

      if (chargeResponse.data.status === 'success') {
        // Update subscription record
        const now = new Date();
        const daysInBillingPeriod = plan.billing_interval === 'yearly' ? 365 : 30;
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + daysInBillingPeriod);

        subscription.status = UserSubscriptionStatus.ACTIVE;
        subscription.subscription_start_date = now;
        subscription.subscription_end_date = endDate;
        subscription.next_charge_date = endDate;
        subscription.paystack_reference = reference;

        await this.userSubscriptionRepository.save(subscription);

        // Create payment record for renewal
        const payment = this.paymentRepository.create({
          user_id: subscription.user_id,
          subscription_plan_id: subscription.subscription_plan_id,
          user_subscription_id: subscription.id,
          amount: plan.amount,
          status: PaymentStatus.SUCCESS,
          payment_type: PaymentType.RENEWAL,
          paystack_reference: reference,
          paid_at: new Date(),
        });

        await this.paymentRepository.save(payment);

        // Send renewal success notification
        await this.notificationService.notifySubscriptionRenewed(
          subscription.user,
          subscription,
        );

        this.logger.log(
          `Successfully renewed subscription ${subscription.id} for user ${subscription.user_id}`,
        );
      } else {
        // Charge failed - mark subscription as expired
        await this.handleRenewalFailure(subscription, reference, chargeResponse.message);
      }
    } catch (error) {
      this.logger.error(
        `Error renewing subscription ${subscription.id}: ${error.message}`,
        error.stack,
      );

      // Record the failure
      await this.handleRenewalFailure(subscription, reference, error.message);
    }
  }

  /**
   * Handle subscription renewal failure
   */
  private async handleRenewalFailure(
    subscription: UserSubscription,
    reference: string,
    errorMessage: string,
  ) {
    try {
      // Mark subscription as expired
      subscription.status = UserSubscriptionStatus.EXPIRED;
      await this.userSubscriptionRepository.save(subscription);

      // Create failed payment record
      const payment = this.paymentRepository.create({
        user_id: subscription.user_id,
        subscription_plan_id: subscription.subscription_plan_id,
        user_subscription_id: subscription.id,
        amount: subscription.subscription_plan.amount,
        status: PaymentStatus.FAILED,
        payment_type: PaymentType.RENEWAL,
        paystack_reference: reference,
        paystack_message: `Renewal failed: ${errorMessage}`,
      });

      await this.paymentRepository.save(payment);

      // Send renewal failure notification
      await this.notificationService.notifySubscriptionRenewalFailed(
        subscription.user,
        subscription,
        errorMessage,
      );

      this.logger.warn(
        `Subscription ${subscription.id} renewal failed and marked as expired. Error: ${errorMessage}`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling renewal failure for subscription ${subscription.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Mark subscriptions as expired if they pass their end date
   * Run every day at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');

    try {
      const now = new Date();

      // Find subscriptions that have passed their end date but are still marked as active
      const expiredSubscriptions = await this.userSubscriptionRepository.find({
        where: {
          subscription_end_date: LessThanOrEqual(now),
          status: UserSubscriptionStatus.ACTIVE,
        },
        relations: ['user', 'subscription_plan'],
      });

      this.logger.log(`Found ${expiredSubscriptions.length} subscriptions that have expired`);

      for (const subscription of expiredSubscriptions) {
        subscription.status = UserSubscriptionStatus.EXPIRED;
        await this.userSubscriptionRepository.save(subscription);

        // Send expiry notification
        await this.notificationService.notifySubscriptionExpired(
          subscription.user,
          subscription,
        );

        this.logger.log(`Marked subscription ${subscription.id} as expired`);
      }

      // Also check for subscriptions expiring in 7 days and send warning notification
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const expiringSubscriptions = await this.userSubscriptionRepository.find({
        where: {
          subscription_end_date: LessThanOrEqual(sevenDaysFromNow),
          status: UserSubscriptionStatus.ACTIVE,
        },
        relations: ['user', 'subscription_plan'],
      });

      this.logger.log(`Found ${expiringSubscriptions.length} subscriptions expiring within 7 days`);

      for (const subscription of expiringSubscriptions) {
        // Only send warning if not already sent (to avoid duplicate notifications)
        // In production, you might want to track notification history
        await this.notificationService.notifySubscriptionExpiringsoon(
          subscription.user,
          subscription,
        );

        this.logger.log(`Sent expiry warning for subscription ${subscription.id}`);
      }
    } catch (error) {
      this.logger.error(`Error checking expired subscriptions: ${error.message}`, error.stack);
    }
  }
}
