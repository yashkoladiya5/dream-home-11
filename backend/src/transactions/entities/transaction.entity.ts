import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 30, nullable: false })
  type: string; // deposit, entry_fee, withdrawal, redemption, points_earned, points_bonus, referral

  @Column({ name: 'cash_amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
  cashAmount: number;

  @Column({ name: 'points_amount', type: 'integer', default: 0 })
  pointsAmount: number;

  @Column({ name: 'cash_balance_before', type: 'numeric', precision: 10, scale: 2, nullable: true })
  cashBalanceBefore: number;

  @Column({ name: 'cash_balance_after', type: 'numeric', precision: 10, scale: 2, nullable: true })
  cashBalanceAfter: number;

  @Column({ name: 'points_balance_before', type: 'integer', nullable: true })
  pointsBalanceBefore: number;

  @Column({ name: 'points_balance_after', type: 'integer', nullable: true })
  pointsBalanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  referenceId: string;

  @Column({ type: 'varchar', length: 20, default: 'completed' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
