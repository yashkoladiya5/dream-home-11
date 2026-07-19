import { IsString, IsNotEmpty, IsUUID, IsOptional, IsIn } from 'class-validator';

export class TrackShareDto {
  @IsUUID()
  @IsNotEmpty()
  contestId: string;

  @IsString()
  @IsNotEmpty()
  shareChannel: string;

  @IsString()
  @IsOptional()
  shareType?: string;
}
