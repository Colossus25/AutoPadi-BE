import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { UserSubscription } from './user-subscription.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum PaymentType {
  INITIAL = 'initial',
  RENEWAL = 'renewal',
}

@Entity('payments')
export class Payment {
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

  @Column({ nullable: true })
  user_subscription_id: number;

  @ManyToOne(() => UserSubscription, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_subscription_id' })
  user_subscription: UserSubscription;

  @Column('bigint')
  amount: number; // In Naira (kobo)

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.INITIAL,
  })
  payment_type: PaymentType;

  @Column({ nullable: true })
  paystack_reference: string;

  @Column({ nullable: true })
  paystack_message: string;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
