import { IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
