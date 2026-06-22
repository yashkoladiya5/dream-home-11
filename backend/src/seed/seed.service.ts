import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Contest, ContestType, ContestStatus } from '../contests/entities/contest.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const count = await this.contestRepository.count();
    if (count > 0) {
      this.logger.log(`Backfilling any missing data for ${count} existing contests...`);
      await this._upsertSeedData();
      return;
    }

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
