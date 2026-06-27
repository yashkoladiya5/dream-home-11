import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/polls')
@UseGuards(JwtAuthGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get('active')
  async getActivePoll(@Req() req) {
    const poll = await this.pollsService.getActivePoll();
    if (!poll) {
      return { message: 'No active poll available' };
    }
    const userVote = await this.pollsService.getUserVote(req.user.id, poll.id);
    return { poll, userVote };
  }

  @Get(':id/results')
  async getResults(@Param('id') id: string, @Req() req) {
    const userVote = await this.pollsService.getUserVote(req.user.id, id);
    const data = await this.pollsService.getPollResults(id);
    return { ...data, userVote };
  }

  @Post('vote')
  async vote(
    @Req() req,
    @Body('pollId') pollId: string,
    @Body('selectedOption') selectedOption: number,
  ) {
    return this.pollsService.vote(req.user.id, pollId, selectedOption);
  }
}
