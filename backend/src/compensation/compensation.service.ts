import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThan, Brackets } from 'typeorm';
import { Contest, ContestStatus, CompensationStatus as ContestCompensationStatus } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { User } from '../users/entities/user.entity';
import { CompensationLog, CompensationStatus as LogStatus } from './entities/compensation.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';

const COMPENSATION_TIERS: { maxFee: number; points: number }[] = [
  { maxFee: 49, points: 120 },
  { maxFee: 99, points: 250 },
  { maxFee: 199, points: 550 },
  { maxFee: 499, points: 1500 },
];

const MAX_TIER_FEE = 499;
const MAX_TIER_POINTS = 1500;

@Injectable()
export class CompensationService {
  private readonly logger = new Logger(CompensationService.name);

  constructor(
    @InjectRepository(Contest)
    private readonly contestRepo: Repository<Contest>,
    @InjectRepository(ContestMember)
    private readonly contestMemberRepo: Repository<ContestMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CompensationLog)
    private readonly compensationLogRepo: Repository<CompensationLog>,
    private readonly pointsEngineService: PointsEngineService,
    private readonly notificationsService: NotificationsService,
    private readonly smsService: SmsService,
  ) {}

  calculateCompensationPoints(entryFeeInr: number): number {
    if (entryFeeInr <= 0) return 0;

    for (const tier of COMPENSATION_TIERS) {
      if (entryFeeInr <= tier.maxFee) {
        return tier.points;
      }
    }

    const rate = MAX_TIER_POINTS / MAX_TIER_FEE;
    return Math.round(entryFeeInr * rate);
  }

  async findUncompensatedContests(): Promise<Contest[]> {
    return this.contestRepo
      .createQueryBuilder('contest')
      .leftJoinAndSelect('contest.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('contest.compensationStatus = :status', { status: ContestCompensationStatus.NONE })
      .andWhere(
        new Brackets((qb) => {
          qb.where('contest.status = :completed', { completed: ContestStatus.COMPLETED })
            .andWhere('contest.endTime < :now', { now: new Date() })
            .andWhere('contest.filledSlots < contest.maxSlots')
            .orWhere('contest.status = :cancelled', { cancelled: ContestStatus.CANCELLED });
        }),
      )
      .getMany();
  }

  async findContestWithMembers(contestId: string): Promise<Contest | null> {
    return this.contestRepo.findOne({
      where: { id: contestId },
      relations: { members: { user: true } },
    });
  }

  async processCompensation(contest: Contest): Promise<{ processed: number; totalPoints: number }> {
    if (!contest.members || contest.members.length === 0) {
      contest.compensationStatus = ContestCompensationStatus.PROCESSED;
      await this.contestRepo.save(contest);
      return { processed: 0, totalPoints: 0 };
    }

    // Atomic idempotency guard: claim this contest atomically to prevent double processing
    const claimResult = await this.contestRepo
      .createQueryBuilder()
      .update(Contest)
      .set({ compensationStatus: ContestCompensationStatus.PENDING })
      .where('id = :id', { id: contest.id })
      .andWhere('compensationStatus = :status', { status: ContestCompensationStatus.NONE })
      .execute();

    if (claimResult.affected === 0) {
      this.logger.warn(`Contest ${contest.id} already claimed for compensation by another process`);
      return { processed: 0, totalPoints: 0 };
    }

    let processed = 0;
    let totalPoints = 0;

    for (const member of contest.members) {
      try {
        const entryFee = Number(contest.entryFeeInr);
        const points = this.calculateCompensationPoints(entryFee);

        const user = member.user;
        if (!user) {
          this.logger.warn(`User not found for member ${member.id} in contest ${contest.id}`);
          continue;
        }

        const multiplier = this.pointsEngineService.getMultiplier(user.currentTier);
        const finalPoints = Math.round(points * multiplier);

        await this.userRepo.manager.transaction(async (entityManager: EntityManager) => {
          await this.pointsEngineService.logPointActionWithEntityManager(
            entityManager,
            user.id,
            'contest_compensation',
            points,
            multiplier,
            finalPoints,
          );

          await entityManager.increment(User, { id: user.id }, 'pointsBalance', finalPoints);
          await entityManager.increment(User, { id: user.id }, 'lifetimePoints', finalPoints);
          await entityManager.increment(User, { id: user.id }, 'weeklyPoints', finalPoints);
          await entityManager.increment(User, { id: user.id }, 'monthlyPoints', finalPoints);

          if (member.pointsEarned !== undefined) {
            await entityManager.update(
              ContestMember,
              { id: member.id },
              { pointsEarned: (member.pointsEarned || 0) + finalPoints },
            );
          }

          const log = entityManager.create(CompensationLog, {
            contestId: contest.id,
            userId: user.id,
            entryFeeInr: entryFee,
            compensationPoints: finalPoints,
            status: LogStatus.PROCESSED,
            processedAt: new Date(),
          });
          await entityManager.save(log);
        });

        this.notificationsService.sendCompensationNotification(user.id, finalPoints);

        if (user.phoneNumber) {
          this.smsService.sendCompensationSms(user.phoneNumber, finalPoints, contest.title || 'Unknown Contest');
        }

        processed++;
        totalPoints += finalPoints;
      } catch (error) {
        this.logger.error(
          `Failed to compensate user ${member.userId} for contest ${contest.id}: ${(error as Error).message}`,
        );

        await this.compensationLogRepo.save({
          contestId: contest.id,
          userId: member.userId,
          entryFeeInr: Number(contest.entryFeeInr),
          compensationPoints: 0,
          status: LogStatus.FAILED,
          processedAt: new Date(),
        } as any);
      }
    }

    contest.compensationStatus = ContestCompensationStatus.PROCESSED;
    await this.contestRepo.save(contest);

    return { processed, totalPoints };
  }

  async processPendingCompensations(): Promise<{
    contestsProcessed: number;
    membersCompensated: number;
    totalPointsAwarded: number;
  }> {
    const contests = await this.findUncompensatedContests();
    this.logger.log(`Found ${contests.length} contests requiring compensation`);

    let contestsProcessed = 0;
    let membersCompensated = 0;
    let totalPointsAwarded = 0;

    for (const contest of contests) {
      try {
        const result = await this.processCompensation(contest);
        contestsProcessed++;
        membersCompensated += result.processed;
        totalPointsAwarded += result.totalPoints;
        this.logger.log(
          `Compensated contest ${contest.id}: ${result.processed} members, ${result.totalPoints} points`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process compensation for contest ${contest.id}: ${(error as Error).message}`,
        );
      }
    }

    return { contestsProcessed, membersCompensated, totalPointsAwarded };
  }

  getCompensationLogRepo(): Repository<CompensationLog> {
    return this.compensationLogRepo;
  }

  async getCompensationStats(): Promise<{ total: number; pending: number; totalPoints: number }> {
    const total = await this.compensationLogRepo.count();
    const pending = await this.compensationLogRepo.count({ where: { status: LogStatus.PENDING } });
    const pointsAgg = await this.compensationLogRepo
      .createQueryBuilder('cl')
      .select('COALESCE(SUM(cl.compensationPoints), 0)', 'total')
      .getRawOne();
    return { total, pending, totalPoints: Number(pointsAgg?.total || 0) };
  }

  async getCompensationLogs(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [logs, total] = await this.compensationLogRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { contest: true, user: true },
    });

    return {
      logs: logs.map((l) => ({
        id: l.id,
        contestId: l.contestId,
        contestTitle: l.contest?.title || null,
        userId: l.userId,
        userName: l.user?.fullName || l.user?.phoneNumber || null,
        entryFeeInr: Number(l.entryFeeInr),
        compensationPoints: l.compensationPoints,
        status: l.status,
        processedAt: l.processedAt,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
