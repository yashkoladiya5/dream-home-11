import { IsString, IsNumber, IsInt, Min, Max, MaxLength, IsOptional, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrivateContestDto {
  @IsString()
  @MaxLength(150)
  title: string;

  @IsNumber()
  @Min(0)
  entryFeeInr: number;

  @IsInt()
  @Min(0)
  pointsToJoin: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  maxSlots: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  prize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @IsOptional()
  @Type(() => Date)
  startTime?: Date;

  @IsOptional()
  @Type(() => Date)
  @MinDate(new Date())
  endTime?: Date;
}
