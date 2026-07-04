import { Test, TestingModule } from '@nestjs/testing';
import {
  LeaderboardRedisService,
  LeaderboardEntry,
} from './leaderboard-redis.service';

describe('LeaderboardRedisService', () => {
  let service: LeaderboardRedisService;
  let mockRedis: Record<string, jest.Mock>;

  beforeEach(async () => {
    const mockData = new Map<string, Map<string, number>>();

    mockRedis = {
      zadd: jest
        .fn()
        .mockImplementation((key: string, score: number, member: string) => {
          if (!mockData.has(key)) mockData.set(key, new Map());
          mockData.get(key)!.set(member, score);
          return Promise.resolve(1);
        }),
      zincrby: jest
        .fn()
        .mockImplementation(
          (key: string, increment: number, member: string) => {
            if (!mockData.has(key)) mockData.set(key, new Map());
            const current = mockData.get(key)!.get(member) || 0;
            const newScore = current + increment;
            mockData.get(key)!.set(member, newScore);
            return Promise.resolve(newScore);
          },
        ),
      zrevrange: jest
        .fn()
        .mockImplementation(
          (key: string, start: number, end: number, withScores?: string) => {
            const members = mockData.get(key);
            if (!members) return Promise.resolve([]);
            const sorted = [...members.entries()]
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .slice(start, end + 1 >= 0 ? end + 1 : undefined);
            if (withScores === 'WITHSCORES') {
              const result: string[] = [];
              sorted.forEach(([member, score]) => {
                result.push(member, score.toString());
              });
              return Promise.resolve(result);
            }
            return Promise.resolve(sorted.map(([member]) => member));
          },
        ),
      zrevrank: jest.fn().mockImplementation((key: string, member: string) => {
        const members = mockData.get(key);
        if (!members || !members.has(member)) return Promise.resolve(null);
        const sorted = [...members.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
        );
        const idx = sorted.findIndex(([m]) => m === member);
        return Promise.resolve(idx >= 0 ? idx : null);
      }),
      zscore: jest.fn().mockImplementation((key: string, member: string) => {
        const members = mockData.get(key);
        if (!members || !members.has(member)) return Promise.resolve(null);
        return Promise.resolve(members.get(member)!.toString());
      }),
      zcard: jest.fn().mockImplementation((key: string) => {
        const members = mockData.get(key);
        return Promise.resolve(members ? members.size : 0);
      }),
      zrem: jest.fn().mockImplementation((key: string, member: string) => {
        const members = mockData.get(key);
        if (!members) return Promise.resolve(0);
        const deleted = members.delete(member);
        return Promise.resolve(deleted ? 1 : 0);
      }),
      del: jest.fn().mockImplementation((key: string) => {
        const existed = mockData.has(key);
        mockData.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      pipeline: jest.fn().mockReturnValue({
        zadd: jest
          .fn()
          .mockImplementation((key: string, score: number, member: string) => {
            if (!mockData.has(key)) mockData.set(key, new Map());
            mockData.get(key)!.set(member, score);
          }),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<LeaderboardRedisService>(LeaderboardRedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sorted set operations', () => {
    it('should add scores', async () => {
      await service.addScore('test:lb', 'user-1', 100);
      expect(mockRedis.zadd).toHaveBeenCalledWith('test:lb', 100, 'user-1');
    });

    it('should increment scores', async () => {
      await service.addScore('test:lb', 'user-1', 100);
      const result = await service.incrementScore('test:lb', 'user-1', 50);
      expect(result).toBe(150);
    });
  });

  describe('getTopUsers', () => {
    beforeEach(async () => {
      await service.batchSetScores('test:lb', [
        { userId: 'user-1', score: 100 },
        { userId: 'user-2', score: 200 },
        { userId: 'user-3', score: 50 },
      ]);
    });

    it('should return top users in descending order', async () => {
      const top = await service.getTopUsers('test:lb', 1, 10);
      expect(top).toHaveLength(3);
      expect(top[0].userId).toBe('user-2');
      expect(top[0].score).toBe(200);
      expect(top[0].rank).toBe(1);
      expect(top[1].userId).toBe('user-1');
      expect(top[1].score).toBe(100);
      expect(top[1].rank).toBe(2);
      expect(top[2].userId).toBe('user-3');
      expect(top[2].score).toBe(50);
      expect(top[2].rank).toBe(3);
    });

    it('should paginate correctly', async () => {
      const page1 = await service.getTopUsers('test:lb', 1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].userId).toBe('user-2');
      expect(page1[1].userId).toBe('user-1');

      const page2 = await service.getTopUsers('test:lb', 2, 2);
      expect(page2).toHaveLength(1);
      expect(page2[0].userId).toBe('user-3');
    });
  });

  describe('getUserRank', () => {
    beforeEach(async () => {
      await service.batchSetScores('test:lb', [
        { userId: 'user-1', score: 100 },
        { userId: 'user-2', score: 200 },
        { userId: 'user-3', score: 50 },
      ]);
    });

    it('should return 1-based rank', async () => {
      const rank = await service.getUserRank('test:lb', 'user-2');
      expect(rank).toBe(1);
    });

    it('should return rank 2 for second place', async () => {
      const rank = await service.getUserRank('test:lb', 'user-1');
      expect(rank).toBe(2);
    });

    it('should return null for non-existent user', async () => {
      const rank = await service.getUserRank('test:lb', 'nonexistent');
      expect(rank).toBeNull();
    });
  });

  describe('getTotalCount', () => {
    it('should return total member count', async () => {
      await service.batchSetScores('test:lb', [
        { userId: 'user-1', score: 100 },
        { userId: 'user-2', score: 200 },
      ]);
      const count = await service.getTotalCount('test:lb');
      expect(count).toBe(2);
    });

    it('should return 0 for empty leaderboard', async () => {
      const count = await service.getTotalCount('empty:lb');
      expect(count).toBe(0);
    });
  });

  describe('getTopWithUserRank', () => {
    beforeEach(async () => {
      await service.batchSetScores('test:lb', [
        { userId: 'user-1', score: 100 },
        { userId: 'user-2', score: 200 },
        { userId: 'user-3', score: 50 },
      ]);
    });

    it('should return entries, user rank, and total count', async () => {
      const result = await service.getTopWithUserRank(
        'test:lb',
        'user-1',
        1,
        10,
      );
      expect(result.entries).toHaveLength(3);
      expect(result.userRank).not.toBeNull();
      expect(result.userRank!.rank).toBe(2);
      expect(result.totalCount).toBe(3);
    });

    it('should return null userRank for non-member', async () => {
      const result = await service.getTopWithUserRank(
        'test:lb',
        'nonexistent',
        1,
        10,
      );
      expect(result.userRank).toBeNull();
      expect(result.totalCount).toBe(3);
    });
  });

  describe('remove operations', () => {
    it('should remove a user', async () => {
      await service.addScore('test:lb', 'user-1', 100);
      await service.removeUser('test:lb', 'user-1');
      const count = await service.getTotalCount('test:lb');
      expect(count).toBe(0);
    });

    it('should remove entire leaderboard', async () => {
      await service.addScore('test:lb', 'user-1', 100);
      await service.removeLeaderboard('test:lb');
      const count = await service.getTotalCount('test:lb');
      expect(count).toBe(0);
    });
  });

  describe('key helpers', () => {
    it('should generate contest key', () => {
      const key = service.getContestKey('abc-123');
      expect(key).toBe('leaderboard:contest:abc-123');
    });

    it('should return correct cycle keys', () => {
      expect(service.getCycleKey('all_time')).toBe('leaderboard:global');
      expect(service.getCycleKey('weekly')).toBe('leaderboard:global:weekly');
      expect(service.getCycleKey('monthly')).toBe('leaderboard:global:monthly');
      expect(service.getCycleKey('unknown')).toBe('leaderboard:global');
    });

    it('static getCycleKey should work without instance', () => {
      expect(LeaderboardRedisService.getStaticCycleKey('weekly')).toBe(
        'leaderboard:global:weekly',
      );
      expect(LeaderboardRedisService.getStaticCycleKey('monthly')).toBe(
        'leaderboard:global:monthly',
      );
      expect(LeaderboardRedisService.getStaticCycleKey('all_time')).toBe(
        'leaderboard:global',
      );
    });
  });

  describe('batchSetScores', () => {
    it('should batch set multiple scores', async () => {
      await service.batchSetScores('test:lb', [
        { userId: 'user-1', score: 100 },
        { userId: 'user-2', score: 200 },
      ]);
      const count = await service.getTotalCount('test:lb');
      expect(count).toBe(2);
    });

    it('should handle empty batch', async () => {
      await service.batchSetScores('test:lb', []);
      const count = await service.getTotalCount('test:lb');
      expect(count).toBe(0);
    });
  });
});
