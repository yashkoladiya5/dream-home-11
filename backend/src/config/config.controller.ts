import { Controller, Get } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('api/v1/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Get('maintenance')
  getMaintenanceStatus() {
    return { maintenanceMode: this.configService.isMaintenanceMode() };
  }
}
