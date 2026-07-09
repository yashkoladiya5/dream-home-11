/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ShareTrackerService, SHARE_POINTS } from './share-tracker.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Share } from './entities/share.entity';
import { PointsEngineService } from '../points/points-engine.service';

describe('ShareTrackerService', () => {
  let service: ShareTrackerService;
  let mockShareRepo: any;
  let mockPointsEngine: any;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockPointsEngineService = {
    logPointAction: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShareTrackerService,
        { provide: getRepositoryToken(Share), useValue: mockRepo },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
      ],
    }).compile();

    service = module.get<ShareTrackerService>(ShareTrackerService);
    mockShareRepo = module.get(getRepositoryToken(Share));
    mockPointsEngine = module.get(PointsEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logShare', () => {
    it('should create a share record and award points', async () => {
      const shareData = {
        userId: 'user-uuid',
        contestId: 'contest-uuid',
        shareChannel: 'whatsapp',
        status: 'sent',
        pointsAwarded: SHARE_POINTS,
        inviteCode: expect.any(String),
      };
      const savedShare = { id: 'share-uuid', ...shareData, sharedAt: new Date() };
      mockRepo.create.mockReturnValue({ ...shareData });
      mockRepo.save.mockResolvedValue(savedShare);

      const result = await service.logShare('user-uuid', 'contest-uuid', 'whatsapp');
      expect(result).toEqual(savedShare);
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-uuid',
        contestId: 'contest-uuid',
        shareChannel: 'whatsapp',
        pointsAwarded: SHARE_POINTS,
      }));
      expect(mockRepo.save).toHaveBeenCalled();
      expect(mockPointsEngine.logPointAction).toHaveBeenCalledWith(
        'user-uuid', 'share_contest', SHARE_POINTS, 1.0, SHARE_POINTS,
      );
    });

    it('should generate a unique invite code', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 'share-uuid', inviteCode: 'ABCD1234' });

      const result = await service.logShare('user-uuid', null, 'telegram');
      expect(result.inviteCode).toBeDefined();
      expect(result.inviteCode.length).toBeGreaterThanOrEqual(6);
    });

    it('should handle null contestId', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockResolvedValue({ id: 'share-uuid', contestId: null, inviteCode: 'CODE123' });

      const result = await service.logShare('user-uuid', null, 'copy_link');
      expect(result.contestId).toBeNull();
    });

    it('should propagate errors from repository', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.logShare('user-uuid', 'contest-uuid', 'whatsapp')).rejects.toThrow('Save failed');
    });
  });

  describe('getShareHistory', () => {
    it('should return share history ordered by sharedAt desc', async () => {
      const shares = [
        { id: 's1', userId: 'user-uuid', sharedAt: new Date('2026-07-09') },
        { id: 's2', userId: 'user-uuid', sharedAt: new Date('2026-07-08') },
      ];
      mockRepo.find.mockResolvedValue(shares);

      const result = await service.getShareHistory('user-uuid');
      expect(result).toEqual(shares);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        order: { sharedAt: 'DESC' },
      });
    });

    it('should return empty array when user has no shares', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getShareHistory('user-uuid');
      expect(result).toEqual([]);
    });
  });

  describe('getShareStats', () => {
    it('should return aggregated share stats', async () => {
      const shares = [
        { id: 's1', pointsAwarded: 50, inviteCode: 'CODE1', sharedAt: new Date() },
        { id: 's2', pointsAwarded: 50, inviteCode: 'CODE2', sharedAt: new Date(Date.now() - 86400000) },
      ];
      mockRepo.find.mockResolvedValue(shares);

      const result = await service.getShareStats('user-uuid');
      expect(result.totalShares).toBe(2);
      expect(result.totalPoints).toBe(100);
      expect(result.inviteCode).toBe('CODE1');
    });

    it('should return zeros when user has no shares', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getShareStats('user-uuid');
      expect(result.totalShares).toBe(0);
      expect(result.totalPoints).toBe(0);
      expect(result.inviteCode).toBeNull();
    });

    it('should return null inviteCode for single share with null inviteCode', async () => {
      const shares = [{ id: 's1', pointsAwarded: 50, inviteCode: null, sharedAt: new Date() }];
      mockRepo.find.mockResolvedValue(shares);

      const result = await service.getShareStats('user-uuid');
      expect(result.totalShares).toBe(1);
      expect(result.totalPoints).toBe(50);
      expect(result.inviteCode).toBeNull();
    });

    it('should handle many shares correctly', async () => {
      const shares = Array.from({ length: 100 }, (_, i) => ({
        id: `s${i}`,
        pointsAwarded: 50,
        inviteCode: `CODE${i}`,
        sharedAt: new Date(Date.now() - i * 86400000),
      }));
      mockRepo.find.mockResolvedValue(shares);

      const result = await service.getShareStats('user-uuid');
      expect(result.totalShares).toBe(100);
      expect(result.totalPoints).toBe(5000);
    });
  });
});
