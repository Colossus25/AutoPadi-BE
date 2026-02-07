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

@Entity('messages')
@Index(['conversation_id', 'created_at'])
@Index(['sender_id'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  conversation_id: string;

  @Column('integer')
  sender_id: number;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'json', nullable: true })
  attachments: Array<{
    type: string;
    url: string;
  }> | null;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
