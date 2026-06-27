import { IsString, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @MaxLength(200)
  content: string;
}
