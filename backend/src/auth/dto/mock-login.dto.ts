import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class MockLoginDto {
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
