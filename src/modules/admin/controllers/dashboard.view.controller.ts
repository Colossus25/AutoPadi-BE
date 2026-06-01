import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { AdminOverviewService } from '../services/admin-overview.service';

/**
 * Dashboard overview page. Protected by AdminAuthMiddleware (see AdminModule),
 * so req.user is always a decoded SuperAdmin here.
 *
 * Stays thin: delegates every aggregation to AdminOverviewService and hands
 * the result to the template.
 */
@Controller('admin')
export class DashboardViewController {
  constructor(private readonly overview: AdminOverviewService) {}

  @Get()
  async index(@Req() req: Request & { user?: SuperAdmin }, @Res() res: Response) {
    const data = await this.overview.build();
    return res.render('admin/dashboard', {
      title: 'Dashboard',
      active: 'dashboard',
      admin: req.user,
      ...data,
    });
  }
}
