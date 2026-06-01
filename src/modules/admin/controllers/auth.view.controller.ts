import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { CookieOptions } from 'express';
import { Request, Response } from 'express';
import { SuperadminService } from '@/modules/superadmin/service/auth.service';
import { SUPERADMIN_AUTH_COOKIE, _IS_PROD_, _TTL_ } from '@/constants';
import { SuperAdminRequest } from '@/definitions';

/**
 * Server-rendered auth pages for the admin dashboard.
 *
 * Reuses SuperadminService.login() and the same SUPERADMIN_AUTH cookie as the
 * JSON API — the only difference is this renders HTML / redirects instead of
 * returning JSON. No AdminAuthMiddleware is applied to this controller.
 */
@Controller('admin')
export class AuthViewController {
  constructor(private readonly superadminService: SuperadminService) {}

  /**
   * The API's shared CookieOptions force `secure: true` + `sameSite: 'none'`,
   * which browsers reject over plain http://localhost during local dev. Mirror
   * the prod settings but soften them for dev so login works on http.
   */
  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: _IS_PROD_,
      sameSite: _IS_PROD_ ? 'none' : 'lax',
      maxAge: _TTL_,
    };
  }

  @Get('login')
  loginPage(@Req() req: Request, @Res() res: Response) {
    if (req.cookies?.[SUPERADMIN_AUTH_COOKIE]) {
      return res.redirect('/admin');
    }
    return res.render('admin/auth/login', { title: 'Sign In', error: null });
  }

  @Post('login')
  async login(
    @Body() body: { email?: string; password?: string },
    @Req() req: SuperAdminRequest,
    @Res() res: Response,
  ) {
    const email = (body.email || '').trim();
    const password = body.password || '';

    if (!email || !password) {
      return res
        .status(422)
        .render('admin/auth/login', { title: 'Sign In', error: 'Email and password are required.', email });
    }

    try {
      const { superAdmin, token } = await this.superadminService.login({ email, password }, req);
      const { password: _pw, ...safeSuperAdmin } = superAdmin;

      const cookieData = { token, superadmin: safeSuperAdmin };
      res.cookie(SUPERADMIN_AUTH_COOKIE, encodeURIComponent(JSON.stringify(cookieData)), this.cookieOptions());

      return res.redirect('/admin');
    } catch (err) {
      const message =
        err?.response?.message || err?.message || 'Invalid credentials, please try again.';
      return res.status(401).render('admin/auth/login', { title: 'Sign In', error: message, email });
    }
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie(SUPERADMIN_AUTH_COOKIE);
    return res.redirect('/admin/login');
  }
}
