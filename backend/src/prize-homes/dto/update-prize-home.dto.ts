import { PartialType } from '@nestjs/mapped-types';
import { CreatePrizeHomeDto } from './create-prize-home.dto';

export class UpdatePrizeHomeDto extends PartialType(CreatePrizeHomeDto) {}
