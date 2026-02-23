import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  UsePipes,
  Req,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { SubscriptionPlanService } from '../services/subscription-plan.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dtos/subscription-plan.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { SuperAdminRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import {
  createSubscriptionPlanValidation,
  updateSubscriptionPlanValidation,
} from '../validations/subscription-plan.validation';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Superadmin - Subscription Plans')
@Controller('superadmin/subscription-plans')
export class SubscriptionPlanController {
  constructor(private readonly planService: SubscriptionPlanService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createSubscriptionPlanValidation))
  async createPlan(
    @Body() dto: CreateSubscriptionPlanDto,
    @Req() req: SuperAdminRequest,
    @Res() res: Response,
  ) {
    const plan = await this.planService.createPlan(dto);
    return res.status(HttpStatus.CREATED).json({ success: true, data: plan });
  }

  @Get()
  async getAllPlans(@Query() pagination: PaginationDto, @Res() res: Response) {
    const result = await this.planService.getAllPlans(pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  @Get('active')
  async getActivePlans(@Res() res: Response) {
    const plans = await this.planService.getActivePlans();
    return res.status(HttpStatus.OK).json({ success: true, data: plans });
  }

  @Get(':id')
  async getPlan(@Param('id') id: number, @Res() res: Response) {
    const plan = await this.planService.getPlanById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: plan });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(updateSubscriptionPlanValidation))
  async updatePlan(
    @Param('id') id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
    @Res() res: Response,
  ) {
    const plan = await this.planService.updatePlan(id, dto);
    return res.status(HttpStatus.OK).json({ success: true, data: plan });
  }

  @Delete(':id')
  async deletePlan(@Param('id') id: number, @Res() res: Response) {
    const result = await this.planService.deletePlan(id);
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }
}
