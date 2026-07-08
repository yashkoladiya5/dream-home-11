import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { ReferralService } from '../referral/referral.service';
import { RedisOtpService } from './redis-otp.service';
import { RefreshTokenService } from './refresh-token.service';
import { QueueService } from '../queue/queue.service';
import { QUEUES } from '../queue/queue.constants';
import { DomainEventNames, createDomainEvent } from '../common/events/domain-events';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly referralService: ReferralService,
    private readonly redisOtpService: RedisOtpService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly queueService: QueueService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  requestOtp(phoneNumber: string): { success: boolean; message: string } {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    this.redisOtpService.storeOtp(phoneNumber, otpCode);

    this.logger.debug(`OTP stored for ${phoneNumber} (length: ${otpCode.length})`);

    this.queueService.add(QUEUES.OTP_SMS, { phoneNumber, code: otpCode });

    return {
      success: true,
      message: 'OTP requested successfully',
    };
  }

  async verifyOtp(
    idToken: string,
    deviceId: string,
    otpCode?: string,
    referralCode?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const { phoneNumber } = await this.firebaseService.verifyIdToken(idToken);

    if (!otpCode) {
      throw new UnauthorizedException('OTP code is required');
    }
    await this.redisOtpService.verifyOtp(phoneNumber, otpCode);

    const existingUser = await this.usersService.findByPhoneNumber(phoneNumber);
    const isNewUser = !existingUser;

    const user = await this.usersService.upsertUser(phoneNumber, deviceId);

    if (isNewUser && referralCode) {
      try {
        await this.referralService.applyReferral(user, referralCode);
      } catch (err) {
        this.logger.warn(
          `Referral code application failed for user ${user.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }

    const tokens = await this.refreshTokenService.generateTokens(
      user.id,
      user.phoneNumber,
      deviceId,
    );

    if (isNewUser) {
      this.eventEmitter.emit(
        DomainEventNames.USER_CREATED,
        createDomainEvent(DomainEventNames.USER_CREATED, {
          userId: user.id,
          phoneNumber: user.phoneNumber,
        }),
      );
    }

    return { ...tokens, user };
  }

  async createMockToken(
    phoneNumber: string,
    role?: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Not available in production');
    }

    const user = await this.usersService.upsertUser(phoneNumber, 'mock-device');

    if (role) {
      user.role = role;
      await this.usersService.updateUser(user);
    }

    const tokens = await this.refreshTokenService.generateTokens(
      user.id,
      user.phoneNumber,
      'mock-device',
    );

    return { ...tokens, user };
  }
}
