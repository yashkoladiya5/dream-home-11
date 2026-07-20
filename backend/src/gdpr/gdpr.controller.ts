import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Gdpr')
@ApiBearerAuth()
@Controller('api/v1/gdpr')
@UseGuards(JwtAuthGuard)
export class GdprController {
  constructor(private readonly gdprService: GdprService) {}

  @Get('export')
  async exportData(@GetUser() user: User) {
    return this.gdprService.exportUserData(user.id);
  }

  @Post('delete-request')
  @HttpCode(HttpStatus.OK)
  async requestDeletion(@GetUser() user: User) {
    await this.gdprService.requestAccountDeletion(user.id);
    return { message: 'Account deletion requested. Your data will be anonymized.' };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@GetUser() user: User) {
    await this.gdprService.permanentDeleteAccount(user.id);
    return { message: 'Account permanently deleted.' };
  }
}
