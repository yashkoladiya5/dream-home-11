import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/health')
export class HealthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  @SkipThrottle()
  async check() {
    const checks: Record<string, { status: string; error?: string }> = {};

    try {
      await this.userRepo.query('SELECT 1');
      checks.database = { status: 'ok' };
    } catch (err) {
      checks.database = { status: 'error', error: (err as Error).message };
    }

    const allOk = Object.values(checks).every(c => c.status === 'ok');

    return {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
