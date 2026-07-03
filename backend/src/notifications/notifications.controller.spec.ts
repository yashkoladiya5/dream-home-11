import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: Partial<Record<keyof NotificationsService, jest.Mock>>;

  beforeEach(async () => {
    service = {
      registerToken: jest.fn(),
      getUserReminders: jest.fn(),
      createReminder: jest.fn(),
      deleteReminder: jest.fn(),
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should call getUserNotifications with parsed query parameters', async () => {
      const req = { user: { id: 'u-1' } };
      await controller.getNotifications(req, '2', '15');
      expect(service.getUserNotifications).toHaveBeenCalledWith('u-1', {
        page: 2,
        limit: 15,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should call getUnreadCount and return count', async () => {
      const req = { user: { id: 'u-1' } };
      service.getUnreadCount!.mockResolvedValue(5);
      const result = await controller.getUnreadCount(req);
      expect(service.getUnreadCount).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({ unreadCount: 5 });
    });
  });

  describe('markAsRead', () => {
    it('should throw BadRequestException if notification ID is not valid UUID', async () => {
      const req = { user: { id: 'u-1' } };
      await expect(controller.markAsRead(req, 'invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call markAsRead and return success status', async () => {
      const req = { user: { id: 'u-1' } };
      const uuid = '12345678-1234-1234-1234-123456789012';
      service.markAsRead!.mockResolvedValue({ id: uuid, isRead: true });
      const result = await controller.markAsRead(req, uuid);
      expect(service.markAsRead).toHaveBeenCalledWith('u-1', uuid);
      expect(result).toEqual({
        success: true,
        notification: { id: uuid, isRead: true },
      });
    });
  });

  describe('readAllNotifications', () => {
    it('should call markAllAsRead and return success status', async () => {
      const req = { user: { id: 'u-1' } };
      const result = await controller.readAllNotifications(req);
      expect(service.markAllAsRead).toHaveBeenCalledWith('u-1');
      expect(result).toEqual({ success: true });
    });
  });
});
