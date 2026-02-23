import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  UsePipes,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { PaymentService } from '../services/payment.service';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { SuperAdminRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';
import { ExtendSubscriptionDto } from '../dtos/user-subscription.dto';
import * as Joi from 'joi';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Superadmin - Subscriptions Management')
@Controller('superadmin/subscriptions')
export class SuperadminSubscriptionController {
  private static readonly extendSubscriptionValidation = Joi.object({
    days: Joi.number().integer().positive().required().messages({
      'number.base': 'Days must be a number',
      'number.positive': 'Days must be positive',
      'any.required': 'Days is required',
    }),
    reason: Joi.string().optional().messages({
      'string.base': 'Reason must be a string',
    }),
  });

  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Get all user subscriptions with pagination
   */
  @Get()
  async getAllSubscriptions(
    @Query() pagination: PaginationDto,
    @Res() res: Response,
  ) {
    const result = await this.userSubscriptionService.getAllSubscriptions(pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  /**
   * Get subscriptions that are expiring soon (within 7 days)
   */
  @Get('insights/expiring-soon')
  async getExpiringSoonSubscriptions(
    @Query() pagination: PaginationDto,
    @Res() res: Response,
  ) {
    const result = await this.userSubscriptionService.getSubscriptionsEndingSoon(pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  /**
   * Get expired subscriptions
   */
  @Get('insights/expired')
  async getExpiredSubscriptionsList(
    @Query() pagination: PaginationDto,
    @Res() res: Response,
  ) {
    const result = await this.userSubscriptionService.getExpiredSubscriptions(pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  /**
   * Get subscription details by ID
   */
  @Get(':id')
  async getSubscriptionById(
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    const subscription = await this.userSubscriptionService.getSubscriptionById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: subscription });
  }

  /**
   * Extend user subscription by specified number of days
   * Useful for manual adjustments, promos, or corrections
   */
  @Patch(':id/extend')
  @UsePipes(new JoiValidationPipe(SuperadminSubscriptionController.extendSubscriptionValidation))
  async extendSubscription(
    @Param('id') id: number,
    @Body() dto: ExtendSubscriptionDto,
    @Req() req: SuperAdminRequest,
    @Res() res: Response,
  ) {
    const subscription = await this.userSubscriptionService.extendSubscription(id, dto.days);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: subscription,
      message: `Subscription extended by ${dto.days} days${dto.reason ? ` - Reason: ${dto.reason}` : ''}`,
    });
  }

  /**
   * Get payment history with optional filtering
   */
  @Get('payment/all')
  async getPaymentHistory(
    @Query() pagination: PaginationDto,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.getAllPayments(pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  /**
   * Get payments for a specific user
   */
  @Get('payment/user/:userId')
  async getUserPaymentsList(
    @Param('userId') userId: number,
    @Query() pagination: PaginationDto,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.getUserPayments(userId, pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  /**
   * Cancel a user's subscription immediately
   */
  @Patch(':id/cancel')
  async cancelSubscription(
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    const subscription = await this.userSubscriptionService.cancelSubscription(id);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully',
    });
  }
}
