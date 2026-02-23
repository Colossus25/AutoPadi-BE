import { Controller, Post, Body, HttpCode, BadRequestException, InternalServerErrorException, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '@/guards/decorator/public.decorator';
import { PaystackService } from '../services/paystack.service';
import { PaymentService } from '../services/payment.service';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { ApiTags } from '@nestjs/swagger';

interface PaystackWebhookData {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    paidAt: string;
    status: string;
    customer: {
      id: number;
      email: string;
      code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      card_type: string;
    };
  };
}

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly paymentService: PaymentService,
    private readonly userSubscriptionService: UserSubscriptionService,
  ) {}

  /**
   * Paystack webhook endpoint
   * Handles charge.success and other payment events
   */
  @Post('paystack')
  @Public()
  @HttpCode(200)
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    try {
      // Verify webhook signature using raw body
      const isValid = this.paystackService.verifyWebhookSignature(JSON.stringify(payload), signature);

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const event = payload.event;
      const data = payload.data;

      // Handle charge.success event
      if (event === 'charge.success') {
        return await this.handleChargeSuccess(data);
      }

      // Handle charge.failed event
      if (event === 'charge.failed') {
        return await this.handleChargeFailed(data);
      }

      // Handle other events silently
      return { success: true, message: 'Event received' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Return 200 to prevent Paystack from retrying
      // But log the error for debugging
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle successful charge event
   */
  private async handleChargeSuccess(data: PaystackWebhookData['data']) {
    try {
      // Verify payment with Paystack to ensure it's legitimate
      const paystackResponse = await this.paystackService.verifyPayment(data.reference);

      if (paystackResponse.data.status !== 'success') {
        throw new BadRequestException('Payment verification failed with Paystack');
      }

      // Update payment and subscription via PaymentService
      // This also triggers notifications: paymentSuccessful, subscriptionActivated
      await this.paymentService.verifyPayment(data.reference);

      console.log(`Payment success processed for reference: ${data.reference}`);

      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      console.error('Error processing charge.success:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle failed charge event
   */
  private async handleChargeFailed(data: PaystackWebhookData['data']) {
    try {
      // Record payment failure via PaymentService
      // This also triggers notifications: paymentFailed
      const result = await this.paymentService.handlePaymentFailure(data.reference);
      console.log(`Payment failed for reference: ${data.reference}`);

      return { success: true, message: 'Payment failure recorded' };
    } catch (error) {
      console.error('Error processing charge.failed:', error);
      return { success: false, error: error.message };
    }
  }
}
