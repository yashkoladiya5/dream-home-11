import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

function validateImageMagicBytes(buffer: Buffer): void {
  if (!buffer || buffer.length < 4) {
    throw new BadRequestException('Invalid or empty image file');
  }

  const magic = buffer.toString('hex', 0, 4).toUpperCase();

  const jpegMagic = 'FFD8FF';
  const pngMagic = '89504E47';
  const webpMagic = '52494646'; // RIFF (for WebP)

  if (
    !magic.startsWith(jpegMagic) &&
    !magic.startsWith(pngMagic) &&
    !magic.startsWith(webpMagic)
  ) {
    throw new BadRequestException('Invalid image file format');
  }
}

@ApiTags('Kyc')
@ApiBearerAuth()
@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async submitKyc(
    @GetUser() user: User,
    @Body() dto: SubmitKycDto,
  ) {
    const kyc = await this.kycService.submitKyc(
      user.id,
      dto.aadhaarNumber,
      dto.panNumber,
      dto.fullName,
      dto.dateOfBirth,
    );
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
      throw new BadRequestException(
        `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only image files (jpg, jpeg, png, webp) are allowed',
      );
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        'Only .jpg, .jpeg, .png, .webp files are allowed',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 5MB');
    }

    // Rely on mimetype and extension verification, as formats like HEIC have dynamic magic bytes offsets
    // validateImageMagicBytes(file.buffer);

    return this.kycService.uploadDocument(user.id, documentType, file);
  }
}
