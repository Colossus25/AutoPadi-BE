import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';

export enum ServiceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  media: string[];

  @Column('simple-array', { nullable: true })
  category: string[];

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  subscription_type: string;

  @Column('simple-array', { nullable: true })
  technician_categories: string[];

  @Column('simple-array', { nullable: true })
  specialized_in: string[];

  @Column('simple-array', { nullable: true })
  type_of_vehicles: string[];

  @Column({ nullable: true })
  service_location: string;

  @Column({ nullable: true })
  pricing: string;

  @Column({ nullable: true })
  specify_price_type: string;

  @Column({ nullable: true })
  contact_person_name: string;

  @Column({ nullable: true })
  contact_person_phone: string;

  @Column({ nullable: true })
  location_coordinates: string;

  @Column({ type: 'numeric', nullable: true })
  estimated_cost: number;

  @Column({ nullable: true })
  subscription_plan: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column({ nullable: true })
  rejection_reason: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
