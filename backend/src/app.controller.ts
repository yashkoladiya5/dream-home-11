import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // Root controller constructor injecting AppService
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipThrottle()
  getHello(): string {
    return this.appService.getHello();
  }
}
