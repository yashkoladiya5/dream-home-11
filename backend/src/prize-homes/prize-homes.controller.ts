import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PrizeHomesService } from './prize-homes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/prize-homes')
@UseGuards(JwtAuthGuard)
export class PrizeHomesController {
  constructor(private readonly prizeHomesService: PrizeHomesService) {}

  @Get()
  async getCatalog() {
    return this.prizeHomesService.getCatalog();
  }

  @Get('cities')
  async getCities() {
    return this.prizeHomesService.getCities();
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit?: string) {
    return this.prizeHomesService.getFeatured(limit ? parseInt(limit, 10) : 5);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.prizeHomesService.getById(id);
  }
}
