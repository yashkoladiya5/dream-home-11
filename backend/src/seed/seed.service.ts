import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Contest, ContestType, ContestStatus } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User, UserLevel } from '../users/entities/user.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Achievement } from '../achievements/entities/achievement.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepository: Repository<ContestMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.contestRepository.count();
    if (count > 0) {
      this.logger.log(`Backfilling any missing data for ${count} existing contests...`);
      await this._upsertSeedData();
    } else {
      this.logger.log('Seeding mock contests...');

      const now = new Date();

      const contests: Partial<Contest>[] = [
        {
          title: 'Mega Dream Home Contest',
          type: ContestType.MEGA,
          entryFeeInr: 49.0,
          pointsToJoin: 100,
          maxSlots: 10000,
          filledSlots: 3420,
          prize: '3 BHK Luxury Apartment in Mumbai',
          badgeText: 'MEGA PRIZE',
          badgeColor: '#F59E0B',
          startTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
          status: ContestStatus.RUNNING,
          rules: '1. Entry fee is non-refundable.\n2. Winner will be selected via a lucky draw at the end of the contest period.\n3. Participants must have a valid KYC to claim the prize.\n4. The mega prize apartment is located in Mumbai and the winner must be 18+.\n5. Dream11 reserves the right to modify or cancel the contest.',
        },
        {
          title: 'Weekend Villa Clash',
          type: ContestType.NORMAL,
          entryFeeInr: 99.0,
          pointsToJoin: 250,
          maxSlots: 5000,
          filledSlots: 1200,
          prize: 'Premium Villa Weekend Gateway',
          badgeText: 'HOT',
          badgeColor: '#D22C2C',
          startTime: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
          status: ContestStatus.RUNNING,
          rules: '1. Entry fee is non-refundable.\n2. The winner gets a 3-day, 2-night stay at a premium villa.\n3. Travel and accommodation are covered by Dream11.\n4. Valid KYC must be completed before claiming.\n5. Contest is open to Indian residents only.',
        },
        {
          title: 'Starter Dream Cottage',
          type: ContestType.NORMAL,
          entryFeeInr: 19.0,
          pointsToJoin: 30,
          maxSlots: 1000,
          filledSlots: 950,
          prize: 'Mountain Cottage Stay & Title',
          badgeText: 'FAST FILLING',
          badgeColor: '#10B981',
          startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: ContestStatus.RUNNING,
          rules: '1. Entry fee is non-refundable.\n2. The winner receives a weekend stay at a mountain cottage.\n3. Transportation is not included.\n4. Must be 18+ to participate.\n5. Only one entry per user.',
        },
        {
          title: 'Luxury Penthouse Showdown',
          type: ContestType.MEGA,
          entryFeeInr: 199.0,
          pointsToJoin: 500,
          maxSlots: 2000,
          filledSlots: 0,
          prize: 'Sea-facing Penthouse in Goa',
          badgeText: 'COMING SOON',
          badgeColor: '#8B5CF6',
          startTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 44 * 24 * 60 * 60 * 1000),
          status: ContestStatus.UPCOMING,
          rules: '1. Contest starts on the scheduled date.\n2. The sea-facing penthouse is located in North Goa.\n3. Winner must complete KYC within 7 days of announcement.\n4. All applicable taxes will be borne by the winner.\n5. Dream11 employees are not eligible to participate.',
        },
        {
          title: 'Beach Villa Bonanza',
          type: ContestType.HOME,
          entryFeeInr: 49.0,
          pointsToJoin: 120,
          maxSlots: 5000,
          filledSlots: 890,
          prize: 'Beachfront Villa in Kerala',
          badgeText: 'HOME PRIZE',
          badgeColor: '#06B6D4',
          startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
          status: ContestStatus.RUNNING,
          rules: '1. Entry fee is non-refundable.\n2. Winner gets a beachfront villa in Kerala valued at ₹2.5 Cr.\n3. The prize will be transferred after legal formalities.\n4. Must have a valid PAN card and KYC.\n5. Multiple entries allowed, but only one prize per winner.',
        },
        {
          title: 'Champions Private League',
          type: ContestType.PRIVATE,
          entryFeeInr: 149.0,
          pointsToJoin: 350,
          maxSlots: 100,
          filledSlots: 42,
          prize: 'Exclusive Club Championship Trophy',
          badgeText: 'PRIVATE',
          badgeColor: '#F97316',
          startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() + 29 * 24 * 60 * 60 * 1000),
          status: ContestStatus.RUNNING,
          rules: '1. Private league — invite only.\n2. Entry fee is non-refundable.\n3. The championship trophy will be awarded at a ceremony.\n4. Participants must maintain fair play standards.\n5. Dream11 reserves the right to disqualify any participant for misconduct.',
        },
      ];

      await this.contestRepository.save(contests);
      this.logger.log(`Seeded ${contests.length} mock contests successfully`);
    }

    await this._ensureCompletedContest();
    await this._seedRewards();
    await this._seedMoreCompletedContests();
    await this._seedBanners();
    await this._seedAchievements();
  }

  private async _ensureCompletedContest(): Promise<void> {
    const existing = await this.contestRepository.findOne({ where: { status: ContestStatus.COMPLETED } });
    if (existing) return;

    const now = new Date();
    const contest = this.contestRepository.create({
      title: 'Grand Prix Finale 2026',
      type: ContestType.NORMAL,
      entryFeeInr: 99.0,
      pointsToJoin: 200,
      maxSlots: 50,
      filledSlots: 50,
      prize: '₹50,000 Grand Prize',
      badgeText: 'COMPLETED',
      badgeColor: '#6B7280',
      inviteCode: undefined,
      startTime: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: ContestStatus.COMPLETED,
      rules: '1. Entry fee is non-refundable.\n2. This contest has been completed.\n3. Winners will be contacted via registered mobile number.\n4. Prize distribution within 7 working days.\n5. All decisions are final.',
    });

    await this.contestRepository.save(contest);

    const memberNames = ['Aarav Sharma', 'Priya Patel', 'Rahul Verma', 'Sneha Reddy', 'Vikram Singh'];
    const memberPoints = [1200, 950, 780, 540, 310];

    for (let i = 0; i < memberNames.length; i++) {
      let user = await this.userRepository.findOne({ where: { phoneNumber: `+9190000000${i}` } });
      if (!user) {
        user = this.userRepository.create({
          fullName: memberNames[i],
          phoneNumber: `+9190000000${i}`,
          walletBalanceInr: 0,
          pointsBalance: 0,
          lifetimePoints: memberPoints[i],
          currentTier: this.getTierForPoints(memberPoints[i]),
          isActive: true,
          deviceId: `seed-device-${i}`,
        });
        await this.userRepository.save(user);
      }

      const member = this.contestMemberRepository.create({
        contestId: contest.id,
        userId: user.id,
        pointsEarned: memberPoints[i],
        joinedAt: new Date(now.getTime() - (15 + i) * 24 * 60 * 60 * 1000),
      });
      await this.contestMemberRepository.save(member);
    }

    this.logger.log(`Seeded completed contest "${contest.title}" with ${memberNames.length} members`);
  }

  private async _seedMoreCompletedContests(): Promise<void> {
    const existing = await this.contestRepository.find({ where: { status: ContestStatus.COMPLETED } });
    if (existing.length >= 3) {
      this.logger.log('Additional completed contests already exist — skipping');
      return;
    }

    const now = new Date();
    const moreContests: Partial<Contest>[] = [
      {
        title: 'Dream Villa Championship',
        type: ContestType.NORMAL as any,
        entryFeeInr: 149.0,
        pointsToJoin: 300,
        maxSlots: 100,
        filledSlots: 100,
        prize: 'Luxury Villa in Lonavala',
        badgeText: 'COMPLETED',
        badgeColor: '#6B7280',
        inviteCode: undefined,
        startTime: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        status: ContestStatus.COMPLETED,
        rules: '1. Entry fee is non-refundable.\n2. This contest has been completed.\n3. Winners will be contacted via registered mobile number.\n4. Prize distribution within 7 working days.\n5. All decisions are final.',
      },
      {
        title: 'Premier League Showdown',
        type: ContestType.MEGA as any,
        entryFeeInr: 199.0,
        pointsToJoin: 500,
        maxSlots: 500,
        filledSlots: 500,
        prize: '₹1,00,000 Grand Cash Prize',
        badgeText: 'COMPLETED',
        badgeColor: '#6B7280',
        inviteCode: undefined,
        startTime: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        status: ContestStatus.COMPLETED,
        rules: '1. Entry fee is non-refundable.\n2. This mega contest has been completed.\n3. Top 3 winners will receive cash prizes.\n4. Winners must complete KYC within 7 days.\n5. All decisions are final.',
      },
    ];

    for (const contestData of moreContests) {
      const contest = this.contestRepository.create(contestData);
      await this.contestRepository.save(contest);

      const memberNames = [
        ['Rohit Sharma', 'Sara Khan', 'Amit Patel'],
        ['Priya Singh', 'Arun Kumar', 'Neha Gupta'],
      ];
      const memberPoints = [
        [1500, 1100, 750],
        [2000, 1600, 1200],
      ];

      const idx = moreContests.indexOf(contestData);
      const names = memberNames[idx];
      const points = memberPoints[idx];

      for (let i = 0; i < names.length; i++) {
        const phoneNumber = `+9191000000${idx * 3 + i}`;
        let user = await this.userRepository.findOne({ where: { phoneNumber } });
        if (!user) {
          user = this.userRepository.create({
            fullName: names[i],
            phoneNumber,
            walletBalanceInr: 0,
            pointsBalance: 0,
            lifetimePoints: points[i],
            currentTier: this.getTierForPoints(points[i]),
            isActive: true,
            deviceId: `seed-device-extra-${idx}-${i}`,
          });
          await this.userRepository.save(user);
        }

        const member = this.contestMemberRepository.create({
          contestId: contest.id,
          userId: user.id,
          pointsEarned: points[i],
          joinedAt: new Date(now.getTime() - (50 + idx * 10 + i) * 24 * 60 * 60 * 1000),
        });
        await this.contestMemberRepository.save(member);
      }
    }

    this.logger.log(`Seeded ${moreContests.length} additional completed contests with winners`);
  }

  private async _seedRewards(): Promise<void> {
    const count = await this.rewardRepository.count();
    if (count > 0) {
      this.logger.log(`Rewards already seeded (${count} existing) — skipping`);
      return;
    }

    const rewards: Partial<Reward>[] = [
      {
        title: '₹100 Amazon Gift Card',
        description: 'Redeem for any product on Amazon.in. Instant digital delivery to your email.',
        imageUrl: null,
        pointsRequired: 500,
        stock: 100,
        category: 'gift_card',
        isActive: true,
        sortOrder: 1,
      },
      {
        title: '₹500 Flipkart Voucher',
        description: 'Shop anything on Flipkart with this digital gift voucher. Valid for 6 months.',
        imageUrl: null,
        pointsRequired: 2000,
        stock: 50,
        category: 'gift_card',
        isActive: true,
        sortOrder: 2,
      },
      {
        title: '₹1000 Myntra Voucher',
        description: 'Fashion & lifestyle shopping voucher for Myntra. Valid on all products.',
        imageUrl: null,
        pointsRequired: 3500,
        stock: 30,
        category: 'gift_card',
        isActive: true,
        sortOrder: 3,
      },
      {
        title: 'Dream11 Premium Cap',
        description: 'Official Dream11 premium cotton cap with embroidered logo. One size fits all.',
        imageUrl: null,
        pointsRequired: 800,
        stock: 20,
        category: 'merchandise',
        isActive: true,
        sortOrder: 4,
      },
      {
        title: 'Dream11 Branded T-Shirt',
        description: 'Premium quality black t-shirt with Dream11 signature print. Available in M, L, XL.',
        imageUrl: null,
        pointsRequired: 1200,
        stock: 15,
        category: 'merchandise',
        isActive: true,
        sortOrder: 5,
      },
      {
        title: 'Dream11 Limited Edition Hoodie',
        description: 'Exclusive limited edition fleece hoodie. Only 10 ever produced. Collectors item.',
        imageUrl: null,
        pointsRequired: 2500,
        stock: 10,
        category: 'merchandise',
        isActive: true,
        sortOrder: 6,
      },
      {
        title: '1 Month Dream11 Premium',
        description: 'Unlock premium contests, exclusive rewards, and priority support for 1 month.',
        imageUrl: null,
        pointsRequired: 1500,
        stock: null,
        category: 'subscription',
        isActive: true,
        sortOrder: 7,
      },
      {
        title: '3 Month Dream11 Premium',
        description: 'Premium subscription for 3 months. Best value for dedicated players.',
        imageUrl: null,
        pointsRequired: 3500,
        stock: null,
        category: 'subscription',
        isActive: true,
        sortOrder: 8,
      },
      {
        title: '1 Year Dream11 Premium',
        description: 'Full year of Dream11 Premium. All benefits unlocked for 12 months.',
        imageUrl: null,
        pointsRequired: 8000,
        stock: null,
        category: 'subscription',
        isActive: true,
        sortOrder: 9,
      },
      {
        title: 'Exclusive Dream11 Trophy Replica',
        description: 'Gold-plated miniature replica of the Dream11 Championship Trophy. Numbered edition.',
        imageUrl: null,
        pointsRequired: 5000,
        stock: 5,
        category: 'special',
        isActive: true,
        sortOrder: 10,
      },
      {
        title: 'VIP Contest Direct Entry Pass',
        description: 'Direct entry to any VIP contest of your choice for one year. Skip the queue!',
        imageUrl: null,
        pointsRequired: 10000,
        stock: 3,
        category: 'special',
        isActive: true,
        sortOrder: 11,
      },
    ];

    await this.rewardRepository.save(rewards);
    this.logger.log(`Seeded ${rewards.length} rewards successfully`);
  }

  private async _seedAchievements(): Promise<void> {
    const count = await this.achievementRepository.count();
    if (count > 0) {
      this.logger.log(`Achievements already seeded (${count} existing) — skipping`);
      return;
    }

    const achievements: Partial<Achievement>[] = [
      {
        key: 'first_contest',
        title: 'First Steps',
        description: 'Join your first contest',
        icon: 'emoji_events',
        bonusPoints: 50,
        sortOrder: 1,
      },
      {
        key: 'ten_contests',
        title: 'Dedicated Player',
        description: 'Join 10 contests',
        icon: 'military_tech',
        bonusPoints: 100,
        sortOrder: 2,
      },
      {
        key: 'fifty_contests',
        title: 'Contest Veteran',
        description: 'Join 50 contests',
        icon: 'workspace_premium',
        bonusPoints: 500,
        sortOrder: 3,
      },
      {
        key: 'streak_7',
        title: 'Streak Master',
        description: 'Achieve a 7-day login streak',
        icon: 'local_fire_department',
        bonusPoints: 100,
        sortOrder: 4,
      },
      {
        key: 'streak_30',
        title: 'Streak Legend',
        description: 'Achieve a 30-day login streak',
        icon: 'whatshot',
        bonusPoints: 500,
        sortOrder: 5,
      },
      {
        key: 'share_first',
        title: 'Social Butterfly',
        description: 'Share the app for the first time',
        icon: 'share',
        bonusPoints: 25,
        sortOrder: 6,
      },
      {
        key: 'share_ten',
        title: 'Influencer',
        description: 'Share the app 10 times',
        icon: 'groups',
        bonusPoints: 100,
        sortOrder: 7,
      },
      {
        key: 'points_5000',
        title: 'Points Collector',
        description: 'Earn 5,000 lifetime points',
        icon: 'stars',
        bonusPoints: 300,
        sortOrder: 8,
      },
      {
        key: 'points_10000',
        title: 'Points Millionaire',
        description: 'Earn 10,000 lifetime points',
        icon: 'auto_awesome',
        bonusPoints: 800,
        sortOrder: 9,
      },
      {
        key: 'first_redeem',
        title: 'Premium Member',
        description: 'Redeem your first reward',
        icon: 'card_giftcard',
        bonusPoints: 150,
        sortOrder: 10,
      },
    ];

    await this.achievementRepository.save(achievements);
    this.logger.log(`Seeded ${achievements.length} achievements successfully`);
  }

  private async _seedBanners(): Promise<void> {
    const count = await this.bannerRepository.count();
    if (count > 0) {
      this.logger.log(`Banners already seeded (${count} existing) — skipping`);
      return;
    }

    const banners: Partial<Banner>[] = [
      {
        title: 'Mega Dream Contest',
        subtitle: 'Win a 3 BHK Luxury Apartment in Mumbai! Entry starts at just ₹49.',
        imageUrl: null,
        link: '/mega-contests',
        linkLabel: 'JOIN NOW',
        backgroundColor: '#D22C2C',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Rewards Catalog',
        subtitle: 'Redeem your points for gift cards, merchandise & more!',
        imageUrl: null,
        link: '/rewards',
        linkLabel: 'EXPLORE',
        backgroundColor: '#F59E0B',
        sortOrder: 2,
        isActive: true,
      },
      {
        title: 'Share & Earn',
        subtitle: 'Invite friends and earn bonus points for every referral!',
        imageUrl: null,
        link: '/share-tracker',
        linkLabel: 'SHARE NOW',
        backgroundColor: '#10B981',
        sortOrder: 3,
        isActive: true,
      },
      {
        title: 'Complete Your KYC',
        subtitle: 'Verify your account to unlock all features and win big prizes!',
        imageUrl: null,
        link: '/home',
        linkLabel: 'VERIFY',
        backgroundColor: '#8B5CF6',
        sortOrder: 4,
        isActive: true,
      },
      {
        title: 'Premium Membership',
        subtitle: 'Go premium for exclusive contests, rewards & priority support.',
        imageUrl: null,
        link: '/rewards',
        linkLabel: 'LEARN MORE',
        backgroundColor: '#D22C2C',
        sortOrder: 5,
        isActive: true,
      },
    ];

    await this.bannerRepository.save(banners);
    this.logger.log(`Seeded ${banners.length} banners successfully`);
  }

  private getTierForPoints(points: number): UserLevel {
    if (points >= 5000) return UserLevel.PLATINUM;
    if (points >= 2000) return UserLevel.GOLD;
    if (points >= 1000) return UserLevel.SILVER;
    return UserLevel.BRONZE;
  }

  private async _upsertSeedData(): Promise<void> {
    const rulesByTitle: Record<string, string> = {
      'Mega Dream Home Contest': '1. Entry fee is non-refundable.\n2. Winner will be selected via a lucky draw at the end of the contest period.\n3. Participants must have a valid KYC to claim the prize.\n4. The mega prize apartment is located in Mumbai and the winner must be 18+.\n5. Dream11 reserves the right to modify or cancel the contest.',
      'Weekend Villa Clash': '1. Entry fee is non-refundable.\n2. The winner gets a 3-day, 2-night stay at a premium villa.\n3. Travel and accommodation are covered by Dream11.\n4. Valid KYC must be completed before claiming.\n5. Contest is open to Indian residents only.',
      'Starter Dream Cottage': '1. Entry fee is non-refundable.\n2. The winner receives a weekend stay at a mountain cottage.\n3. Transportation is not included.\n4. Must be 18+ to participate.\n5. Only one entry per user.',
      'Luxury Penthouse Showdown': '1. Contest starts on the scheduled date.\n2. The sea-facing penthouse is located in North Goa.\n3. Winner must complete KYC within 7 days of announcement.\n4. All applicable taxes will be borne by the winner.\n5. Dream11 employees are not eligible to participate.',
      'Beach Villa Bonanza': '1. Entry fee is non-refundable.\n2. Winner gets a beachfront villa in Kerala valued at ₹2.5 Cr.\n3. The prize will be transferred after legal formalities.\n4. Must have a valid PAN card and KYC.\n5. Multiple entries allowed, but only one prize per winner.',
      'Champions Private League': '1. Private league — invite only.\n2. Entry fee is non-refundable.\n3. The championship trophy will be awarded at a ceremony.\n4. Participants must maintain fair play standards.\n5. Dream11 reserves the right to disqualify any participant for misconduct.',
    };

    const existing = await this.contestRepository.findBy({ rules: IsNull() });
    for (const contest of existing) {
      const rules = rulesByTitle[contest.title];
      if (rules) {
        await this.contestRepository.update(contest.id, { rules });
        this.logger.log(`  Updated rules for "${contest.title}"`);
      }
    }
    if (existing.length === 0) {
      this.logger.log('  All contests already have rules — nothing to backfill');
    }
  }
}
