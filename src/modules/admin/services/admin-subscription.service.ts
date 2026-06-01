import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  UserSubscription,
  UserSubscriptionStatus,
} from '@/modules/subscriptions/entities/user-subscription.entity';
import {
  Payment,
  PaymentStatus,
} from '@/modules/subscriptions/entities/payment.entity';

/**
 * Admin-side paginated reads for subscribers and payments.
 *
 * The existing `getAllSubscriptions` / `getAllPayments` on the domain services
 * page but don't filter by status — which the admin tables need. This service
 * adds those status filters using the same repos.
 */
@Injectable()
export class AdminSubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private readonly userSubs: Repository<UserSubscription>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
  ) {}

  async listSubscribers(opts: {
    page: number;
    limit: number;
    status?: UserSubscriptionStatus | null;
  }) {
    const { page, limit, status } = opts;
    const qb = this.userSubs
      .createQueryBuilder('us')
      .leftJoinAndSelect('us.user', 'user')
      .leftJoinAndSelect('us.subscription_plan', 'plan')
      .orderBy('us.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('us.status = :status', { status });

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }

  async listPayments(opts: { page: number; limit: number; status?: PaymentStatus | null }) {
    const { page, limit, status } = opts;
    const qb = this.payments
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.subscription_plan', 'plan')
      .orderBy('p.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('p.status = :status', { status });

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }
}

function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: Math.max(1, page - 1),
    nextPage: Math.min(totalPages, page + 1),
  };
}
