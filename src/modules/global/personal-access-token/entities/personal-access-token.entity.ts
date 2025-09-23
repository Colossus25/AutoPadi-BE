import { User } from '@/modules/auth/entities/user.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum PersonalAccessTokenType {
  otp = 'otp',
  accessCodeReset = 'accessCodeReset',
  rememberToken = 'rememberToken',
  other = 'others',
}

@Entity({ name: 'personal_access_token' })
export class PersonalAccessToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: PersonalAccessTokenType,
    default: PersonalAccessTokenType.otp,
  })
  token_type: PersonalAccessTokenType;

  @ManyToOne(() => User, (r) => r.id, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timestamp' })
  due_at?: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;
}
