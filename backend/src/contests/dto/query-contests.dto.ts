import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum ContestSortBy {
  ENTRY_FEE = 'entry_fee',
  PRIZE_POOL = 'prize_pool',
  START_TIME = 'start_time',
  CREATED_AT = 'created_at',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryContestsDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContestSortBy)
  sortBy?: ContestSortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  prizeMin?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  prizeMax?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  feeMin?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  feeMax?: number;
}
