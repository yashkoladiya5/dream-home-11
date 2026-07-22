import { Logger } from '@nestjs/common';

export function createMockLogger(): Record<keyof Logger, jest.Mock> {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
    localInstance: jest.fn() as any,
  };
}

export function createMockConfigService(overrides: Record<string, any> = {}) {
  const defaults = {
    JWT_SECRET: 'test-secret',
    JWT_EXPIRY: '1h',
    ENCRYPTION_KEY: 'test-key-32-chars-minimum-12345678',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    WEBHOOK_SECRET: 'test-webhook-secret',
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => defaults[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!(key in defaults)) throw new Error(`Config key "${key}" not found`);
      return defaults[key];
    }),
  };
}

export function createMockJwtService() {
  return {
    sign: jest.fn(() => 'mock-token'),
    signAsync: jest.fn(async () => 'mock-token'),
    verify: jest.fn(() => ({ sub: 'mock-id', phone: '+911234567890' })),
    verifyAsync: jest.fn(async () => ({ sub: 'mock-id', phone: '+911234567890' })),
    decode: jest.fn(() => ({ sub: 'mock-id' })),
  };
}

export function createMockDataSource() {
  return {
    transaction: jest.fn(async (cb: any) => {
      const manager = {
        findOne: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        increment: jest.fn(),
        decrement: jest.fn(),
        create: jest.fn(),
        createQueryBuilder: jest.fn().mockReturnThis(),
        getRepository: jest.fn().mockReturnValue({
          createQueryBuilder: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        }),
      };
      return cb(manager);
    }),
    getRepository: jest.fn(),
    manager: { connection: {} },
  };
}

export function createMockRedis() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    incr: jest.fn(),
    ttl: jest.fn(),
    multi: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    })),
  };
}

export function createMockEventEmitter() {
  return {
    emit: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
  };
}

export function createMockThrottlerStorage() {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    increment: jest.fn(),
  };
}

export function createMockEncryptionService() {
  return {
    encrypt: jest.fn((plaintext: string) => `encrypted:${plaintext}`),
    decrypt: jest.fn((encrypted: string) => {
      if (encrypted.startsWith('encrypted:')) return encrypted.replace('encrypted:', '');
      return 'decrypted-value';
    }),
  };
}

export function createMockWalletService() {
  return {
    initializeWallet: jest.fn().mockResolvedValue({ id: 'wallet-id', userId: 'user-id', balanceInr: 0, lockedBalanceInr: 0, pointsBalance: 0 }),
    creditBalance: jest.fn().mockResolvedValue({ wallet: { balanceInr: 1000 }, transaction: {} }),
    debitBalance: jest.fn().mockResolvedValue({ wallet: { balanceInr: 900 }, transaction: {} }),
    creditPoints: jest.fn().mockResolvedValue({ pointsBalance: 100 }),
    debitPoints: jest.fn().mockResolvedValue({ pointsBalance: 50 }),
    getBalance: jest.fn().mockResolvedValue({ balanceInr: 1000, lockedBalanceInr: 0, availableBalance: 1000, pointsBalance: 100 }),
    getWallet: jest.fn().mockResolvedValue({ id: 'wallet-id', userId: 'user-id', balanceInr: 1000, lockedBalanceInr: 0, pointsBalance: 100 }),
    lockBalance: jest.fn().mockResolvedValue({}),
    unlockBalance: jest.fn().mockResolvedValue({}),
  };
}

export function createMockAppConfigService(overrides: Record<string, any> = {}) {
  const defaults = {
    maxWithdrawalAmount: 50000,
    bonusTier1Threshold: '100',
    bonusTier1Points: 10,
    bonusTier2Threshold: '500',
    bonusTier2Points: 50,
    bonusTier3Threshold: '1000',
    bonusTier3Points: 100,
    ...overrides,
  };
  return {
    getConfig: jest.fn().mockResolvedValue(defaults),
    isMaintenanceMode: jest.fn().mockResolvedValue(false),
    isFeatureEnabled: jest.fn().mockResolvedValue(true),
  };
}

export function createMockPointsEngineService() {
  return {
    getMultiplier: jest.fn().mockReturnValue(1.0),
    calculatePoints: jest.fn((basePoints: number) => basePoints),
    logPointAction: jest.fn().mockResolvedValue({}),
    logPointActionWithEntityManager: jest.fn().mockResolvedValue({}),
    getTierInfo: jest.fn().mockReturnValue({ tier: 'bronze', multiplier: 1.0 }),
    getNextTierInfo: jest.fn().mockReturnValue({ nextTier: 'silver', nextMultiplier: 1.1, pointsToNextTier: 1000 }),
  };
}

export function createMockReferralService() {
  return {
    applyReferral: jest.fn().mockResolvedValue({ success: true, message: 'Referral applied', pointsAwarded: 30 }),
    getReferralStats: jest.fn().mockResolvedValue({ referralCode: 'TESTCODE', totalReferred: 0, totalRewardsEarned: 0, totalKycCompleted: 0 }),
    getReferralHistory: jest.fn().mockResolvedValue([]),
    processKycReferral: jest.fn().mockResolvedValue(undefined),
    ensureReferralCode: jest.fn().mockResolvedValue('TESTCODE'),
    generateReferralCode: jest.fn().mockReturnValue('TESTCODE'),
  };
}

export function createMockAuditService() {
  return {
    log: jest.fn().mockResolvedValue({}),
  };
}
