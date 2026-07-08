import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false, unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'balance_inr',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  balanceInr: number;

  @Column({
    name: 'locked_balance_inr',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  lockedBalanceInr: number;

  @Column({ name: 'points_balance', type: 'integer', default: 0 })
  pointsBalance: number;

  @VersionColumn({ name: 'version' })
  version: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
