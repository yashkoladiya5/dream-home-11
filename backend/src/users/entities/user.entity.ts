import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { Kyc } from '../../kyc/entities/kyc.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

export enum UserLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

@Entity('users')
@Index(['phoneNumber'])
@Index(['referralCode'])
@Index(['lifetimePoints'])
@Index(['isActive'])
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

  @Column({ name: 'weekly_points', type: 'integer', default: 0 })
  weeklyPoints: number;

  @Column({ name: 'monthly_points', type: 'integer', default: 0 })
  monthlyPoints: number;

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

  @Column({ name: 'state', type: 'varchar', length: 50, nullable: true })
  state: string;

  @Column({
    name: 'bank_account_number',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  bankAccountNumber: string;

  @Column({ name: 'bank_ifsc', type: 'varchar', length: 20, nullable: true })
  bankIfsc: string;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName: string;

  @Column({ name: 'upi_id', type: 'varchar', length: 512, nullable: true })
  upiId: string;

  @Column({
    name: 'referral_code',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: true,
  })
  referralCode: string;

  @Column({ name: 'referred_by', type: 'uuid', nullable: true })
  referredBy: string;

  @Column({ name: 'device_id', type: 'varchar', length: 255, nullable: false })
  deviceId: string;

  role: UserRole;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ name: 'current_streak', type: 'integer', default: 0 })
  currentStreak: number;

  @Column({ name: 'longest_streak', type: 'integer', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_streak_date', type: 'date', nullable: true })
  lastStreakDate: Date | null;

  @Column({ name: 'terms_accepted_at', type: 'timestamp', nullable: true })
  termsAcceptedAt?: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @OneToOne(() => Kyc, (kyc) => kyc.user)
  kyc: Kyc;

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;
}
