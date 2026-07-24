import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentRecord, ConsentType } from '../entities/consent-record.entity';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
  ) {}

  async recordConsent(
    userId: string,
    consentType: string,
    accepted: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentRecord> {
    const record = this.consentRepo.create({
      userId,
      consentType,
      accepted,
      ipAddress,
      userAgent,
    });
    return this.consentRepo.save(record);
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return this.consentRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getLatestConsent(
    userId: string,
    consentType: string,
  ): Promise<ConsentRecord | null> {
    return this.consentRepo.findOne({
      where: { userId, consentType },
      order: { createdAt: 'DESC' },
    });
  }

  async getConsentLogs(
    limit = 50,
    offset = 0,
  ): Promise<{ records: ConsentRecord[]; total: number }> {
    const [records, total] = await this.consentRepo.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { records, total };
  }
}
