import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  @IsIn(['general', 'payment', 'technical', 'kyc', 'account', 'other'])
  category?: string;
}
