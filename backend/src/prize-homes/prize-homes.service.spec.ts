import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PrizeHomesService } from './prize-homes.service';
import { PrizeHome } from './entities/prize-home.entity';
import {
  createMockRepository,
  MockRepository,
} from '../test/mock-repository.factory';

describe('PrizeHomesService', () => {
  let service: PrizeHomesService;
  let prizeHomeRepo: MockRepository<PrizeHome>;

  const mockPrizeHomes: PrizeHome[] = [
    {
      id: 'ph-1',
      title: 'Luxury Villa Mumbai',
      description: 'Beautiful sea-facing villa',
      imageUrl: 'https://example.com/villa.jpg',
      city: 'Mumbai',
      state: 'Maharashtra',
      location: 'Bandra West',
      valueInr: 25000000,
      bedrooms: 4,
      bathrooms: 3,
      area: '2500 sqft',
      features: ['Pool', 'Garden', 'Parking'],
      type: 'villa',
      emoji: '🏠',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'ph-2',
      title: 'Modern Apartment Delhi',
      description: 'High-rise apartment with city view',
      imageUrl: 'https://example.com/apartment.jpg',
      city: 'Delhi',
      state: 'Delhi',
      location: 'Dwarka',
      valueInr: 15000000,
      bedrooms: 3,
      bathrooms: 2,
      area: '1800 sqft',
      features: ['Gym', 'Parking'],
      type: 'apartment',
      emoji: '🏢',
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'ph-3',
      title: 'Inactive Property',
      description: null,
      imageUrl: null,
      city: 'Pune',
      state: null,
      location: null,
      valueInr: 10000000,
      bedrooms: null,
      bathrooms: null,
      area: null,
      features: null,
      type: null,
      emoji: null,
      sortOrder: 3,
      isActive: false,
      createdAt: new Date(),
    },
  ];

  beforeEach(async () => {
    prizeHomeRepo = createMockRepository<PrizeHome>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrizeHomesService,
        { provide: getRepositoryToken(PrizeHome), useValue: prizeHomeRepo },
      ],
    }).compile();

    service = module.get<PrizeHomesService>(PrizeHomesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCatalog', () => {
    it('should return all active prize homes sorted by sortOrder', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue(
        mockPrizeHomes.filter((p) => p.isActive),
      );
      const result = await service.getCatalog();
      expect(result).toHaveLength(2);
      expect(result[0].city).toBe('Mumbai');
      expect(prizeHomeRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC' },
      });
    });

    it('should return empty array when no active prize homes', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getCatalog();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return prize home when found', async () => {
      (prizeHomeRepo.findOne as jest.Mock).mockResolvedValue(mockPrizeHomes[0]);
      const result = await service.getById('ph-1');
      expect(result.id).toBe('ph-1');
      expect(result.title).toBe('Luxury Villa Mumbai');
    });

    it('should throw NotFoundException when not found', async () => {
      (prizeHomeRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getByCity', () => {
    it('should return active prize homes for a city', async () => {
      const mumbaiHomes = [mockPrizeHomes[0]];
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue(mumbaiHomes);
      const result = await service.getByCity('Mumbai');
      expect(result).toHaveLength(1);
      expect(prizeHomeRepo.find).toHaveBeenCalledWith({
        where: { city: 'Mumbai', isActive: true },
        order: { sortOrder: 'ASC' },
      });
    });

    it('should return empty array for city with no prize homes', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getByCity('Unknown City');
      expect(result).toEqual([]);
    });
  });

  describe('getCities', () => {
    it('should return unique cities with counts', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue(
        mockPrizeHomes.filter((p) => p.isActive),
      );
      const result = await service.getCities();
      expect(result).toHaveLength(2);
      expect(result[0].city).toBe('Mumbai');
      expect(result[0].count).toBe(1);
    });

    it('should return empty array when no active prize homes', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getCities();
      expect(result).toEqual([]);
    });

    it('should group multiple homes in same city', async () => {
      const extraMumbaiHome = {
        ...mockPrizeHomes[0],
        id: 'ph-4',
        sortOrder: 4,
      };
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([
        mockPrizeHomes[0],
        mockPrizeHomes[1],
        extraMumbaiHome,
      ]);
      const result = await service.getCities();
      const mumbai = result.find((c) => c.city === 'Mumbai');
      expect(mumbai?.count).toBe(2);
    });
  });

  describe('getFeatured', () => {
    it('should return featured prize homes up to limit', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue(
        mockPrizeHomes.filter((p) => p.isActive),
      );
      const result = await service.getFeatured(5);
      expect(result).toHaveLength(2);
      expect(prizeHomeRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { sortOrder: 'ASC' },
        take: 5,
      });
    });

    it('should respect limit parameter', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([mockPrizeHomes[0]]);
      const result = await service.getFeatured(1);
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no active prize homes', async () => {
      (prizeHomeRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.getFeatured(3);
      expect(result).toEqual([]);
    });
  });
});
