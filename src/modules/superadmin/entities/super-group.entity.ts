import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SuperAdmin } from "./super-admin.entity";
import { SuperRoles } from "./super-role.entity";

@Entity({ name: "super_group"})
export class SuperGroup {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ nullable: true})
    description: string

    @ManyToMany(() => SuperAdmin)
    @JoinTable()
    members: SuperAdmin[]

    @ManyToMany(() => SuperRoles)
    @JoinTable()
    roles: SuperRoles[]

    @ManyToOne(() => SuperGroup, { nullable: true})
    parent?: SuperGroup | null

    @OneToMany(() => SuperGroup, group => group.parent)
    children: SuperGroup[]

    @CreateDateColumn()
    createdAt: Date
}