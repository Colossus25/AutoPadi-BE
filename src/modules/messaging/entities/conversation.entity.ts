import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ConversationParticipant } from './conversation-participant.entity';
import { Message } from './message.entity';

export enum ConversationContextType {
  PRODUCT_INQUIRY = 'product_inquiry',
  BOOKING = 'booking',
  DRIVER_JOB = 'driver_job',
  GENERAL = 'general',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Entity('conversations')
@Index(['context_type', 'context_id'])
@Index(['status'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ConversationContextType,
    default: ConversationContextType.GENERAL,
  })
  context_type: ConversationContextType;

  @Column({ type: 'uuid', nullable: true })
  context_id: string | null;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => ConversationParticipant,
    (participant) => participant.conversation,
    { cascade: true },
  )
  participants: ConversationParticipant[];

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];
}
