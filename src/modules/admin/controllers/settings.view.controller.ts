import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { SuperadminService } from '@/modules/superadmin/service/auth.service';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';

import { AdminSettingsService } from '../services/admin-settings.service';
import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

type AdminReq = Request & { user?: SuperAdmin };

/**
 * Settings.
 *   /admin/settings/profile  — current admin: edit profile + change password
 *   /admin/settings/admins   — admin team: list + add new + delete
 *   /admin/settings/roles    — RBAC catalogue (read-only)
 *
 * The cookie's `user` carries only the decoded payload (no relations), so
 * profile reads always go through getProfile(req.user.id) to fetch the live
 * admin row with their roles.
 */
@Controller('admin/settings')
export class SettingsViewController {
  constructor(
    private readonly settings: AdminSettingsService,
    private readonly superadmin: SuperadminService,
  ) {}

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/admin/settings/profile');
  }

  // ---------- Profile -------------------------------------------------

  @Get('profile')
  async profile_view(@Req() req: AdminReq, @Res() res: Response) {
    const me = await this.settings.getProfile(req.user!.id);
    return res.render('admin/settings/profile', {
      title: 'Settings · Profile',
      active: 'settings',
      tab: 'profile',
      admin: req.user,
      me,
      flash: extractFlash(req),
    });
  }

  @Post('profile')
  async profile_update(
    @Req() req: AdminReq,
    @Res() res: Response,
    @Body() body: { first_name?: string; last_name?: string; email?: string },
  ) {
    try {
      await this.settings.updateProfile(req.user!.id, body);
      return redirectWithFlash(res, '/admin/settings/profile', 'success', 'Profile updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/settings/profile', 'error', errorMessage(e));
    }
  }

  @Post('profile/password')
  async profile_changePassword(
    @Req() req: AdminReq,
    @Res() res: Response,
    @Body() body: { current_password?: string; new_password?: string; confirm_password?: string },
  ) {
    try {
      const current = body.current_password ?? '';
      const next = body.new_password ?? '';
      const confirm = body.confirm_password ?? '';
      if (!current || !next) throw new BadRequestException('Both current and new password are required.');
      if (next !== confirm) throw new BadRequestException('New password and confirmation do not match.');

      await this.settings.changePassword(req.user!.id, current, next);
      return redirectWithFlash(res, '/admin/settings/profile', 'success', 'Password updated.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/settings/profile', 'error', errorMessage(e));
    }
  }

  // ---------- Admin team ----------------------------------------------

  @Get('admins')
  async admins_list(@Req() req: AdminReq, @Res() res: Response) {
    const [admins, roles] = await Promise.all([
      this.settings.listAdmins(),
      this.settings.listRoles(),
    ]);
    return res.render('admin/settings/admins', {
      title: 'Settings · Admins',
      active: 'settings',
      tab: 'admins',
      admin: req.user,
      admins,
      roles,
      currentAdminId: req.user!.id,
      flash: extractFlash(req),
    });
  }

  @Post('admins')
  async admins_create(
    @Res() res: Response,
    @Body()
    body: {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      role_ids?: string | string[];
    },
  ) {
    try {
      const first_name = body.first_name?.trim();
      const last_name = body.last_name?.trim();
      const email = body.email?.trim();
      const password = body.password ?? '';
      if (!first_name || !last_name) throw new BadRequestException('Name is required.');
      if (!email) throw new BadRequestException('Email is required.');
      if (!password || password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters.');
      }

      // Forms with multiple checkboxes named "role_ids" arrive as a single
      // string when one is checked and an array when multiple are.
      const rawIds = Array.isArray(body.role_ids)
        ? body.role_ids
        : body.role_ids
          ? [body.role_ids]
          : [];
      const super_role_ids = rawIds
        .map((s) => Number(s))
        .filter((n) => Number.isInteger(n) && n > 0);

      await this.superadmin.createAdmin({
        first_name,
        last_name,
        email,
        password,
        super_role_ids,
      });
      return redirectWithFlash(res, '/admin/settings/admins', 'success', 'Admin created.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/settings/admins', 'error', errorMessage(e));
    }
  }

  @Post('admins/:id/delete')
  async admins_delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AdminReq,
    @Res() res: Response,
  ) {
    try {
      await this.settings.deleteAdmin(req.user!.id, id);
      return redirectWithFlash(res, '/admin/settings/admins', 'success', 'Admin removed.');
    } catch (e) {
      return redirectWithFlash(res, '/admin/settings/admins', 'error', errorMessage(e));
    }
  }

  // ---------- Roles ---------------------------------------------------

  @Get('roles')
  async roles_list(@Req() req: AdminReq, @Res() res: Response) {
    const [roles, permissions] = await Promise.all([
      this.settings.listRoles(),
      this.settings.listPermissions(),
    ]);
    return res.render('admin/settings/roles', {
      title: 'Settings · Roles',
      active: 'settings',
      tab: 'roles',
      admin: req.user,
      roles,
      permissions,
      flash: extractFlash(req),
    });
  }
}
