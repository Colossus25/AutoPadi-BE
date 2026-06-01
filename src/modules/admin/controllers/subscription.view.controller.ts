import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { SubscriptionPlanService } from '@/modules/subscriptions/services/subscription-plan.service';
import { UserSubscriptionService } from '@/modules/subscriptions/services/user-subscription.service';
import {
  PaymentStatus,
} from '@/modules/subscriptions/entities/payment.entity';
import {
  UserSubscriptionStatus,
} from '@/modules/subscriptions/entities/user-subscription.entity';

import { AdminSubscriptionService } from '../services/admin-subscription.service';
import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

const BILLING_INTERVALS = ['monthly', 'yearly', 'quarterly'] as const;
const PLAN_STATUSES = ['active', 'inactive'] as const;
const SUB_STATUSES = [
  'active',
  'trial',
  'expired',
  'canceled',
  'payment_pending',
] as const;
const PAYMENT_STATUSES = ['pending', 'success', 'failed'] as const;

type BillingInterval = (typeof BILLING_INTERVALS)[number];
type PlanStatusStr = (typeof PLAN_STATUSES)[number];

/**
 * Subscription section: three tab pages.
 *   /admin/subscription/plans       — plan CRUD (admin-only)
 *   /admin/subscription/subscribers — user subscriptions list, extend / cancel
 *   /admin/subscription/payments    — payment history (read-only)
 *
 * Plan amounts are stored as kobo (bigint) — the form takes Naira and we
 * multiply by 100 before saving, divide by 100 when displaying.
 */
@Controller('admin/subscription')
export class SubscriptionViewController {
  constructor(
    private readonly plans: SubscriptionPlanService,
    private readonly userSubs: UserSubscriptionService,
    private readonly admin: AdminSubscriptionService,
  ) {}

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/admin/subscription/plans');
  }

  // ---------- Plans ----------------------------------------------------

  @Get('plans')
  async plans_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const result = await this.plans.getAllPlans({ page, limit });

    return res.render('admin/subscription/plans', {
      title: 'Subscription · Plans',
      active: 'subscription',
      tab: 'plans',
      admin: req.user,
      plans: result.plans,
      pagination: paginationFromMeta(result.meta),
      billingIntervals: BILLING_INTERVALS,
      planStatuses: PLAN_STATUSES,
      flash: extractFlash(req),
    });
  }

  @Post('plans')
  async plans_create(
    @Body() body: PlanFormBody,
    @Res() res: Response,
  ) {
    try {
      const dto = buildPlanDto(body, { partial: false });
      await this.plans.createPlan(dto);
      return redirectWithFlash(res, '/admin/subscription/plans', 'success', 'Plan created.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/subscription/plans', 'error', errorMessage(e));
    }
  }

  @Post('plans/:id/update')
  async plans_update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: PlanFormBody,
    @Res() res: Response,
  ) {
    try {
      const dto = buildPlanDto(body, { partial: true });
      await this.plans.updatePlan(id, dto);
      return redirectWithFlash(res, '/admin/subscription/plans', 'success', 'Plan updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/subscription/plans', 'error', errorMessage(e));
    }
  }

  @Post('plans/:id/delete')
  async plans_delete(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.plans.deletePlan(id);
      return redirectWithFlash(res, '/admin/subscription/plans', 'success', 'Plan deleted.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/subscription/plans', 'error', errorMessage(e));
    }
  }

  // ---------- Subscribers ---------------------------------------------

  @Get('subscribers')
  async subscribers_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('status') statusRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const status = isSubStatus(statusRaw) ? (statusRaw as UserSubscriptionStatus) : null;

    const result = await this.admin.listSubscribers({ page, limit, status });

    return res.render('admin/subscription/subscribers', {
      title: 'Subscription · Subscribers',
      active: 'subscription',
      tab: 'subscribers',
      admin: req.user,
      subscribers: result.rows,
      pagination: paginationFromMeta({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }),
      statusFilter: status,
      subStatuses: SUB_STATUSES,
      flash: extractFlash(req),
    });
  }

  @Post('subscribers/:id/extend')
  async subscribers_extend(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { days?: string },
    @Res() res: Response,
  ) {
    try {
      const days = Number(body.days);
      if (!Number.isInteger(days) || days <= 0) {
        throw new BadRequestException('Days must be a positive whole number.');
      }
      await this.userSubs.extendSubscription(id, days);
      return redirectWithFlash(res, '/admin/subscription/subscribers', 'success', `Extended by ${days} days.`);
    } catch (e) {
      return redirectWithFlash(res, '/admin/subscription/subscribers', 'error', errorMessage(e));
    }
  }

  @Post('subscribers/:id/cancel')
  async subscribers_cancel(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.userSubs.cancelSubscription(id);
      return redirectWithFlash(res, '/admin/subscription/subscribers', 'success', 'Subscription cancelled.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/subscription/subscribers', 'error', errorMessage(e));
    }
  }

  // ---------- Payments -------------------------------------------------

  @Get('payments')
  async payments_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('status') statusRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const status = isPaymentStatus(statusRaw) ? (statusRaw as PaymentStatus) : null;

    const result = await this.admin.listPayments({ page, limit, status });

    return res.render('admin/subscription/payments', {
      title: 'Subscription · Payments',
      active: 'subscription',
      tab: 'payments',
      admin: req.user,
      payments: result.rows,
      pagination: paginationFromMeta({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }),
      statusFilter: status,
      paymentStatuses: PAYMENT_STATUSES,
      flash: extractFlash(req),
    });
  }
}

