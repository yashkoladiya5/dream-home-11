import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contest, ContestType, ContestStatus } from './entities/contest.entity';
import { QueryContestsDto } from './dto/query-contests.dto';

@Injectable()
export class ContestsService {
  constructor(
    @InjectRepository(Contest)
    private readonly contestRepository: Repository<Contest>,
  ) {}

  async findAll(query: QueryContestsDto): Promise<{ contests: Contest[]; total: number; page: number; limit: number }> {
    const { type, status, page = 1, limit = 20 } = query;
    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    const [contests, total] = await this.contestRepository.findAndCount({
      where,
      order: { startTime: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { contests, total, page, limit };
  }

  async findById(id: string): Promise<Contest | null> {
    return this.contestRepository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Contest | null> {
    return this.contestRepository.findOne({ where: { title: code } });
  }
}
