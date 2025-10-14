import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { Store } from './store.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  media: string[];

  @Column({ nullable: true })
  location_coordinates: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  listing_type: string;

  @Column({ nullable: true })
  price: string;

  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  mileage: string;

  @Column({ nullable: true })
  colour: string;

  @Column({ nullable: true })
  body: string;

  @Column({ nullable: true })
  fuel: string;

  @ManyToOne(() => Store, (store) => store.products, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
