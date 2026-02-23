import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentType } from '../entities/payment.entity';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaystackService } from './paystack.service';
import { SubscriptionNotificationService } from './subscription-notification.service';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

interface InitiatePaymentResult {
  payment_id: number;
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface PaymentVerifyResult {
  payment_id: number;
  user_subscription_id: number;
  status: UserSubscriptionStatus;
  authorization_code: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
    private readonly paystackService: PaystackService,
    private readonly notificationService: SubscriptionNotificationService,
  ) {}

  /**
   * Initiate a payment for a subscription plan
   * Returns Paystack payment URL and payment record details
   */
  async initiatePayment(
    user: User,
    planId: number,
    paymentType: PaymentType = PaymentType.INITIAL,
  ): Promise<InitiatePaymentResult> {
    // Verify plan exists and is active
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${planId} not found`);
    }

    if (plan.status !== 'active') {
      throw new BadRequestException('This subscription plan is not currently available');
    }

    // Generate unique reference
    const reference = `PAY-${user.id}-${Date.now()}`;

    // Create payment record
    const payment = this.paymentRepository.create({
      user_id: user.id,
      subscription_plan_id: planId,
      amount: plan.amount,
      status: PaymentStatus.PENDING,
      payment_type: paymentType,
      paystack_reference: reference,
    });

    await this.paymentRepository.save(payment);

    // Initialize payment with Paystack
    const paystackResponse = await this.paystackService.initializePayment({
      email: user.email,
      amount: plan.amount,
      reference,
    });

    return {
      payment_id: payment.id,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
      reference: paystackResponse.data.reference,
    };
  }

  /**
   * Verify and process a successful payment
   */
  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    // Find payment by reference
    const payment = await this.paymentRepository.findOne({
      where: { paystack_reference: reference },
      relations: ['subscription_plan', 'user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference ${reference} not found`);
    }

    // Verify with Paystack
    const paystackData = await this.paystackService.verifyPayment(reference);

    if (paystackData.data.status !== 'success') {
      payment.status = PaymentStatus.FAILED;
      payment.paystack_message = `Payment failed: ${paystackData.message}`;
      await this.paymentRepository.save(payment);

      // Send payment failed notification
      await this.notificationService.notifyPaymentFailed(payment.user, payment, paystackData.message);

      throw new BadRequestException('Payment was not successful. Please try again.');
    }

    // Update payment record
    payment.status = PaymentStatus.SUCCESS;
    payment.paid_at = new Date(paystackData.data.paid_at);
    payment.paystack_message = 'Payment successful';
    await this.paymentRepository.save(payment);

    // Create or update user subscription
    let userSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        user_id: payment.user_id,
        subscription_plan_id: payment.subscription_plan_id,
      },
      relations: ['subscription_plan', 'user'],
    });

    const authCode = paystackData.data.authorization.authorization_code;
    const plan = payment.subscription_plan;
    const now = new Date();
    const daysInBillingPeriod = plan.billing_interval === 'yearly' ? 365 : 30;
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysInBillingPeriod);

    const isNewSubscription = !userSubscription;

    if (!userSubscription) {
      userSubscription = this.userSubscriptionRepository.create({
        user_id: payment.user_id,
        subscription_plan_id: payment.subscription_plan_id,
        status: UserSubscriptionStatus.ACTIVE,
        subscription_start_date: now,
        subscription_end_date: endDate,
        next_charge_date: endDate,
        paystack_authorization_code: authCode,
        paystack_reference: reference,
        subscription_plan: plan,
        user: payment.user,
      });
    } else {
      userSubscription.status = UserSubscriptionStatus.ACTIVE;
      userSubscription.subscription_start_date = now;
      userSubscription.subscription_end_date = endDate;
      userSubscription.next_charge_date = endDate;
      userSubscription.paystack_authorization_code = authCode;
      userSubscription.paystack_reference = reference;
    }

    await this.userSubscriptionRepository.save(userSubscription);
    payment.user_subscription_id = userSubscription.id;
    await this.paymentRepository.save(payment);

    // Send activation notification for new subscriptions
    if (isNewSubscription) {
      await this.notificationService.notifySubscriptionActivated(payment.user, userSubscription);
    }

    // Send payment success notification
    await this.notificationService.notifyPaymentSuccessful(payment.user, payment);

    return {
      payment_id: payment.id,
      user_subscription_id: userSubscription.id,
      status: userSubscription.status,
      authorization_code: authCode,
    };
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(user: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { user_id: user.id },
      relations: ['subscription_plan'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      payments,
    };
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      relations: ['user', 'subscription_plan'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      payments,
    };
  }

  /**
   * Get all payments for a specific user (admin only)
   */
  async getUserPayments(userId: number, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { user_id: userId },
      relations: ['subscription_plan', 'user'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      payments,
    };
  }

  /**
   * Create a free trial subscription (no payment required)
   */
  async createTrialSubscription(
    user: User,
    planId: number,
  ): Promise<{ user_subscription_id: number; status: UserSubscriptionStatus }> {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${planId} not found`);
    }

    if (plan.free_trial_days === 0) {
      throw new BadRequestException('This plan does not offer a free trial');
    }

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + plan.free_trial_days);

    const userSubscription = this.userSubscriptionRepository.create({
      user_id: user.id,
      subscription_plan_id: planId,
      status: UserSubscriptionStatus.TRIAL,
      free_trial_active: true,
      free_trial_end_date: trialEndDate,
      subscription_start_date: now,
    });

    await this.userSubscriptionRepository.save(userSubscription);

    return {
      user_subscription_id: userSubscription.id,
      status: userSubscription.status,
    };
  }

  /**
   * Get user's active subscription
   */
  async getUserActiveSubscription(user: User) {
    return await this.userSubscriptionRepository.find({
      where: [
        { user_id: user.id, status: UserSubscriptionStatus.ACTIVE },
        { user_id: user.id, status: UserSubscriptionStatus.TRIAL },
      ],
      relations: ['subscription_plan'],
    });
  }

  /**
   * Check if user has an active subscription for a plan
   */
  async hasActiveSubscription(user: User): Promise<boolean> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: [
        { user_id: user.id, status: UserSubscriptionStatus.ACTIVE },
        { user_id: user.id, status: UserSubscriptionStatus.TRIAL },
      ],
    });

    return !!subscription;
  }

  /**
   * Charge a subscription renewal using authorization code
   */
  async renewSubscription(userSubscription: UserSubscription): Promise<void> {
    if (!userSubscription.paystack_authorization_code) {
      throw new BadRequestException('No authorization code available for renewal');
    }

    const reference = `REN-${userSubscription.id}-${Date.now()}`;
    const user = userSubscription.user;
    const plan = userSubscription.subscription_plan;

    try {
      const paystackResponse = await this.paystackService.chargeAuthorization({
        authorization_code: userSubscription.paystack_authorization_code,
        email: user.email,
        amount: plan.amount,
        reference,
      });

      if (paystackResponse.status) {
        // Create payment record for renewal
        const payment = this.paymentRepository.create({
          user_id: user.id,
          subscription_plan_id: plan.id,
          user_subscription_id: userSubscription.id,
          amount: plan.amount,
          status: PaymentStatus.SUCCESS,
          payment_type: PaymentType.RENEWAL,
          paystack_reference: reference,
          paid_at: new Date(),
        });

        await this.paymentRepository.save(payment);

        // Update subscription dates
        const now = new Date();
        const daysInBillingPeriod = plan.billing_interval === 'yearly' ? 365 : 30;
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + daysInBillingPeriod);

        userSubscription.subscription_start_date = now;
        userSubscription.subscription_end_date = endDate;
        userSubscription.next_charge_date = endDate;
        userSubscription.status = UserSubscriptionStatus.ACTIVE;

        await this.userSubscriptionRepository.save(userSubscription);
      }
    } catch (error) {
      // Log renewal failure but don't throw - handle gracefully
      const payment = this.paymentRepository.create({
        user_id: user.id,
        subscription_plan_id: plan.id,
        user_subscription_id: userSubscription.id,
        amount: plan.amount,
        status: PaymentStatus.FAILED,
        payment_type: PaymentType.RENEWAL,
        paystack_reference: reference,
        paystack_message: error.message,
      });

      await this.paymentRepository.save(payment);
      userSubscription.status = UserSubscriptionStatus.EXPIRED;
      await this.userSubscriptionRepository.save(userSubscription);
    }
  }

  /**
   * Handle payment failure via webhook
   */
  async handlePaymentFailure(reference: string) {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { paystack_reference: reference },
        relations: ['user'],
      });

      if (!payment) {
        return { success: false, message: 'Payment not found' };
      }

      payment.status = PaymentStatus.FAILED;
      payment.paystack_message = 'Charge failed via webhook';
      await this.paymentRepository.save(payment);

      return { success: true, message: 'Payment failure recorded' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to record payment failure');
    }
  }
}
