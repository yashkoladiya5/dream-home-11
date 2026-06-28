import { Test, TestingModule } from '@nestjs/testing';
import { ChatHistoryController } from './chat-history.controller';
import { ChatHistoryService } from './chat-history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryMessagesDto } from './dto/query-messages.dto';

describe('ChatHistoryController', () => {
  let controller: ChatHistoryController;
  let chatHistoryService: ChatHistoryService;

  const mockChatHistoryService = {
    getUserChats: jest.fn(),
    getMessages: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatHistoryController],
      providers: [
        { provide: ChatHistoryService, useValue: mockChatHistoryService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<ChatHistoryController>(ChatHistoryController);
    chatHistoryService = module.get<ChatHistoryService>(ChatHistoryService);

    jest.clearAllMocks();
  });

  it('has JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', ChatHistoryController);
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  describe('GET /chats', () => {
    it('returns user chats', async () => {
      const mockChats = [{ id: 'chat-1', name: 'Test Chat', type: 'group' }];
      mockChatHistoryService.getUserChats.mockResolvedValue(mockChats);

      const result = await controller.getUserChats('user-1');

      expect(mockChatHistoryService.getUserChats).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockChats);
    });
  });

  describe('GET /chats/:id/messages', () => {
    it('returns paginated messages with meta', async () => {
      const messages = [{ id: 'msg-1', chatId: 'chat-1', content: 'Hello' }];
      mockChatHistoryService.getMessages.mockResolvedValue({
        messages,
        total: 1,
        page: 1,
        limit: 30,
      });

      const result = await controller.getMessages(
        'chat-1',
        { page: 1, limit: 30 } as QueryMessagesDto,
        'user-1',
      );

      expect(mockChatHistoryService.getMessages).toHaveBeenCalledWith('chat-1', 1, 30);
      expect(result).toEqual({
        data: messages,
        meta: { total: 1, page: 1, limit: 30, hasMore: false },
      });
    });

    it('passes query params correctly', async () => {
      mockChatHistoryService.getMessages.mockResolvedValue({
        messages: [],
        total: 0,
        page: 2,
        limit: 10,
      });

      await controller.getMessages(
        'chat-1',
        { page: 2, limit: 10 } as QueryMessagesDto,
        'user-1',
      );

      expect(mockChatHistoryService.getMessages).toHaveBeenCalledWith('chat-1', 2, 10);
    });

    it('sets hasMore=true when more pages exist', async () => {
      const messages = Array(10).fill({ id: 'msg', content: 'test' });
      mockChatHistoryService.getMessages.mockResolvedValue({
        messages,
        total: 25,
        page: 1,
        limit: 10,
      });

      const result = await controller.getMessages(
        'chat-1',
        { page: 1, limit: 10 } as QueryMessagesDto,
        'user-1',
      );

      expect(result.meta.hasMore).toBe(true);
    });
  });
});
