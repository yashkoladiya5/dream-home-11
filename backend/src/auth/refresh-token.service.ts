import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';
import { RedisCacheService } from '../redis/redis-cache.service';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisCache: RedisCacheService,
  ) {
    this.accessTokenExpiry = this.configService.get<string>(
      'JWT_ACCESS_EXPIRY',
      '15m',
    );
    this.refreshTokenExpiryDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRY_DAYS',
      30,
    );
  }

  async generateTokens(
    userId: string,
    phoneNumber: string,
    deviceId?: string,
    family?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: userId, phoneNumber },
      { expiresIn: this.accessTokenExpiry as any },
    );

    const refreshTokenValue = uuidv4();
    const tokenHash = this.hashToken(refreshTokenValue);
    const tokenFamily = family || uuidv4();

    const refreshToken = this.refreshTokenRepo.create({
      tokenHash,
      userId,
      deviceId,
      family: tokenFamily,
      expiresAt: new Date(
        Date.now() + this.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
      ),
    });
    await this.refreshTokenRepo.save(refreshToken);

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async refreshAccessToken(
    refreshTokenValue: string,
    deviceId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(refreshTokenValue);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash, revoked: false },
      relations: { user: true },
    });

    if (!storedToken) {
      const revokedToken = await this.refreshTokenRepo.findOne({
        where: { tokenHash },
        select: { id: true, family: true, revoked: true },
      });
      if (revokedToken) {
        await this.revokeFamily(revokedToken.family);
        this.logger.warn(`Refresh token replay detected — family ${revokedToken.family} revoked`);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.refreshTokenRepo.remove(storedToken);
      throw new UnauthorizedException('Refresh token expired');
    }

    const isBlacklisted = await this.redisCache.exists(
      `blacklist:refresh:${tokenHash}`,
    );
    if (isBlacklisted) {
      await this.revokeFamily(storedToken.family);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    await this.refreshTokenRepo.update(storedToken.id, { revoked: true, revokedAt: new Date() });

    const user = storedToken.user;
    return this.generateTokens(
      user.id,
      user.phoneNumber,
      deviceId || storedToken.deviceId,
      storedToken.family,
    );
  }

  async revokeToken(tokenHash: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { tokenHash },
      { revoked: true, revokedAt: new Date() },
    );
    await this.redisCache.set(
      `blacklist:refresh:${tokenHash}`,
      true,
      this.refreshTokenExpiryDays * 24 * 3600,
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokenRepo.find({
      where: { userId, revoked: false },
    });
    for (const token of tokens) {
      await this.revokeToken(token.tokenHash);
    }
  }

  private async revokeFamily(family?: string): Promise<void> {
    if (!family) return;
    const tokens = await this.refreshTokenRepo.find({
      where: { family, revoked: false },
    });
    for (const token of tokens) {
      await this.revokeToken(token.tokenHash);
    }
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where('expires_at < NOW()')
      .execute();
    return result.affected || 0;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
