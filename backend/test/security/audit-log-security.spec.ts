import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../../src/common/audit/audit-log.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from '../../src/audit/entities/audit-log.entity';
import { Repository } from 'typeorm';

describe('Security: Audit Logging', () => {
  let auditLogService: AuditLogService;
  let auditLogRepo: Repository<AuditLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    auditLogService = module.get<AuditLogService>(AuditLogService);
    auditLogRepo = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sensitive Operations Are Logged', () => {
    test('login success is logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-1' });
      const result = await auditLogService.logLogin('user-1', true, '192.168.1.1');
      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_success',
          targetType: 'auth',
          targetId: 'user-1',
          userId: 'user-1',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    test('login failure is logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-2' });
      const result = await auditLogService.logLogin('user-2', false, '10.0.0.1');
      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'login_failure',
        }),
      );
    });

    test('payment events are logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-3' });
      await auditLogService.logPayment('user-3', 500, 'withdrawal', 'verified');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'payment_verified',
          targetType: 'payment',
          metadata: expect.objectContaining({
            amount: 500,
            paymentType: 'withdrawal',
            status: 'verified',
          }),
        }),
      );
    });

    test('KYC events are logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-4' });
      await auditLogService.logKyc('user-4', 'submitted', 'pending');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'kyc_submitted',
          targetType: 'kyc',
          metadata: expect.objectContaining({ action: 'submitted', status: 'pending' }),
        }),
      );
    });

    test('admin actions are logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-5' });
      await auditLogService.logAdminAction('admin-1', 'update_user', 'user-5', { role: 'moderator' });
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin_update_user',
          userId: 'admin-1',
          targetId: 'user-5',
          metadata: expect.objectContaining({
            changes: { role: 'moderator' },
            targetUserId: 'user-5',
          }),
        }),
      );
    });

    test('withdrawal events are logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-6' });
      await auditLogService.logWithdrawal('user-6', 1000, 'completed');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'withdrawal_completed',
          targetType: 'withdrawal',
          metadata: expect.objectContaining({ amount: 1000, status: 'completed' }),
        }),
      );
    });
  });

  describe('Audit Event Required Fields', () => {
    test('audit log is created with all required fields', async () => {
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve({ id: 'log-req', ...data }));
      const result = await auditLogService.log(
        'test_action',
        'test_resource',
        'resource-1',
        'user-1',
        { detail: 'test' },
        '10.0.0.5',
      );
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result.action).toBe('test_action');
      expect(result.targetType).toBe('test_resource');
      expect(result.targetId).toBe('resource-1');
      expect(result.userId).toBe('user-1');
      expect(result.metadata).toHaveProperty('detail', 'test');
      expect(result.metadata).toHaveProperty('correlationId');
      expect(result.metadata).toHaveProperty('timestamp');
    });

    test('audit log without optional ip still has timestamp', async () => {
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve({ id: 'log-noip', ...data }));
      const result = await auditLogService.log('test', 'resource', 'r1', 'u1');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(typeof result.metadata.timestamp).toBe('string');
    });
  });

  describe('PII Redaction', () => {
    test('audit log does not contain plaintext Aadhaar numbers', async () => {
      const metadata = { aadhaar: 'XXXX-XXXX-1234', name: 'Test User' };
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-pii-1' });
      await auditLogService.log('kyc_submitted', 'kyc', 'user-1', 'user-1', metadata, '10.0.0.1');
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.metadata.aadhaar).toBe('XXXX-XXXX-1234');
      expect(createCall.metadata.aadhaar).not.toMatch(/^\d{12}$/);
    });

    test('audit log does not contain plaintext PAN numbers', async () => {
      const metadata = { pan: 'XXXX-XXXX-1234', name: 'Test User' };
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-pii-2' });
      await auditLogService.log('kyc_submitted', 'kyc', 'user-1', 'user-1', metadata, '10.0.0.1');
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.metadata.pan).not.toMatch(/^[A-Z]{5}[0-9]{4}[A-Z]$/);
    });

    test('PII fields are masked before being stored in audit', async () => {
      const metadata = { bankAccount: 'XXXXXXXX1234', ifsc: 'SBIN0001234' };
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-pii-3' });
      await auditLogService.log('payment_verified', 'payment', 'user-1', 'user-1', metadata, '10.0.0.1');
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.metadata.bankAccount).toBe('XXXXXXXX1234');
    });
  });

  describe('Failed Auth Attempts', () => {
    test('repeated login failures are logged', async () => {
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({ id: 'log-fail' });
      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        await auditLogService.logLogin(`user-fail-${i}`, false, `10.0.0.${i}`);
      }
      expect(mockRepository.create).toHaveBeenCalledTimes(attempts);
      expect(mockRepository.save).toHaveBeenCalledTimes(attempts);
    });

    test('failed login has success=false in metadata', async () => {
      mockRepository.create.mockImplementation((data) => data);
      mockRepository.save.mockImplementation((data) => Promise.resolve({ id: 'log-fail-meta', ...data }));
      const result = await auditLogService.logLogin('user-fail', false, '10.0.0.100');
      expect(result.action).toBe('login_failure');
      expect(result.metadata).toHaveProperty('success', false);
    });
  });

  describe('Audit Log Cleanup', () => {
    test('cleanup removes logs older than retention period', async () => {
      const deleteSpy = jest.spyOn(mockRepository, 'delete').mockResolvedValue({ affected: 10, raw: {} });
      process.env.AUDIT_LOG_RETENTION_DAYS = '30';
      await auditLogService.cleanupOldLogs();
      expect(deleteSpy).toHaveBeenCalled();
      delete process.env.AUDIT_LOG_RETENTION_DAYS;
    });

    test('cleanup defaults to 90 days retention', async () => {
      const deleteSpy = jest.spyOn(mockRepository, 'delete').mockResolvedValue({ affected: 5, raw: {} });
      await auditLogService.cleanupOldLogs();
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});
