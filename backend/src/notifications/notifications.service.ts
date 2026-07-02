import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getMessaging } from 'firebase-admin/messaging';
import { FcmToken } from './entities/fcm-token.entity';
import { Reminder } from './entities/reminder.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';

export const REMINDER_POINTS = 10;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
    return this.fcmTokenRepo.find({
      where: { userId },
      select: { id: true, token: true, deviceType: true },
    });
  }

  async createReminder(userId: string, contestId: string, remindAt: Date): Promise<Reminder> {
    const existing = await this.reminderRepo.findOne({ where: { userId, contestId, status: 'pending' } });
    if (existing) {
      this.logger.warn(`Duplicate reminder attempt for user ${userId}, contest ${contestId}`);
      return existing;
    }

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

    await this.pointsEngineService.logPointAction(userId, 'reminder_created', REMINDER_POINTS, 1.0, REMINDER_POINTS);

    return saved;
  }

  async getUserReminders(userId: string): Promise<Reminder[]> {
    return this.reminderRepo.find({
      where: { userId },
      relations: { contest: true },
      order: { remindAt: 'DESC' },
      select: {
        id: true, userId: true, contestId: true, remindAt: true, status: true, createdAt: true,
        contest: { id: true, title: true },
      },
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

  async sendCompensationNotification(userId: string, points: number): Promise<void> {
    await this.createNotification(
      userId,
      'Points Compensated!',
      `You've received ${points} points as compensation for a cancelled contest.`,
      'compensation',
    );

    const tokens = await this.getUserTokens(userId);
    if (tokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user ${userId}`);
      return;
    }

    for (const fcmToken of tokens) {
      const message = {
        notification: {
          title: 'Points Compensated!',
          body: `You've received ${points} points as compensation for a cancelled contest.`,
        },
        token: fcmToken.token,
        data: { type: 'compensation', points: points.toString() },
      };

      try {
        await getMessaging().send(message);
        this.logger.log(`Compensation notification sent to device ${fcmToken.id}`);
      } catch (error: any) {
        this.logger.error(`Failed to send FCM to token ${fcmToken.id}: ${error.message}`);
      }
    }
  }

  async broadcastToAllUsers(title: string, body: string, data?: Record<string, string>): Promise<number> {
    const users = await this.userRepo.find({ where: { isActive: true } });
    for (const user of users) {
      await this.createNotification(user.id, title, body, data?.type || 'broadcast');
    }

    const tokens = await this.fcmTokenRepo.find();
    let sentCount = 0;

    for (const fcmToken of tokens) {
      const message = {
        notification: { title, body },
        token: fcmToken.token,
        data: { ...data, type: data?.type ?? 'broadcast' },
      };

      try {
        await getMessaging().send(message);
        sentCount++;
      } catch (error: any) {
        this.logger.error(`Failed to send broadcast to token ${fcmToken.id}: ${error.message}`);
      }
    }

    this.logger.log(`Broadcast sent to ${sentCount}/${tokens.length} devices`);
    return sentCount;
  }

  async broadcastToUsersByTier(tier: string, title: string, body: string, data?: Record<string, string>): Promise<number> {
    const users = await this.userRepo.find({
      where: { currentTier: tier as any, isActive: true },
      select: { id: true, phoneNumber: true, fullName: true },
    });
    for (const user of users) {
      await this.createNotification(user.id, title, body, data?.type || 'broadcast');
    }

    const tokens = await this.fcmTokenRepo
      .createQueryBuilder('ft')
      .innerJoin('ft.user', 'u')
      .where('u.currentTier = :tier', { tier })
      .getMany();

    let sentCount = 0;
    for (const fcmToken of tokens) {
      const message = {
        notification: { title, body },
        token: fcmToken.token,
        data: { ...data, type: data?.type ?? 'broadcast' },
      };

      try {
        await getMessaging().send(message);
        sentCount++;
      } catch (error: any) {
        this.logger.error(`Failed to send broadcast to token ${fcmToken.id}: ${error.message}`);
      }
    }

    this.logger.log(`Broadcast to tier ${tier} sent to ${sentCount}/${tokens.length} devices`);
    return sentCount;
  }

  async sendReminderNotification(reminder: Reminder): Promise<void> {
    await this.createNotification(
      reminder.userId,
      'Dream11 Reminder',
      'Your contest is starting soon!',
      'contest_reminder',
    );

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
      } catch (error: any) {
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

  // --- Notification Log Management ---

  async createNotification(userId: string, title: string, body: string, type: string): Promise<NotificationLog> {
    const notification = this.notificationLogRepo.create({
      userId,
      title,
      body,
      type: type || 'general',
      isRead: false,
    });
    return this.notificationLogRepo.save(notification);
  }

  async getUserNotifications(userId: string, query: { page?: number; limit?: number }): Promise<{ notifications: NotificationLog[]; total: number; unreadCount: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationLogRepo.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationLogRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, id: string): Promise<NotificationLog> {
    const notification = await this.notificationLogRepo.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return this.notificationLogRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationLogRepo.update({ userId, isRead: false }, { isRead: true });
  }
}
