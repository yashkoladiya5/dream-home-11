import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePrizeHomeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsNumber()
  @Min(0)
  entryFee: number;

  @IsNumber()
  @Min(0)
  totalSlots: number;

  @IsString()
  @IsNotEmpty()
  drawDate: string;
}
