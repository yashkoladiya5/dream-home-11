import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kyc, KycStatus } from './entities/kyc.entity';
import { User } from '../users/entities/user.entity';

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
}
