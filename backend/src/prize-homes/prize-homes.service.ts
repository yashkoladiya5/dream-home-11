import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrizeHome } from './entities/prize-home.entity';

@Injectable()
export class PrizeHomesService {
  constructor(
    @InjectRepository(PrizeHome)
    private readonly prizeHomeRepository: Repository<PrizeHome>,
  ) {}

  async getCatalog(): Promise<PrizeHome[]> {
    return this.prizeHomeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getById(id: string): Promise<PrizeHome> {
    const home = await this.prizeHomeRepository.findOne({ where: { id } });
    if (!home) {
      throw new NotFoundException('Prize home not found');
    }
    return home;
  }

  async getByCity(city: string): Promise<PrizeHome[]> {
    return this.prizeHomeRepository.find({
      where: { city, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getCities(): Promise<{ city: string; count: number }[]> {
    const homes = await this.prizeHomeRepository.find({
      where: { isActive: true },
    });

    const cityMap = new Map<string, number>();
    for (const home of homes) {
      cityMap.set(home.city, (cityMap.get(home.city) || 0) + 1);
    }

    return Array.from(cityMap.entries()).map(([city, count]) => ({
      city,
      count,
    }));
  }

  async getFeatured(limit: number = 5): Promise<PrizeHome[]> {
    return this.prizeHomeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
      take: limit,
    });
  }
}
