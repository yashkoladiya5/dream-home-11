import { Controller, Get, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { QueryContestsDto } from './dto/query-contests.dto';
import { JoinContestDto } from './dto/join-contest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/contests')
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

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

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async joinContest(
    @Param('id') id: string,
    @Body() joinContestDto: JoinContestDto,
    @GetUser() user: User,
  ) {
    return this.contestsService.joinContest(user.id, id);
  }
}
