import { SuperAdmin } from "./super-admin.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SuperPermissions } from "./super-permissions.entity";

@Entity({ name: "super_roles"})
export class SuperRoles {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true })
    description: string

    @ManyToMany(() => SuperPermissions)
    @JoinTable({ name: "super_role_permissions"})
    super_permission: SuperPermissions[]

    // @ManyToMany(() => SuperAdmin, (admin) => admin.super_role)
    // superadmin: SuperAdmin[]

    @CreateDateColumn({ type: "timestamp"})
    created_at!: Date

    @UpdateDateColumn({ type: "timestamp"})
    updated_at!: Date
}