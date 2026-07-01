import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from './entities/contest.entity';
import { ContestMember } from './entities/contest-member.entity';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { ContestsGateway } from './contests.gateway';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contest, ContestMember]), UsersModule, AuthModule],
  providers: [ContestsService, ContestsGateway],
  controllers: [ContestsController],
  exports: [TypeOrmModule, ContestsService, ContestsGateway],
})
export class ContestsModule {}
