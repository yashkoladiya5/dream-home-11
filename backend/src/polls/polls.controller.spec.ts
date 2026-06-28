import { Test, TestingModule } from '@nestjs/testing';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('PollsController', () => {
  let controller: PollsController;
  let pollsService: PollsService;

  const mockPollsService = {
    getActivePoll: jest.fn(),
    getUserVote: jest.fn(),
    getPollResults: jest.fn(),
    vote: jest.fn(),
  };

  const mockRequest = {
    user: { id: 'user-uuid-12345' },
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PollsController],
      providers: [
        {
          provide: PollsService,
          useValue: mockPollsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PollsController>(PollsController);
    pollsService = module.get<PollsService>(PollsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', PollsController);
    expect(guards).toBeDefined();
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  describe('GET /api/v1/polls/active', () => {
    it('should return poll and userVote when active poll exists', async () => {
      const mockPoll = {
        id: 'poll-1',
        question: 'Test question?',
        options: ['A', 'B', 'C'],
      };
      const mockUserVote = { selectedOption: 1 };

      mockPollsService.getActivePoll.mockResolvedValue(mockPoll);
      mockPollsService.getUserVote.mockResolvedValue(mockUserVote);

      const result = await controller.getActivePoll(mockRequest);

      expect(result).toEqual({ poll: mockPoll, userVote: mockUserVote });
      expect(mockPollsService.getActivePoll).toHaveBeenCalledTimes(1);
      expect(mockPollsService.getUserVote).toHaveBeenCalledWith('user-uuid-12345', 'poll-1');
    });

    it('should return message when no active poll exists', async () => {
      mockPollsService.getActivePoll.mockResolvedValue(null);

      const result = await controller.getActivePoll(mockRequest);

      expect(result).toEqual({ message: 'No active poll available' });
      expect(mockPollsService.getUserVote).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/polls/vote', () => {
    it('should call pollsService.vote with correct params and return result', async () => {
      const voteResult = {
        success: true,
        message: 'Vote recorded! You earned 20 points.',
        pointsAwarded: 20,
        results: [
          { option: 'A', count: 1, percentage: 100 },
          { option: 'B', count: 0, percentage: 0 },
          { option: 'C', count: 0, percentage: 0 },
        ],
        userVote: { selectedOption: 0 },
        totalVotes: 1,
      };

      mockPollsService.vote.mockResolvedValue(voteResult);

      const result = await controller.vote(mockRequest, 'poll-1', 0);

      expect(result).toEqual(voteResult);
      expect(mockPollsService.vote).toHaveBeenCalledWith('user-uuid-12345', 'poll-1', 0);
    });
  });

  describe('GET /api/v1/polls/:id/results', () => {
    it('should return poll results with user vote', async () => {
      const resultsData = {
        poll: { id: 'poll-1', question: 'Test?' },
        results: [
          { option: 'A', count: 3, percentage: 60 },
          { option: 'B', count: 2, percentage: 40 },
        ],
        totalVotes: 5,
      };
      const userVote = { selectedOption: 0 };

      mockPollsService.getUserVote.mockResolvedValue(userVote);
      mockPollsService.getPollResults.mockResolvedValue(resultsData);

      const result = await controller.getResults('poll-1', mockRequest);

      expect(result).toEqual({ ...resultsData, userVote });
      expect(mockPollsService.getUserVote).toHaveBeenCalledWith('user-uuid-12345', 'poll-1');
      expect(mockPollsService.getPollResults).toHaveBeenCalledWith('poll-1');
    });
  });
});
