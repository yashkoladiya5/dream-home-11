import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
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

  @Post('upload-document')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    const validTypes = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'selfie'];
    if (!validTypes.includes(documentType)) {
      throw new BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files (jpg, jpeg, png) are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    return this.kycService.uploadDocument(user.id, documentType, file);
  }
}
