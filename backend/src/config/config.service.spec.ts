import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { SystemConfig } from './entities/system-config.entity';

describe('ConfigService', () => {
  let service: ConfigService;
  let mockRepo: any;
  let currentConfig: any;

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

  beforeEach(async () => {
    currentConfig = { ...defaultConfig };

    mockRepo = {
      find: jest.fn().mockImplementation(() => Promise.resolve([currentConfig])),
      create: jest.fn().mockReturnValue(defaultConfig),
      save: jest.fn().mockResolvedValue(defaultConfig),
      update: jest.fn().mockImplementation(async (_id, updates) => {
        currentConfig = { ...currentConfig, ...updates };
        return { affected: 1 };
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: getRepositoryToken(SystemConfig), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return the app configuration from repo', async () => {
      const config = await service.getConfig();
      expect(config).toBeDefined();
      expect(config.appName).toBe('Dream Home 11');
      expect(config.maintenanceMode).toBe(false);
    });

    it('should return a copy, not the original', async () => {
      const config1 = await service.getConfig();
      const config2 = await service.getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });
  });

  describe('updateConfig', () => {
    it('should update the config and return new values', async () => {
      const result = await service.updateConfig({ maintenanceMode: true });
      expect(result.maintenanceMode).toBe(true);
      expect(mockRepo.update).toHaveBeenCalledWith(
        defaultConfig.id,
        expect.objectContaining({ maintenanceMode: true }),
      );
    });

    it('should ignore id and timestamps in updates', async () => {
      await service.updateConfig({
        id: 'hacked-id',
        createdAt: new Date(0),
        updatedAt: new Date(0),
        maintenanceMode: true,
      } as any);
      const callArgs = mockRepo.update.mock.calls[0][1];
      expect(callArgs.id).toBeUndefined();
      expect(callArgs.maintenanceMode).toBe(true);
    });

    it('should return current config if no valid fields provided', async () => {
      const result = await service.updateConfig({} as any);
      expect(result).toBeDefined();
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('isMaintenanceMode', () => {
    it('should return false by default', async () => {
      const result = await service.isMaintenanceMode();
      expect(result).toBe(false);
    });

    it('should return true when maintenance mode is on', async () => {
      await service.updateConfig({ maintenanceMode: true });
      const result = await service.isMaintenanceMode();
      expect(result).toBe(true);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', async () => {
      expect(await service.isFeatureEnabled('spin')).toBe(true);
      expect(await service.isFeatureEnabled('polls')).toBe(true);
      expect(await service.isFeatureEnabled('feed')).toBe(true);
      expect(await service.isFeatureEnabled('chat')).toBe(true);
      expect(await service.isFeatureEnabled('referral')).toBe(true);
    });

    it('should return false for unknown features', async () => {
      expect(await service.isFeatureEnabled('unknown')).toBe(false);
    });

    it('should return false when feature is disabled', async () => {
      await service.updateConfig({ dailySpinEnabled: false });
      expect(await service.isFeatureEnabled('spin')).toBe(false);
    });
  });
});
