import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'achievement_id', type: 'uuid', nullable: false })
  achievementId: string;

  @ManyToOne(() => Achievement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;

  @CreateDateColumn({ name: 'earned_at', type: 'timestamp with time zone' })
  earnedAt: Date;
}
