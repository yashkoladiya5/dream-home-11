import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmToken } from './entities/fcm-token.entity';
import { Reminder } from './entities/reminder.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { User } from '../users/entities/user.entity';
import { PointsModule } from '../points/points.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FcmToken, Reminder, NotificationLog, User]),
    PointsModule,
    UsersModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
