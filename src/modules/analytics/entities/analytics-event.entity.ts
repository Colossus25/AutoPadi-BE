import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum AnalyticsResourceType {
  STORE = 'store',
  PRODUCT = 'product',
  DRIVER = 'driver',
  DRIVER_JOB = 'driver_job',
  SERVICE = 'service',
}

export enum AnalyticsEventType {
  VIEW = 'view',
  CLICK = 'click',
  ENQUIRY = 'enquiry',
}

@Entity('analytics_events')
@Index(['resource_type', 'resource_id', 'created_at'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AnalyticsResourceType })
  resource_type: AnalyticsResourceType;

  @Column()
  resource_id: number;

  @Column({ type: 'enum', enum: AnalyticsEventType })
  event_type: AnalyticsEventType;

  @Column()
  user_id: number;

  @CreateDateColumn()
  created_at: Date;
}
