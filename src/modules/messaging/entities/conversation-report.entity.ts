import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

export enum ConversationReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  SCAM = 'scam',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  IMPERSONATION = 'impersonation',
  OTHER = 'other',
}

export enum ConversationReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('conversation_reports')
@Index(['conversation_id'])
@Index(['reporter_id'])
@Index(['reported_user_id'])
@Index(['status'])
export class ConversationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('integer')
  reporter_id: number;

  @Column('integer')
  reported_user_id: number;

  @Column({ type: 'uuid', nullable: true })
  message_id: string | null;

  @Column({ type: 'enum', enum: ConversationReportReason })
  reason: ConversationReportReason;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ConversationReportStatus,
    default: ConversationReportStatus.PENDING,
  })
  status: ConversationReportStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reported_user_id' })
  reported_user: User;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'message_id' })
  message: Message | null;
}
