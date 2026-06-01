import {
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

import { ServiceService } from '@/modules/serviceprovider/service/service.service';
import { ServiceStatus } from '@/modules/serviceprovider/entities/service.entity';

import { AdminListingsService } from '../services/admin-listings.service';
import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

const SERVICE_STATUSES = ['pending', 'approved', 'rejected'] as const;

/**
 * Listings section: two tabs.
 *   /admin/listings/products — paginated read of every product (Auto Dealer
 *     listings). Currently view-only — there's no platform-side moderation
 *     model for products yet.
 *   /admin/listings/services — paginated services with status filter; admin
 *     can Approve or Reject (with an optional reason). Both actions reuse
 *     ServiceService.approveService / rejectService, which already fires
 *     SERVICE_APPROVED / SERVICE_REJECTED events that the notifications
 *     subscriber turns into in-app + push notifications.
 */
@Controller('admin/listings')
export class ListingsViewController {
  constructor(
    private readonly listings: AdminListingsService,
    private readonly services: ServiceService,
  ) {}

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/admin/listings/products');
  }

  // ---------- Products -------------------------------------------------

  @Get('products')
  async products_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const result = await this.listings.listProducts({ page, limit });

    return res.render('admin/listings/products', {
      title: 'Listings · Products',
      active: 'listings',
      tab: 'products',
      admin: req.user,
      products: result.rows,
      pagination: toPagination(result),
      flash: extractFlash(req),
    });
  }

  // ---------- Services -------------------------------------------------

  @Get('services')
  async services_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('status') statusRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const status = isServiceStatus(statusRaw)
      ? (statusRaw as ServiceStatus)
      : null;

    const result = await this.listings.listServices({ page, limit, status });

    // Pending count is the most useful at-a-glance metric for the admin —
    // gives the "things waiting on you" badge for the moderation queue.
    const pendingResult = status === ServiceStatus.PENDING
      ? result
      : await this.listings.listServices({ page: 1, limit: 1, status: ServiceStatus.PENDING });

    return res.render('admin/listings/services', {
      title: 'Listings · Services',
      active: 'listings',
      tab: 'services',
      admin: req.user,
      services: result.rows,
      pagination: toPagination(result),
      statusFilter: status,
      serviceStatuses: SERVICE_STATUSES,
      pendingCount: pendingResult.total,
      flash: extractFlash(req),
    });
  }

  @Post('services/:id/approve')
  async services_approve(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      await this.services.approveService(id);
      return redirectWithFlash(
        res,
        '/admin/listings/services',
        'success',
        'Service approved. Provider notified.',
      );
    } catch (e) {
      return redirectWithFlash(res, '/admin/listings/services', 'error', errorMessage(e));
    }
  }

  @Post('services/:id/reject')
  async services_reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
    @Res() res: Response,
  ) {
    try {
      const reason = body.reason?.trim() || undefined;
      await this.services.rejectService(id, reason);
      return redirectWithFlash(
        res,
        '/admin/listings/services',
        'success',
        'Service rejected. Provider notified.',
      );
    } catch (e) {
      return redirectWithFlash(res, '/admin/listings/services', 'error', errorMessage(e));
    }
  }
}

// ---------- Module-private utilities ------------------------------------

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function isServiceStatus(v: unknown): boolean {
  return typeof v === 'string' && (SERVICE_STATUSES as readonly string[]).includes(v);
}

function toPagination(result: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number;
  nextPage: number;
}) {
  return result;
}