// ---------- Module-private utilities ------------------------------------

type PlanFormBody = {
  name?: string;
  amount?: string; // Naira input from form
  billing_interval?: string;
  free_trial_days?: string;
  description?: string;
  features?: string;
  status?: string;
};

function buildPlanDto(body: PlanFormBody, opts: { partial: boolean }) {
  const dto: Record<string, unknown> = {};

  if (body.name !== undefined) dto.name = body.name?.trim();
  if (body.amount !== undefined && body.amount !== '') {
    const naira = Number(body.amount);
    if (!Number.isFinite(naira) || naira < 0) {
      throw new BadRequestException('Amount must be a non-negative number.');
    }
    dto.amount = Math.round(naira * 100); // Naira → kobo
  }
  if (body.billing_interval !== undefined && body.billing_interval !== '') {
    if (!(BILLING_INTERVALS as readonly string[]).includes(body.billing_interval)) {
      throw new BadRequestException('Invalid billing interval.');
    }
    dto.billing_interval = body.billing_interval as BillingInterval;
  }
  if (body.free_trial_days !== undefined && body.free_trial_days !== '') {
    const days = Number(body.free_trial_days);
    if (!Number.isInteger(days) || days < 0) {
      throw new BadRequestException('Free trial days must be a non-negative whole number.');
    }
    dto.free_trial_days = days;
  } else if (!opts.partial) {
    dto.free_trial_days = 0;
  }
  if (body.description !== undefined) {
    dto.description = body.description?.trim() || undefined;
  }
  if (body.features !== undefined) {
    // textarea: one feature per non-blank line
    const features = body.features
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    dto.features = features;
  }
  if (body.status !== undefined && body.status !== '') {
    if (!(PLAN_STATUSES as readonly string[]).includes(body.status)) {
      throw new BadRequestException('Invalid status.');
    }
    dto.status = body.status as PlanStatusStr;
  }

  if (!opts.partial) {
    if (!dto.name) throw new BadRequestException('Plan name is required.');
    if (dto.amount === undefined) throw new BadRequestException('Amount is required.');
    if (!dto.billing_interval) dto.billing_interval = 'monthly';
    if (!dto.status) dto.status = 'active';
  }

  // The DTO shapes diverge between create (required fields) and update
  // (all optional); buildPlanDto narrows via opts.partial above, so cast
  // through `unknown` to satisfy the structural check.
  return dto as unknown as Parameters<SubscriptionPlanService['createPlan']>[0];
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function paginationFromMeta(meta: { page: number; limit: number; total: number; totalPages: number }) {
  const totalPages = Math.max(1, meta.totalPages);
  return {
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    totalPages,
    hasPrev: meta.page > 1,
    hasNext: meta.page < totalPages,
    prevPage: Math.max(1, meta.page - 1),
    nextPage: Math.min(totalPages, meta.page + 1),
  };
}

function isSubStatus(v: unknown): boolean {
  return typeof v === 'string' && (SUB_STATUSES as readonly string[]).includes(v);
}
function isPaymentStatus(v: unknown): boolean {
  return typeof v === 'string' && (PAYMENT_STATUSES as readonly string[]).includes(v);
}
