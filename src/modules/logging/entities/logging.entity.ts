import { SuperAdmin } from "@/modules/superadmin/entities/super-admin.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity({ name: "logging"})
export class Logging {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    entity: string

    @Column('text', { nullable: true})
    note: string

    @ManyToOne(() => SuperAdmin, (admin) => admin.logs, { nullable: false })
    @JoinColumn({ name: 'admin_id'})
    admin: SuperAdmin

    @Column()
    admin_id: string

    @Column({ default: false })
    visible: boolean

    @Column('json', { nullable: true })
    metadata: any

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

}