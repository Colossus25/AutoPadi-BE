import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';

@Entity('driver_jobs')
export class DriverJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  employing_type: string;

  @Column({ type: 'int', nullable: true })
  number_of_driver_needed: number;

  @Column({ nullable: true })
  driver_gender: string;

  @Column({ type: 'int', nullable: true })
  driver_age: number;

  @Column({ nullable: true })
  driver_level_of_education: string;

  @Column({ nullable: true })
  driver_marital_status: string;

  @Column({ nullable: true })
  religion: string;

  @Column({ type: 'int', nullable: true })
  driver_years_of_experience: number;

  @Column({ type: 'boolean', nullable: true })
  valid_driver_license: boolean;

  @Column({ type: 'boolean', nullable: true })
  driver_must_reside_in_state: boolean;

  @Column({ type: 'boolean', nullable: true })
  accomodation_available: boolean;

  @Column('simple-array', { nullable: true })
  type_of_vehicles: string[];

  @Column({ nullable: true })
  subscription_plan: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
