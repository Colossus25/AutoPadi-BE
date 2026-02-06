import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { Service } from '@/modules/serviceprovider/entities/service.entity';
import { BookingReview } from './booking-review.entity';
import { BookingReport } from './booking-report.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Service, { eager: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'service_provider_id' })
  service_provider: User;

  @Column()
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';

  @Column({ nullable: true })
  booking_date: Date;

  @Column({ nullable: true })
  preferred_time: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  estimated_cost: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  final_cost: number;

  @OneToMany(() => BookingReview, (review) => review.booking, { cascade: true })
  reviews: BookingReview[];

  @OneToMany(() => BookingReport, (report) => report.booking, { cascade: true })
  reports: BookingReport[];

  @Column({ nullable: true })
  cancelled_reason: string;

  @Column({ nullable: true })
  declined_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
