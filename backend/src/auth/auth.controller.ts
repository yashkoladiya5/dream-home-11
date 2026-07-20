import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { MockLoginDto } from './dto/mock-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { User } from '../users/entities/user.entity';
import { SkipEnvelope } from '../common/decorators/skip-envelope.decorator';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('request-otp')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  requestOtp(@Body() requestOtpDto: RequestOtpDto): {
    success: boolean;
    message: string;
  } {
    return this.authService.requestOtp(requestOtpDto.phoneNumber);
  }

  @Post('verify-otp')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    return this.authService.verifyOtp(
      verifyOtpDto.idToken,
      verifyOtpDto.deviceId,
      verifyOtpDto.otpCode,
      verifyOtpDto.referralCode,
    );
  }

  @Post('refresh')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @SkipEnvelope()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Headers('x-device-id') deviceId?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.refreshTokenService.refreshAccessToken(
      dto.refreshToken,
      deviceId,
    );
  }

  @Post('admin-login')
  @SkipEnvelope()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.phoneNumber, dto.password);
  }

  @Post('mock-login')
  @SkipEnvelope()
  @Throttle({ default: { ttl: 60000, limit: 1000 } })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async mockLogin(@Body() dto: MockLoginDto) {
    if (process.env.NODE_ENV !== 'development') {
      throw new UnauthorizedException('Not available in production');
    }
    return this.authService.createMockToken(dto.phoneNumber, dto.role);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async logout(@Body() dto: RefreshTokenDto): Promise<{ success: boolean; message: string }> {
    const tokenHash = this.refreshTokenService.hashToken(dto.refreshToken);
    await this.refreshTokenService.revokeToken(tokenHash);
    return { success: true, message: 'Logged out successfully' };
  }
}
