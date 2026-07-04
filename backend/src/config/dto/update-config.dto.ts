import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsString()
  appName?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  apiVersion?: string;

  @IsOptional()
  @IsString()
  environment?: string;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  minAppVersionAndroid?: string;

  @IsOptional()
  @IsString()
  minAppVersionIos?: string;

  @IsOptional()
  @IsNumber()
  maxWithdrawalAmount?: number;

  @IsOptional()
  @IsNumber()
  minWithdrawalAmount?: number;

  @IsOptional()
  @IsBoolean()
  dailySpinEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pollsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  feedEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  referralEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  maxDailyPosts?: number;

  @IsOptional()
  @IsNumber()
  maxDailySpins?: number;

  @IsOptional()
  @IsString()
  supportEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictedStates?: string[];
}
