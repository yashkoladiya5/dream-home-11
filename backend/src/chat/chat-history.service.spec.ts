import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatHistoryService } from './chat-history.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { Chat } from './entities/chat.entity';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;

  const mockQueryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockChatMessageRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockChatParticipantRepo = {
    find: jest.fn(),
  };

  const mockChatRepo = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatHistoryService,
        { provide: getRepositoryToken(ChatMessage), useValue: mockChatMessageRepo },
        { provide: getRepositoryToken(ChatParticipant), useValue: mockChatParticipantRepo },
        { provide: getRepositoryToken(Chat), useValue: mockChatRepo },
      ],
    }).compile();

    service = module.get<ChatHistoryService>(ChatHistoryService);
  });

  describe('saveMessage', () => {
    it('creates and saves a message, returns it', async () => {
      const data = { chatId: 'chat-1', senderId: 'user-1', content: 'Hello', type: 'text' };
      const created = { id: 'msg-1', ...data };
      mockChatMessageRepo.create.mockReturnValue(created);
      mockChatMessageRepo.save.mockResolvedValue(created);

      const result = await service.saveMessage(data);

      expect(mockChatMessageRepo.create).toHaveBeenCalledWith(data);
      expect(mockChatMessageRepo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('getMessages', () => {
    it('returns paginated messages with sender relations', async () => {
      const messages = [
        { id: 'msg-1', chatId: 'chat-1', senderId: 'user-1', content: 'Hello', sender: { id: 'user-1' } },
      ];
      mockChatMessageRepo.findAndCount.mockResolvedValue([messages, 1]);

      const result = await service.getMessages('chat-1', 1, 30);

      expect(mockChatMessageRepo.findAndCount).toHaveBeenCalledWith({
        where: { chatId: 'chat-1' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 30,
        relations: { sender: true },
      });
      expect(result.messages).toEqual(messages);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(30);
    });

    it('handles empty results', async () => {
      mockChatMessageRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getMessages('chat-1', 1, 30);

      expect(result.messages).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getUserChats', () => {
    it('returns user chats from participant records', async () => {
      const chat = { id: 'chat-1', name: 'Test Chat', type: 'group', participants: [], messages: [] };
      mockChatParticipantRepo.find.mockResolvedValue([
        { id: 'p-1', chatId: 'chat-1', userId: 'user-1', chat },
      ]);

      const result = await service.getUserChats('user-1');

      expect(mockChatParticipantRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: { chat: { participants: { user: true } } },
        order: { joinedAt: 'DESC' },
      });
      expect(result).toEqual([chat]);
    });
  });

  describe('markMessagesRead', () => {
    it('updates unread messages using query builder', async () => {
      await service.markMessagesRead('chat-1', 'user-1');

      expect(mockChatMessageRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ isRead: true });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('chat_id = :chatId', { chatId: 'chat-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('sender_id != :userId', { userId: 'user-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('is_read = false');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
