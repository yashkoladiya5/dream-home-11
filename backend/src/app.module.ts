import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './users/entities/user.entity';
import { Kyc } from './kyc/entities/kyc.entity';
import { Contest } from './contests/entities/contest.entity';
import { ContestMember } from './contests/entities/contest-member.entity';
import { PointLog } from './points/entities/point-log.entity';
import { PointsModule } from './points/points.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';
import { AuthModule } from './auth/auth.module';
import { ContestsModule } from './contests/contests.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_DATABASE', 'dream_home_11'),
        entities: [User, Kyc, Contest, ContestMember, PointLog],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    KycModule,
    AuthModule,
    ContestsModule,
    PointsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
