import { BadRequestException, Injectable, NotAcceptableException } from '@nestjs/common';
import { SuperAdminPermission, SuperAdminRequest, UserRequest } from '@/definitions';
import { SuperAdmin } from '@/modules/superadmin/entities/super-admin.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { SuperRoles } from '../entities/super-role.entity';
import { SuperPermissions } from '../entities/super-permissions.entity';
import { SuperLoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { verifyHash } from '@/core/utils';
import { JwtService } from '@nestjs/jwt';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { CreateAdminDto } from '../dto/create.dto';
import { SuperGroup } from '../entities/super-group.entity';

@Injectable()
export class SuperadminService {
    public DEFAULT_ROLES = [
        {
            name: "Super Admin",
            description: "Has super admin authority",
            permission: [
                SuperAdminPermission.CAN_ADD_USER,
                SuperAdminPermission.CAN_ARCHIVE_USER,
                SuperAdminPermission.CAN_DEACTIVATE_USER,
                SuperAdminPermission.CAN_DELETE_USER,
                SuperAdminPermission.CAN_DISABLE_USER,
                SuperAdminPermission.CAN_EDIT_USER,
                SuperAdminPermission.CAN_ENABLE_USER,
                SuperAdminPermission.CAN_SUSPEND_USER,
                SuperAdminPermission.CAN_TERMINATE_SESSIONS,
                SuperAdminPermission.CAN_VIEW_SESSIONS
            ]
        }
    ];

    constructor(
        @InjectRepository(SuperAdmin)
        private readonly superAdminRepository: Repository<SuperAdmin>,
        @InjectRepository(SuperRoles)
        private readonly superRolesRepository: Repository<SuperRoles>,
        @InjectRepository(SuperPermissions)
        private readonly superPermissionsRepository: Repository<SuperPermissions>,
        @InjectRepository(SuperGroup) 
        private readonly superGroupRepository: Repository<SuperGroup>,
        private readonly jwtService: JwtService
    ) {}

    // Create default SuperAdmin if not exists
    async createDefaultSuperAdmin() {
        const existing = await this.superAdminRepository.findOne({ where: { email: 'superadmin@address.com' } });
        if (existing) return existing;

        // Create permissions
        const permissions = await Promise.all(
            this.DEFAULT_ROLES[0].permission.map(async (perm) => {
                let p = await this.superPermissionsRepository.findOne({ where: { name: perm } });
                if (!p) p = await this.superPermissionsRepository.save(this.superPermissionsRepository.create({ name: perm }));
                return p;
            })
        );

        // Create role
        let role = await this.superRolesRepository.findOne({ where: { name: this.DEFAULT_ROLES[0].name } });
        if (!role) {
            role = this.superRolesRepository.create({
                name: this.DEFAULT_ROLES[0].name,
                description: this.DEFAULT_ROLES[0].description,
                super_permission: permissions
            });
            role = await this.superRolesRepository.save(role);
        }

        const password = await bcrypt.hash('superadmin123', 10); 
        const superAdmin = this.superAdminRepository.create({
            first_name: 'super',
            last_name: 'admin',
            email: 'superadmin@gmail.com',
            password,
            super_role: [role],
        });
        const result = await this.superAdminRepository.save(superAdmin);

        return result
    }

    async login(superLoginDto: SuperLoginDto, req: SuperAdminRequest) {
        const superAdmin = await this.superAdminRepository.findOne({
            where: { email: superLoginDto.email },
            relations: ['super_role', 'super_role.super_permission']
        });

        if (!superAdmin) {
            throw new NotAcceptableException("Invalid credentials");
        }

        const verified = await verifyHash(superLoginDto.password, superAdmin.password);
        if (!verified) {
            throw new NotAcceptableException("Incorrect password, please try again");
        }

        const token = this.jwtService.sign({
            id: superAdmin.id,
            email: superAdmin.email
        });

        return {
            message: "Login successful",
            superAdmin,
            token
        };
    }

    async createAdmin(createAdminDto: CreateAdminDto) {
        const existing = await this.superAdminRepository.findOne({
            where: {
                email: createAdminDto.email
            }
        })
        if(existing) throw new BadRequestException("Superadmin with this email already exists")
            const password = await bcrypt.hash(createAdminDto.password, 10)
        
        let roles: SuperRoles[] = []

        if (createAdminDto.super_role_ids && createAdminDto.super_role_ids.length > 0) {
            roles = await this.superRolesRepository.find({
                where: {id: In(roles)}
            })
        }

        let groups: SuperGroup[] = []
        if (createAdminDto.super_group_ids && createAdminDto.super_group_ids.length > 0) {
            groups = await this.superGroupRepository.find({
                where: {id: In(groups)}
            })
        }

        const superAdmin = this.superAdminRepository.create({
            ...createAdminDto,
            password: password,
            super_role: roles,
            super_group: groups
        })

        const result = await this.superAdminRepository.save(superAdmin)

        return result
    }
}