import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
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
    return { success: true, reminder };
  }

  @Delete('reminders/:id')
  async deleteReminder(@Req() req, @Param('id') id: string) {
    await this.notificationsService.deleteReminder(req.user.id, id);
    return { success: true };
  }
}
