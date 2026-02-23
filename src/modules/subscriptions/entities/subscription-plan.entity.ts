import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  QUARTERLY = 'quarterly',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('bigint')
  amount: number; // In Naira (kobo - smallest denomination)

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTHLY,
  })
  billing_interval: BillingInterval;

  @Column({ type: 'int', default: 0 })
  free_trial_days: number; // 0 = no trial, 7 = 7 days trial

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
