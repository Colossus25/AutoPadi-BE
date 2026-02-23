import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    paid_at: string;
    customer: {
      id: number;
      email: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
    };
  };
}

interface PaystackChargeAuthResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: 'success' | 'failed' | 'pending';
    amount: number;
    authorization: {
      authorization_code: string;
    };
  };
}

interface InitializePaymentDto {
  email: string;
  amount: number; // in Naira (kobo)
  reference: string;
}

interface ChargeAuthorizationDto {
  authorization_code: string;
  email: string;
  amount: number; // in Naira (kobo)
  reference: string;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly apiClient: AxiosInstance;
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';

    if (!this.secretKey) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured');
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment(dto: InitializePaymentDto): Promise<PaystackInitResponse> {
    try {
      const response = await this.apiClient.post<PaystackInitResponse>('/transaction/initialize', {
        email: dto.email,
        amount: dto.amount,
        reference: dto.reference,
      });

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to initialize payment');
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error initializing payment: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to initialize payment with Paystack');
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await this.apiClient.get<PaystackVerifyResponse>(
        `/transaction/verify/${reference}`,
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to verify payment');
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error verifying payment: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to verify payment');
    }
  }

  /**
   * Charge an authorization (for recurring payments)
   */
  async chargeAuthorization(dto: ChargeAuthorizationDto): Promise<PaystackChargeAuthResponse> {
    try {
      const response = await this.apiClient.post<PaystackChargeAuthResponse>(
        '/transaction/charge_authorization',
        {
          authorization_code: dto.authorization_code,
          email: dto.email,
          amount: dto.amount,
          reference: dto.reference,
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(response.data.message || 'Failed to charge authorization');
      }

      return response.data;
    } catch (error) {
      this.logger.error(`Error charging authorization: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to charge authorization');
    }
  }

  /**
   * Verify webhook signature from Paystack
   */
  verifyWebhookSignature(body: string | Record<string, any>, signature: string): boolean {
    const crypto = require('crypto');
    
    // If body is an object, stringify it
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(bodyString)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Get list of all transactions
   */
  async listTransactions(page: number = 1, limit: number = 10) {
    try {
      const response = await this.apiClient.get('/transaction', {
        params: {
          page,
          perPage: limit,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Error listing transactions: ${error.message}`);
      throw new InternalServerErrorException('Failed to list transactions');
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(reference: string) {
    try {
      const response = await this.apiClient.get(`/transaction/${reference}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching transaction: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch transaction');
    }
  }
}
