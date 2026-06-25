import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrizeHome } from './entities/prize-home.entity';
import { PrizeHomesService } from './prize-homes.service';
import { PrizeHomesController } from './prize-homes.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([PrizeHome]), UsersModule],
  controllers: [PrizeHomesController],
  providers: [PrizeHomesService],
})
export class PrizeHomesModule {}
