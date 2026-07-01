import { Test, TestingModule } from '@nestjs/testing';
import { ContestsGateway } from './contests.gateway';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserLevel } from '../users/entities/user.entity';

describe('ContestsGateway', () => {
  let gateway: ContestsGateway;
  let jwtService: jest.Mocked<JwtService>;
  let usersService: jest.Mocked<UsersService>;

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
        ContestsGateway,
        { provide: JwtService, useValue: { verify: jest.fn(), sign: jest.fn() } },
        { provide: UsersService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    gateway = module.get<ContestsGateway>(ContestsGateway);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);
    (gateway as any).server = mockServer;

    jest.clearAllMocks();
  });

  it('handleConnection — valid token should connect successfully', async () => {
    mockClient.handshake.auth.token = 'valid-token';
    jwtService.verify.mockReturnValue(validPayload);
    usersService.findById.mockResolvedValue(mockUser);

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).not.toHaveBeenCalled();
    expect(mockClient.data.userId).toBe('user-1');
  });

  it('handleConnection — no token should disconnect', async () => {
    mockClient.handshake.auth = {};
    mockClient.handshake.query = {};

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — invalid token should disconnect', async () => {
    mockClient.handshake.auth.token = 'bad-token';
    jwtService.verify.mockImplementation(() => { throw new Error('jwt error'); });

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — user not found should disconnect', async () => {
    mockClient.handshake.auth.token = 'valid-token';
    jwtService.verify.mockReturnValue(validPayload);
    usersService.findById.mockResolvedValue(null);

    await (gateway as any).handleConnection(mockClient);

    expect(mockClient.disconnect).toHaveBeenCalled();
  });

  it('handleConnection — inactive user should disconnect', async () => {
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

  it('handleJoinContestRoom', () => {
    mockClient.data.userId = 'user-1';
    gateway.handleJoinRoom(mockClient, { contestId: 'contest-1' });

    expect(mockClient.join).toHaveBeenCalledWith('contest:contest-1');
  });

  it('handleLeaveContestRoom', () => {
    gateway.handleLeaveRoom(mockClient, { contestId: 'contest-1' });

    expect(mockClient.leave).toHaveBeenCalledWith('contest:contest-1');
  });

  it('emitPointUpdate', () => {
    const data = {
      userId: 'user-1',
      points: 100,
      activity: 'quiz',
      description: 'Correct answer',
      timestamp: new Date(),
    };
    gateway.emitPointUpdate('contest-1', data);

    expect(mockServer.to).toHaveBeenCalledWith('contest:contest-1');
    expect(mockServer.emit).toHaveBeenCalledWith('contest.pointUpdate', {
      contestId: 'contest-1',
      ...data,
    });
  });

  it('emitLeaderboardUpdate', () => {
    const leaderboard = [{ userId: 'user-1', rank: 1, points: 500 }];
    gateway.emitLeaderboardUpdate('contest-1', leaderboard);

    expect(mockServer.to).toHaveBeenCalledWith('contest:contest-1');
    expect(mockServer.emit).toHaveBeenCalledWith('contest.leaderboardUpdate', {
      contestId: 'contest-1',
      leaderboard,
    });
  });
});
