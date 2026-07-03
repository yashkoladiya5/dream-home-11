import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PollsService } from './polls.service';
import { Poll } from './entities/poll.entity';
import { PollVote } from './entities/poll-vote.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { PointsEngineService } from '../points/points-engine.service';
import { TransactionsService } from '../transactions/transactions.service';

describe('PollsService', () => {
  let service: PollsService;

  const mockPollRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockVoteRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockPointsEngineService = {
    logPointAction: jest.fn(),
  };

  const mockTransactionsService = {
    logTransaction: jest.fn(),
  };

  const now = new Date();
  const mockPoll: Poll = {
    id: 'poll-1',
    question: 'Test question?',
    options: ['Option A', 'Option B', 'Option C'],
    totalVotes: 0,
    activeFrom: new Date(now.getTime() - 86400000),
    activeTo: new Date(now.getTime() + 86400000),
    isActive: true,
    createdAt: now,
  };

  const mockUser = {
    id: 'user-1',
    phoneNumber: '+1234567890',
    deviceId: 'device-1',
    currentTier: UserLevel.BRONZE,
    lifetimePoints: 500,
    pointsBalance: 200,
    walletBalanceInr: 0,
    isActive: true,
    createdAt: now,
  } as unknown as User;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PollsService,
        { provide: getRepositoryToken(Poll), useValue: mockPollRepo },
        { provide: getRepositoryToken(PollVote), useValue: mockVoteRepo },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    service = module.get<PollsService>(PollsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActivePoll', () => {
    it('should return the active poll when one exists', async () => {
      mockPollRepo.findOne.mockResolvedValue(mockPoll);

      const result = await service.getActivePoll();

      expect(result).toEqual(mockPoll);
      expect(mockPollRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should return null when no active poll exists', async () => {
      mockPollRepo.findOne.mockResolvedValue(null);

      const result = await service.getActivePoll();

      expect(result).toBeNull();
    });
  });

  describe('getUserVote', () => {
    it('should return the user vote when it exists', async () => {
      mockVoteRepo.findOne.mockResolvedValue({
        selectedOption: 1,
        userId: 'user-1',
        pollId: 'poll-1',
      });

      const result = await service.getUserVote('user-1', 'poll-1');

      expect(result).toEqual({ selectedOption: 1 });
    });

    it('should return null when no vote exists', async () => {
      mockVoteRepo.findOne.mockResolvedValue(null);

      const result = await service.getUserVote('user-1', 'poll-1');

      expect(result).toBeNull();
    });

    it('should return null when userId is missing', async () => {
      const result = await service.getUserVote('', 'poll-1');

      expect(result).toBeNull();
    });
  });

  describe('getPollResults', () => {
    it('should return correct percentages for poll results', async () => {
      mockPollRepo.findOne.mockResolvedValue(mockPoll);
      mockVoteRepo.find.mockResolvedValue([
        { selectedOption: 0, userId: 'u1', pollId: 'poll-1' },
        { selectedOption: 0, userId: 'u2', pollId: 'poll-1' },
        { selectedOption: 1, userId: 'u3', pollId: 'poll-1' },
        { selectedOption: 1, userId: 'u4', pollId: 'poll-1' },
        { selectedOption: 2, userId: 'u5', pollId: 'poll-1' },
      ]);

      const result = await service.getPollResults('poll-1');

      expect(result.poll).toEqual(mockPoll);
      expect(result.totalVotes).toBe(5);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        option: 'Option A',
        count: 2,
        percentage: 40,
      });
      expect(result.results[1]).toEqual({
        option: 'Option B',
        count: 2,
        percentage: 40,
      });
      expect(result.results[2]).toEqual({
        option: 'Option C',
        count: 1,
        percentage: 20,
      });
    });

    it('should throw NotFoundException when poll does not exist', async () => {
      mockPollRepo.findOne.mockResolvedValue(null);

      await expect(service.getPollResults('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('vote', () => {
    it('should succeed and award +20 points', async () => {
      mockPollRepo.findOne.mockResolvedValue({ ...mockPoll, totalVotes: 0 });
      mockUsersService.findById.mockResolvedValue({ ...mockUser });
      mockVoteRepo.findOne.mockResolvedValue(null);
      mockVoteRepo.create.mockReturnValue({
        userId: 'user-1',
        pollId: 'poll-1',
        selectedOption: 1,
      });
      mockVoteRepo.save.mockResolvedValue({});
      mockPollRepo.save.mockResolvedValue({});
      mockUsersService.updateUser.mockResolvedValue({});
      mockPointsEngineService.logPointAction.mockResolvedValue(undefined);
      mockTransactionsService.logTransaction.mockResolvedValue({});
      mockVoteRepo.find.mockResolvedValue([
        { selectedOption: 1, userId: 'u1', pollId: 'poll-1' },
      ]);

      const result = await service.vote('user-1', 'poll-1', 1);

      expect(result.success).toBe(true);
      expect(result.pointsAwarded).toBe(20);
      expect(result.message).toContain('20 points');
      expect(result.userVote).toEqual({ selectedOption: 1 });
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({ pointsBalance: 220, lifetimePoints: 520 }),
      );
      expect(mockPointsEngineService.logPointAction).toHaveBeenCalledWith(
        'user-1',
        'daily_poll_vote',
        20,
        1.0,
        20,
      );
      expect(mockTransactionsService.logTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'points_earned',
          pointsAmount: 20,
          referenceType: 'poll_vote',
        }),
      );
    });

    it('should throw BadRequestException when poll is not active', async () => {
      const expiredPoll = {
        ...mockPoll,
        activeFrom: new Date(now.getTime() - 172800000),
        activeTo: new Date(now.getTime() - 86400000),
      };
      mockPollRepo.findOne.mockResolvedValue(expiredPoll);

      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        'not currently active',
      );
    });

    it('should throw BadRequestException when invalid option selected', async () => {
      mockPollRepo.findOne.mockResolvedValue(mockPoll);

      await expect(service.vote('user-1', 'poll-1', 5)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote('user-1', 'poll-1', -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when already voted', async () => {
      mockPollRepo.findOne.mockResolvedValue(mockPoll);
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockVoteRepo.findOne.mockResolvedValue({
        selectedOption: 1,
        userId: 'user-1',
        pollId: 'poll-1',
      });

      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        'already voted',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPollRepo.findOne.mockResolvedValue(mockPoll);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.vote('user-1', 'poll-1', 1)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
