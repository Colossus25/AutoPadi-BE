import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SuperAdmin } from './super-admin.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  attribute_type: 'make' | 'type' | 'year' | 'colour' | 'body' | 'fuel';

  @Column()
  value: string;

  @ManyToOne(() => SuperAdmin, { eager: true })
  @JoinColumn({ name: 'created_by' })
  created_by: SuperAdmin;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
