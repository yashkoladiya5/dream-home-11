import {
  IsNumber,
  IsBoolean,
  IsArray,
  IsString,
  IsEmail,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class ComplianceSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(120)
  minimumAge?: number;

  @IsOptional()
  @IsBoolean()
  requireKycForWithdrawal?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictedStates?: string[];

  @IsOptional()
  @IsString()
  tosVersion?: string;

  @IsOptional()
  @IsString()
  privacyPolicyVersion?: string;

  @IsOptional()
  @IsBoolean()
  cookieConsentRequired?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dataRetentionDays?: number;

  @IsOptional()
  @IsEmail()
  gdprContactEmail?: string;

  @IsOptional()
  @IsBoolean()
  ageVerificationRequired?: boolean;
}
