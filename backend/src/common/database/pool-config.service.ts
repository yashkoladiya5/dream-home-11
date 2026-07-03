import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PoolConfigService {
  private readonly poolSize: number;
  private readonly poolMin: number;
  private readonly idleTimeout: number;
  private readonly acquireTimeout: number;

  constructor(private readonly config: ConfigService) {
    this.poolSize = this.config.get<number>('DB_POOL_SIZE', 50);
    this.poolMin = this.config.get<number>('DB_POOL_MIN', 5);
    this.idleTimeout = this.config.get<number>('DB_IDLE_TIMEOUT', 30000);
    this.acquireTimeout = this.config.get<number>('DB_ACQUIRE_TIMEOUT', 5000);
  }

  getExtra() {
    return {
      max: this.poolSize,
      min: this.poolMin,
      idleTimeoutMillis: this.idleTimeout,
      connectionTimeoutMillis: this.acquireTimeout,
    };
  }

  logPoolStatus(totalCount: number, idleCount: number, waitingCount: number): void {
    console.log(
      `[DB Pool] total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`,
    );
  }
}
