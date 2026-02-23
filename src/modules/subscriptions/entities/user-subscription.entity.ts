import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum UserSubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  PAYMENT_PENDING = 'payment_pending',
}

@Entity('user_subscriptions')
export class UserSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  subscription_plan_id: number;

  @ManyToOne(() => SubscriptionPlan, { eager: true })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscription_plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: UserSubscriptionStatus,
    default: UserSubscriptionStatus.PAYMENT_PENDING,
  })
  status: UserSubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  subscription_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscription_end_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  next_charge_date: Date;

  @Column({ type: 'boolean', default: false })
  free_trial_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  free_trial_end_date: Date;

  @Column({ nullable: true })
  paystack_authorization_code: string;

  @Column({ nullable: true })
  paystack_reference: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
