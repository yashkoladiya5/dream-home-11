import { Controller, Get, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/banners')
@UseGuards(JwtAuthGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async getActiveBanners() {
    return this.bannersService.getActiveBanners();
  }
}
