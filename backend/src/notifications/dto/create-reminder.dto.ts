import { IsString, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class CreateReminderDto {
  @IsUUID()
  @IsNotEmpty()
  contestId: string;

  @IsDateString()
  @IsNotEmpty()
  remindAt: string;
}
