import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ReorderBannersDto {
  @IsString()
  @IsNotEmpty()
  bannerId: string;

  @IsNumber()
  newOrder: number;

  @IsString()
  @IsNotEmpty()
  swapWithId: string;

  @IsNumber()
  swapWithOrder: number;
}
