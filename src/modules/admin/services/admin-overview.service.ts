import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/modules/auth/entities/user.entity';
import { Store } from '@/modules/autodealer/entities/store.entity';
import { Product } from '@/modules/autodealer/entities/product.entity';
import { Service, ServiceStatus } from '@/modules/serviceprovider/entities/service.entity';
import {
  Payment,
  PaymentStatus,
} from '@/modules/subscriptions/entities/payment.entity';
import {
  UserSubscription,
  UserSubscriptionStatus,
} from '@/modules/subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '@/modules/subscriptions/entities/subscription-plan.entity';
import { Logging } from '@/modules/logging/entities/logging.entity';

/**
 * Read-side aggregations for the admin Dashboard Overview screen.
 *
 * Every method returns an already-shaped view-model so the controller (and the
 * Pug template) can stay dumb. Counts and sums are computed straight from
 * repositories — no business logic, just SQL we don't already expose elsewhere.
 *
 * Conventions:
 *  - "Listings" = Product + Service rows (the admin nav merges both).
 *  - Revenue is the sum of successful Payment.amount, which is stored in kobo
 *    (1 ₦ = 100 kobo); we convert to Naira before display.
 *  - "Delta" compares the trailing 30-day window to the prior 30-day window.
 */
@Injectable()
export class AdminOverviewService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Store) private readonly stores: Repository<Store>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Service) private readonly services: Repository<Service>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private readonly userSubs: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly plans: Repository<SubscriptionPlan>,
    @InjectRepository(Logging) private readonly logs: Repository<Logging>,
  ) {}

  // ---------- Public composition ---------------------------------------

  async build() {
    const [stats, userGrowth, storePerformance, subscriptionDistribution, recentActivities] =
      await Promise.all([
        this.getStats(),
        this.getUserGrowth(6),
        this.getStorePerformance(5),
        this.getSubscriptionDistribution(),
        this.getRecentActivities(5),
      ]);
    return { stats, userGrowth, storePerformance, subscriptionDistribution, recentActivities };
  }

  // ---------- Stat cards ------------------------------------------------

  async getStats() {
    const now = new Date();
    const day30 = new Date(now.getTime() - 30 * 86400000);
    const day60 = new Date(now.getTime() - 60 * 86400000);

    const [
      totalUsers,
      totalStores,
      totalProducts,
      totalServices,
      revenueKoboRaw,
      uParts,
      sParts,
      pParts,
      svParts,
      rParts,
    ] = await Promise.all([
      this.users.count(),
      this.stores.count(),
      this.products.count(),
      this.services.count(),
      this.payments
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'sum')
        .where('p.status = :s', { s: PaymentStatus.SUCCESS })
        .getRawOne<{ sum: string }>(),
      this.countWindow(this.users, 'u', 'created_at', day30, day60),
      this.countWindow(this.stores, 's', 'created_at', day30, day60),
      this.countWindow(this.products, 'p', 'created_at', day30, day60),
      this.countWindow(this.services, 's', 'created_at', day30, day60),
      this.revenueParts(day30, day60),
    ]);

    const revenueKobo = Number(revenueKoboRaw?.sum ?? 0);
    const totalRevenueNaira = Math.round(revenueKobo / 100);

    // Listings deltas merge products and services so they share one bucket.
    const listingParts = {
      cur: pParts.cur + svParts.cur,
      prev: pParts.prev + svParts.prev,
    };

    return [
      {
        label: 'Total Users',
        value: fmtNumber(totalUsers),
        delta: toDelta(uParts.cur, uParts.prev),
        icon: 'users',
      },
      {
        label: 'Total Stores',
        value: fmtNumber(totalStores),
        delta: toDelta(sParts.cur, sParts.prev),
        icon: 'store',
      },
      {
        label: 'Total Listings',
        value: fmtNumber(totalProducts + totalServices),
        delta: toDelta(listingParts.cur, listingParts.prev),
        icon: 'package',
      },
      {
        label: 'Total Revenue',
        value: fmtNaira(totalRevenueNaira),
        delta: toDelta(rParts.cur, rParts.prev),
        icon: 'dollar-sign',
      },
    ];
  }

  // ---------- User Growth (line chart) ---------------------------------

  async getUserGrowth(months: number) {
    const buckets = lastNMonths(months);
    const start = buckets[0].start;

    const rows = await this.users
      .createQueryBuilder('u')
      .select("TO_CHAR(DATE_TRUNC('month', u.created_at), 'YYYY-MM')", 'm')
      .addSelect('COUNT(*)', 'c')
      .where('u.created_at >= :start', { start })
      .groupBy('m')
      .orderBy('m', 'ASC')
      .getRawMany<{ m: string; c: string }>();

    const byMonth = new Map(rows.map((r) => [r.m, Number(r.c)]));
    return {
      labels: buckets.map((b) => b.label),
      data: buckets.map((b) => byMonth.get(b.key) ?? 0),
    };
  }

  // ---------- Store Performance (bar chart) ----------------------------

  /**
   * Top N stores by view count. The Figma calls this section "Store
   * Performance" with a "sales" axis — we don't have an orders/sales model
   * yet, so views is the closest available engagement metric. Swap in
   * revenue/sales once that domain lands.
   */
  async getStorePerformance(limit: number) {
    const rows = await this.stores
      .createQueryBuilder('s')
      .select(['s.name AS name', 'COALESCE(s.views_count, 0) AS value'])
      .orderBy('s.views_count', 'DESC', 'NULLS LAST')
      .limit(limit)
      .getRawMany<{ name: string; value: string }>();

    return {
      labels: rows.map((r) => r.name ?? 'Unnamed store'),
      data: rows.map((r) => Number(r.value)),
      metricLabel: 'Total views',
    };
  }

  // ---------- Active Subscriptions (pie) -------------------------------

  /**
   * Distribution of users across plans. Users without an active/trial
   * UserSubscription are bucketed as "Free".
   */
  async getSubscriptionDistribution() {
    const [totalUsers, planRows] = await Promise.all([
      this.users.count(),
      this.userSubs
        .createQueryBuilder('us')
        .leftJoin(SubscriptionPlan, 'p', 'p.id = us.subscription_plan_id')
        .select('p.name', 'name')
        .addSelect('COUNT(DISTINCT us.user_id)', 'c')
        .where('us.status IN (:...statuses)', {
          statuses: [UserSubscriptionStatus.ACTIVE, UserSubscriptionStatus.TRIAL],
        })
        .groupBy('p.name')
        .getRawMany<{ name: string | null; c: string }>(),
    ]);

    const paidByPlan = planRows
      .filter((r) => r.name)
      .map((r) => ({ label: r.name!, value: Number(r.c) }));
    const paidTotal = paidByPlan.reduce((sum, p) => sum + p.value, 0);
    const free = Math.max(totalUsers - paidTotal, 0);

    const slices = [{ label: 'Free', value: free }, ...paidByPlan].filter((s) => s.value > 0);
    const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;

    // Soft palette echoing the Figma (Free=gray, paid plans=blue shades).
    const palette = ['#9CA3AF', '#3B82F6', '#1D4ED8', '#60A5FA', '#1E3A8A'];
    return slices.map((s, i) => ({
      label: s.label,
      value: s.value,
      percent: Math.round((s.value / total) * 100),
      color: palette[i % palette.length],
    }));
  }

  // ---------- Recent Activities ----------------------------------------

  /**
   * A merged feed of the freshest platform events. We pull from three real
   * sources — new stores, service-approval transitions, and activated user
   * subscriptions — sort by timestamp, and keep the top N. Falls back to the
   * Logging entity if none of those have rows.
   */
  async getRecentActivities(limit: number) {
    const [stores, approvedServices, activatedSubs] = await Promise.all([
      this.stores.find({ order: { created_at: 'DESC' }, take: limit }),
      this.services.find({
        where: { status: ServiceStatus.APPROVED },
        order: { updated_at: 'DESC' },
        take: limit,
      }),
      this.userSubs.find({
        where: { status: UserSubscriptionStatus.ACTIVE },
        relations: ['subscription_plan', 'user'],
        order: { created_at: 'DESC' },
        take: limit,
      }),
    ]);

    type Item = { title: string; subtitle: string; at: Date; icon: string };
    const items: Item[] = [];

    for (const s of stores) {
      items.push({
        title: 'New store registration',
        subtitle: s.name ?? `Store #${s.id}`,
        at: s.created_at,
        icon: 'store',
      });
    }
    for (const sv of approvedServices) {
      items.push({
        title: 'Listing approved',
        subtitle: sv.name ?? `Service #${sv.id}`,
        at: sv.updated_at,
        icon: 'check-circle-2',
      });
    }
    for (const sub of activatedSubs) {
      const planName = sub.subscription_plan?.name ?? 'plan';
      const who =
        sub.user && (sub.user.first_name || sub.user.last_name)
          ? `${sub.user.first_name ?? ''} ${sub.user.last_name ?? ''}`.trim()
          : sub.user?.email ?? `User #${sub.user_id}`;
      items.push({
        title: `User upgraded to ${planName}`,
        subtitle: who,
        at: sub.created_at,
        icon: 'arrow-up-circle',
      });
    }

    if (items.length === 0) {
      const logs = await this.logs.find({ order: { created_at: 'DESC' }, take: limit });
      for (const l of logs) {
        items.push({
          title: l.entity ?? 'Activity',
          subtitle: l.note ?? '',
          at: l.created_at,
          icon: 'activity',
        });
      }
    }

    return items
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit)
      .map((i) => ({ ...i, ago: relativeTime(i.at) }));
  }

  // ---------- Helpers --------------------------------------------------

  private async countWindow<T extends object>(
    repo: Repository<T>,
    alias: string,
    dateCol: string,
    day30: Date,
    day60: Date,
  ): Promise<DeltaParts> {
    const col = `${alias}.${dateCol}`;
    const [cur, prev] = await Promise.all([
      repo.createQueryBuilder(alias).where(`${col} >= :d30`, { d30: day30 }).getCount(),
      repo
        .createQueryBuilder(alias)
        .where(`${col} >= :d60 AND ${col} < :d30`, { d60: day60, d30: day30 })
        .getCount(),
    ]);
    return { cur, prev };
  }

  private async revenueParts(day30: Date, day60: Date): Promise<DeltaParts> {
    const sum = async (gte: Date, lt?: Date) => {
      const qb = this.payments
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'sum')
        .where('p.status = :s', { s: PaymentStatus.SUCCESS })
        .andWhere('p.paid_at >= :gte', { gte });
      if (lt) qb.andWhere('p.paid_at < :lt', { lt });
      const row = await qb.getRawOne<{ sum: string }>();
      return Number(row?.sum ?? 0);
    };
    const [cur, prev] = await Promise.all([sum(day30), sum(day60, day30)]);
    return { cur, prev };
  }
}

// ---------- Module-private utilities ------------------------------------

type Delta = { direction: 'up' | 'down'; value: string };
type DeltaParts = { cur: number; prev: number };

function toDelta(cur: number, prev: number): Delta | null {
  if (prev === 0) return null; // no baseline, suppress the badge
  const pct = ((cur - prev) / prev) * 100;
  return {
    direction: pct >= 0 ? 'up' : 'down',
    value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
  };
}

function lastNMonths(n: number) {
  // Earliest-first list of month buckets covering [now-n months, now].
  // Every entry carries the earliest start date so callers can use it for the
  // SQL lower bound without recomputing.
  const out: { key: string; label: string; start: Date }[] = [];
  const now = new Date();
  const earliest = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: earliest,
    });
  }
  return out;
}

function fmtNumber(n: number) {
  return n.toLocaleString('en-US');
}

function fmtNaira(n: number) {
  return `₦${n.toLocaleString('en-US')}`;
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
