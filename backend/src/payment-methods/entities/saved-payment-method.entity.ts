import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('saved_payment_methods')
export class SavedPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 30 })
  category: string; // 'upi', 'card', 'net_banking', 'wallet'

  @Column({ length: 100 })
  label: string; // e.g. "HDFC Credit Card", "my@okhdfcpay"

  @Column({ name: 'display_value', length: 255 })
  displayValue: string; // masked card number, UPI ID, etc.

  @Column({ nullable: true, name: 'provider_name', length: 50 })
  providerName?: string; // Visa, Mastercard, HDFC, etc.

  @Column({ nullable: true, name: 'icon_url', length: 255 })
  iconUrl?: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
