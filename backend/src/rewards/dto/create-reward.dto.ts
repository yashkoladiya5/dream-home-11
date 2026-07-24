import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityAvailable?: number;
}
