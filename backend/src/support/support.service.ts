import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import {
  ensureSupportUploadDir,
  SUPPORT_UPLOAD_DIR,
} from './support-uploads.config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
  ) {}

  async createTicket(
    userId: string,
    dto: CreateTicketDto,
    file?: Express.Multer.File,
  ): Promise<SupportTicket> {
    const ticket = this.supportTicketRepository.create({
      userId,
      subject: dto.subject,
      message: dto.message,
      category: dto.category || 'general',
    });

    const saved = await this.supportTicketRepository.save(ticket);

    if (file) {
      ensureSupportUploadDir();
      const userDir = join(SUPPORT_UPLOAD_DIR, userId);
      if (!existsSync(userDir)) {
        mkdirSync(userDir, { recursive: true });
      }

      const ext = extname(file.originalname) || '.jpg';
      const filename = `${saved.id}-${file.originalname}`;
      const filePath = join(userDir, filename);
      writeFileSync(filePath, file.buffer);

      const url = `/uploads/support/${userId}/${filename}`;
      saved.attachmentUrl = url;
      await this.supportTicketRepository.save(saved);
    }

    return saved;
  }

  async getUserTickets(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    tickets: SupportTicket[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [tickets, total] = await this.supportTicketRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { tickets, total, page, limit };
  }

  async getTicketById(
    userId: string,
    ticketId: string,
  ): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepository.findOne({
      where: { id: ticketId, userId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }
}
