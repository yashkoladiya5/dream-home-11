import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('leaderboard_archives')
@Index(['cycle', 'snapshotDate'])
@Index(['cycle', 'rank'])
export class LeaderboardArchive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  cycle: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'integer' })
  points: number;

  @Column({ type: 'integer' })
  rank: number;

  @Column({
    name: 'previous_tier',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  previousTier: string | null;

  @Column({ name: 'snapshot_date', type: 'timestamptz' })
  snapshotDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
