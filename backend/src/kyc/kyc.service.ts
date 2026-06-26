import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc, KycStatus } from './entities/kyc.entity';
import { User } from '../users/entities/user.entity';
import { ensureUploadDir, KYC_UPLOAD_DIR } from './kyc-uploads.config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async submitKyc(userId: string, aadhaarNumber: string, panNumber: string, fullName: string): Promise<Kyc> {
    const existing = await this.kycRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('KYC already submitted for this user');
    }

    const kyc = this.kycRepository.create({
      userId,
      aadhaarNumber,
      panNumber,
      status: KycStatus.PENDING,
    });

    return this.kycRepository.save(kyc);
  }

  async getKycStatus(userId: string): Promise<{ status: KycStatus; verifiedAt: Date | null }> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      throw new NotFoundException('KYC not found');
    }
    return { status: kyc.status, verifiedAt: kyc.verifiedAt };
  }

  async getKycDetails(userId: string): Promise<Kyc> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      throw new NotFoundException('KYC not found');
    }
    return kyc;
  }

  private getColumnForDocumentType(documentType: string): keyof Kyc {
    const map: Record<string, keyof Kyc> = {
      aadhaar_front: 'aadhaarFrontUrl',
      aadhaar_back: 'aadhaarBackUrl',
      pan_card: 'panCardUrl',
      selfie: 'selfieUrl',
    };
    return map[documentType];
  }

  async uploadDocument(
    userId: string,
    documentType: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const column = this.getColumnForDocumentType(documentType);
    if (!column) {
      throw new BadRequestException(`Invalid document type: ${documentType}`);
    }

    let kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      kyc = this.kycRepository.create({
        userId,
        status: KycStatus.PENDING,
      });
      kyc = await this.kycRepository.save(kyc);
    }

    ensureUploadDir();
    const userDir = join(KYC_UPLOAD_DIR, userId);
    if (!existsSync(userDir)) {
      mkdirSync(userDir, { recursive: true });
    }

    const ext = extname(file.originalname) || '.jpg';
    const filename = `${documentType}${ext}`;
    const filePath = join(userDir, filename);
    writeFileSync(filePath, file.buffer);

    const url = `/uploads/kyc/${userId}/${filename}`;
    (kyc as any)[column] = url;
    await this.kycRepository.save(kyc);

    return { url };
  }
}
