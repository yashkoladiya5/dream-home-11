import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc, KycStatus } from './entities/kyc.entity';
import { User } from '../users/entities/user.entity';
import { ReferralService } from '../referral/referral.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { maskAadhaar, maskPan } from '../common/encryption/pii-transform';
import { ensureUploadDir, KYC_UPLOAD_DIR } from './kyc-uploads.config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly referralService: ReferralService,
    private readonly auditService: AuditService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async submitKyc(
    userId: string,
    aadhaarNumber: string,
    panNumber: string,
    fullName: string,
  ): Promise<Kyc> {
    const existing = await this.kycRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('KYC already submitted for this user');
    }

    const kyc = this.kycRepository.create({
      userId,
      aadhaarNumber: this.encryptionService.encrypt(aadhaarNumber),
      panNumber: this.encryptionService.encrypt(panNumber),
      status: KycStatus.PENDING,
    });

    const saved = await this.kycRepository.save(kyc);

    await this.auditService.log({
      userId,
      action: AuditAction.SUBMIT_KYC,
      targetId: saved.id,
      targetType: 'kyc',
      metadata: { status: saved.status },
    });

    await this.referralService.processKycReferral(userId);

    return saved;
  }

  async getKycStatus(
    userId: string,
  ): Promise<{ status: string; verifiedAt: Date | null }> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      return { status: 'unverified', verifiedAt: null };
    }
    return { status: kyc.status, verifiedAt: kyc.verifiedAt };
  }

  async getKycDetails(userId: string): Promise<Partial<Kyc>> {
    const kyc = await this.kycRepository.findOne({ where: { userId } });
    if (!kyc) {
      return {
        status: 'unverified' as any,
      };
    }
    let decryptedAadhaar: string | undefined;
    let decryptedPan: string | undefined;
    try {
      if (kyc.aadhaarNumber) {
        decryptedAadhaar = this.encryptionService.decrypt(kyc.aadhaarNumber);
      }
    } catch {
      decryptedAadhaar = undefined;
    }
    try {
      if (kyc.panNumber) {
        decryptedPan = this.encryptionService.decrypt(kyc.panNumber);
      }
    } catch {
      decryptedPan = undefined;
    }

    return {
      id: kyc.id,
      userId: kyc.userId,
      status: kyc.status,
      verifiedAt: kyc.verifiedAt,
      rejectionReason: kyc.rejectionReason,
      aadhaarNumber: decryptedAadhaar
        ? maskAadhaar(decryptedAadhaar)
        : undefined,
      panNumber: decryptedPan ? maskPan(decryptedPan) : undefined,
      aadhaarFrontUrl: kyc.aadhaarFrontUrl,
      aadhaarBackUrl: kyc.aadhaarBackUrl,
      panCardUrl: kyc.panCardUrl,
      selfieUrl: kyc.selfieUrl,
    };
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
    try {
      console.log(`[KYC Upload] Starting upload for user: ${userId}, type: ${documentType}`);
      const column = this.getColumnForDocumentType(documentType);
      if (!column) {
        throw new BadRequestException(`Invalid document type: ${documentType}`);
      }

      let kyc = await this.kycRepository.findOne({ where: { userId } });
      if (!kyc) {
        console.log(`[KYC Upload] No KYC record found. Creating a new one for user: ${userId}`);
        kyc = this.kycRepository.create({
          userId,
          status: KycStatus.PENDING,
        });
        kyc = await this.kycRepository.save(kyc);
      }

      console.log(`[KYC Upload] Ensuring upload directory: ${KYC_UPLOAD_DIR}`);
      ensureUploadDir();
      const userDir = join(KYC_UPLOAD_DIR, userId);
      if (!existsSync(userDir)) {
        console.log(`[KYC Upload] Creating user-specific directory: ${userDir}`);
        mkdirSync(userDir, { recursive: true });
      }

      const ext = extname(file.originalname) || '.jpg';
      const filename = `${documentType}${ext}`;
      const filePath = join(userDir, filename);
      console.log(`[KYC Upload] Preparing file buffer for write...`);
      console.log(`[KYC Upload] file.buffer type: ${typeof file.buffer}`);
      console.log(`[KYC Upload] file.buffer constructor: ${file.buffer?.constructor?.name}`);
      console.log(`[KYC Upload] file.buffer keys: ${Object.keys(file.buffer || {}).join(', ')}`);
      
      let fileData: Buffer;
      if (Buffer.isBuffer(file.buffer)) {
        fileData = file.buffer;
      } else if (file.buffer && typeof file.buffer === 'object') {
        const rawObj = file.buffer as any;
        if (rawObj.type === 'Buffer' && Array.isArray(rawObj.data)) {
          fileData = Buffer.from(rawObj.data);
        } else if (Array.isArray(rawObj.data)) {
          fileData = Buffer.from(rawObj.data);
        } else if (rawObj.data && Array.isArray(rawObj.data.data)) {
          fileData = Buffer.from(rawObj.data.data);
        } else if (rawObj instanceof Uint8Array || rawObj.constructor?.name === 'Uint8Array' || rawObj.constructor?.name === 'Buffer') {
          fileData = Buffer.from(rawObj);
        } else if (rawObj.buffer && rawObj.buffer instanceof ArrayBuffer) {
          fileData = Buffer.from(rawObj.buffer);
        } else {
          console.warn('[KYC Upload] Unknown buffer object format. Attempting conversion of keys:', Object.keys(rawObj));
          fileData = Buffer.from(JSON.stringify(rawObj));
        }
      } else {
        fileData = Buffer.from((file.buffer as any) || '');
      }

      console.log(`[KYC Upload] Writing file of size ${fileData.length} bytes to: ${filePath}`);
      writeFileSync(filePath, fileData);

      const url = `/uploads/kyc/${userId}/${filename}`;
      (kyc as any)[column] = url;
      console.log(`[KYC Upload] Updating KYC database record...`);
      await this.kycRepository.save(kyc);

      console.log(`[KYC Upload] Upload successfully completed.`);
      return { url };
    } catch (error) {
      console.error('[KYC Upload] CRITICAL ERROR ENCOUNTERED:', error);
      throw error;
    }
  }
}
