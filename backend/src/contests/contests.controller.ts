import { Controller, Get, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { ContestsGateway } from './contests.gateway';
import { QueryContestsDto } from './dto/query-contests.dto';
import { JoinContestDto } from './dto/join-contest.dto';
import { CreatePrivateContestDto } from './dto/create-private-contest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/contests')
export class ContestsController {
  constructor(
    private readonly contestsService: ContestsService,
    private readonly contestsGateway: ContestsGateway,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: QueryContestsDto) {
    return this.contestsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.contestsService.findById(id);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  async getMembers(@Param('id') id: string) {
    return this.contestsService.getMembers(id);
  }

  @Get(':id/completed')
  @UseGuards(JwtAuthGuard)
  async getCompletedContestData(@Param('id') id: string) {
    return this.contestsService.getCompletedContestData(id);
  }

  @Get(':id/leaderboard')
  @UseGuards(JwtAuthGuard)
  async getLeaderboard(@Param('id') id: string) {
    return this.contestsService.getLeaderboard(id);
  }

  @Get('code/:code')
  @UseGuards(JwtAuthGuard)
  async findByInviteCode(@Param('code') code: string) {
    return this.contestsService.findByInviteCode(code);
  }

  @Post('private')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createPrivate(
    @Body() dto: CreatePrivateContestDto,
    @GetUser() user: User,
  ) {
    return this.contestsService.createPrivateContest(user.id, dto);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async joinContest(
    @Param('id') id: string,
    @Body() joinContestDto: JoinContestDto,
    @GetUser() user: User,
  ) {
    const result = await this.contestsService.joinContest(user.id, id);
    this.contestsGateway.emitPointUpdate(id, {
      userId: user.id,
      points: result.contest.pointsToJoin,
      activity: 'contest_joined',
      description: 'Joined the contest',
      timestamp: new Date(),
    });
    return result;
  }
}
