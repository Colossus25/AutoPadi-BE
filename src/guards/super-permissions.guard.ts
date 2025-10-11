import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { appConfig } from '@/config';
import { extractSuperAdminFromCookie } from '@/core/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SuperAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepo: Repository<SuperAdmin>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request & { user?: SuperAdmin } = context.switchToHttp().getRequest();

    let token: string;
    let superadmin: SuperAdmin;

    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      const payload: any = await this.jwtService.verifyAsync(token, { secret: appConfig.JWT_SECRET });

      const foundSuperadmin = await this.superAdminRepo.findOne({
        where: { id: payload.id },
        relations: ['super_role', 'super_role.super_permission'],
      });

      if (!foundSuperadmin) throw new UnauthorizedException('SuperAdmin not found');
      superadmin = foundSuperadmin;
    } else if (req.cookies[SUPERADMIN_AUTH_COOKIE]) {
      const cookieData = extractSuperAdminFromCookie(req);
      token = cookieData.token;
      superadmin = cookieData.superadmin as SuperAdmin;
    } else {
      throw new UnauthorizedException('SuperAdmin unauthenticated');
    }

    req.user = superadmin;
    return true;
  }
}
