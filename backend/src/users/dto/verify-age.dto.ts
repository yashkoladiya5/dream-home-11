import { IsDateString, IsNotEmpty } from 'class-validator';

export class VerifyAgeDto {
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;
}
