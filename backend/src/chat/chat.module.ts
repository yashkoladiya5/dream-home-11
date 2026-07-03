import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatHistoryService } from './chat-history.service';
import { ChatHistoryController } from './chat-history.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMessage, ChatParticipant]),
    UsersModule,
    AuthModule,
  ],
  providers: [ChatGateway, ChatHistoryService],
  controllers: [ChatHistoryController],
  exports: [ChatGateway, ChatHistoryService, TypeOrmModule],
})
export class ChatModule {}
