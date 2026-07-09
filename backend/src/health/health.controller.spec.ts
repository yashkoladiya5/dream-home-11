/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { getDataSourceToken } from '@nestjs/typeorm';
import { REDIS_CLIENT } from '../redis/redis.constants';

jest.useFakeTimers();

describe('HealthController', () => {
  let controller: HealthController;
  let mockDataSource: any;
  let mockRedis: any;

  beforeEach(async () => {
    mockDataSource = { query: jest.fn().mockResolvedValue([{ '1': 1 }]) };
    mockRedis = { ping: jest.fn().mockResolvedValue('PONG') };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getDataSourceToken(), useValue: mockDataSource },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.runAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status with timestamp and uptime', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('live', () => {
    it('should return ok status', () => {
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(result.duration_ms).toBe(0);
    });
  });

  describe('ready', () => {
    it('should return ok when all dependencies pass', async () => {
      const result = await controller.ready();
      expect(result.status).toBe('ok');
      expect(result.checks).toHaveLength(2);
      expect(result.checks[0].componentId).toBe('database');
      expect(result.checks[0].status).toBe('pass');
      expect(result.checks[1].componentId).toBe('redis');
      expect(result.checks[1].status).toBe('pass');
    });

    it('should return degraded when database fails', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Connection refused'));

      const result = await controller.ready();
      expect(result.status).toBe('degraded');
      expect(result.checks[0].status).toBe('fail');
      expect(result.checks[0].output).toContain('Connection refused');
      expect(result.checks[1].status).toBe('pass');
    });

    it('should return degraded when both fail', async () => {
      mockDataSource.query.mockRejectedValue(new Error('DB timeout'));
      mockRedis.ping.mockRejectedValue(new Error('Redis timeout'));

      const result = await controller.ready();
      expect(result.status).toBe('degraded');
      expect(result.checks.every((c: any) => c.status === 'fail')).toBe(true);
    });

    it('should handle database failure with fail status', async () => {
      mockDataSource.query.mockRejectedValue(new Error('Timeout exceeded'));

      const result = await controller.ready();
      expect(result.checks[0].status).toBe('fail');
      expect(result.checks[0].output).toContain('Timeout');
    });
  });

  describe('detailed', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it('should return detailed health info when valid key is provided', async () => {
      process.env.HEALTH_SECRET = 'secret-key';

      const result = await controller.detailed('secret-key');
      expect(result.status).toBe('ok');
      expect(result.version).toBeDefined();
      expect(result.checks.length).toBeGreaterThanOrEqual(4);
      expect(result.checks.some((c: any) => c.componentId === 'memory')).toBe(true);
      expect(result.checks.some((c: any) => c.componentId === 'disk')).toBe(true);
    });

    it('should throw Forbidden when health key is wrong', async () => {
      process.env.HEALTH_SECRET = 'secret-key';

      await expect(controller.detailed('wrong-key')).rejects.toThrow('Forbidden');
    });

    it('should allow access when HEALTH_SECRET is not set', async () => {
      delete process.env.HEALTH_SECRET;

      const result = await controller.detailed('any-key');
      expect(result.status).toBe('ok');
    });
  });
});
