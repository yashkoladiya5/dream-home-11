import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';
import {
  createMockRepository,
  MockRepository,
} from '../test/mock-repository.factory';

describe('BannersService', () => {
  let service: BannersService;
  let bannerRepo: MockRepository<Banner>;

  const mockBanners: Banner[] = [
    {
      id: 'banner-1',
      title: 'Summer Sale',
      subtitle: 'Get 50% off',
      imageUrl: 'https://example.com/summer.jpg',
      link: 'https://example.com/sale',
      linkLabel: 'Shop Now',
      backgroundColor: '#FF0000',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'banner-2',
      title: 'New Contest',
      subtitle: 'Win big prizes',
      imageUrl: 'https://example.com/contest.jpg',
      link: 'https://example.com/contest',
      linkLabel: 'Join',
      backgroundColor: '#00FF00',
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'banner-3',
      title: 'Inactive Banner',
      subtitle: null,
      imageUrl: null,
      link: null,
      linkLabel: null,
      backgroundColor: null,
      sortOrder: 3,
      isActive: false,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    bannerRepo = createMockRepository<Banner>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: getRepositoryToken(Banner), useValue: bannerRepo },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveBanners', () => {
    it('should return only active banners sorted by sortOrder', async () => {
      (bannerRepo.find as jest.Mock).mockResolvedValue(
        mockBanners.filter((b) => b.isActive),
      );

      const result = await service.getActiveBanners();
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Summer Sale');
      expect(bannerRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });

    it('should return empty array when no active banners', async () => {
      (bannerRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getActiveBanners();
      expect(result).toEqual([]);
    });

    it('should exclude inactive banners', async () => {
      (bannerRepo.find as jest.Mock).mockResolvedValue([mockBanners[0]]);
      const result = await service.getActiveBanners();
      expect(result.every((b) => b.isActive)).toBe(true);
    });

    it('should return banners in the order provided by repository', async () => {
      const unsorted = [mockBanners[1], mockBanners[0]];
      (bannerRepo.find as jest.Mock).mockResolvedValue(unsorted);

      const result = await service.getActiveBanners();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('banner-2');
    });
  });
});
