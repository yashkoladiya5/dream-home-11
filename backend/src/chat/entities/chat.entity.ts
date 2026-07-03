import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatParticipant } from './chat-participant.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 20, default: 'direct' })
  type: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @OneToMany(() => ChatMessage, (msg) => msg.chat)
  messages: ChatMessage[];

  @OneToMany(() => ChatParticipant, (cp) => cp.chat)
  participants: ChatParticipant[];
}
