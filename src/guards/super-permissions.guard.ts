import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUPER_PERMISSIONS_KEY } from './decorator/superadmin-permissions.decorator';
import { SuperAdminPermission } from '@/definitions';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { SuperRoles } from '@/modules/superadmin/entities/super-role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SuperPermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(SuperAdmin)
    private readonly superAdminRepository: Repository<SuperAdmin>,
    @InjectRepository(SuperRoles)
    private readonly superRolesRepository: Repository<SuperRoles>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<SuperAdminPermission[]>(
      SUPER_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredPermissions) return true;

    const req = context.switchToHttp().getRequest();


    const superadmin: SuperAdmin = req.superadmin;
    if (!superadmin) throw new ForbiddenException('SuperAdmin not authenticated');

    // Load roles and permissions for this superadmin
    const superAdminWithRoles = await this.superAdminRepository.findOne({
      where: { id: superadmin.id },
      relations: ['super_role', 'super_role.super_permission'],
    });

    if (!superAdminWithRoles) throw new ForbiddenException('SuperAdmin not found');

    // Flatten all permissions from all roles
    const permissions: string[] = [];
    const roles = Array.isArray(superAdminWithRoles.super_role)
      ? superAdminWithRoles.super_role
      : [superAdminWithRoles.super_role];

    for (const role of roles) {
      if (role && Array.isArray(role.super_permission)) {
        permissions.push(...role.super_permission.map((p) => p.name));
      }
    }

    // Allow if superadmin has any of the required permissions
    if (permissions.some((p) => requiredPermissions.includes(p as SuperAdminPermission))) {
      return true;
    }

    throw new ForbiddenException('You do not have the permission to perform this action!');
  }
}