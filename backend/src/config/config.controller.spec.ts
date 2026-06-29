import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';
import { SystemConfig } from './entities/system-config.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ConfigController', () => {
  let controller: ConfigController;
  let configService: ConfigService;
  let currentConfig: any;

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  const defaultConfig = {
    id: 'test-id',
    appName: 'Dream Home 11',
    appVersion: '1.0.0',
    apiVersion: 'v1',
    environment: 'test',
    maintenanceMode: false,
    minAppVersionAndroid: '1.0.0',
    minAppVersionIos: '1.0.0',
    maxWithdrawalAmount: 50000,
    minWithdrawalAmount: 100,
    dailySpinEnabled: true,
    pollsEnabled: true,
    feedEnabled: true,
    chatEnabled: true,
    referralEnabled: true,
    maxDailyPosts: 5,
    maxDailySpins: 1,
    supportEmail: 'support@dreamhome11.com',
    restrictedStates: ['Assam', 'Odisha', 'Telangana'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepo = {
    find: jest.fn(),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    currentConfig = { ...defaultConfig };
    mockRepo.find.mockImplementation(() => Promise.resolve([currentConfig]));
    mockRepo.update.mockImplementation(async (_id, updates) => {
      currentConfig = { ...currentConfig, ...updates };
      return { affected: 1 };
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        ConfigService,
        { provide: getRepositoryToken(SystemConfig), useValue: mockRepo },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ConfigController>(ConfigController);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/config', () => {
    it('should return the app configuration', async () => {
      const result = await controller.getConfig();
      expect(result).toBeDefined();
      expect(result.appName).toBe('Dream Home 11');
      expect(result.restrictedStates).toHaveLength(3);
    });
  });

  describe('GET /api/v1/config/maintenance', () => {
    it('should return maintenance mode status', async () => {
      const result = await controller.getMaintenanceStatus();
      expect(result).toEqual({ maintenanceMode: false });
    });
  });

  describe('GET /api/v1/config/feature/:key', () => {
    it('should return feature enabled status', async () => {
      const result = await controller.getFeature('spin');
      expect(result).toEqual({ feature: 'spin', enabled: true });
    });

    it('should return disabled for unknown features', async () => {
      const result = await controller.getFeature('unknown');
      expect(result).toEqual({ feature: 'unknown', enabled: false });
    });
  });
});
