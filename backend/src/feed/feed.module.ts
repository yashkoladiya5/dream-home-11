import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Like, Comment])],
  providers: [FeedService, RateLimiterService],
  controllers: [FeedController],
  exports: [TypeOrmModule],
})
export class FeedModule {}
