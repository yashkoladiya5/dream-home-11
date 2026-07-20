import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('api/v1/feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getPosts(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.feedService.getPosts(user.id, pageNum, limitNum);
  }

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  async createPost(@GetUser() user: User, @Body() dto: CreatePostDto) {
    const post = await this.feedService.createPost(
      user.id,
      dto.content,
      dto.imageUrl,
    );
    return { message: 'Post created successfully', post };
  }

  @Post(':id/like')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) postId: string,
  ) {
    return this.feedService.toggleLike(user.id, postId);
  }

  @Post(':id/comment')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) postId: string,
    @Body() dto: AddCommentDto,
  ) {
    const comment = await this.feedService.addComment(
      user.id,
      postId,
      dto.content,
    );
    return { message: 'Comment added successfully', comment };
  }

  @Get(':id/comments')
  async getComments(
    @Param('id', ParseUUIDPipe) postId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.feedService.getComments(postId, pageNum, limitNum);
  }
}
