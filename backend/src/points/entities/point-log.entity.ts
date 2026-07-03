import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('point_logs')
@Index(['userId'])
@Index(['createdAt'])
@Index(['action'])
export class PointLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50, nullable: false })
  action: string;

  @Column({ name: 'base_points', type: 'integer', default: 0 })
  basePoints: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  multiplier: number;

  @Column({ name: 'final_points', type: 'integer', default: 0 })
  finalPoints: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
