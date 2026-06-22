import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { QueryContestsDto } from './dto/query-contests.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
