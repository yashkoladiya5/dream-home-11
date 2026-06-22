import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contest, ContestMember]), UsersModule],
  providers: [ContestsService],
  controllers: [ContestsController],
  exports: [TypeOrmModule, ContestsService],
})
export class ContestsModule {}
