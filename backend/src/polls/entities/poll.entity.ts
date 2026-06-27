import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  question: string;

  @Column({ type: 'jsonb' })
  options: string[];

  @Column({ name: 'total_votes', type: 'integer', default: 0 })
  totalVotes: number;

  @Column({ name: 'active_from', type: 'timestamp with time zone' })
  activeFrom: Date;

  @Column({ name: 'active_to', type: 'timestamp with time zone' })
  activeTo: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
