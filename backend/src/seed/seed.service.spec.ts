import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contest } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User } from '../users/entities/user.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { SavedPaymentMethod } from '../payment-methods/entities/saved-payment-method.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { Poll } from '../polls/entities/poll.entity';
import { Post } from '../feed/entities/post.entity';
import { Like } from '../feed/entities/like.entity';
import { Comment } from '../feed/entities/comment.entity';
import { Chat } from '../chat/entities/chat.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { Referral } from '../referral/entities/referral.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { SystemConfig } from '../config/entities/system-config.entity';

function createMockRepo() {
  return {
    count: jest.fn().mockResolvedValue(1),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockReturnValue({ id: 'new-id' }),
    save: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SeedService', () => {
  let service: SeedService;

  const mockRepos = {
    contestRepo: createMockRepo(),
    contestMemberRepo: createMockRepo(),
    userRepo: createMockRepo(),
    rewardRepo: createMockRepo(),
    bannerRepo: createMockRepo(),
    achievementRepo: createMockRepo(),
    prizeHomeRepo: createMockRepo(),
    transactionRepo: createMockRepo(),
    paymentMethodRepo: createMockRepo(),
    kycRepo: createMockRepo(),
    withdrawalRepo: createMockRepo(),
    pollRepo: createMockRepo(),
    postRepo: createMockRepo(),
    likeRepo: createMockRepo(),
    commentRepo: createMockRepo(),
    chatRepo: createMockRepo(),
    chatMessageRepo: createMockRepo(),
    chatParticipantRepo: createMockRepo(),
    referralRepo: createMockRepo(),
    supportTicketRepo: createMockRepo(),
    systemConfigRepo: createMockRepo(),
  };

  function setAllCounts(val: number): void {
    for (const key of Object.keys(mockRepos)) {
      mockRepos[key as keyof typeof mockRepos].count.mockResolvedValue(val);
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: getRepositoryToken(Contest),
          useValue: mockRepos.contestRepo,
        },
        {
          provide: getRepositoryToken(ContestMember),
          useValue: mockRepos.contestMemberRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockRepos.userRepo },
        { provide: getRepositoryToken(Reward), useValue: mockRepos.rewardRepo },
        { provide: getRepositoryToken(Banner), useValue: mockRepos.bannerRepo },
        {
          provide: getRepositoryToken(Achievement),
          useValue: mockRepos.achievementRepo,
        },
        {
          provide: getRepositoryToken(PrizeHome),
          useValue: mockRepos.prizeHomeRepo,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepos.transactionRepo,
        },
        {
          provide: getRepositoryToken(SavedPaymentMethod),
          useValue: mockRepos.paymentMethodRepo,
        },
        { provide: getRepositoryToken(Kyc), useValue: mockRepos.kycRepo },
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: mockRepos.withdrawalRepo,
        },
        { provide: getRepositoryToken(Poll), useValue: mockRepos.pollRepo },
        { provide: getRepositoryToken(Post), useValue: mockRepos.postRepo },
        { provide: getRepositoryToken(Like), useValue: mockRepos.likeRepo },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepos.commentRepo,
        },
        { provide: getRepositoryToken(Chat), useValue: mockRepos.chatRepo },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockRepos.chatMessageRepo,
        },
        {
          provide: getRepositoryToken(ChatParticipant),
          useValue: mockRepos.chatParticipantRepo,
        },
        {
          provide: getRepositoryToken(Referral),
          useValue: mockRepos.referralRepo,
        },
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockRepos.supportTicketRepo,
        },
        {
          provide: getRepositoryToken(SystemConfig),
          useValue: mockRepos.systemConfigRepo,
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should backfill when contests exist', async () => {
      mockRepos.contestRepo.count.mockResolvedValue(3);
      mockRepos.contestRepo.findOne.mockResolvedValue({
        id: 'completed-contest',
      });
      setAllCounts(1);
      mockRepos.userRepo.find.mockResolvedValue([]);
      mockRepos.systemConfigRepo.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
    });

    it('should seed mock contests when none exist', async () => {
      mockRepos.contestRepo.count.mockResolvedValue(0);
      mockRepos.contestRepo.save.mockResolvedValue([{ id: 'contest-1' }]);
      mockRepos.contestRepo.findOne.mockResolvedValue(null);
      mockRepos.contestRepo.create.mockReturnValue({ id: 'new-contest-id' });
      setAllCounts(1);
      mockRepos.userRepo.find.mockResolvedValue([]);
      mockRepos.systemConfigRepo.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
      expect(mockRepos.contestRepo.save).toHaveBeenCalled();
    });

    it('should skip seeding if data already exists', async () => {
      mockRepos.contestRepo.count.mockResolvedValue(1);
      mockRepos.contestRepo.findOne.mockResolvedValue({
        id: 'completed-contest',
      });
      mockRepos.contestRepo.findBy.mockResolvedValue([]);
      setAllCounts(1);
      mockRepos.userRepo.find.mockResolvedValue([]);
      mockRepos.systemConfigRepo.find.mockResolvedValue([{ id: 1 }]);

      await expect(service.onApplicationBootstrap()).resolves.not.toThrow();
      expect(mockRepos.rewardRepo.save).not.toHaveBeenCalled();
      expect(mockRepos.bannerRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('seed operations', () => {
    it('should seed rewards when none exist', async () => {
      mockRepos.rewardRepo.count.mockResolvedValue(0);

      await service['_seedRewards']();
      expect(mockRepos.rewardRepo.count).toHaveBeenCalled();
      expect(mockRepos.rewardRepo.save).toHaveBeenCalled();
    });

    it('should skip seeding rewards when already exist', async () => {
      mockRepos.rewardRepo.count.mockResolvedValue(5);

      await service['_seedRewards']();
      expect(mockRepos.rewardRepo.save).not.toHaveBeenCalled();
    });

    it('should seed banners when none exist', async () => {
      mockRepos.bannerRepo.count.mockResolvedValue(0);

      await service['_seedBanners']();
      expect(mockRepos.bannerRepo.save).toHaveBeenCalled();
    });

    it('should seed system config when none exist', async () => {
      mockRepos.systemConfigRepo.find.mockResolvedValue([]);
      mockRepos.systemConfigRepo.create.mockReturnValue({});
      mockRepos.systemConfigRepo.save.mockResolvedValue({});

      await service['_seedSystemConfig']();
      expect(mockRepos.systemConfigRepo.create).toHaveBeenCalled();
      expect(mockRepos.systemConfigRepo.save).toHaveBeenCalled();
    });

    it('should skip system config when already exists', async () => {
      mockRepos.systemConfigRepo.find.mockResolvedValue([
        { id: 1, appName: 'Test' },
      ]);

      await service['_seedSystemConfig']();
      expect(mockRepos.systemConfigRepo.save).not.toHaveBeenCalled();
    });
  });
});
