import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyReferralDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
