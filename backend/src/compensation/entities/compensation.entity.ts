import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Contest } from '../../contests/entities/contest.entity';
import { User } from '../../users/entities/user.entity';

export enum CompensationStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('compensation_logs')
@Unique(['contestId', 'userId'])
export class CompensationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contest_id', type: 'uuid', nullable: false })
  contestId: string;

  @ManyToOne(() => Contest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'entry_fee_inr', type: 'numeric', precision: 10, scale: 2, nullable: false })
  entryFeeInr: number;

  @Column({ name: 'compensation_points', type: 'integer', nullable: false })
  compensationPoints: number;

  @Column({
    type: 'enum',
    enum: CompensationStatus,
    default: CompensationStatus.PENDING,
  })
  status: CompensationStatus;

  @Column({ name: 'processed_at', type: 'timestamp with time zone', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
