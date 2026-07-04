import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ChatHistoryService } from './chat-history.service';
import { User, UserLevel } from '../users/entities/user.entity';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

  const mockChatHistoryService = {
    saveMessage: jest
      .fn()
      .mockImplementation(({ chatId, senderId, content, type }) =>
        Promise.resolve({
          id: 'msg-1',
          chatId,
          senderId,
          content,
          type: type || 'text',
          createdAt: new Date(),
          isRead: false,
        }),
      ),
  };

  const mockClient = {
    handshake: { auth: {}, query: {} },
    data: {} as any,
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  const mockUser = {
    id: 'user-1',
    phoneNumber: '+1234567890',
    deviceId: 'device-1',
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 500,
    pointsBalance: 200,
    walletBalanceInr: 0,
    isActive: true,
    currentStreak: 0,
    longestStreak: 0,
    lastStreakDate: null,
    weeklyPoints: 0,
    monthlyPoints: 0,
    email: '',
    fullName: 'Test User',
    avatarUrl: '',
    state: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    upiId: '',
    referralCode: '',
    referredBy: '',
    fcmToken: '',
    createdAt: new Date(),
  } as unknown as User;

  const validPayload = { sub: 'user-1', phoneNumber: '+1234567890' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: JwtService,
          useValue: { verify: jest.fn(), sign: jest.fn() },
        },
        { provide: UsersService, useValue: { findById: jest.fn() } },
        { provide: ChatHistoryService, useValue: mockChatHistoryService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    (gateway as any).server = mockServer;

    jest.clearAllMocks();
  });

  it('handleConnection — valid token', async () => {
    mockClient.handshake.auth.token = 'valid-token';
    jwtService.verify.mockReturnValue(validPayload);
    usersService.findById.mockResolvedValue(mockUser);

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).not.toHaveBeenCalled();
    expect(mockClient.data.userId).toBe('user-1');
    expect(mockClient.join).toHaveBeenCalledWith('user:user-1');
  });

  it('handleConnection — no token', async () => {
    mockClient.handshake.auth = {};

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — invalid token', async () => {
    mockClient.handshake.auth.token = 'bad-token';
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt error');
    });

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — user not found', async () => {
    mockClient.handshake.auth.token = 'valid-token';
    jwtService.verify.mockReturnValue(validPayload);
    usersService.findById.mockResolvedValue(null);

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — inactive user', async () => {
    mockClient.handshake.auth.token = 'valid-token';
    jwtService.verify.mockReturnValue(validPayload);
    const inactiveUser = { ...mockUser, isActive: false };
    usersService.findById.mockResolvedValue(inactiveUser);

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleDisconnect should not throw', () => {
    expect(() => (gateway as any).handleDisconnect(mockClient)).not.toThrow();
  });

  it('handleJoinChat', () => {
    mockClient.data.userId = 'user-1';
    gateway.handleJoinChat(mockClient, { chatId: 'chat-1' });

    expect(mockClient.join).toHaveBeenCalledWith('chat:chat-1');
  });

  it('handleLeaveChat', () => {
    gateway.handleLeaveChat(mockClient, { chatId: 'chat-1' });

    expect(mockClient.leave).toHaveBeenCalledWith('chat:chat-1');
  });

  it('handleSendMessage', async () => {
    mockClient.data.userId = 'user-1';
    await gateway.handleSendMessage(mockClient, {
      chatId: 'chat-1',
      content: 'Hello',
      type: 'text',
    });

    expect(mockServer.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockServer.emit).toHaveBeenCalledWith(
      'newMessage',
      expect.objectContaining({
        chatId: 'chat-1',
        senderId: 'user-1',
        content: 'Hello',
      }),
    );
  });

  it('handleSendMessage — no userId', async () => {
    mockClient.data = {};
    await gateway.handleSendMessage(mockClient, {
      chatId: 'chat-1',
      content: 'Hi',
    });

    expect(mockServer.to).not.toHaveBeenCalled();
    expect(mockServer.emit).not.toHaveBeenCalled();
  });

  it('handleTyping', () => {
    mockClient.data.userId = 'user-1';
    gateway.handleTyping(mockClient, { chatId: 'chat-1', isTyping: true });

    expect(mockClient.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockClient.emit).toHaveBeenCalledWith('userTyping', {
      userId: 'user-1',
      chatId: 'chat-1',
      isTyping: true,
    });
  });

  it('handleMarkRead', () => {
    mockClient.data.userId = 'user-1';
    gateway.handleMarkRead(mockClient, {
      chatId: 'chat-1',
      messageId: 'msg-1',
    });

    expect(mockServer.to).toHaveBeenCalledWith('chat:chat-1');
    expect(mockServer.emit).toHaveBeenCalledWith('messageRead', {
      userId: 'user-1',
      chatId: 'chat-1',
      messageId: 'msg-1',
    });
  });
});
