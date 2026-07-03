import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Contest } from './contest.entity';
import { User } from '../../users/entities/user.entity';

@Entity('contest_members')
@Unique(['contestId', 'userId'])
export class ContestMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contest_id', type: 'uuid', nullable: false })
  contestId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => Contest, (contest) => contest.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({
    name: 'joined_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt: Date;

  @Column({ name: 'points_earned', type: 'integer', default: 0 })
  pointsEarned: number;
}
