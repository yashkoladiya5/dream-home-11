import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WithdrawalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('withdrawals')
export class Withdrawal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'amount', type: 'numeric', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ name: 'status', type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
  status: WithdrawalStatus;

  @Column({ name: 'bank_account_number', type: 'varchar', length: 30, nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_ifsc', type: 'varchar', length: 20, nullable: true })
  bankIfsc: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName: string;

  @Column({ name: 'upi_id', type: 'varchar', length: 100, nullable: true })
  upiId: string;

  @Column({ name: 'utr_number', type: 'varchar', length: 50, nullable: true })
  utrNumber: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
