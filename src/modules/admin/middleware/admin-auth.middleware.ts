import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { appConfig } from '@/config';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { extractSuperAdminFromCookie } from '@/core/utils';

/**
 * Auth gate for the server-rendered admin dashboard.
 *
 * Unlike SuperAuthGuard (which throws 401 JSON via the global exception filter),
 * this middleware REDIRECTS unauthenticated visitors to the login page — the
 * right behaviour for an HTML dashboard. It reuses the same SUPERADMIN_AUTH
 * cookie that POST /superadmin/login (and our /admin/login form) sets.
 */
@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request & { user?: unknown }, res: Response, next: NextFunction) {
    try {
      if (!req.cookies?.[SUPERADMIN_AUTH_COOKIE]) {
        return res.redirect('/admin/login');
      }

      const { token, superadmin } = extractSuperAdminFromCookie(req);

      // Validate the JWT so a tampered/expired cookie can't grant access.
      await this.jwtService.verifyAsync(token, { secret: appConfig.JWT_SECRET });

      req.user = superadmin;
      return next();
    } catch {
      res.clearCookie(SUPERADMIN_AUTH_COOKIE);
      return res.redirect('/admin/login');
    }
  }
}
