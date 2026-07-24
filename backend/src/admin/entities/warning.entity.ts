import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WarningLevel {
  L1 = 1,
  L2 = 2,
  L3 = 3,
}

export enum WarningStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RESOLVED = 'resolved',
}

@Entity('warnings')
export class Warning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'integer', default: 1 })
  level: WarningLevel;

  @Column({ type: 'varchar', length: 100, nullable: false })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'points_deducted', type: 'integer', default: 0 })
  pointsDeducted: number;

  @Column({
    type: 'enum',
    enum: WarningStatus,
    default: WarningStatus.ACTIVE,
  })
  status: WarningStatus;

  @Column({ name: 'issued_by', type: 'uuid', nullable: true })
  issuedBy: string | null;

  @Column({
    name: 'expires_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  expiresAt: Date | null;

  @Column({
    name: 'resolved_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  resolvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;
}
