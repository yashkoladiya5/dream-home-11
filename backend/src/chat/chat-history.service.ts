import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Chat } from './entities/chat.entity';
import { ChatListResponseDto } from './dto/chat-list-response.dto';

@Injectable()
export class ChatHistoryService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepo: Repository<ChatParticipant>,
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
  ) {}

  async saveMessage(data: {
    chatId: string;
    senderId: string;
    content: string;
    type?: string;
  }): Promise<ChatMessage> {
    const message = this.chatMessageRepo.create({
      chatId: data.chatId,
      senderId: data.senderId,
      content: data.content,
      type: data.type || 'text',
    });
    return this.chatMessageRepo.save(message);
  }

  async getMessages(
    chatId: string,
    page: number = 1,
    limit: number = 30,
  ): Promise<{ messages: ChatMessage[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [messages, total] = await this.chatMessageRepo.findAndCount({
      where: { chatId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: { sender: true },
    });
    return { messages, total, page, limit };
  }

  async getUserChats(userId: string): Promise<Chat[]> {
    const participations = await this.chatParticipantRepo.find({
      where: { userId },
      relations: { chat: { participants: { user: true } } },
      order: { joinedAt: 'DESC' },
    });
    return participations.map((p) => p.chat);
  }

  async getUserChatsWithDetails(userId: string): Promise<ChatListResponseDto[]> {
    const participations = await this.chatParticipantRepo.find({
      where: { userId },
      relations: { chat: true },
      order: { joinedAt: 'DESC' },
    });

    const enrichedChats: ChatListResponseDto[] = [];

    for (const participation of participations) {
      const chat = participation.chat;

      const participants = await this.chatParticipantRepo.find({
        where: { chatId: chat.id },
        relations: { user: true },
      });

      const lastMessage = await this.chatMessageRepo.findOne({
        where: { chatId: chat.id },
        order: { createdAt: 'DESC' },
      });

      const unreadCount = await this.chatMessageRepo.count({
        where: { chatId: chat.id, isRead: false },
      });

      enrichedChats.push({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        participants: participants.map((p) => ({
          id: p.user.id,
          fullName: p.user.fullName || 'User',
          avatarUrl: p.user.avatarUrl,
        })),
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount,
        createdAt: chat.createdAt,
      });
    }

    return enrichedChats;
  }

  async markMessagesRead(chatId: string, userId: string): Promise<void> {
    await this.chatMessageRepo
      .createQueryBuilder()
      .update()
      .set({ isRead: true })
      .where('chat_id = :chatId', { chatId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    return this.chatMessageRepo.count({
      where: { chatId, isRead: false },
    });
  }
}
