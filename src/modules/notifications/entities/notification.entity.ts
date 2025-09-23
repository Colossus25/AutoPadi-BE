import { User } from '@/modules/auth/entities/user.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  tag: string;

  @Column({ type: 'json', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;

  //Used for read at
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @ManyToOne(() => User, (relationship) => relationship.notifications)
  @JoinColumn({ name: 'User_id' })
  user: User;
}
