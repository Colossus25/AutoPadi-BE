import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  level_of_education: string;

  @Column({ nullable: true })
  tribe: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ nullable: true })
  marital_status: string;

  @Column({ nullable: true })
  religion: string;

  @Column({ type: 'int', nullable: true })
  years_of_experience: number;

  @Column({ nullable: true })
  valid_driver_license: string;

  @Column({ nullable: true })
  utility_bill: string;

  @Column({ nullable: true })
  cv: string;

  @Column({ type: 'boolean', nullable: true })
  open_to_relocation: boolean;

  @Column({ nullable: true })
  relocation_state: string;

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
