import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareTrackerController } from './share-tracker.controller';
import { ShareTrackerService } from './share-tracker.service';
import { Share } from './entities/share.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Share]), UsersModule],
  controllers: [ShareTrackerController],
  providers: [ShareTrackerService],
  exports: [ShareTrackerService],
})
export class ShareTrackerModule {}
