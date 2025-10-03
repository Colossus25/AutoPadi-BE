import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Notification } from "@/modules/notifications/entities/notification.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password?: string;

  @Column({ nullable: true })
  user_type?: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  id_type?: string;

  @Column({ nullable: true })
  id_number?: string;

  @Column({ type: "text", nullable: true })
  id_image?: string | null;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  landmark?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ type: "text", nullable: true })
  proof_of_address_image?: string | null;

  @Column({ nullable: true, type: "text" })
  profile_picture: string | null;

  @Column({ nullable: true, type: "text", select: false })
  remember_token?: string | null;

  @Column({ type: "timestamp", nullable: true })
  email_verified_at?: Date | null;

  @DeleteDateColumn({ type: "timestamp", nullable: true, select: false })
  deleted_at?: Date | null;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;

  @OneToMany(() => Notification, (r) => r.user)
  @JoinColumn({ name: "user_id" })
  notifications: Notification[];
}
