import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";

@Entity({ name: "user_roles" })
@Unique("UQ_user_roles_user_type", ["user_id", "user_type"])
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Column()
  user_type: string;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;
}
