import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { FcmToken } from './entities/fcm-token.entity';
import { Reminder } from './entities/reminder.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { User } from '../users/entities/user.entity';
import { PointsEngineService } from '../points/points-engine.service';
import { NotFoundException } from '@nestjs/common';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let fcmTokenRepo: Partial<Record<keyof Repository<FcmToken>, jest.Mock>>;
  let reminderRepo: Partial<Record<keyof Repository<Reminder>, jest.Mock>>;
  let notificationLogRepo: Partial<Record<keyof Repository<NotificationLog>, jest.Mock>>;
  let userRepo: Partial<Record<keyof Repository<User>, jest.Mock>>;

  const mockPointsEngineService = {
    logPointAction: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    fcmTokenRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
    };
    reminderRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      remove: jest.fn(),
    };
    notificationLogRepo = {
      findAndCount: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve(d)),
      update: jest.fn().mockResolvedValue({}),
    };
    userRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(FcmToken), useValue: fcmTokenRepo },
        { provide: getRepositoryToken(Reminder), useValue: reminderRepo },
        { provide: getRepositoryToken(NotificationLog), useValue: notificationLogRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PointsEngineService, useValue: mockPointsEngineService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should successfully save a notification log', async () => {
      const result = await service.createNotification('u-1', 'Test Title', 'Test Body', 'kyc');
      expect(notificationLogRepo.create).toHaveBeenCalledWith({
        userId: 'u-1',
        title: 'Test Title',
        body: 'Test Body',
        type: 'kyc',
        isRead: false,
      });
      expect(notificationLogRepo.save).toHaveBeenCalled();
      expect(result.userId).toBe('u-1');
      expect(result.type).toBe('kyc');
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications and unread count', async () => {
      const logs = [
        { id: 'n-1', userId: 'u-1', title: 'A', body: 'B', type: 'compensation', isRead: false },
      ];
      notificationLogRepo.findAndCount = jest.fn().mockResolvedValue([logs, 1]);
      notificationLogRepo.count = jest.fn().mockResolvedValue(1);

      const result = await service.getUserNotifications('u-1', { page: 1, limit: 10 });
      expect(notificationLogRepo.findAndCount).toHaveBeenCalled();
      expect(result.notifications).toEqual(logs);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification does not exist', async () => {
      notificationLogRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.markAsRead('u-1', 'n-1')).rejects.toThrow(NotFoundException);
    });

    it('should mark notification as read successfully', async () => {
      const log = { id: 'n-1', userId: 'u-1', isRead: false };
      notificationLogRepo.findOne = jest.fn().mockResolvedValue(log);
      notificationLogRepo.save = jest.fn().mockImplementation((n) => Promise.resolve(n));

      const result = await service.markAsRead('u-1', 'n-1');
      expect(result.isRead).toBe(true);
      expect(notificationLogRepo.save).toHaveBeenCalledWith(log);
    });
  });

  describe('markAllAsRead', () => {
    it('should trigger update query on database', async () => {
      await service.markAllAsRead('u-1');
      expect(notificationLogRepo.update).toHaveBeenCalledWith(
        { userId: 'u-1', isRead: false },
        { isRead: true },
      );
    });
  });
});
