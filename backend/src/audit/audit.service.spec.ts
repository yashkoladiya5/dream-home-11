/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  let mockRepo: any;

  const mockAuditLogRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepo },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    mockRepo = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log entry with adminId', async () => {
      const params = {
        adminId: 'admin-uuid',
        action: AuditAction.UPDATE_USER,
        targetId: 'target-uuid',
        targetType: 'user',
        metadata: { field: 'name' },
        ipAddress: '127.0.0.1',
      };
      const createdLog = { id: 'log-uuid', ...params, admin: undefined };
      mockAuditLogRepo.create.mockReturnValue(createdLog);
      mockAuditLogRepo.save.mockResolvedValue(createdLog);

      const result = await service.log(params);
      expect(result).toEqual(createdLog);
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(params);
      expect(mockAuditLogRepo.save).toHaveBeenCalledWith(createdLog);
    });

    it('should create and save an audit log with userId', async () => {
      const params = {
        userId: 'user-uuid',
        action: AuditAction.PROFILE_UPDATED,
      };
      const createdLog = { id: 'log-uuid', ...params };
      mockAuditLogRepo.create.mockReturnValue(createdLog);
      mockAuditLogRepo.save.mockResolvedValue(createdLog);

      const result = await service.log(params);
      expect(result).toEqual(createdLog);
    });

    it('should handle minimal log params', async () => {
      const params = { action: AuditAction.POINTS_EARNED };
      const createdLog = { id: 'log-uuid', ...params };
      mockAuditLogRepo.create.mockReturnValue(createdLog);
      mockAuditLogRepo.save.mockResolvedValue(createdLog);

      const result = await service.log(params);
      expect(result.id).toBe('log-uuid');
      expect(result.action).toBe(AuditAction.POINTS_EARNED);
    });

    it('should propagate repository save errors', async () => {
      mockAuditLogRepo.create.mockReturnValue({ action: AuditAction.POINTS_EARNED });
      mockAuditLogRepo.save.mockRejectedValue(new Error('DB error'));

      await expect(service.log({ action: AuditAction.POINTS_EARNED })).rejects.toThrow('DB error');
    });
  });

  describe('getLogs', () => {
    const baseLog = {
      id: 'log-uuid',
      userId: null,
      adminId: 'admin-uuid',
      admin: { fullName: 'Admin User', phoneNumber: '+919999999999' },
      action: AuditAction.UPDATE_USER,
      targetId: 'target-uuid',
      targetType: 'user',
      metadata: null,
      ipAddress: '127.0.0.1',
      createdAt: new Date('2026-01-01'),
    };

    it('should return paginated logs with default pagination', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[baseLog], 1]);

      const result = await service.getLogs({});
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply action filter when provided', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[baseLog], 1]);

      await service.getLogs({ action: AuditAction.UPDATE_USER });
      const callWhere = mockAuditLogRepo.findAndCount.mock.calls[0][0].where;
      expect(callWhere.action).toBe(AuditAction.UPDATE_USER);
    });

    it('should apply adminId filter when provided', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getLogs({ adminId: 'admin-uuid' });
      const callWhere = mockAuditLogRepo.findAndCount.mock.calls[0][0].where;
      expect(callWhere.adminId).toBe('admin-uuid');
    });

    it('should apply userId filter when provided', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getLogs({ userId: 'user-uuid' });
      const callWhere = mockAuditLogRepo.findAndCount.mock.calls[0][0].where;
      expect(callWhere.userId).toBe('user-uuid');
    });

    it('should cap limit at 100', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getLogs({ limit: 500 });
      const callTake = mockAuditLogRepo.findAndCount.mock.calls[0][0].take;
      expect(callTake).toBe(100);
    });

    it('should return empty logs array when no results', async () => {
      mockAuditLogRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getLogs({});
      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should map admin name from admin relation', async () => {
      const logWithAdmin = {
        ...baseLog,
        admin: { fullName: 'Admin User', phoneNumber: '+919999999999' },
      };
      mockAuditLogRepo.findAndCount.mockResolvedValue([[logWithAdmin], 1]);

      const result = await service.getLogs({});
      expect(result.logs[0].adminName).toBe('Admin User');
    });

    it('should fallback to phoneNumber when admin fullName is null', async () => {
      const logNoName = {
        ...baseLog,
        admin: { fullName: null, phoneNumber: '+919999999999' },
      };
      mockAuditLogRepo.findAndCount.mockResolvedValue([[logNoName], 1]);

      const result = await service.getLogs({});
      expect(result.logs[0].adminName).toBe('+919999999999');
    });

    it('should return null adminName when admin relation is null', async () => {
      const logNoAdmin = { ...baseLog, admin: null };
      mockAuditLogRepo.findAndCount.mockResolvedValue([[logNoAdmin], 1]);

      const result = await service.getLogs({});
      expect(result.logs[0].adminName).toBeNull();
    });
  });
});
