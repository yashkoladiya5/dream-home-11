import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ContestType, ContestStatus } from '../entities/contest.entity';

export class QueryContestsDto {
  @IsOptional()
  @IsEnum(ContestType)
  type?: ContestType;

  @IsOptional()
  @IsEnum(ContestStatus)
  status?: ContestStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
