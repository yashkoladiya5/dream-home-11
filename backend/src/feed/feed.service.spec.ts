import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { FeedService } from './feed.service';
import { RateLimiterService } from './rate-limiter.service';

describe('FeedService', () => {
  let service: FeedService;

  const mockPostRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockLikeRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCommentRepo = {
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRateLimiter = {
    isRateLimited: jest.fn().mockReturnValue(false),
    recordRequest: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockLikeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockCommentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepo },
        { provide: getRepositoryToken(Like), useValue: mockLikeRepo },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: RateLimiterService, useValue: mockRateLimiter },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockPostRepo.create.mockReturnValue({ id: 'post-1', userId: 'user-1', content: 'Hello world', imageUrl: null });
      mockPostRepo.save.mockResolvedValue({ id: 'post-1', userId: 'user-1', content: 'Hello world', imageUrl: null });

      const result = await service.createPost('user-1', 'Hello world');

      expect(mockPostRepo.create).toHaveBeenCalledWith({ userId: 'user-1', content: 'Hello world', imageUrl: null });
      expect(mockPostRepo.save).toHaveBeenCalled();
      expect(mockRateLimiter.recordRequest).toHaveBeenCalledWith('user-1');
      expect(result.content).toBe('Hello world');
    });

    it('should create a post with image', async () => {
      mockPostRepo.create.mockReturnValue({ id: 'post-2', userId: 'user-1', content: 'Check this', imageUrl: 'https://example.com/img.jpg' });
      mockPostRepo.save.mockResolvedValue({ id: 'post-2', userId: 'user-1', content: 'Check this', imageUrl: 'https://example.com/img.jpg' });

      await service.createPost('user-1', 'Check this', 'https://example.com/img.jpg');

      expect(mockPostRepo.create).toHaveBeenCalledWith({ userId: 'user-1', content: 'Check this', imageUrl: 'https://example.com/img.jpg' });
    });

    it('should throw when rate limited', async () => {
      mockRateLimiter.isRateLimited.mockReturnValue(true);

      await expect(service.createPost('user-1', 'Too many')).rejects.toThrow(BadRequestException);
      expect(mockPostRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('should like a post', async () => {
      mockPostRepo.findOne.mockResolvedValue({ id: 'post-1', isActive: true });
      mockLikeRepo.findOne.mockResolvedValue(null);
      mockLikeRepo.create.mockReturnValue({ postId: 'post-1', userId: 'user-1' });
      mockLikeRepo.save.mockResolvedValue({});
      mockLikeRepo.count.mockResolvedValue(5);

      const result = await service.toggleLike('user-1', 'post-1');

      expect(result).toEqual({ liked: true, likeCount: 5 });
    });

    it('should unlike a post', async () => {
      mockPostRepo.findOne.mockResolvedValue({ id: 'post-1', isActive: true });
      mockLikeRepo.findOne.mockResolvedValue({ id: 'like-1', postId: 'post-1', userId: 'user-1' });
      mockLikeRepo.remove.mockResolvedValue({});
      mockLikeRepo.count.mockResolvedValue(3);

      const result = await service.toggleLike('user-1', 'post-1');

      expect(result).toEqual({ liked: false, likeCount: 3 });
    });

    it('should throw for non-existent post', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.toggleLike('user-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should add a comment successfully', async () => {
      mockPostRepo.findOne.mockResolvedValue({ id: 'post-1', isActive: true });
      mockCommentRepo.create.mockReturnValue({ postId: 'post-1', userId: 'user-1', content: 'Great post!' });
      mockCommentRepo.save.mockResolvedValue({ id: 'comment-1', postId: 'post-1', userId: 'user-1', content: 'Great post!', createdAt: new Date() });

      const result = await service.addComment('user-1', 'post-1', 'Great post!');

      expect(mockCommentRepo.create).toHaveBeenCalledWith({ postId: 'post-1', userId: 'user-1', content: 'Great post!' });
      expect(result).toBeDefined();
    });

    it('should throw for non-existent post', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.addComment('user-1', 'bad-id', 'comment')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPosts', () => {
    it('should return enriched posts', async () => {
      const now = new Date();
      mockPostRepo.findAndCount.mockResolvedValue([
        [{ id: 'post-1', content: 'Hello', imageUrl: null, createdAt: now, user: { id: 'user-1', fullName: 'Alice', avatarUrl: 'a1', currentTier: 'GOLD' } }],
        1,
      ]);
      mockLikeRepo.find.mockResolvedValue([]);

      const result = await service.getPosts('user-1', 1, 20);

      expect(result.posts[0].id).toBe('post-1');
      expect(result.posts[0].likeCount).toBe(0);
      expect(result.posts[0].commentCount).toBe(0);
      expect(result.posts[0].hasLiked).toBe(false);
      expect(result.total).toBe(1);
    });

    it('should mark hasLiked when user has liked', async () => {
      const now = new Date();
      mockPostRepo.findAndCount.mockResolvedValue([
        [{ id: 'post-1', content: 'Hello', imageUrl: null, createdAt: now, user: { id: 'user-1', fullName: 'Alice', avatarUrl: 'a1', currentTier: 'GOLD' } }],
        1,
      ]);
      mockLikeRepo.find.mockResolvedValue([{ postId: 'post-1', userId: 'user-1' }]);

      const result = await service.getPosts('user-1', 1, 20);

      expect(result.posts[0].hasLiked).toBe(true);
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      mockPostRepo.findOne.mockResolvedValue({ id: 'post-1', isActive: true });
      const now = new Date();
      mockCommentRepo.findAndCount.mockResolvedValue([
        [{ id: 'c1', content: 'Nice!', createdAt: now, user: { id: 'user-2', fullName: 'Bob', avatarUrl: 'a2', currentTier: 'SILVER' } }],
        1,
      ]);

      const result = await service.getComments('post-1', 1, 20);

      expect(result.comments.length).toBe(1);
      expect(result.comments[0].user.fullName).toBe('Bob');
      expect(result.total).toBe(1);
    });

    it('should throw for non-existent post', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.getComments('bad-id', 1, 20)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPostById', () => {
    it('should return a post by id', async () => {
      mockPostRepo.findOne.mockResolvedValue({ id: 'post-1', content: 'Hello' });

      const result = await service.getPostById('post-1');

      expect(result.id).toBe('post-1');
    });

    it('should throw for non-existent post', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.getPostById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
