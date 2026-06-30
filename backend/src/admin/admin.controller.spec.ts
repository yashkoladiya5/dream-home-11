import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditService } from '../audit/audit.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdmin = { id: 'admin-1', role: 'admin', fullName: 'Admin' } as any;
  const mockReq = { ip: '127.0.0.1' } as any;

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockAdminService = {
    getDashboardStats: jest.fn().mockResolvedValue({ totalUsers: 100 }),
    getUsers: jest.fn().mockResolvedValue({ users: [], total: 0, page: 1, limit: 20 }),
    getUserById: jest.fn().mockResolvedValue({ id: '1', fullName: 'Test' }),
    updateUser: jest.fn().mockImplementation((id, dto) => Promise.resolve({ id, ...dto })),
    getContests: jest.fn().mockResolvedValue({ contests: [], total: 0, page: 1, limit: 20 }),
    getContestById: jest.fn().mockResolvedValue({ id: 'c1', title: 'Test' }),
    getKycSubmissions: jest.fn().mockResolvedValue({ submissions: [], total: 0, page: 1, limit: 20 }),
    approveKyc: jest.fn().mockResolvedValue({ id: 'k1', status: 'approved' }),
    rejectKyc: jest.fn().mockResolvedValue({ id: 'k1', status: 'rejected', rejectionReason: 'Invalid' }),
    updateSystemConfig: jest.fn().mockResolvedValue({ maintenanceMode: true }),
    getSupportTickets: jest.fn().mockResolvedValue({ tickets: [], total: 0, page: 1, limit: 20 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('should return dashboard stats', async () => {
      const result = await controller.getDashboard();
      expect(result.totalUsers).toBe(100);
    });
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return paginated users', async () => {
      const result = await controller.getUsers({});
      expect(result.users).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should return user by id', async () => {
      const result = await controller.getUser('1');
      expect(result.fullName).toBe('Test');
    });
  });

  describe('PATCH /api/v1/admin/users/:id', () => {
    it('should update user', async () => {
      const result = await controller.updateUser('1', { fullName: 'Updated' }, mockAdmin, mockReq);
      expect(result.fullName).toBe('Updated');
    });
  });

  describe('GET /api/v1/admin/contests', () => {
    it('should return contests', async () => {
      const result = await controller.getContests({});
      expect(result.contests).toBeDefined();
    });
  });

  describe('GET /api/v1/admin/contests/:id', () => {
    it('should return contest detail', async () => {
      const result = await controller.getContest('c1');
      expect(result.title).toBe('Test');
    });
  });

  describe('GET /api/v1/admin/kyc', () => {
    it('should return KYC submissions', async () => {
      const result = await controller.getKycSubmissions({});
      expect(result.submissions).toBeDefined();
    });
  });

  describe('PATCH /api/v1/admin/kyc/:id/approve', () => {
    it('should approve KYC', async () => {
      const result = await controller.approveKyc('k1', mockAdmin, mockReq);
      expect(result.status).toBe('approved');
    });
  });

  describe('PATCH /api/v1/admin/kyc/:id/reject', () => {
    it('should reject KYC', async () => {
      const result = await controller.rejectKyc('k1', { reason: 'Invalid' }, mockAdmin, mockReq);
      expect(result.status).toBe('rejected');
    });
  });

  describe('PATCH /api/v1/admin/config', () => {
    it('should update system config', async () => {
      const result = await controller.updateConfig({ maintenanceMode: true }, mockAdmin, mockReq);
      expect(result!.maintenanceMode).toBe(true);
    });
  });

  describe('GET /api/v1/admin/support-tickets', () => {
    it('should return support tickets', async () => {
      const result = await controller.getSupportTickets({});
      expect(result.tickets).toBeDefined();
    });
  });
});
