import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { SuperRoles } from "./super-role.entity";
import { SuperGroup } from "./super-group.entity";
import { Logging } from "@/modules/logging/entities/logging.entity";

@Entity({ name: "superadmins"})
export class SuperAdmin {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true})
    first_name: string

    @Column({ nullable: true })
    last_name: string

    @Column({ unique: true})
    email: string

    @Column( { nullable: true})
    password: string

    @ManyToMany(() => SuperRoles)
    @JoinTable({ name: "super_admin_roles"})
    super_role: SuperRoles[]

    @ManyToMany(() => SuperGroup)
    @JoinTable({ name: "super_admin_groups"})
    super_group: SuperGroup[]

    @OneToMany(() => Logging, (logging) => logging.admin)
    logs: Logging[]

    @CreateDateColumn({ type: "timestamp"})
    created_at!: Date
    
    @UpdateDateColumn({ type: "timestamp"})
    updated_at!: Date
}