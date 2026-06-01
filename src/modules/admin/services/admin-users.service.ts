import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { User } from '@/modules/auth/entities/user.entity';
import { PaymentService } from '@/modules/subscriptions/services/payment.service';
import { UserSubscriptionService } from '@/modules/subscriptions/services/user-subscription.service';

export const USER_TYPES = [
  'buyer',
  'auto dealer',
  'service provider',
  'driver',
  'driver employer',
] as const;
export type UserType = (typeof USER_TYPES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatusFilter = (typeof USER_STATUSES)[number];

/**
 * Admin-side queries + detail builder for the Users section.
 *
 * "Status" is derived from `User.deleted_at` (a @DeleteDateColumn):
 *   - active   → deleted_at IS NULL
 *   - suspended → deleted_at IS NOT NULL  (TypeORM excludes them from default
 *     queries, so login already fails for these accounts — no extra wiring
 *     needed to enforce the suspension).
 *
 * The Figma design suggests a separate `status` enum, but reusing
 * @DeleteDateColumn gives us real functional behaviour for free instead of a
 * stub. We restore via the soft-delete restore() API.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly payments: PaymentService,
    private readonly userSubs: UserSubscriptionService,
  ) {}

  async list(opts: {
    page: number;
    limit: number;
    userType?: UserType | null;
    status?: UserStatusFilter | null;
    q?: string | null;
  }) {
    const { page, limit, userType, status, q } = opts;

    // We need deleted_at on every row so the table can show a Suspended pill,
    // and we need .withDeleted() so suspended users are included at all
    // (TypeORM filters them out by default).
    const qb = this.users
      .createQueryBuilder('u')
      .addSelect('u.deleted_at')
      .withDeleted()
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userType) qb.andWhere('u.user_type = :userType', { userType });
    if (status === 'active') qb.andWhere('u.deleted_at IS NULL');
    else if (status === 'suspended') qb.andWhere('u.deleted_at IS NOT NULL');

    if (q && q.trim()) {
      const needle = `%${q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.email) LIKE :n OR LOWER(u.first_name) LIKE :n OR LOWER(u.last_name) LIKE :n OR u.phone LIKE :n)',
        { n: needle },
      );
    }

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }

  /** Lightweight totals used by the page header (matches the Figma stat cards). */
  async stats() {
    const [total, suspended] = await Promise.all([
      this.users.count({ withDeleted: true }),
      this.users.count({ where: { deleted_at: Not(IsNull()) }, withDeleted: true }),
    ]);
    return { total, active: total - suspended, suspended };
  }

  /**
   * Profile detail used by the user-profile modal. Combines the user row,
   * their recent payments, their active subscription (so we can show the
   * "Plan" line), and a synthesised activity feed.
   */
  async detail(id: number) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.deleted_at')
      .withDeleted()
      .where('u.id = :id', { id })
      .getOne();

    if (!user) throw new NotFoundException('User not found');

    const [payments, subs] = await Promise.all([
      this.payments.getUserPayments(id, { page: 1, limit: 5 }),
      this.userSubs.getUserSubscriptions(id, { page: 1, limit: 1 }),
    ]);

    const currentSubObj = (subs as { subscriptions?: Array<unknown> } | undefined);
    const currentSub = Array.isArray(currentSubObj?.subscriptions)
      ? (currentSubObj!.subscriptions[0] as {
          status?: string;
          subscription_plan?: { name?: string };
        } | undefined)
      : undefined;

    return {
      user,
      isSuspended: user.deleted_at != null,
      planName: currentSub?.subscription_plan?.name ?? null,
      planStatus: currentSub?.status ?? null,
      payments: (payments as { payments?: unknown[] }).payments ?? [],
      activity: buildActivity(user),
    };
  }

  async suspend(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.users.softRemove(user);
  }

  async reactivate(id: number) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.deleted_at')
      .withDeleted()
      .where('u.id = :id', { id })
      .getOne();
    if (!user) throw new NotFoundException('User not found');
    if (user.deleted_at == null) return; // already active
    await this.users.restore(id);
  }
}

// ---------- Module-private utilities ------------------------------------

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

/**
 * Honest activity feed built from columns we actually have. We deliberately
 * don't fabricate "logged in N hours ago" entries — when an audit log lands,
 * we wire that in.
 */
function buildActivity(user: User) {
  type Item = { title: string; at: Date; icon: string };
  const items: Item[] = [];

  items.push({ title: 'Account created', at: user.created_at, icon: 'user-plus' });

  if (user.email_verified_at) {
    items.push({
      title: 'Email verified',
      at: user.email_verified_at,
      icon: 'mail-check',
    });
  }

  // updated_at == created_at means the user has never updated anything; only
  // surface as a distinct event when it actually moved.
  if (user.updated_at && user.updated_at.getTime() > user.created_at.getTime() + 1000) {
    items.push({
      title: 'Profile updated',
      at: user.updated_at,
      icon: 'pencil',
    });
  }

  if (user.deleted_at) {
    items.push({
      title: 'Account suspended',
      at: user.deleted_at,
      icon: 'ban',
    });
  }

  return items
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((i) => ({ ...i, ago: relativeTime(i.at) }));
}

function relativeTime(d: Date) {
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}
