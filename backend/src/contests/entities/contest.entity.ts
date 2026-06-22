import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ContestMember } from './contest-member.entity';

export enum ContestType {
  NORMAL = 'normal',
  MEGA = 'mega',
  HOME = 'home',
  PRIVATE = 'private',
}

export enum ContestStatus {
  UPCOMING = 'upcoming',
  RUNNING = 'running',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('contests')
export class Contest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150, nullable: false })
  title: string;

  @Column({
    type: 'enum',
    enum: ContestType,
    default: ContestType.NORMAL,
  })
  type: ContestType;

  @Column({ name: 'entry_fee_inr', type: 'numeric', precision: 10, scale: 2, default: 0.0 })
  entryFeeInr: number;

  @Column({ name: 'points_to_join', type: 'integer', default: 0 })
  pointsToJoin: number;

  @Column({ name: 'max_slots', type: 'integer', nullable: false })
  maxSlots: number;

  @Column({ name: 'filled_slots', type: 'integer', default: 0 })
  filledSlots: number;

  @Column({ type: 'text', nullable: true })
  prize: string;

  @Column({ name: 'badge_text', type: 'varchar', length: 50, nullable: true })
  badgeText: string;

  @Column({ name: 'badge_color', type: 'varchar', length: 20, nullable: true })
  badgeColor: string;

  @Column({ type: 'text', nullable: true })
  rules: string;

  @Column({ name: 'invite_code', type: 'varchar', length: 8, nullable: true, unique: true })
  inviteCode: string;

  @Column({ name: 'start_time', type: 'timestamp with time zone', nullable: false })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp with time zone', nullable: false })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ContestStatus,
    default: ContestStatus.UPCOMING,
  })
  status: ContestStatus;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @OneToMany(() => ContestMember, (cm) => cm.contest)
  members: ContestMember[];
}
