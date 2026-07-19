import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheControl } from '../common/decorators/cache-control.decorator';

import { RegisterTokenDto } from './dto/register-token.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@CacheControl(30)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('fcm-token')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async registerToken(
    @Req() req,
    @Body() dto: RegisterTokenDto,
  ) {
    const userId = req.user.id;
    if (!dto.token) return { success: false, reason: 'Token is required' };
    await this.notificationsService.registerToken(
      userId,
      dto.token,
      dto.deviceType || 'ios',
    );
    return { success: true };
  }

  @Get('reminders')
  async getReminders(@Req() req) {
    return this.notificationsService.getUserReminders(req.user.id);
  }

  @Post('reminders')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createReminder(
    @Req() req,
    @Body() dto: CreateReminderDto,
  ) {
    const userId = req.user.id;
    const reminder = await this.notificationsService.createReminder(
      userId,
      dto.contestId,
      new Date(dto.remindAt),
    );
    const reminders = await this.notificationsService.getUserReminders(userId);
    const created = reminders.find((r) => r.id === reminder.id);
    return { success: true, reminder: created || reminder };
  }

  @Delete('reminders/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async deleteReminder(@Req() req, @Param('id') id: string) {
    await this.notificationsService.deleteReminder(req.user.id, id);
    return { success: true };
  }

  @Get()
  async getNotifications(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    return this.notificationsService.getUserNotifications(req.user.id, {
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async markAsRead(@Req() req, @Param('id') id: string) {
    if (!UUID_REGEX.test(id))
      throw new BadRequestException('Invalid notification ID format');
    const notification = await this.notificationsService.markAsRead(
      req.user.id,
      id,
    );
    return { success: true, notification };
  }

  @Post('read-all')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async readAllNotifications(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
