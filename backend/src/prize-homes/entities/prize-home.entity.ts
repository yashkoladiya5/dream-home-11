import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('prize_homes')
export class PrizeHome {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  location: string | null;

  @Column({
    name: 'value_inr',
    type: 'numeric',
    precision: 15,
    scale: 2,
    nullable: false,
  })
  valueInr: number;

  @Column({ type: 'integer', nullable: true })
  bedrooms: number | null;

  @Column({ type: 'integer', nullable: true })
  bathrooms: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  area: string | null;

  @Column({ type: 'json', nullable: true })
  features: string[] | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  emoji: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  get formattedValue(): string {
    const val = Number(this.valueInr);
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} Lakhs`;
    return `₹${val.toLocaleString('en-IN')}`;
  }
}
