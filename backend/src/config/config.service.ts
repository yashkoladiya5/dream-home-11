import { Injectable } from '@nestjs/common';

export interface AppConfig {
  appName: string;
  appVersion: string;
  apiVersion: string;
  environment: string;
  maintenanceMode: boolean;
  minAppVersionAndroid: string;
  minAppVersionIos: string;
  maxWithdrawalAmount: number;
  minWithdrawalAmount: number;
  dailySpinEnabled: boolean;
  pollsEnabled: boolean;
  feedEnabled: boolean;
  chatEnabled: boolean;
  referralEnabled: boolean;
  maxDailyPosts: number;
  maxDailySpins: number;
  supportEmail: string;
  restrictedStates: string[];
}

@Injectable()
export class ConfigService {
  private config: AppConfig = {
    appName: 'Dream Home 11',
    appVersion: '1.0.0',
    apiVersion: 'v1',
    environment: process.env.NODE_ENV || 'development',
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
  };

  getConfig(): AppConfig {
    return { ...this.config };
  }

  isMaintenanceMode(): boolean {
    return this.config.maintenanceMode;
  }

  isFeatureEnabled(feature: string): boolean {
    const featureMap: Record<string, keyof AppConfig> = {
      spin: 'dailySpinEnabled',
      polls: 'pollsEnabled',
      feed: 'feedEnabled',
      chat: 'chatEnabled',
      referral: 'referralEnabled',
    };
    const key = featureMap[feature];
    if (key) {
      return this.config[key] as boolean;
    }
    return false;
  }
}
