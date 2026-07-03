import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('SupportController', () => {
  let controller: SupportController;
  let supportService: SupportService;

  const mockSupportService = {
    createTicket: jest.fn(),
    getUserTickets: jest.fn(),
    getTicketById: jest.fn(),
  };

  const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };

  const mockUser = { id: 'user-uuid-12345' };
  const now = new Date();

  const mockTicket = {
    id: 'ticket-uuid-1',
    userId: 'user-uuid-12345',
    subject: 'Test ticket',
    message: 'Test message',
    category: 'general',
    status: 'open',
    attachmentUrl: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupportController],
      providers: [{ provide: SupportService, useValue: mockSupportService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<SupportController>(SupportController);
    supportService = module.get<SupportService>(SupportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have JwtAuthGuard applied at controller level', () => {
    const guards = Reflect.getMetadata('__guards__', SupportController);
    expect(guards).toBeDefined();
    expect(guards).toHaveLength(1);
    expect(guards[0]).toBe(JwtAuthGuard);
  });

  describe('POST /api/v1/support/tickets', () => {
    it('should create a ticket without file', async () => {
      const dto = {
        subject: 'Test ticket',
        message: 'Test message',
        category: 'general',
      };
      mockSupportService.createTicket.mockResolvedValue(mockTicket);

      const result = await controller.createTicket(mockUser as any, dto);

      expect(result).toEqual(mockTicket);
      expect(mockSupportService.createTicket).toHaveBeenCalledWith(
        'user-uuid-12345',
        dto,
        undefined,
      );
    });

    it('should create a ticket with valid file attachment', async () => {
      const dto = {
        subject: 'Test ticket',
        message: 'Test message',
        category: 'technical',
      };
      const file = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;
      const ticketWithAttachment = {
        ...mockTicket,
        attachmentUrl: '/uploads/support/test.png',
      };
      mockSupportService.createTicket.mockResolvedValue(ticketWithAttachment);

      const result = await controller.createTicket(mockUser as any, dto, file);

      expect(result).toEqual(ticketWithAttachment);
      expect(mockSupportService.createTicket).toHaveBeenCalledWith(
        'user-uuid-12345',
        dto,
        file,
      );
    });

    it('should accept pdf file type', async () => {
      const dto = { subject: 'Test ticket', message: 'Test message' };
      const file = {
        originalname: 'doc.pdf',
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
        size: 2048,
      } as Express.Multer.File;
      mockSupportService.createTicket.mockResolvedValue(mockTicket);

      await controller.createTicket(mockUser as any, dto, file);

      expect(mockSupportService.createTicket).toHaveBeenCalledWith(
        'user-uuid-12345',
        dto,
        file,
      );
    });

    it('should accept jpeg file type', async () => {
      const dto = { subject: 'Test ticket', message: 'Test message' };
      const file = {
        originalname: 'photo.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 3072,
      } as Express.Multer.File;
      mockSupportService.createTicket.mockResolvedValue(mockTicket);

      await controller.createTicket(mockUser as any, dto, file);

      expect(mockSupportService.createTicket).toHaveBeenCalledWith(
        'user-uuid-12345',
        dto,
        file,
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const dto = { subject: 'Test ticket', message: 'Test message' };
      const file = {
        originalname: 'video.mp4',
        buffer: Buffer.from('test'),
        mimetype: 'video/mp4',
        size: 1024,
      } as Express.Multer.File;

      await expect(
        controller.createTicket(mockUser as any, dto, file),
      ).rejects.toThrow(BadRequestException);
      expect(mockSupportService.createTicket).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for oversize file', async () => {
      const dto = { subject: 'Test ticket', message: 'Test message' };
      const file = {
        originalname: 'large.png',
        buffer: Buffer.from('x'.repeat(6 * 1024 * 1024)),
        mimetype: 'image/png',
        size: 6 * 1024 * 1024,
      } as Express.Multer.File;

      await expect(
        controller.createTicket(mockUser as any, dto, file),
      ).rejects.toThrow(BadRequestException);
      expect(mockSupportService.createTicket).not.toHaveBeenCalled();
    });

    it('should accept file exactly at size limit', async () => {
      const dto = { subject: 'Test ticket', message: 'Test message' };
      const file = {
        originalname: 'atlimit.jpg',
        buffer: Buffer.from('x'.repeat(5 * 1024 * 1024)),
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024,
      } as Express.Multer.File;
      mockSupportService.createTicket.mockResolvedValue(mockTicket);

      await controller.createTicket(mockUser as any, dto, file);

      expect(mockSupportService.createTicket).toHaveBeenCalled();
    });

    it('should accept jpg mime type', async () => {
      const dto = { subject: 'Test tick', message: 'Test message' };
      const file = {
        originalname: 'scan.jpg',
        buffer: Buffer.from('test'),
        mimetype: 'image/jpg',
        size: 1024,
      } as Express.Multer.File;
      mockSupportService.createTicket.mockResolvedValue(mockTicket);

      await controller.createTicket(mockUser as any, dto, file);

      expect(mockSupportService.createTicket).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/support/tickets', () => {
    it('should return paginated tickets', async () => {
      const mockResponse = {
        tickets: [mockTicket],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockSupportService.getUserTickets.mockResolvedValue(mockResponse);

      const result = await controller.getUserTickets(mockUser as any);

      expect(result).toEqual(mockResponse);
      expect(mockSupportService.getUserTickets).toHaveBeenCalledWith(
        'user-uuid-12345',
        1,
        20,
      );
    });

    it('should accept page and limit query params', async () => {
      const mockResponse = { tickets: [], total: 0, page: 2, limit: 10 };
      mockSupportService.getUserTickets.mockResolvedValue(mockResponse);

      const result = await controller.getUserTickets(
        mockUser as any,
        '2',
        '10',
      );

      expect(result).toEqual(mockResponse);
      expect(mockSupportService.getUserTickets).toHaveBeenCalledWith(
        'user-uuid-12345',
        2,
        10,
      );
    });
  });

  describe('GET /api/v1/support/tickets/:id', () => {
    it('should return a single ticket', async () => {
      mockSupportService.getTicketById.mockResolvedValue(mockTicket);

      const result = await controller.getTicketById(
        mockUser as any,
        'ticket-uuid-1',
      );

      expect(result).toEqual(mockTicket);
      expect(mockSupportService.getTicketById).toHaveBeenCalledWith(
        'user-uuid-12345',
        'ticket-uuid-1',
      );
    });

    it('should propagate NotFoundException from service', async () => {
      mockSupportService.getTicketById.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)(),
      );

      await expect(
        controller.getTicketById(mockUser as any, 'nonexistent'),
      ).rejects.toThrow();
    });
  });
});
