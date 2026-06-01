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

import { AuthService } from '@/modules/auth/services/auth.service';

import {
  AdminUsersService,
  UserStatusFilter,
  UserType,
  USER_STATUSES,
  USER_TYPES,
} from '../services/admin-users.service';
import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

/**
 * Users section.
 *   GET  /admin/users                          — paginated, filterable list
 *   GET  /admin/users/:id/profile              — htmx partial for the modal
 *   POST /admin/users/:id/suspend              — softRemove
 *   POST /admin/users/:id/reactivate           — restore
 *   POST /admin/users/:id/reset-password       — reuses AuthService.forgotPassword
 *
 * The profile modal is the first htmx-driven swap in the dashboard: clicking
 * "View" fetches /:id/profile, the controller renders just the modal partial,
 * and the listing page mounts it into a `#user-modal-mount` div.
 */
@Controller('admin/users')
export class UsersViewController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async index(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('user_type') userTypeRaw?: string,
    @Query('status') statusRaw?: string,
    @Query('q') qRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const userType = isUserType(userTypeRaw) ? (userTypeRaw as UserType) : null;
    const status = isStatus(statusRaw) ? (statusRaw as UserStatusFilter) : null;
    const q = qRaw?.trim() || null;

    const [result, stats] = await Promise.all([
      this.users.list({ page, limit, userType, status, q }),
      this.users.stats(),
    ]);

    return res.render('admin/users/index', {
      title: 'Users',
      active: 'users',
      admin: req.user,
      users: result.rows,
      pagination: result,
      stats,
      userTypes: USER_TYPES,
      userTypeFilter: userType,
      statuses: USER_STATUSES,
      statusFilter: status,
      q: q ?? '',
      flash: extractFlash(req),
    });
  }

  /**
   * htmx-fetched modal partial. Returns just the modal markup (no layout),
   * which the list page swaps into its mount point.
   */
  @Get(':id/profile')
  async profile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const detail = await this.users.detail(id);
      return res.render('admin/users/_profile-modal', { ...detail });
    } catch (e) {
      // For htmx swaps we return a small error fragment so the user sees what
      // happened in the modal mount instead of a full-page 500.
      return res.status(404).render('admin/users/_modal-error', {
        message: errorMessage(e),
      });
    }
  }

  @Post(':id/suspend')
  async suspend(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.users.suspend(id);
      return redirectWithFlash(res, '/admin/users', 'success', 'User suspended.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/users', 'error', errorMessage(e));
    }
  }

  @Post(':id/reactivate')
  async reactivate(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.users.reactivate(id);
      return redirectWithFlash(res, '/admin/users', 'success', 'User reactivated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/users', 'error', errorMessage(e));
    }
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const detail = await this.users.detail(id);
      // Reuses the user-facing forgot-password flow: generates a token and
      // emails it to the user. The user resets via the existing /reset link.
      await this.auth.forgotPassword({ email: detail.user.email });
      return redirectWithFlash(
        res,
        '/admin/users',
        'success',
        `Password reset link sent to ${detail.user.email}.`,
      );
    } catch (e) {
      return redirectWithFlash(res, '/admin/users', 'error', errorMessage(e));
    }
  }
}

// ---------- helpers ------------------------------------------------------

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function isUserType(v: unknown): boolean {
  return typeof v === 'string' && (USER_TYPES as readonly string[]).includes(v);
}
function isStatus(v: unknown): boolean {
  return typeof v === 'string' && (USER_STATUSES as readonly string[]).includes(v);
}
