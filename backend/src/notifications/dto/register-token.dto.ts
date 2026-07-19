import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  deviceType?: string;
}
