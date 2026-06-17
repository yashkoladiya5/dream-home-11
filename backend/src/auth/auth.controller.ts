import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ token: string; user: User }> {
    return this.authService.verifyOtp(
      verifyOtpDto.idToken,
      verifyOtpDto.deviceId,
    );
  }
}
