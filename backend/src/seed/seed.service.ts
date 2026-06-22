import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      this.logger.log(`Seeding skipped — ${count} contests already exist`);
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
      },
    ];

    await this.contestRepository.save(contests);
    this.logger.log(`Seeded ${contests.length} mock contests successfully`);
  }
}
