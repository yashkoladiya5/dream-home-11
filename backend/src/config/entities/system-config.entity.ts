import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Dream Home 11' })
  appName: string;

  @Column({ default: '1.0.0' })
  appVersion: string;

  @Column({ default: 'v1' })
  apiVersion: string;

  @Column({ default: 'development' })
  environment: string;

  @Column({ default: false })
  maintenanceMode: boolean;

  @Column({ default: '1.0.0' })
  minAppVersionAndroid: string;

  @Column({ default: '1.0.0' })
  minAppVersionIos: string;

  @Column('decimal', { precision: 10, scale: 2, default: 50000 })
  maxWithdrawalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 100 })
  minWithdrawalAmount: number;

  @Column({ default: true })
  dailySpinEnabled: boolean;

  @Column({ default: true })
  pollsEnabled: boolean;

  @Column({ default: true })
  feedEnabled: boolean;

  @Column({ default: true })
  chatEnabled: boolean;

  @Column({ default: true })
  referralEnabled: boolean;

  @Column({ default: 5 })
  maxDailyPosts: number;

  @Column({ default: 1 })
  maxDailySpins: number;

  @Column({ default: 'support@dreamhome11.com' })
  supportEmail: string;

  @Column('simple-array', { default: 'Assam,Odisha,Telangana' })
  restrictedStates: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
