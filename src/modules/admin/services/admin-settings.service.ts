import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { SuperRoles } from '@/modules/superadmin/entities/super-role.entity';
import { SuperPermissions } from '@/modules/superadmin/entities/super-permissions.entity';

/**
 * Admin Settings: profile self-management, admin team management, and a
 * read-only view of the RBAC role/permission catalogue.
 *
 * The existing `SuperadminService.createAdmin` is reused for new admins; this
 * service handles profile updates, password changes, deletes, and the list
 * queries.
 */
@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectRepository(SuperAdmin)
    private readonly admins: Repository<SuperAdmin>,
    @InjectRepository(SuperRoles)
    private readonly roles: Repository<SuperRoles>,
    @InjectRepository(SuperPermissions)
    private readonly permissions: Repository<SuperPermissions>,
  ) {}

  // ---------- Profile -------------------------------------------------

  async getProfile(id: number) {
    const admin = await this.admins.findOne({
      where: { id },
      relations: ['super_role', 'super_role.super_permission'],
    });
    if (!admin) throw new NotFoundException('Profile not found');
    return admin;
  }

  async updateProfile(
    id: number,
    dto: { first_name?: string; last_name?: string; email?: string },
  ) {
    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Profile not found');

    if (dto.email && dto.email !== admin.email) {
      const taken = await this.admins.findOne({ where: { email: dto.email } });
      if (taken) throw new ConflictException('Email already in use.');
      admin.email = dto.email.trim();
    }
    if (dto.first_name !== undefined) admin.first_name = dto.first_name.trim();
    if (dto.last_name !== undefined) admin.last_name = dto.last_name.trim();

    await this.admins.save(admin);
    return admin;
  }

  async changePassword(id: number, current: string, next: string) {
    if (!next || next.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters.');
    }
    const admin = await this.admins.findOne({ where: { id } });
    if (!admin) throw new NotFoundException('Profile not found');

    const ok = await bcrypt.compare(current, admin.password);
    if (!ok) throw new NotAcceptableException('Current password is incorrect.');

    admin.password = await bcrypt.hash(next, 10);
    await this.admins.save(admin);
  }

  // ---------- Admins team --------------------------------------------

  async listAdmins() {
    return this.admins.find({
      relations: ['super_role'],
      order: { created_at: 'DESC' },
    });
  }

  async deleteAdmin(currentAdminId: number, targetId: number) {
    // Coerce both sides — cookie-deserialised ids can arrive as strings while
    // ParseIntPipe gives us a number, and `===` between them silently fails.
    if (Number(currentAdminId) === Number(targetId)) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    const admin = await this.admins.findOne({ where: { id: targetId } });
    if (!admin) throw new NotFoundException('Admin not found');
    try {
      await this.admins.remove(admin);
    } catch (e) {
      // Postgres FK violation when this admin has created banners / attributes /
      // logs — surface a useful message instead of leaking the constraint name.
      const code = (e as { code?: string })?.code;
      if (code === '23503') {
        throw new BadRequestException(
          'This admin owns banners, attributes, or audit logs and cannot be removed.',
        );
      }
      throw e;
    }
  }

  // ---------- Roles ---------------------------------------------------

  async listRoles() {
    return this.roles.find({
      relations: ['super_permission'],
      order: { name: 'ASC' },
    });
  }

  async listPermissions() {
    return this.permissions.find({ order: { name: 'ASC' } });
  }
}
