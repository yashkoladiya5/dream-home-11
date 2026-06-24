import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getMessaging } from 'firebase-admin/messaging';
import { FcmToken } from './entities/fcm-token.entity';
import { Reminder } from './entities/reminder.entity';
import { PointsEngineService } from '../points/points-engine.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    private readonly pointsEngineService: PointsEngineService,
  ) {}

  async registerToken(userId: string, token: string, deviceType: string): Promise<FcmToken> {
    const existing = await this.fcmTokenRepo.findOne({ where: { userId, token } });
    if (existing) {
      existing.deviceType = deviceType;
      return this.fcmTokenRepo.save(existing);
    }
    const fcmToken = this.fcmTokenRepo.create({ userId, token, deviceType });
    return this.fcmTokenRepo.save(fcmToken);
  }

  async getUserTokens(userId: string): Promise<FcmToken[]> {
    return this.fcmTokenRepo.find({ where: { userId } });
  }

  async createReminder(userId: string, contestId: string, remindAt: Date): Promise<Reminder> {
    const reminder = this.reminderRepo.create({ userId, contestId, remindAt });
    const saved = await this.reminderRepo.save(reminder);

    const now = Date.now();
    const delay = remindAt.getTime() - now;
    if (delay > 0) {
      const timeout = setTimeout(async () => {
        await this.sendReminderNotification(saved);
      }, delay);
      this.scheduledTimeouts.set(saved.id, timeout);
    }

    await this.pointsEngineService.logPointAction(userId, 'reminder_created', 10, 1.0, 10);

    return saved;
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return this.reminderRepo.find({
      where: { userId },
      order: { remindAt: 'DESC' },
    });
  }

  async deleteReminder(userId: string, reminderId: string): Promise<void> {
    const reminder = await this.reminderRepo.findOne({ where: { id: reminderId, userId } });
    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    const timeout = this.scheduledTimeouts.get(reminderId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledTimeouts.delete(reminderId);
    }

    await this.reminderRepo.remove(reminder);
  }

  async sendReminderNotification(reminder: Reminder): Promise<void> {
    const tokens = await this.getUserTokens(reminder.userId);
    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user ${reminder.userId}`);
      return;
    }

    for (const fcmToken of tokens) {
      const message = {
        notification: { title: 'Dream11 Reminder', body: `Your contest is starting soon!` },
        token: fcmToken.token,
        data: { contestId: reminder.contestId, type: 'contest_reminder' },
      };

      try {
        await getMessaging().send(message);
        this.logger.log(`Reminder sent to device ${fcmToken.id}`);
      } catch (error) {
        this.logger.error(`Failed to send FCM to token ${fcmToken.id}: ${error.message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueReminders(): Promise<void> {
    const dueReminders = await this.reminderRepo.find({
      where: {
        remindAt: LessThanOrEqual(new Date()),
        status: 'pending',
      },
    });

    for (const reminder of dueReminders) {
      reminder.status = 'sent';
      await this.reminderRepo.save(reminder);
      await this.sendReminderNotification(reminder);
    }
  }
}
