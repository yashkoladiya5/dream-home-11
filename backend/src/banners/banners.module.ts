import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Banner]), UsersModule],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService, TypeOrmModule],
})
export class BannersModule {}
