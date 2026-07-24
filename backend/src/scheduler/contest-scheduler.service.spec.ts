/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ContestSchedulerService } from './contest-scheduler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contest, ContestStatus } from '../contests/entities/contest.entity';
import { ContestsService } from '../contests/contests.service';

describe('ContestSchedulerService', () => {
  let service: ContestSchedulerService;
  let mockContestRepository: any;
  let mockContestsService: any;

  const mockRepo = {
    find: jest.fn(),
  };

  const mockContestsServiceObj = {
    completeContest: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestSchedulerService,
        { provide: getRepositoryToken(Contest), useValue: mockRepo },
        { provide: ContestsService, useValue: mockContestsServiceObj },
      ],
    }).compile();

    service = module.get<ContestSchedulerService>(ContestSchedulerService);
    mockContestRepository = module.get(getRepositoryToken(Contest));
    mockContestsService = module.get(ContestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoCompleteContests', () => {
    it('should auto-complete expired running contests', async () => {
      const expiredContest = {
        id: 'contest-1',
        title: 'Expired Contest',
        status: ContestStatus.RUNNING,
        endTime: new Date(Date.now() - 1000),
      };
      mockRepo.find.mockResolvedValue([expiredContest]);
      mockContestsServiceObj.completeContest.mockResolvedValue({
        winners: [{ id: 'user-1' }],
      });

      await service.autoCompleteContests();
      expect(mockRepo.find).toHaveBeenCalled();
      expect(mockContestsServiceObj.completeContest).toHaveBeenCalledWith(
        'contest-1',
      );
    });

    it('should handle no expired contests gracefully', async () => {
      mockRepo.find.mockResolvedValue([]);

      await service.autoCompleteContests();
      expect(mockContestsServiceObj.completeContest).not.toHaveBeenCalled();
    });

    it('should process multiple expired contests', async () => {
      const contests = [
        {
          id: 'contest-1',
          title: 'C1',
          status: ContestStatus.RUNNING,
          endTime: new Date(Date.now() - 1000),
        },
        {
          id: 'contest-2',
          title: 'C2',
          status: ContestStatus.RUNNING,
          endTime: new Date(Date.now() - 2000),
        },
      ];
      mockRepo.find.mockResolvedValue(contests);
      mockContestsServiceObj.completeContest.mockResolvedValue({ winners: [] });

      await service.autoCompleteContests();
      expect(mockContestsServiceObj.completeContest).toHaveBeenCalledTimes(2);
      expect(mockContestsServiceObj.completeContest).toHaveBeenCalledWith(
        'contest-1',
      );
      expect(mockContestsServiceObj.completeContest).toHaveBeenCalledWith(
        'contest-2',
      );
    });

    it('should continue processing remaining contests even if one fails', async () => {
      const contests = [
        {
          id: 'contest-1',
          title: 'C1',
          status: ContestStatus.RUNNING,
          endTime: new Date(Date.now() - 1000),
        },
        {
          id: 'contest-2',
          title: 'C2',
          status: ContestStatus.RUNNING,
          endTime: new Date(Date.now() - 2000),
        },
      ];
      mockRepo.find.mockResolvedValue(contests);
      mockContestsServiceObj.completeContest
        .mockRejectedValueOnce(new Error('Failed to complete'))
        .mockResolvedValueOnce({ winners: [{ id: 'user-2' }] });

      await expect(service.autoCompleteContests()).resolves.not.toThrow();
      expect(mockContestsServiceObj.completeContest).toHaveBeenCalledTimes(2);
    });

    it('should only query contests with RUNNING status and past endTime', async () => {
      mockRepo.find.mockResolvedValue([]);

      await service.autoCompleteContests();
      const findWhere = mockRepo.find.mock.calls[0][0].where;
      expect(findWhere.status).toBe(ContestStatus.RUNNING);
      expect(findWhere.endTime).toBeDefined();
    });

    it('should limit to 50 contests per run', async () => {
      mockRepo.find.mockResolvedValue([]);

      await service.autoCompleteContests();
      expect(mockRepo.find.mock.calls[0][0].take).toBe(50);
    });
  });
});
