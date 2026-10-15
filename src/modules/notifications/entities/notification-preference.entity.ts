import { User } from "@/modules/auth/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Per-user notification opt-ins. No row means all defaults (everything on). */
@Entity({ name: "notification_preferences" })
export class NotificationPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "int" })
  user_id: number;

  @Column({ type: "boolean", default: true })
  push_enabled: boolean;

  @Column({ type: "boolean", default: true })
  email_enabled: boolean;

  @Column({ type: "boolean", default: true })
  promotions_enabled: boolean;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
