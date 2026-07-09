import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { KycService } from './kyc.service';
import { Kyc, KycStatus } from './entities/kyc.entity';
import { User } from '../users/entities/user.entity';
import { createMockRepository, MockRepository } from '../test/mock-repository.factory';
import { createMockDataSource, createMockReferralService, createMockAuditService, createMockEncryptionService } from '../test/mock-services.factory';
import { ReferralService } from '../referral/referral.service';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../common/encryption/encryption.service';

describe('KycService', () => {
  let service: KycService;
  let kycRepo: MockRepository<Kyc>;
  let userRepo: MockRepository<User>;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockEncryptionService: ReturnType<typeof createMockEncryptionService>;
  let mockReferralService: ReturnType<typeof createMockReferralService>;
  let mockAuditService: ReturnType<typeof createMockAuditService>;

  const mockKyc: Kyc = {
    id: 'kyc-1',
    userId: 'user-1',
    aadhaarNumber: 'encrypted:123456789012',
    panNumber: 'encrypted:ABCDE1234F',
    status: KycStatus.PENDING,
    verifiedAt: null,
    rejectionReason: null,
    aadhaarFrontUrl: null,
    aadhaarBackUrl: null,
    panCardUrl: null,
    selfieUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: null as any,
  };

  beforeEach(async () => {
    kycRepo = createMockRepository<Kyc>();
    userRepo = createMockRepository<User>();
    mockDataSource = createMockDataSource();
    mockEncryptionService = createMockEncryptionService();
    mockReferralService = createMockReferralService();
    mockAuditService = createMockAuditService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getRepositoryToken(Kyc), useValue: kycRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ReferralService, useValue: mockReferralService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<KycService>(KycService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitKyc', () => {
    it('should submit KYC successfully', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(null);
      (kycRepo.create as jest.Mock).mockReturnValue(mockKyc);
      (kycRepo.save as jest.Mock).mockResolvedValue(mockKyc);

      const result = await service.submitKyc('user-1', '123456789012', 'ABCDE1234F', 'Test User');
      expect(result.status).toBe(KycStatus.PENDING);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledTimes(2);
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockReferralService.processKycReferral).toHaveBeenCalledWith('user-1');
    });

    it('should throw ConflictException when KYC already submitted', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(mockKyc);
      await expect(service.submitKyc('user-1', '123456789012', 'ABCDE1234F', 'Test')).rejects.toThrow(ConflictException);
    });

    it('should update user full name when provided', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(null);
      (kycRepo.create as jest.Mock).mockReturnValue(mockKyc);
      (kycRepo.save as jest.Mock).mockResolvedValue(mockKyc);

      await service.submitKyc('user-1', '123456789012', 'ABCDE1234F', 'Updated Name');
      expect(userRepo.update).toHaveBeenCalledWith('user-1', { fullName: 'Updated Name' });
    });

    it('should not update user full name when empty', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(null);
      (kycRepo.create as jest.Mock).mockReturnValue(mockKyc);
      (kycRepo.save as jest.Mock).mockResolvedValue(mockKyc);

      await service.submitKyc('user-1', '123456789012', 'ABCDE1234F', '');
      expect(userRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('getKycStatus', () => {
    it('should return pending status when KYC record exists', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(mockKyc);
      const result = await service.getKycStatus('user-1');
      expect(result.status).toBe('pending');
    });

    it('should return unverified status when no KYC record', async () => {
      (kycRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.getKycStatus('user-1');
      expect(result.status).toBe('unverified');
      expect(result.verifiedAt).toBeNull();
    });

    it('should return approved status with verified date', async () => {
      const approvedKyc = { ...mockKyc, status: KycStatus.APPROVED, verifiedAt: new Date('2025-01-01') };
      (kycRepo.findOne as jest.Mock).mockResolvedValue(approvedKyc);
      const result = await service.getKycStatus('user-1');
      expect(result.status).toBe('approved');
      expect(result.verifiedAt).toBeDefined();
    });
  });

  describe('uploadDocument', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should upload document and update KYC record', async () => {
      const file = { buffer: Buffer.from('fake-image-data'), originalname: 'photo.jpg', mimetype: 'image/jpeg' } as Express.Multer.File;
      const manager = {
        findOne: jest.fn().mockResolvedValue(mockKyc),
        save: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.uploadDocument('user-1', 'aadhaar_front', file);
      expect(result.url).toContain('/uploads/kyc/user-1/');
    });

    it('should create a new KYC record if none exists', async () => {
      const file = { buffer: Buffer.from('data'), originalname: 'selfie.jpg' } as Express.Multer.File;
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue({ id: 'new-kyc', userId: 'user-1', status: KycStatus.PENDING }),
        create: jest.fn().mockReturnValue({ userId: 'user-1', status: KycStatus.PENDING }),
      };
      mockDataSource.transaction.mockImplementation(async (cb: any) => cb(manager));

      const result = await service.uploadDocument('user-1', 'selfie', file);
      expect(result.url).toBeDefined();
    });

    it('should throw BadRequestException for invalid document type', async () => {
      const file = { buffer: Buffer.from('data'), originalname: 'doc.jpg' } as Express.Multer.File;
      await expect(service.uploadDocument('user-1', 'invalid_type', file)).rejects.toThrow(BadRequestException);
    });
  });
});
