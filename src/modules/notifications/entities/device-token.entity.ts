import { User } from "@/modules/auth/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum DevicePlatform {
  ANDROID = "android",
  IOS = "ios",
  WEB = "web",
}

@Entity({ name: "device_tokens" })
export class DeviceToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "text" })
  token: string;

  @Column({ type: "enum", enum: DevicePlatform, default: DevicePlatform.ANDROID })
  platform: DevicePlatform;

  @Column({ type: "timestamp", nullable: true })
  last_used_at?: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
