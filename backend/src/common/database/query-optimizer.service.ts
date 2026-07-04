import { Injectable, Logger } from '@nestjs/common';
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);

  addPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    page: number,
    limit: number,
  ): SelectQueryBuilder<T> {
    const safeLimit = Math.min(limit, 100);
    const skip = (page - 1) * safeLimit;
    return query.skip(skip).take(safeLimit);
  }

  addCursorPagination<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    cursor: string | undefined,
    limit: number,
  ): SelectQueryBuilder<T> {
    const safeLimit = Math.min(limit, 100);
    if (cursor) {
      query.andWhere(`${query.alias}.id > :cursor`, { cursor });
    }
    return query.take(safeLimit + 1).orderBy(`${query.alias}.id`, 'ASC');
  }

  addIncludes<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    relations: string[],
  ): SelectQueryBuilder<T> {
    for (const relation of relations) {
      query.leftJoinAndSelect(`${query.alias}.${relation}`, relation);
    }
    return query;
  }

  addFieldSelection<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    fields: string[],
  ): SelectQueryBuilder<T> {
    return query.select(fields.map((f) => `${query.alias}.${f}`));
  }

  async getQueryDuration<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
  ): Promise<{ result: T[]; duration: number }> {
    const start = Date.now();
    const result = await query.getMany();
    const duration = Date.now() - start;
    return { result, duration };
  }

  async logSlowQuery<T extends ObjectLiteral>(
    query: SelectQueryBuilder<T>,
    thresholdMs: number,
  ): Promise<T[]> {
    const start = Date.now();
    const result = await query.getMany();
    const duration = Date.now() - start;
    if (duration > thresholdMs) {
      this.logger.warn(`[Slow Query] ${duration}ms - ${query.getQuery()}`);
    }
    return result;
  }
}
