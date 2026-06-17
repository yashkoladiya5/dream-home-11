import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Kyc } from '../../kyc/entities/kyc.entity';

export enum UserLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'phone_number',
    type: 'varchar',
    length: 15,
    unique: true,
    nullable: false,
  })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: true })
  fullName: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'current_tier',
    type: 'enum',
    enum: UserLevel,
    default: UserLevel.BRONZE,
  })
  currentTier: UserLevel;

  @Column({ name: 'lifetime_points', type: 'integer', default: 0 })
  lifetimePoints: number;

  @Column({
    name: 'wallet_balance_inr',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  walletBalanceInr: number;

  @Column({ name: 'points_balance', type: 'integer', default: 0 })
  pointsBalance: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: false })
  deviceId: string;

  @OneToOne(() => Kyc, (kyc) => kyc.user)
  kyc: Kyc;
}
