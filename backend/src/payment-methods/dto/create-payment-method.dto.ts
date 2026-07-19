import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  displayValue: string;

  @IsString()
  @IsOptional()
  providerName?: string;
}
