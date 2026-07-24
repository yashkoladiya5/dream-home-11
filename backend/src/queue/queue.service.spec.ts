import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUES } from './queue.constants';

describe('QueueService', () => {
  let service: QueueService;

  const mockQueue = {
    add: jest.fn(),
    addBulk: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
  };

  const mockQueues = {
    [QUEUES.OTP_SMS]: { ...mockQueue },
    [QUEUES.PUSH_NOTIFICATIONS]: { ...mockQueue },
    [QUEUES.EMAIL]: { ...mockQueue },
    [QUEUES.PRIZE_DISTRIBUTION]: { ...mockQueue },
    [QUEUES.SETTLEMENT]: { ...mockQueue },
    [QUEUES.REMINDERS]: { ...mockQueue },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getQueueToken(QUEUES.OTP_SMS),
          useValue: mockQueues[QUEUES.OTP_SMS],
        },
        {
          provide: getQueueToken(QUEUES.PUSH_NOTIFICATIONS),
          useValue: mockQueues[QUEUES.PUSH_NOTIFICATIONS],
        },
        {
          provide: getQueueToken(QUEUES.EMAIL),
          useValue: mockQueues[QUEUES.EMAIL],
        },
        {
          provide: getQueueToken(QUEUES.PRIZE_DISTRIBUTION),
          useValue: mockQueues[QUEUES.PRIZE_DISTRIBUTION],
        },
        {
          provide: getQueueToken(QUEUES.SETTLEMENT),
          useValue: mockQueues[QUEUES.SETTLEMENT],
        },
        {
          provide: getQueueToken(QUEUES.REMINDERS),
          useValue: mockQueues[QUEUES.REMINDERS],
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('should add a job to the specified queue and return its id', async () => {
      mockQueues[QUEUES.OTP_SMS].add.mockResolvedValue({ id: 'job-123' });

      const jobId = await service.add(QUEUES.OTP_SMS, {
        phone: '+919999999999',
      });
      expect(jobId).toBe('job-123');
      expect(mockQueues[QUEUES.OTP_SMS].add).toHaveBeenCalledWith(
        QUEUES.OTP_SMS,
        { phone: '+919999999999' },
        { delay: undefined, priority: undefined, jobId: undefined },
      );
    });

    it('should pass options to the queue add call', async () => {
      mockQueues[QUEUES.EMAIL].add.mockResolvedValue({ id: 'job-456' });

      await service.add(
        QUEUES.EMAIL,
        { to: 'user@test.com' },
        { delay: 5000, priority: 1, jobId: 'custom-id' },
      );
      expect(mockQueues[QUEUES.EMAIL].add).toHaveBeenCalledWith(
        QUEUES.EMAIL,
        { to: 'user@test.com' },
        { delay: 5000, priority: 1, jobId: 'custom-id' },
      );
    });

    it('should return empty string when job id is falsy', async () => {
      mockQueues[QUEUES.REMINDERS].add.mockResolvedValue({ id: null });

      const jobId = await service.add(QUEUES.REMINDERS, {});
      expect(jobId).toBe('');
    });

    it('should handle errors from queue add', async () => {
      mockQueues[QUEUES.SETTLEMENT].add.mockRejectedValue(
        new Error('Queue unavailable'),
      );

      await expect(service.add(QUEUES.SETTLEMENT, {})).rejects.toThrow(
        'Queue unavailable',
      );
    });
  });

  describe('addBulk', () => {
    it('should add multiple jobs to the specified queue', async () => {
      mockQueues[QUEUES.PUSH_NOTIFICATIONS].addBulk.mockResolvedValue(
        undefined,
      );

      const items = [
        { data: { userId: '1', message: 'Hello' } },
        { data: { userId: '2', message: 'World' }, options: { delay: 1000 } },
      ];
      await service.addBulk(QUEUES.PUSH_NOTIFICATIONS, items);
      expect(
        mockQueues[QUEUES.PUSH_NOTIFICATIONS].addBulk,
      ).toHaveBeenCalledWith(
        items.map((item) => ({
          name: QUEUES.PUSH_NOTIFICATIONS,
          data: item.data,
          opts: item.options,
        })),
      );
    });

    it('should handle empty items array', async () => {
      mockQueues[QUEUES.EMAIL].addBulk.mockResolvedValue(undefined);

      await service.addBulk(QUEUES.EMAIL, []);
      expect(mockQueues[QUEUES.EMAIL].addBulk).toHaveBeenCalledWith([]);
    });
  });

  describe('getQueueStatus', () => {
    it('should return queue status counts', async () => {
      mockQueues[QUEUES.OTP_SMS].getWaitingCount.mockResolvedValue(5);
      mockQueues[QUEUES.OTP_SMS].getActiveCount.mockResolvedValue(2);
      mockQueues[QUEUES.OTP_SMS].getCompletedCount.mockResolvedValue(100);
      mockQueues[QUEUES.OTP_SMS].getFailedCount.mockResolvedValue(3);
      mockQueues[QUEUES.OTP_SMS].getDelayedCount.mockResolvedValue(1);

      const status = await service.getQueueStatus(QUEUES.OTP_SMS);
      expect(status).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });

    it('should return zero counts when queue is empty', async () => {
      mockQueues[QUEUES.EMAIL].getWaitingCount.mockResolvedValue(0);
      mockQueues[QUEUES.EMAIL].getActiveCount.mockResolvedValue(0);
      mockQueues[QUEUES.EMAIL].getCompletedCount.mockResolvedValue(0);
      mockQueues[QUEUES.EMAIL].getFailedCount.mockResolvedValue(0);
      mockQueues[QUEUES.EMAIL].getDelayedCount.mockResolvedValue(0);

      const status = await service.getQueueStatus(QUEUES.EMAIL);
      expect(status).toEqual({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      });
    });
  });

  describe('getQueueMetrics', () => {
    it('should return queue metrics with failure rate', async () => {
      mockQueues[QUEUES.PRIZE_DISTRIBUTION].getCompletedCount.mockResolvedValue(
        80,
      );
      mockQueues[QUEUES.PRIZE_DISTRIBUTION].getFailedCount.mockResolvedValue(
        20,
      );

      const metrics = await service.getQueueMetrics(QUEUES.PRIZE_DISTRIBUTION);
      expect(metrics.failureRate).toBe(20);
      expect(metrics.jobsPerMinute).toBe(0);
      expect(metrics.avgProcessTime).toBe(0);
    });

    it('should return 0 failure rate when no jobs exist', async () => {
      mockQueues[QUEUES.REMINDERS].getCompletedCount.mockResolvedValue(0);
      mockQueues[QUEUES.REMINDERS].getFailedCount.mockResolvedValue(0);

      const metrics = await service.getQueueMetrics(QUEUES.REMINDERS);
      expect(metrics.failureRate).toBe(0);
    });

    it('should return 0 failure rate when no jobs completed or failed', async () => {
      mockQueues[QUEUES.OTP_SMS].getCompletedCount.mockResolvedValue(0);
      mockQueues[QUEUES.OTP_SMS].getFailedCount.mockResolvedValue(0);

      const metrics = await service.getQueueMetrics(QUEUES.OTP_SMS);
      expect(metrics.failureRate).toBe(0);
    });
  });
});
