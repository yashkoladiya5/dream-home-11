import { Controller, Post, Get, Delete, Patch, Body, Param, Req, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('fcm-token')
  async registerToken(@Req() req, @Body('token') token: string, @Body('deviceType') deviceType: string) {
    const userId = req.user.id;
    if (!token) return { success: false, reason: 'Token is required' };
    await this.notificationsService.registerToken(userId, token, deviceType || 'ios');
    return { success: true };
  }

  @Get('reminders')
  async getReminders(@Req() req) {
    return this.notificationsService.getUserReminders(req.user.id);
  }

  @Post('reminders')
  async createReminder(@Req() req, @Body('contestId') contestId: string, @Body('remindAt') remindAt: string) {
    const userId = req.user.id;
    if (!contestId || !remindAt) return { success: false, reason: 'contestId and remindAt are required' };
    if (!UUID_REGEX.test(contestId)) throw new BadRequestException('Invalid contest ID format');
    const reminder = await this.notificationsService.createReminder(userId, contestId, new Date(remindAt));
    const reminders = await this.notificationsService.getUserReminders(userId);
    const created = reminders.find(r => r.id === reminder.id);
    return { success: true, reminder: created || reminder };
  }

  @Delete('reminders/:id')
  async deleteReminder(@Req() req, @Param('id') id: string) {
    await this.notificationsService.deleteReminder(req.user.id, id);
    return { success: true };
  }

  @Get()
  async getNotifications(@Req() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    return this.notificationsService.getUserNotifications(req.user.id, { page: pageNum, limit: limitNum });
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    if (!UUID_REGEX.test(id)) throw new BadRequestException('Invalid notification ID format');
    const notification = await this.notificationsService.markAsRead(req.user.id, id);
    return { success: true, notification };
  }

  @Post('read-all')
  async readAllNotifications(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
