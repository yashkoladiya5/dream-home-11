import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @IsNotEmpty()
  @IsString()
  deviceId: string;
}
