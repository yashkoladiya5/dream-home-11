import { Test, TestingModule } from '@nestjs/testing';
import { PoolConfigService } from './pool-config.service';
import { ConfigService } from '@nestjs/config';

function mockConfigService(overrides: Record<string, any> = {}) {
  return {
    get: jest.fn(
      (key: string, defaultValue?: any) => overrides[key] ?? defaultValue,
    ),
  };
}

describe('PoolConfigService', () => {
  let service: PoolConfigService;

  const buildService = async (overrides: Record<string, any> = {}) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolConfigService,
        { provide: ConfigService, useValue: mockConfigService(overrides) },
      ],
    }).compile();
    return module.get<PoolConfigService>(PoolConfigService);
  };

  it('should be defined', async () => {
    service = await buildService();
    expect(service).toBeDefined();
  });

  describe('getExtra', () => {
    it('should return default pool config values', async () => {
      service = await buildService();
      const extra = service.getExtra();
      expect(extra.max).toBe(50);
      expect(extra.min).toBe(5);
      expect(extra.idleTimeoutMillis).toBe(30000);
      expect(extra.connectionTimeoutMillis).toBe(5000);
    });

    it('should use custom config values when provided', async () => {
      service = await buildService({
        DB_POOL_SIZE: 100,
        DB_POOL_MIN: 10,
        DB_IDLE_TIMEOUT: 60000,
        DB_ACQUIRE_TIMEOUT: 10000,
      });
      const extra = service.getExtra();
      expect(extra.max).toBe(100);
      expect(extra.min).toBe(10);
      expect(extra.idleTimeoutMillis).toBe(60000);
      expect(extra.connectionTimeoutMillis).toBe(10000);
    });

    it('should handle zero values for pool config', async () => {
      service = await buildService({ DB_POOL_SIZE: 0, DB_POOL_MIN: 0 });
      const extra = service.getExtra();
      expect(extra.max).toBe(0);
      expect(extra.min).toBe(0);
    });
  });

  describe('logPoolStatus', () => {
    it('should log pool status without throwing', async () => {
      service = await buildService();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      service.logPoolStatus(10, 5, 2);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[DB Pool] total: 10, idle: 5, waiting: 2',
      );
      consoleSpy.mockRestore();
    });
  });
});
