import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SuperAdmin } from './super-admin.entity';

@Entity('service_attributes')
export class ServiceAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attribute_type: 'technician_categories' | 'specialized_in' | 'type_of_vehicles';

  @Column()
  value: string;

  @ManyToOne(() => SuperAdmin, { eager: true })
  @JoinColumn({ name: 'created_by' })
  created_by: SuperAdmin;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
