import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { Conversation } from './conversation.entity';

@Entity('conversation_participants')
@Index(['conversation_id', 'user_id'])
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('integer')
  user_id: number;

  @CreateDateColumn()
  joined_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_read_at: Date | null;

  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
