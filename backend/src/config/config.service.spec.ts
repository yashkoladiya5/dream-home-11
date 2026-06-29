import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return the full app configuration', () => {
      const config = service.getConfig();
      expect(config).toBeDefined();
      expect(config.appName).toBe('Dream Home 11');
      expect(config.appVersion).toBe('1.0.0');
      expect(config.apiVersion).toBe('v1');
      expect(config.maintenanceMode).toBe(false);
      expect(config.dailySpinEnabled).toBe(true);
      expect(config.pollsEnabled).toBe(true);
      expect(config.feedEnabled).toBe(true);
      expect(config.chatEnabled).toBe(true);
      expect(config.referralEnabled).toBe(true);
    });

    it('should return restricted states', () => {
      const config = service.getConfig();
      expect(config.restrictedStates).toEqual(['Assam', 'Odisha', 'Telangana']);
    });

    it('should return withdrawal limits', () => {
      const config = service.getConfig();
      expect(config.minWithdrawalAmount).toBe(100);
      expect(config.maxWithdrawalAmount).toBe(50000);
    });
  });

  describe('isMaintenanceMode', () => {
    it('should return false by default', () => {
      expect(service.isMaintenanceMode()).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      expect(service.isFeatureEnabled('spin')).toBe(true);
      expect(service.isFeatureEnabled('polls')).toBe(true);
      expect(service.isFeatureEnabled('feed')).toBe(true);
      expect(service.isFeatureEnabled('chat')).toBe(true);
      expect(service.isFeatureEnabled('referral')).toBe(true);
    });

    it('should return false for unknown features', () => {
      expect(service.isFeatureEnabled('unknown')).toBe(false);
    });
  });
});
