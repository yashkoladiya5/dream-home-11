import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private readonly requests = new Map<string, number[]>();
  private readonly maxRequests = 5;
  private readonly windowMs = 60000;

  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(userId) || [];
    const recent = timestamps.filter((t) => now - t < this.windowMs);
    this.requests.set(userId, recent);
    return recent.length >= this.maxRequests;
  }

  recordRequest(userId: string): void {
    const now = Date.now();
    const timestamps = this.requests.get(userId) || [];
    timestamps.push(now);
    this.requests.set(userId, timestamps);
  }
}
