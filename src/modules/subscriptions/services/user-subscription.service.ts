import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription, UserSubscriptionStatus } from '../entities/user-subscription.entity';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class UserSubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  /**
   * Get user's current active subscription
   */
  async getActiveSubscription(user: User) {
    const subscriptions = await this.userSubscriptionRepository.find({
      where: [
        { user_id: user.id, status: UserSubscriptionStatus.ACTIVE },
        { user_id: user.id, status: UserSubscriptionStatus.TRIAL },
      ],
      relations: ['subscription_plan'],
      order: { created_at: 'DESC' },
    });

    return subscriptions.length > 0 ? subscriptions[0] : null;
  }

  /**
   * Get all subscriptions for a user (with User context - their own subscriptions)
   */
  async getUserSubscriptionsForUser(user: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await this.userSubscriptionRepository.findAndCount({
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
      subscriptions,
    };
  }

  /**
   * Get subscription details by ID (for superadmin - no user filter)
   */
  async getSubscriptionById(id: number, user?: User) {
    let subscription;

    if (user) {
      // User context - only their own subscription
      subscription = await this.userSubscriptionRepository.findOne({
        where: { id, user_id: user.id },
        relations: ['subscription_plan'],
      });
    } else {
      // Superadmin context - any subscription
      subscription = await this.userSubscriptionRepository.findOne({
        where: { id },
        relations: ['subscription_plan', 'user'],
      });
    }

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Check if subscription is still valid
   */
  isSubscriptionValid(subscription: UserSubscription): boolean {
    const now = new Date();

    if (subscription.status === UserSubscriptionStatus.EXPIRED) {
      return false;
    }

    if (subscription.status === UserSubscriptionStatus.CANCELED) {
      return false;
    }

    if (subscription.status === UserSubscriptionStatus.TRIAL) {
      if (subscription.free_trial_end_date && now > subscription.free_trial_end_date) {
        return false;
      }
      return true;
    }

    if (subscription.status === UserSubscriptionStatus.ACTIVE) {
      if (subscription.subscription_end_date && now > subscription.subscription_end_date) {
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Mark subscription as expired
   */
  async markAsExpired(id: number) {
    await this.userSubscriptionRepository.update(id, {
      status: UserSubscriptionStatus.EXPIRED,
    });

    return this.userSubscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'subscription_plan'],
    });
  }

  /**
   * Cancel a subscription (user context - their own subscription)
   */
  async cancelSubscriptionForUser(id: number, user: User) {
    const subscription = await this.getSubscriptionById(id, user);

    if (subscription.status === UserSubscriptionStatus.CANCELED) {
      throw new BadRequestException('This subscription is already canceled');
    }

    subscription.status = UserSubscriptionStatus.CANCELED;
    return await this.userSubscriptionRepository.save(subscription);
  }

  /**
   * SUPERADMIN: Get all subscriptions with pagination
   */
  async getAllSubscriptions(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await this.userSubscriptionRepository.findAndCount({
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
      subscriptions,
    };
  }

  /**
   * SUPERADMIN: Get all subscriptions for a specific user
   */
  async getUserSubscriptions(userId: number, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await this.userSubscriptionRepository.findAndCount({
      where: { user_id: userId },
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
      subscriptions,
    };
  }

  /**
   * SUPERADMIN: Extend a subscription by specified number of days
   */
  async extendSubscription(id: number, days: number) {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id },
      relations: ['subscription_plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Extend the end date
    const newEndDate = new Date(subscription.subscription_end_date || new Date());
    newEndDate.setDate(newEndDate.getDate() + days);

    subscription.subscription_end_date = newEndDate;

    // If subscription was expired, mark as active
    if (subscription.status === UserSubscriptionStatus.EXPIRED) {
      subscription.status = UserSubscriptionStatus.ACTIVE;
      subscription.next_charge_date = newEndDate;
    }

    return await this.userSubscriptionRepository.save(subscription);
  }

  /**
   * SUPERADMIN: Cancel a subscription (no user context required)
   */
  async cancelSubscription(id: number) {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id },
      relations: ['user', 'subscription_plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === UserSubscriptionStatus.CANCELED) {
      throw new BadRequestException('This subscription is already canceled');
    }

    subscription.status = UserSubscriptionStatus.CANCELED;
    return await this.userSubscriptionRepository.save(subscription);
  }

  /**
   * SUPERADMIN: Get subscriptions ending soon with pagination
   */
  async getSubscriptionsEndingSoon(pagination: PaginationDto, daysAhead: number = 7) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + daysAhead);

    const [subscriptions, total] = await this.userSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.subscription_plan', 'plan')
      .where('sub.status = :status', { status: UserSubscriptionStatus.ACTIVE })
      .andWhere('sub.subscription_end_date IS NOT NULL')
      .andWhere('sub.subscription_end_date BETWEEN :now AND :endDate', { now, endDate })
      .orderBy('sub.subscription_end_date', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      subscriptions,
    };
  }

  /**
   * SUPERADMIN: Get expired subscriptions with pagination
   */
  async getExpiredSubscriptions(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const now = new Date();

    const [subscriptions, total] = await this.userSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .leftJoinAndSelect('sub.subscription_plan', 'plan')
      .where('sub.status = :status', { status: UserSubscriptionStatus.ACTIVE })
      .andWhere('sub.subscription_end_date IS NOT NULL')
      .andWhere('sub.subscription_end_date <= :now', { now })
      .orderBy('sub.subscription_end_date', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      subscriptions,
    };
  }
}
