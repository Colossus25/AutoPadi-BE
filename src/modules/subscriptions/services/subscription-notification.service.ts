import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { EmailService } from '@/core/utils/mailer';
import * as path from 'path';
import * as pug from 'pug';

interface NotificationPayload {
  user: User;
  subscription: UserSubscription;
  payment?: Payment;
  reason?: string;
}

@Injectable()
export class SubscriptionNotificationService {
  private readonly logger = new Logger(SubscriptionNotificationService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  /**
   * Send subscription activated email
   */
  async notifySubscriptionActivated(user: User, subscription: UserSubscription) {
    try {
      const payload = {
        email: user.email,
        token: '',
        subject: 'Subscription Activated',
      };

      await this.sendEmail(user, 'subscriptionActivated', 'Subscription Activated', {
        planName: subscription.subscription_plan?.name || 'Your Plan',
        startDate: subscription.subscription_start_date?.toLocaleDateString() || new Date().toLocaleDateString(),
        endDate: subscription.subscription_end_date?.toLocaleDateString() || 'N/A',
      });

      this.logger.log(`Subscription activated email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send subscription activated email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send subscription expiring soon warning email (7 days before)
   */
  async notifySubscriptionExpiringsoon(user: User, subscription: UserSubscription) {
    try {
      const daysLeft = Math.ceil(
        (subscription.subscription_end_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.sendEmail(user, 'subscriptionExpiringWarning', 'Your Subscription is Expiring Soon', {
        planName: subscription.subscription_plan?.name || 'Your Plan',
        expiryDate: subscription.subscription_end_date?.toLocaleDateString() || 'N/A',
        daysLeft,
      });

      this.logger.log(`Subscription expiring warning email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send subscription expiring warning email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send subscription expired email
   */
  async notifySubscriptionExpired(user: User, subscription: UserSubscription) {
    try {
      await this.sendEmail(user, 'subscriptionExpired', 'Your Subscription Has Expired', {
        planName: subscription.subscription_plan?.name || 'Your Plan',
        expiryDate: subscription.subscription_end_date?.toLocaleDateString() || 'N/A',
      });

      this.logger.log(`Subscription expired email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send subscription expired email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send subscription renewed successfully email
   */
  async notifySubscriptionRenewed(user: User, subscription: UserSubscription) {
    try {
      await this.sendEmail(user, 'subscriptionRenewed', 'Subscription Renewed Successfully', {
        planName: subscription.subscription_plan?.name || 'Your Plan',
        amount: subscription.subscription_plan?.amount / 100 || 0,
        renewalDate: new Date().toLocaleDateString(),
        nextDueDate: subscription.subscription_end_date?.toLocaleDateString() || 'N/A',
      });

      this.logger.log(`Subscription renewed email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send subscription renewed email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send subscription renewal failed email
   */
  async notifySubscriptionRenewalFailed(user: User, subscription: UserSubscription, reason: string) {
    try {
      await this.sendEmail(user, 'subscriptionRenewalFailed', 'Subscription Renewal Failed', {
        planName: subscription.subscription_plan?.name || 'Your Plan',
        failureReason: reason,
        nextRetryDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(),
      });

      this.logger.log(`Subscription renewal failed email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send subscription renewal failed email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send payment failed email
   */
  async notifyPaymentFailed(user: User, payment: Payment, reason: string) {
    try {
      await this.sendEmail(user, 'paymentFailed', 'Payment Failed', {
        amount: payment.amount / 100 || 0,
        currency: 'NGN',
        failureReason: reason,
        reference: payment.paystack_reference,
      });

      this.logger.log(`Payment failed email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment failed email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Send payment successful email
   */
  async notifyPaymentSuccessful(user: User, payment: Payment) {
    try {
      await this.sendEmail(user, 'paymentSuccess', 'Payment Successful', {
        amount: payment.amount / 100 || 0,
        currency: 'NGN',
        reference: payment.paystack_reference,
        paidAt: payment.paid_at?.toLocaleDateString() || new Date().toLocaleDateString(),
        planName: payment.subscription_plan?.name || 'Your Plan',
      });

      this.logger.log(`Payment success email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment success email to ${user.email}: ${error.message}`,
      );
    }
  }

  /**
   * Generic email sending method with template support
   */
  private async sendEmail(user: User, template: string, subject: string, data: Record<string, any>) {
    try {
      const templatePath = path.join(process.cwd(), 'views', `${template}.pug`);

      const html = pug.renderFile(templatePath, {
        ...data,
        subject,
      });

      const emailService = new EmailService(user, '');
      const transporter = emailService.newTransport();

      const mailOptions = {
        from: `AutoPadi <${process.env.MAIL_EMAIL}>`,
        to: user.email,
        subject,
        html,
      };

      await transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${user.email} with subject: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      // Don't throw - allow application to continue even if email fails
    }
  }
}
