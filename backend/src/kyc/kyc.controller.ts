import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitKyc(
    @GetUser() user: User,
    @Body('aadhaarNumber') aadhaarNumber: string,
    @Body('panNumber') panNumber: string,
    @Body('fullName') fullName: string,
  ) {
    const kyc = await this.kycService.submitKyc(user.id, aadhaarNumber, panNumber, fullName);
    return {
      id: kyc.id,
      status: kyc.status,
      verifiedAt: kyc.verifiedAt,
    };
  }

  @Get('status')
  async getKycStatus(@GetUser() user: User) {
    return this.kycService.getKycStatus(user.id);
  }

  @Get('details')
  async getKycDetails(@GetUser() user: User) {
    return this.kycService.getKycDetails(user.id);
  }
}
