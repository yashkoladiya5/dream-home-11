import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Chat } from './entities/chat.entity';
import { ChatListResponseDto } from './dto/chat-list-response.dto';
import { ChatDetailResponseDto } from './dto/chat-detail-response.dto';

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
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
  }> {
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

  async getUserChatsWithDetails(
    userId: string,
  ): Promise<ChatListResponseDto[]> {
    const participations = await this.chatParticipantRepo.find({
      where: { userId },
      relations: { chat: true },
      order: { joinedAt: 'DESC' },
    });

    if (participations.length === 0) return [];

    const chatIds = participations.map((p) => p.chat.id);

    const [allParticipants, lastMessages, unreadCountResults] =
      await Promise.all([
        this.chatParticipantRepo.find({
          where: { chatId: In(chatIds) },
          relations: { user: true },
        }),
        this.chatMessageRepo
          .createQueryBuilder()
          .select(
            'DISTINCT ON (chat_id) id, chat_id, content, sender_id, created_at',
          )
          .from('chat_messages', 'm')
          .where('chat_id IN (:...chatIds)', { chatIds })
          .orderBy('chat_id', 'ASC')
          .addOrderBy('created_at', 'DESC')
          .getRawMany(),
        this.chatMessageRepo
          .createQueryBuilder('m')
          .select('m.chat_id', 'chat_id')
          .addSelect('COUNT(*)', 'count')
          .where('m.chat_id IN (:...chatIds)', { chatIds })
          .andWhere('m.is_read = false')
          .groupBy('m.chat_id')
          .getRawMany(),
      ]);

    const participantsByChat = new Map<string, typeof allParticipants>();
    for (const p of allParticipants) {
      const list = participantsByChat.get(p.chatId) || [];
      list.push(p);
      participantsByChat.set(p.chatId, list);
    }

    const lastMessageByChat = new Map(
      lastMessages.map((m: any) => [m.chat_id, m]),
    );
    const unreadCountByChat = new Map(
      unreadCountResults.map((r: any) => [r.chat_id, parseInt(r.count, 10)]),
    );

    return participations.map((participation) => {
      const chat = participation.chat;
      const participants = participantsByChat.get(chat.id) || [];
      const rawLast = lastMessageByChat.get(chat.id);

      return {
        id: chat.id,
        name: chat.name,
        type: chat.type,
        participants: participants.map((p) => ({
          id: p.user.id,
          fullName: p.user.fullName || 'User',
          avatarUrl: p.user.avatarUrl,
        })),
        lastMessage: rawLast
          ? {
              content: rawLast.content,
              createdAt: rawLast.created_at,
              senderId: rawLast.sender_id,
            }
          : null,
        unreadCount: unreadCountByChat.get(chat.id) ?? 0,
        createdAt: chat.createdAt,
      };
    });
  }

  async getChatDetail(
    chatId: string,
    userId: string,
  ): Promise<ChatDetailResponseDto> {
    const chat = await this.chatRepo.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const isParticipant = await this.chatParticipantRepo.findOne({
      where: { chatId, userId },
    });

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    const participants = await this.chatParticipantRepo.find({
      where: { chatId },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });

    const lastMessage = await this.chatMessageRepo.findOne({
      where: { chatId },
      order: { createdAt: 'DESC' },
    });

    const unreadCount = await this.chatMessageRepo.count({
      where: { chatId, isRead: false },
    });

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      participants: participants.map((p) => ({
        id: p.user.id,
        fullName: p.user.fullName || 'User',
        avatarUrl: p.user.avatarUrl,
        joinedAt: p.joinedAt,
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
    };
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
