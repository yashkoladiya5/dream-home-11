import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contest } from '../../contests/entities/contest.entity';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'contest_id', type: 'uuid', nullable: false })
  contestId: string;

  @ManyToOne(() => Contest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @Column({
    name: 'remind_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  remindAt: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
