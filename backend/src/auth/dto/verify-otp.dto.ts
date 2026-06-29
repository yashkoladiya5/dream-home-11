import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  otpCode?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
