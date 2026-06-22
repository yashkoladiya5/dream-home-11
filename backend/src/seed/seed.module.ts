import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contest } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contest, ContestMember])],
  providers: [SeedService],
})
export class SeedModule {}
