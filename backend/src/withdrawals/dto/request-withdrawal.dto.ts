import {
  IsNumber,
  Min,
  IsString,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class RequestWithdrawalDto {
  @IsNumber()
  @Min(100)
  amount: number;

  @ValidateIf((o) => !o.upiId)
  @IsString()
  @IsOptional()
  bankAccountNumber?: string;

  @ValidateIf((o) => !o.upiId)
  @IsString()
  @IsOptional()
  bankIfsc?: string;

  @ValidateIf((o) => !o.upiId)
  @IsString()
  @IsOptional()
  bankName?: string;

  @ValidateIf((o) => !o.bankAccountNumber)
  @IsString()
  @IsOptional()
  upiId?: string;
}
