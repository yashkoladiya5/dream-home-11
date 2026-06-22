import { IsOptional, IsString } from 'class-validator';

export class JoinContestDto {
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
