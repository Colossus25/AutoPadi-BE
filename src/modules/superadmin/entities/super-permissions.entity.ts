import { SuperAdminPermission } from "@/definitions";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity({ name: "super_permissions" })
export class SuperPermissions {
    @PrimaryGeneratedColumn()
    id: string

    @Column()
    name: SuperAdminPermission

    @Column({ nullable: true })
    group: string

    @Column({ nullable: true})
    description: string

    @CreateDateColumn({ type: "timestamp"})
    created_at!: Date

    @UpdateDateColumn({ type: "timestamp"})
    updated_at!: Date
}