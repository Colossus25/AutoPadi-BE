import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan, PlanStatus, BillingInterval } from '../entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dtos/subscription-plan.dto';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const existingPlan = await this.planRepository.findOne({
      where: { name: dto.name },
    });

    if (existingPlan) {
      throw new BadRequestException(`Subscription plan "${dto.name}" already exists`);
    }

    const plan = this.planRepository.create({
      name: dto.name,
      amount: dto.amount,
      billing_interval: (dto.billing_interval as BillingInterval) || BillingInterval.MONTHLY,
      free_trial_days: dto.free_trial_days || 0,
      description: dto.description,
      features: dto.features,
      status: (dto.status as PlanStatus) || PlanStatus.ACTIVE,
    });

    return await this.planRepository.save(plan);
  }

  async getAllPlans(pagination?: PaginationDto) {
    const { page = 1, limit = 10 } = pagination || {};
    const skip = (page - 1) * limit;

    const [plans, total] = await this.planRepository.findAndCount({
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
      plans,
    };
  }

  async getActivePlans() {
    return await this.planRepository.find({
      where: { status: PlanStatus.ACTIVE },
      order: { amount: 'ASC' },
    });
  }

  async getPlanById(id: number) {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  async updatePlan(id: number, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.getPlanById(id);

    if (dto.name && dto.name !== plan.name) {
      const existingPlan = await this.planRepository.findOne({
        where: { name: dto.name },
      });
      if (existingPlan) {
        throw new BadRequestException(`Subscription plan "${dto.name}" already exists`);
      }
    }

    Object.assign(plan, {
      ...(dto.name && { name: dto.name }),
      ...(dto.amount && { amount: dto.amount }),
      ...(dto.billing_interval && { billing_interval: dto.billing_interval }),
      ...(dto.free_trial_days !== undefined && { free_trial_days: dto.free_trial_days }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.features && { features: dto.features }),
      ...(dto.status && { status: dto.status }),
    });

    return await this.planRepository.save(plan);
  }

  async deletePlan(id: number) {
    const plan = await this.getPlanById(id);
    await this.planRepository.remove(plan);
    return { message: `Subscription plan "${plan.name}" deleted successfully` };
  }
}
