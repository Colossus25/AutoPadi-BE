import { Controller, Get, Param, ParseIntPipe, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AdminStoresService } from '../services/admin-stores.service';
import { extractFlash, errorMessage } from '../util/flash';

/**
 * Store Management.
 *   GET /admin/stores                — paginated, searchable list
 *   GET /admin/stores/:id/profile    — htmx partial for the detail modal
 *
 * No write actions yet — there's no platform-side store-status column, and
 * we're stubbing status in the UI ("Active" for everyone) until that schema
 * change lands.
 */
@Controller('admin/stores')
export class StoresViewController {
  constructor(private readonly stores: AdminStoresService) {}

  @Get()
  async index(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('q') qRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const q = qRaw?.trim() || null;

    const [result, stats] = await Promise.all([
      this.stores.list({ page, limit, q }),
      this.stores.stats(),
    ]);

    return res.render('admin/stores/index', {
      title: 'Stores',
      active: 'stores',
      admin: req.user,
      stores: result.rows,
      pagination: result,
      stats,
      q: q ?? '',
      flash: extractFlash(req),
    });
  }

  @Get(':id/profile')
  async profile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const detail = await this.stores.detail(id);
      return res.render('admin/stores/_store-modal', { ...detail });
    } catch (e) {
      return res.status(404).render('admin/users/_modal-error', {
        message: errorMessage(e),
      });
    }
  }
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
