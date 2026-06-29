import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

describe('ConfigController', () => {
  let controller: ConfigController;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [ConfigService],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/config', () => {
    it('should return the app configuration', () => {
      const result = controller.getConfig();
      expect(result).toBeDefined();
      expect(result.appName).toBe('Dream Home 11');
      expect(result.appVersion).toBe('1.0.0');
      expect(result.restrictedStates).toHaveLength(3);
    });
  });

  describe('GET /api/v1/config/maintenance', () => {
    it('should return maintenance mode status', () => {
      const result = controller.getMaintenanceStatus();
      expect(result).toEqual({ maintenanceMode: false });
    });
  });
});
