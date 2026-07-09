import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class RecordConsentDto {
  @IsString()
  consentType: string;

  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
