import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
}

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'referrer_id', type: 'uuid', nullable: false })
  referrerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrer_id' })
  referrer: User;

  @Column({ name: 'referee_id', type: 'uuid', nullable: false, unique: true })
  refereeId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referee_id' })
  referee: User;

  @Column({ type: 'integer', default: 30 })
  signupReward: number;

  @Column({ type: 'integer', default: 0 })
  kycReward: number;

  @Column({
    type: 'enum',
    enum: ReferralStatus,
    default: ReferralStatus.PENDING,
  })
  status: ReferralStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'settled_at', type: 'timestamp with time zone', nullable: true })
  settledAt: Date;
}
