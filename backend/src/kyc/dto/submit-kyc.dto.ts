import { IsString, IsNotEmpty, IsOptional, IsDateString, Matches } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{12}$/, { message: 'Aadhaar number must be exactly 12 digits' })
  aadhaarNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, { message: 'PAN number must be valid (e.g., ABCDE1234F)' })
  panNumber: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
