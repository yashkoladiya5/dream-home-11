import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';

@Injectable()
export class ConfigService implements OnApplicationBootstrap {
  private config: SystemConfig | null = null;

  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepo: Repository<SystemConfig>,
  ) {}

  async onApplicationBootstrap() {
    await this.refreshConfig();
  }

  private async refreshConfig() {
    const configs = await this.configRepo.find();
    if (configs.length > 0) {
      this.config = configs[0];
    } else {
      const defaults = this.configRepo.create();
      this.config = await this.configRepo.save(defaults);
    }
  }

  async getConfig(): Promise<SystemConfig> {
    if (!this.config) {
      await this.refreshConfig();
    }
    return { ...this.config! };
  }

  async updateConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    if (!this.config) {
      await this.refreshConfig();
    }
    const allowedFields: (keyof SystemConfig)[] = [
      'appName',
      'appVersion',
      'apiVersion',
      'environment',
      'maintenanceMode',
      'minAppVersionAndroid',
      'minAppVersionIos',
      'maxWithdrawalAmount',
      'minWithdrawalAmount',
      'dailySpinEnabled',
      'pollsEnabled',
      'feedEnabled',
      'chatEnabled',
      'referralEnabled',
      'maxDailyPosts',
      'maxDailySpins',
      'supportEmail',
      'restrictedStates',
      'bonusTier1Threshold',
      'bonusTier1Points',
      'bonusTier2Threshold',
      'bonusTier2Points',
      'bonusTier3Threshold',
      'bonusTier3Points',
    ];
    const filtered: Partial<SystemConfig> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        (filtered as any)[key] = updates[key];
      }
    }
    if (Object.keys(filtered).length === 0) {
      return this.getConfig();
    }
    await this.configRepo.update(this.config!.id, filtered);
    await this.refreshConfig();
    return { ...this.config! };
  }

  async isMaintenanceMode(): Promise<boolean> {
    const config = await this.getConfig();
    return config.maintenanceMode;
  }

  async isFeatureEnabled(feature: string): Promise<boolean> {
    const config = await this.getConfig();
    const featureMap: Record<string, keyof SystemConfig> = {
      spin: 'dailySpinEnabled',
      polls: 'pollsEnabled',
      feed: 'feedEnabled',
      chat: 'chatEnabled',
      referral: 'referralEnabled',
      maintenanceMode: 'maintenanceMode',
    };
    const key = featureMap[feature];
    if (key) {
      return config[key] as unknown as boolean;
    }
    return false;
  }
}
