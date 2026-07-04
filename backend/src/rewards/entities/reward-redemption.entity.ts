import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reward } from './reward.entity';

@Entity('reward_redemptions')
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'reward_id', type: 'uuid', nullable: false })
  rewardId: string;

  @ManyToOne(() => Reward, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reward_id' })
  reward: Reward;

  @Column({ name: 'points_spent', type: 'integer', nullable: false })
  pointsSpent: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'redeemed_at', type: 'timestamp with time zone' })
  redeemedAt: Date;

  @Column({
    name: 'fulfilled_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  fulfilledAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
