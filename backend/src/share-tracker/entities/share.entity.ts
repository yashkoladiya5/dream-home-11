import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'contest_id', type: 'uuid', nullable: true })
  contestId: string | null;

  @Column({ name: 'share_channel', type: 'varchar', length: 50, nullable: false })
  shareChannel: string;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: string;

  @Column({ name: 'points_awarded', type: 'integer', default: 0 })
  pointsAwarded: number;

  @Column({ name: 'invite_code', type: 'varchar', length: 20, nullable: true })
  inviteCode: string | null;

  @CreateDateColumn({ name: 'shared_at', type: 'timestamp with time zone' })
  sharedAt: Date;
}
