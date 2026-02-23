import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UseGuards,
  UsePipes,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { UserSubscriptionService } from '../services/user-subscription.service';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { InitiatePaymentDto, VerifyPaymentDto, RenewSubscriptionDto, InitiateTrialDto } from '../dtos/payment.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import {
  initiatePaymentValidation,
  verifyPaymentValidation,
  renewSubscriptionValidation,
  initiateTrialValidation,
} from '../validations/payment.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Subscriptions - User')
@Controller('subscription')
export class UserSubscriptionController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly planService: SubscriptionPlanService,
  ) {}

  /**
   * Get user's active subscription
   */
  @Get('active')
  async getActiveSubscription(@Req() req: UserRequest, @Res() res: Response) {
    const subscription = await this.userSubscriptionService.getActiveSubscription(req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: subscription,
    });
  }

  /**
   * Get available plans
   */
  @Get('plans')
  async getAvailablePlans(@Res() res: Response) {
    const plans = await this.planService.getActivePlans();
    return res.status(HttpStatus.OK).json({
      success: true,
      data: plans,
    });
  }

  /**
   * Get user's subscription history
   */
  @Get('history')
  async getSubscriptionHistory(@Req() req: UserRequest, @Query() pagination: PaginationDto, @Res() res: Response) {
    const result = await this.userSubscriptionService.getUserSubscriptionsForUser(req.user, pagination);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  /**
   * Get payment history
   */
  @Get('payments')
  async getPaymentHistory(@Req() req: UserRequest, @Query() pagination: PaginationDto, @Res() res: Response) {
    const result = await this.paymentService.getPaymentHistory(req.user, pagination);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  /**
   * Initiate a payment for subscription
   */
  @Post('initiate')
  @UsePipes(new JoiValidationPipe(initiatePaymentValidation))
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Req() req: UserRequest,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.initiatePayment(req.user, dto.subscription_plan_id);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  /**
   * Verify payment and activate subscription
   */
  @Post('verify')
  @UsePipes(new JoiValidationPipe(verifyPaymentValidation))
  async verifyPayment(@Body() dto: VerifyPaymentDto, @Res() res: Response) {
    const result = await this.paymentService.verifyPayment(dto.reference);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
    });
  }

  /**
   * Initiate a free trial subscription
   */
  @Post('trial')
  @UsePipes(new JoiValidationPipe(initiateTrialValidation))
  async initiateTrial(@Body() dto: InitiateTrialDto, @Req() req: UserRequest, @Res() res: Response) {
    const result = await this.paymentService.createTrialSubscription(req.user, dto.subscription_plan_id);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Free trial activated successfully',
    });
  }

  /**
   * Renew an expired subscription
   */
  @Post('renew')
  @UsePipes(new JoiValidationPipe(renewSubscriptionValidation))
  async renewSubscription(@Body() dto: RenewSubscriptionDto, @Req() req: UserRequest, @Res() res: Response) {
    const result = await this.paymentService.initiatePayment(req.user, dto.subscription_plan_id);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Renewal initiated. Please complete payment.',
    });
  }

  /**
   * Cancel a subscription
   */
  @Patch('cancel/:id')
  async cancelSubscription(
    @Param('id') id: number,
    @Req() req: UserRequest,
    @Res() res: Response,
  ) {
    const result = await this.userSubscriptionService.cancelSubscriptionForUser(id, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: result,
      message: 'Subscription cancelled successfully',
    });
  }

  /**
   * Get subscription details
   */
  @Get(':id')
  async getSubscription(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const subscription = await this.userSubscriptionService.getSubscriptionById(id, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: subscription,
    });
  }
}
