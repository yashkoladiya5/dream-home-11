import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'amount' })
  amount: number;

  @Column({ length: 30, default: 'pending' })
  status: string;

  @Column({ length: 50, name: 'payment_method', nullable: true })
  paymentMethod?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'bonus_points', default: 0 })
  bonusPoints: number;

  @Column({ name: 'signature', nullable: true })
  signature?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
