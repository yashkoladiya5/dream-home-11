import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('api/v1/support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @UseInterceptors(FileInterceptor('attachment'))
  async createTicket(
    @GetUser() user: User,
    @Body() dto: CreateTicketDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Only image (jpg, jpeg, png) and pdf files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File size must not exceed 5MB');
      }
    }

    return this.supportService.createTicket(user.id, dto, file);
  }

  @Get('tickets')
  async getUserTickets(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.supportService.getUserTickets(user.id, pageNum, limitNum);
  }

  @Get('tickets/:id')
  async getTicketById(@GetUser() user: User, @Param('id') id: string) {
    return this.supportService.getTicketById(user.id, id);
  }
}
