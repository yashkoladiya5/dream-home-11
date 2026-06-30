import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportTicket } from './entities/support-ticket.entity';

describe('SupportService', () => {
  let service: SupportService;

  const mockSupportTicketRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const now = new Date();
  const mockTicket: SupportTicket = {
    id: 'ticket-1',
    userId: 'user-1',
    subject: 'Test subject',
    message: 'Test message content',
    category: 'general',
    status: 'open',
    attachmentUrl: '',
    createdAt: now,
    updatedAt: now,
    user: undefined as any,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupportService,
        {
          provide: getRepositoryToken(SupportTicket),
          useValue: mockSupportTicketRepo,
        },
      ],
    }).compile();

    service = module.get<SupportService>(SupportService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create a ticket without file attachment', async () => {
      const dto = { subject: 'Test subject', message: 'Test message', category: 'general' };
      mockSupportTicketRepo.create.mockReturnValue(mockTicket);
      mockSupportTicketRepo.save.mockResolvedValue(mockTicket);

      const result = await service.createTicket('user-1', dto);

      expect(result).toEqual(mockTicket);
      expect(mockSupportTicketRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        subject: 'Test subject',
        message: 'Test message',
        category: 'general',
      });
      expect(mockSupportTicketRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should create a ticket with default category when not provided', async () => {
      const dto = { subject: 'Test subject', message: 'Test message' };
      const ticketWithDefault = { ...mockTicket, category: 'general' };
      mockSupportTicketRepo.create.mockReturnValue(ticketWithDefault);
      mockSupportTicketRepo.save.mockResolvedValue(ticketWithDefault);

      const result = await service.createTicket('user-1', dto);

      expect(result.category).toBe('general');
      expect(mockSupportTicketRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        subject: 'Test subject',
        message: 'Test message',
        category: 'general',
      });
    });

    it('should create a ticket with file attachment and save attachmentUrl', async () => {
      const dto = { subject: 'Test subject', message: 'Test message', category: 'technical' };
      const file = {
        originalname: 'screenshot.png',
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const savedTicket = { ...mockTicket, id: 'ticket-new' };
      mockSupportTicketRepo.create.mockReturnValue(mockTicket);
      mockSupportTicketRepo.save
        .mockResolvedValueOnce(savedTicket)
        .mockResolvedValueOnce({ ...savedTicket, attachmentUrl: `/uploads/support/user-1/ticket-new-screenshot.png` });

      const result = await service.createTicket('user-1', dto, file);

      expect(mockSupportTicketRepo.save).toHaveBeenCalledTimes(2);
      expect(result.attachmentUrl).toContain('/uploads/support/');
    });

    it('should create a ticket with other category', async () => {
      const dto = { subject: 'Other issue', message: 'Some message', category: 'other' };
      const ticketOther = { ...mockTicket, subject: 'Other issue', category: 'other' };
      mockSupportTicketRepo.create.mockReturnValue(ticketOther);
      mockSupportTicketRepo.save.mockResolvedValue(ticketOther);

      const result = await service.createTicket('user-1', dto);

      expect(result.category).toBe('other');
    });
  });

  describe('getUserTickets', () => {
    it('should return paginated tickets for a user', async () => {
      const tickets = [mockTicket];
      mockSupportTicketRepo.findAndCount.mockResolvedValue([tickets, 1]);

      const result = await service.getUserTickets('user-1', 1, 20);

      expect(result.tickets).toEqual(tickets);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockSupportTicketRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should return empty list when user has no tickets', async () => {
      mockSupportTicketRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getUserTickets('user-2', 1, 20);

      expect(result.tickets).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const tickets = Array(5).fill(null).map((_, i) => ({ ...mockTicket, id: `ticket-${i}` }));
      mockSupportTicketRepo.findAndCount.mockResolvedValue([tickets, 15]);

      const result = await service.getUserTickets('user-1', 2, 5);

      expect(result.tickets).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(mockSupportTicketRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 5,
      });
    });

    it('should use default page and limit when not provided', async () => {
      mockSupportTicketRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.getUserTickets('user-1');

      expect(mockSupportTicketRepo.findAndCount).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getTicketById', () => {
    it('should return a ticket by id for the given user', async () => {
      mockSupportTicketRepo.findOne.mockResolvedValue(mockTicket);

      const result = await service.getTicketById('user-1', 'ticket-1');

      expect(result).toEqual(mockTicket);
      expect(mockSupportTicketRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'ticket-1', userId: 'user-1' },
      });
    });

    it('should throw NotFoundException when ticket does not exist', async () => {
      mockSupportTicketRepo.findOne.mockResolvedValue(null);

      await expect(service.getTicketById('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when ticket belongs to a different user', async () => {
      mockSupportTicketRepo.findOne.mockResolvedValue(null);

      await expect(service.getTicketById('user-2', 'ticket-1')).rejects.toThrow(NotFoundException);
    });
  });
});
