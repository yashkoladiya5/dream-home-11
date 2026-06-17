import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in valid E.164 format (e.g. +91XXXXXXXXXX)',
  })
  phoneNumber: string;
}
