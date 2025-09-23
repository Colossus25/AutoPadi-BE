import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "@/modules/auth/entities/user.entity";

@Entity({ name: "notification_jobs" })
export class NotificationJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tag: string;

  @Column({ default: false })
  queued: boolean;

  @Column({ default: false })
  queue_able: boolean;

  @Column("text", { nullable: true })
  action_note?: string;

  @Column({ type: "json", nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deleted_at?: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @ManyToOne(() => User, (relationship) => relationship.id)
  @JoinColumn({ name: "user_id" })
  user: User;
}
