import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheControl } from '../common/decorators/cache-control.decorator';

@ApiTags('Banners')
@ApiBearerAuth()
@Controller('api/v1/banners')
@UseGuards(JwtAuthGuard)
@CacheControl(300)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  async getActiveBanners() {
    return this.bannersService.getActiveBanners();
  }
}
