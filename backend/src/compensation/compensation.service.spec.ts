import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompensationService } from './compensation.service';
import {
  Contest,
  ContestStatus,
  CompensationStatus as ContestCompensationStatus,
} from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { CompensationLog } from './entities/compensation.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';

describe('CompensationService', () => {
  let service: CompensationService;
  let contestRepo: Partial<Record<keyof Repository<Contest>, jest.Mock>>;
  let contestMemberRepo: Partial<
    Record<keyof Repository<ContestMember>, jest.Mock>
  >;
  let userRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let compensationLogRepo: Partial<
    Record<keyof Repository<CompensationLog>, jest.Mock>
  >;

  const mockPointsEngineService = {
    getMultiplier: jest.fn().mockReturnValue(1.0),
    logPointActionWithEntityManager: jest.fn().mockResolvedValue({}),
  };

  const mockNotificationsService = {
    sendCompensationNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockSmsService = {
    sendCompensationSms: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    contestRepo = {
      find: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    contestMemberRepo = {};
    userRepo = {
      manager: {
        transaction: jest.fn().mockImplementation(async (cb) => {
          return cb({
            increment: jest.fn(),
            update: jest.fn(),
            create: jest.fn().mockImplementation((d) => d),
            save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
          });
        }),
      } as any,
    };
    compensationLogRepo = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompensationService,
        { provide: getRepositoryToken(Contest), useValue: contestRepo },
        {
          provide: getRepositoryToken(ContestMember),
          useValue: contestMemberRepo,
        },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(CompensationLog),
          useValue: compensationLogRepo,
        },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<CompensationService>(CompensationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCompensationPoints', () => {
    it('should return correct points for slabs', () => {
      expect(service.calculateCompensationPoints(49)).toBe(120);
      expect(service.calculateCompensationPoints(99)).toBe(250);
      expect(service.calculateCompensationPoints(199)).toBe(550);
      expect(service.calculateCompensationPoints(499)).toBe(1500);
      expect(service.calculateCompensationPoints(0)).toBe(0);
      expect(service.calculateCompensationPoints(-10)).toBe(0);
      // Slab checks (e.g. 300 should return the 499 slab points, which is 1500)
      expect(service.calculateCompensationPoints(300)).toBe(1500);
      // Interpolation check above 499
      expect(service.calculateCompensationPoints(600)).toBe(
        Math.round(600 * (1500 / 499)),
      );
    });
  });

  describe('autoCloseExpiredContests', () => {
    it('should mark expired contest with filledSlots >= maxSlots as COMPLETED', async () => {
      const contest = {
        id: 'c-1',
        title: 'Contest 1',
        status: ContestStatus.RUNNING,
        filledSlots: 10,
        maxSlots: 10,
        endTime: new Date(Date.now() - 10000),
      } as Contest;

      contestRepo.find = jest.fn().mockResolvedValue([contest]);
      contestRepo.save = jest.fn().mockResolvedValue(contest);

      const result = await service.autoCloseExpiredContests();
      expect(result.completed).toBe(1);
      expect(result.cancelled).toBe(0);
      expect(contest.status).toBe(ContestStatus.COMPLETED);
      expect(contestRepo.save).toHaveBeenCalledWith(contest);
    });

    it('should mark expired contest with filledSlots < maxSlots as CANCELLED', async () => {
      const contest = {
        id: 'c-2',
        title: 'Contest 2',
        status: ContestStatus.RUNNING,
        filledSlots: 5,
        maxSlots: 10,
        endTime: new Date(Date.now() - 10000),
      } as Contest;

      contestRepo.find = jest.fn().mockResolvedValue([contest]);
      contestRepo.save = jest.fn().mockResolvedValue(contest);

      const result = await service.autoCloseExpiredContests();
      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(1);
      expect(contest.status).toBe(ContestStatus.CANCELLED);
      expect(contestRepo.save).toHaveBeenCalledWith(contest);
    });

    it('should not modify active contests', async () => {
      contestRepo.find = jest.fn().mockResolvedValue([]);
      const result = await service.autoCloseExpiredContests();
      expect(result.completed).toBe(0);
      expect(result.cancelled).toBe(0);
    });
  });
});
