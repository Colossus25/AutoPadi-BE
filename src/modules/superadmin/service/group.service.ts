import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { SuperAdmin } from "../entities/super-admin.entity";
import { SuperGroup } from "../entities/super-group.entity";
import { CreateGroupDto } from "../dto/create-group.dto";
import { SuperRoles } from "../entities/super-role.entity";

@Injectable()
export class SuperGroupService {
    constructor(
        @InjectRepository(SuperAdmin)
        private readonly superAdminRepository: Repository<SuperAdmin>,
        @InjectRepository(SuperGroup)
        private readonly superGroupRepository:
        Repository<SuperGroup>,
        @InjectRepository(SuperRoles)
        private readonly superRolesRepository:
        Repository<SuperRoles>, 
    ) {}

    async createGroup(dto: CreateGroupDto) {
        const parentGroup = dto.parent_id ? await this.superGroupRepository.findOne({
            where: {
                id: dto.parent_id
            }
        }) : null

        const newGroup = this.superGroupRepository.create({
            name: dto.name,
            description: dto.description,
            parent: parentGroup
        })

        const result = await this.superGroupRepository.save(newGroup)

        return result
    }

    async updateGroup(id: number, dto: Partial<CreateGroupDto>): Promise<SuperGroup> {
        const group = await this.superGroupRepository.findOne({
            where: { id }
        })
        if(!group) throw new NotFoundException("Group not found")
        
            if (dto.parent_id) {
                group.parent = await this.superGroupRepository.findOne({
                    where: {
                        id: dto.parent_id
                    }
                })
            }

            group.name = dto.name ?? group.name
            group.description = dto.description ?? group.description

        return this.superGroupRepository.save(group)
    }

    async deleteGroup(id: number): Promise<void> {
        const group = await this.superGroupRepository.findOne({
            where: { id },
            relations: ['children']
        })

        if (!group) {
            throw new ConflictException(
                "Cannot delete group with child groups. Move or delete children first."
            )
        }

        await this.superGroupRepository.remove(group)
    }

    async assignUsersToGroup(
        groupId: number,
        userIds: number[]
    ): Promise<SuperGroup> {
        const group = await this.superGroupRepository.findOne({
            where: { id: groupId },
            relations: ['members']
        })
        if(!group) throw new NotFoundException("Group not found")

            const users = await this.superAdminRepository.find({
                where: {
                    id: In(userIds)
                }
            })

            if (users.length === 0) {
                throw new NotFoundException("Please enter a valid admin id")
            }

            group.members = [...new Set([...group.members, ...users])]

        return this.superGroupRepository.save(group)
    }

    async assignRolesToGroups(
        groupId: number,
        roleIds: number[]
    ): Promise<SuperGroup> {
        const group = await this.superGroupRepository.findOne({
            where: { id: groupId }
        })

        if(!group) throw new NotFoundException("Group not found")
            
        const roles = await this.superRolesRepository.find({
            where: {
                id: In(roleIds)
            }
        })

        if (roles.length === 0) {
            throw new NotFoundException("Enter valid roles id")
        }

        group.roles = [...new Set([...(group.roles || []), ...roles])];

        return this.superGroupRepository.save(group);
    }
}