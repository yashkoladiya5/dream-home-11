import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { PollVote } from './entities/poll-vote.entity';
import { UsersService } from '../users/users.service';
import { PointsEngineService } from '../points/points-engine.service';
import { TransactionsService } from '../transactions/transactions.service';
import { UserLevel } from '../users/entities/user.entity';

@Injectable()
export class PollsService {
  private readonly VOTE_POINTS = 20;

  constructor(
    @InjectRepository(Poll)
    private readonly pollRepo: Repository<Poll>,
    @InjectRepository(PollVote)
    private readonly voteRepo: Repository<PollVote>,
    private readonly usersService: UsersService,
    private readonly pointsEngineService: PointsEngineService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async getActivePoll(): Promise<Poll | null> {
    const now = new Date();
    const poll = await this.pollRepo.findOne({
      where: {
        isActive: true,
        activeFrom: LessThanOrEqual(now),
        activeTo: MoreThanOrEqual(now),
      },
      order: { activeFrom: 'DESC' },
    });
    return poll || null;
  }

  async getPollResults(pollId: string): Promise<{
    poll: Poll;
    results: { option: string; count: number; percentage: number }[];
    userVote: { selectedOption: number } | null;
    totalVotes: number;
  }> {
    const poll = await this.pollRepo.findOne({ where: { id: pollId } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const votes = await this.voteRepo.find({ where: { pollId } });
    const totalVotes = votes.length;

    const results = poll.options.map((option, idx) => {
      const count = votes.filter((v) => v.selectedOption === idx).length;
      const percentage = totalVotes > 0
        ? Math.round((count / totalVotes) * 100)
        : 0;
      return { option, count, percentage };
    });

    return { poll, results, userVote: null, totalVotes };
  }

  async getUserVote(
    userId: string,
    pollId: string,
  ): Promise<{ selectedOption: number } | null> {
    const vote = await this.voteRepo.findOne({
      where: { userId, pollId },
    });
    return vote ? { selectedOption: vote.selectedOption } : null;
  }

  async vote(
    userId: string,
    pollId: string,
    selectedOption: number,
  ): Promise<{
    success: boolean;
    message: string;
    pointsAwarded: number;
    results: { option: string; count: number; percentage: number }[];
    userVote: { selectedOption: number };
    totalVotes: number;
  }> {
    const poll = await this.pollRepo.findOne({ where: { id: pollId } });
    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    const now = new Date();
    if (now < poll.activeFrom || now > poll.activeTo) {
      throw new BadRequestException('This poll is not currently active');
    }

    if (selectedOption < 0 || selectedOption >= poll.options.length) {
      throw new BadRequestException('Invalid option selected');
    }

    const existingVote = await this.voteRepo.findOne({
      where: { userId, pollId },
    });
    if (existingVote) {
      throw new BadRequestException('You have already voted on this poll');
    }

    const vote = this.voteRepo.create({
      userId,
      pollId,
      selectedOption,
    });
    await this.voteRepo.save(vote);

    poll.totalVotes += 1;
    await this.pollRepo.save(poll);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const prevPoints = Number(user.pointsBalance);
    const prevLifetime = Number(user.lifetimePoints);
    user.pointsBalance = prevPoints + this.VOTE_POINTS;
    user.lifetimePoints = prevLifetime + this.VOTE_POINTS;

    if (user.lifetimePoints >= 5000) {
      user.currentTier = UserLevel.PLATINUM;
    } else if (user.lifetimePoints >= 2000) {
      user.currentTier = UserLevel.GOLD;
    } else if (user.lifetimePoints >= 1000) {
      user.currentTier = UserLevel.SILVER;
    }

    await this.usersService.updateUser(user);

    await this.pointsEngineService.logPointAction(
      userId,
      'daily_poll_vote',
      this.VOTE_POINTS,
      1.0,
      this.VOTE_POINTS,
    );

    await this.transactionsService.logTransaction({
      userId,
      type: 'points_earned',
      pointsAmount: this.VOTE_POINTS,
      pointsBalanceBefore: prevPoints,
      pointsBalanceAfter: user.pointsBalance,
      description: 'Daily poll vote reward',
      referenceType: 'poll_vote',
      referenceId: pollId,
    });

    const allVotes = await this.voteRepo.find({ where: { pollId } });
    const totalVotes = allVotes.length;
    const results = poll.options.map((option, idx) => {
      const count = allVotes.filter((v) => v.selectedOption === idx).length;
      const percentage = Math.round((count / totalVotes) * 100);
      return { option, count, percentage };
    });

    return {
      success: true,
      message: `Vote recorded! You earned ${this.VOTE_POINTS} points.`,
      pointsAwarded: this.VOTE_POINTS,
      results,
      userVote: { selectedOption },
      totalVotes,
    };
  }
}
