import { extractDataFromCookie } from '@/core/utils';
import { PermissionValueType } from '@/definitions';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorator/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionValueType[]>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredPermissions) return true;

    const req = context.switchToHttp().getRequest();

    const { user } = extractDataFromCookie(req);

    throw new ForbiddenException('You do not have the permission to perform this action!');
  }
}
