import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  @Get('maintenance')
  async getMaintenanceStatus() {
    return { maintenanceMode: await this.configService.isMaintenanceMode() };
  }

  @Get('feature/:key')
  async getFeature(@Param('key') key: string) {
    const enabled = await this.configService.isFeatureEnabled(key);
    return { feature: key, enabled };
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateConfig(@Body() dto: UpdateConfigDto) {
    return this.configService.updateConfig(dto as any);
  }
}
