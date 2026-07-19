import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTransactionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsString()
  @IsOptional()
  @IsIn(['all', 'deposit', 'withdrawal', 'entry_fee', 'prize', 'points_bonus'])
  type?: string;
}
