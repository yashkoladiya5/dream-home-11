import { Test, TestingModule } from '@nestjs/testing';
import { RedisThrottlerStorageService } from './redis-throttler-storage.service';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

describe('RedisThrottlerStorageService', () => {
  let service: RedisThrottlerStorageService;
  let mockRedis: Partial<Redis>;

  beforeEach(async () => {
    mockRedis = {
      status: 'ready',
      get: jest.fn(),
      set: jest.fn(),
      ttl: jest.fn(),
      pexpire: jest.fn(),
      multi: jest.fn().mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        pttl: jest.fn().mockReturnThis(),
        exec: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisThrottlerStorageService,
        {
          provide: REDIS_CLIENT,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisThrottlerStorageService>(
      RedisThrottlerStorageService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('increment', () => {
    it('should use fallback increment when Redis is not ready', async () => {
      mockRedis.status = 'close';
      const result = await service.increment(
        'test-key',
        60000,
        5,
        10000,
        'default',
      );
      expect(result.totalHits).toBe(1);
      expect(result.isBlocked).toBe(false);
      expect(result.timeToBlockExpire).toBe(0);
    });

    it('should return isBlocked true if key is already blocked in Redis', async () => {
      mockRedis.status = 'ready';
      (mockRedis.get as jest.Mock).mockResolvedValue('1');
      (mockRedis.ttl as jest.Mock).mockResolvedValue(5); // 5 seconds remaining

      const result = await service.increment(
        'test-key',
        60000,
        5,
        10000,
        'default',
      );
      expect(result.totalHits).toBe(6);
      expect(result.isBlocked).toBe(true);
      expect(result.timeToExpire).toBe(5000);
      expect(result.timeToBlockExpire).toBe(5000);
      expect(mockRedis.get).toHaveBeenCalledWith(
        'throttler:block:default:test-key',
      );
    });

    it('should increment hits and return totalHits when limit is not exceeded', async () => {
      mockRedis.status = 'ready';
      (mockRedis.get as jest.Mock).mockResolvedValue(null);

      const mockExec = jest.fn().mockResolvedValue([
        [null, 3], // totalHits
        [null, 45000], // remaining ttl in ms
      ]);
      (mockRedis.multi as jest.Mock).mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        pttl: jest.fn().mockReturnThis(),
        exec: mockExec,
      });

      const result = await service.increment(
        'test-key',
        60000,
        5,
        10000,
        'default',
      );
      expect(result.totalHits).toBe(3);
      expect(result.isBlocked).toBe(false);
      expect(result.timeToExpire).toBe(45000);
      expect(result.timeToBlockExpire).toBe(0);
    });

    it('should block and return isBlocked true if increment exceeds limit', async () => {
      mockRedis.status = 'ready';
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockRedis.set as jest.Mock).mockResolvedValue('OK');

      const mockExec = jest.fn().mockResolvedValue([
        [null, 6], // totalHits (exceeds limit 5)
        [null, 58000],
      ]);
      (mockRedis.multi as jest.Mock).mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        pttl: jest.fn().mockReturnThis(),
        exec: mockExec,
      });

      const result = await service.increment(
        'test-key',
        60000,
        5,
        10000,
        'default',
      );
      expect(result.totalHits).toBe(6);
      expect(result.isBlocked).toBe(true);
      expect(result.timeToExpire).toBe(10000); // blockDuration
      expect(result.timeToBlockExpire).toBe(10000);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttler:block:default:test-key',
        '1',
        'PX',
        10000,
      );
    });
  });
});
