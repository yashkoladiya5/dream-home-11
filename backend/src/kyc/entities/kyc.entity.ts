import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('kyc')
export class Kyc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId: string;

  @OneToOne(() => User, (user) => user.kyc, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'aadhaar_number',
    type: 'varchar',
    length: 12,
    unique: true,
    nullable: false,
  })
  aadhaarNumber: string;

  @Column({
    name: 'pan_number',
    type: 'varchar',
    length: 10,
    unique: true,
    nullable: false,
  })
  panNumber: string;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  status: KycStatus;

  @Column({
    name: 'verified_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  verifiedAt: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'aadhaar_front_url', type: 'varchar', nullable: true })
  aadhaarFrontUrl: string;

  @Column({ name: 'aadhaar_back_url', type: 'varchar', nullable: true })
  aadhaarBackUrl: string;

  @Column({ name: 'pan_card_url', type: 'varchar', nullable: true })
  panCardUrl: string;

  @Column({ name: 'selfie_url', type: 'varchar', nullable: true })
  selfieUrl: string;
}
