import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { MockLoginDto } from './dto/mock-login.dto';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ token: string; user: User }> {
    return this.authService.verifyOtp(
      verifyOtpDto.idToken,
      verifyOtpDto.deviceId,
      verifyOtpDto.otpCode,
      verifyOtpDto.referralCode,
    );
  }

  @Post('mock-login')
  @Throttle({ default: { ttl: 60000, limit: 1000 } })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async mockLogin(@Body() dto: MockLoginDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Not available in production');
    }
    return this.authService.createMockToken(dto.phoneNumber, dto.role);
  }
}
