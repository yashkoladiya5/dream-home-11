import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { RateLimiterService } from './rate-limiter.service';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  async getPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: any[]; total: number }> {
    const [posts, total] = await this.postRepo.findAndCount({
      where: { isActive: true },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const postIds = posts.map((p) => p.id);

    const likeCounts = await this.likeRepo
      .createQueryBuilder('like')
      .select('like.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('like.postId IN (:...postIds)', { postIds })
      .groupBy('like.postId')
      .getRawMany();

    const userLikes = await this.likeRepo.find({
      where: { userId, postId: postIds.length > 0 ? In(postIds) : '' },
    });

    const commentCounts = await this.commentRepo
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...postIds)', { postIds })
      .groupBy('comment.postId')
      .getRawMany();

    const likeCountMap = new Map<string, number>(
      likeCounts.map((r: any) => [r.postId, parseInt(r.count, 10) || 0]),
    );

    const commentCountMap = new Map<string, number>(
      commentCounts.map((r: any) => [r.postId, parseInt(r.count, 10) || 0]),
    );

    const userLikedSet = new Set(userLikes.map((l) => l.postId));

    const enrichedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt,
      user: {
        id: post.user?.id,
        fullName: post.user?.fullName,
        avatarUrl: post.user?.avatarUrl,
        currentTier: post.user?.currentTier,
      },
      likeCount: likeCountMap.get(post.id) || 0,
      commentCount: commentCountMap.get(post.id) || 0,
      hasLiked: userLikedSet.has(post.id),
    }));

    return { posts: enrichedPosts, total };
  }

  async createPost(
    userId: string,
    content: string,
    imageUrl?: string,
  ): Promise<Post> {
    if (this.rateLimiter.isRateLimited(userId)) {
      throw new BadRequestException(
        'Too many posts. Please wait before creating another post.',
      );
    }

    const post = this.postRepo.create({
      userId,
      content,
      imageUrl: imageUrl || null,
    });

    const saved = await this.postRepo.save(post);
    this.rateLimiter.recordRequest(userId);
    return saved;
  }

  async toggleLike(
    userId: string,
    postId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId, isActive: true } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({ where: { postId, userId } });

    if (existing) {
      await this.likeRepo.remove(existing);
      const likeCount = await this.likeRepo.count({ where: { postId } });
      return { liked: false, likeCount };
    }

    const like = this.likeRepo.create({ postId, userId });
    await this.likeRepo.save(like);
    const likeCount = await this.likeRepo.count({ where: { postId } });
    return { liked: true, likeCount };
  }

  async addComment(
    userId: string,
    postId: string,
    content: string,
  ): Promise<Comment> {
    const post = await this.postRepo.findOne({ where: { id: postId, isActive: true } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepo.create({ postId, userId, content });
    return this.commentRepo.save(comment);
  }

  async getComments(
    postId: string,
    page: number,
    limit: number,
  ): Promise<{ comments: any[]; total: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId, isActive: true } });
    if (!post) throw new NotFoundException('Post not found');

    const [comments, total] = await this.commentRepo.findAndCount({
      where: { postId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enrichedComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user?.id,
        fullName: c.user?.fullName,
        avatarUrl: c.user?.avatarUrl,
        currentTier: c.user?.currentTier,
      },
    }));

    return { comments: enrichedComments, total };
  }

  async getPostById(postId: string): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id: postId, isActive: true },
      relations: { user: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}
