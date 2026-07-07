import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  COMPENSATE_CONTEST = 'compensate_contest',
  PROCESS_PENDING_COMPENSATIONS = 'process_pending_compensations',
  UPDATE_USER = 'update_user',
  UPDATE_CONFIG = 'update_config',
  APPROVE_KYC = 'approve_kyc',
  REJECT_KYC = 'reject_kyc',
  BROADCAST_NOTIFICATION = 'broadcast_notification',
  SUBMIT_KYC = 'submit_kyc',
  WITHDRAWAL_REQUEST = 'withdrawal_request',
  PAYMENT_VERIFIED = 'payment_verified',
  POINTS_EARNED = 'points_earned',
  PROFILE_UPDATED = 'profile_updated',
  UPDATE_TICKET_STATUS = 'update_ticket_status',
  CREATE_CONTEST = 'create_contest',
  UPDATE_CONTEST = 'update_contest',
  DELETE_CONTEST = 'delete_contest',
}

@Entity('audit_logs')
@Index(['adminId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'admin_id', type: 'uuid', nullable: true })
  adminId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ type: 'varchar', length: 50, nullable: false })
  action: string;

  @Column({ name: 'target_id', type: 'varchar', length: 50, nullable: true })
  targetId: string;

  @Column({ name: 'target_type', type: 'varchar', length: 50, nullable: true })
  targetType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
