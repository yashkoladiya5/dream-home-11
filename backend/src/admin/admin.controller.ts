import {
  Controller, Get, Patch, Post, Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import {
  QueryUsersDto,
  UpdateUserDto,
  QueryContestsDto,
  QueryKycDto,
  RejectKycDto,
} from './dto';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers({
      ...query,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateUser(id, dto as any);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.UPDATE_USER,
      targetId: id,
      targetType: 'user',
      metadata: dto as any,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('contests')
  async getContests(@Query() query: QueryContestsDto) {
    return this.adminService.getContests(query);
  }

  @Get('contests/:id')
  async getContest(@Param('id') id: string) {
    return this.adminService.getContestById(id);
  }

  @Get('kyc')
  async getKycSubmissions(@Query() query: QueryKycDto) {
    return this.adminService.getKycSubmissions(query);
  }

  @Patch('kyc/:id/approve')
  async approveKyc(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.approveKyc(id);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.APPROVE_KYC,
      targetId: id,
      targetType: 'kyc',
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch('kyc/:id/reject')
  async rejectKyc(@Param('id') id: string, @Body() dto: RejectKycDto, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.rejectKyc(id, dto.reason);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.REJECT_KYC,
      targetId: id,
      targetType: 'kyc',
      metadata: { reason: dto.reason },
      ipAddress: req.ip,
    });
    return result;
  }

  @Patch('config')
  async updateConfig(@Body() dto: Record<string, any>, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateSystemConfig(dto);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.UPDATE_CONFIG,
      metadata: { updatedKeys: Object.keys(dto) },
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('support-tickets')
  async getSupportTickets(
    @Query() query: { page?: number; limit?: number; status?: string; category?: string },
  ) {
    return this.adminService.getSupportTickets(query);
  }

  @Post('contests/:id/compensate')
  async compensateContest(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.compensateContest(id);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.COMPENSATE_CONTEST,
      targetId: id,
      targetType: 'contest',
      metadata: result,
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('compensations/process-pending')
  async processPendingCompensations(@GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.processPendingCompensations();
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.PROCESS_PENDING_COMPENSATIONS,
      metadata: result,
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('compensations')
  async getCompensationLogs(
    @Query() query: { page?: number; limit?: number; status?: string },
  ) {
    return this.adminService.getCompensationLogs(query);
  }

  @Get('compensations/stats')
  async getCompensationStats() {
    return this.adminService.getDetailedCompensationStats();
  }

  @Get('compensations/export')
  async exportCompensations(@Query() query: { status?: string }) {
    return this.adminService.exportCompensations(query);
  }

  @Post('notifications/broadcast')
  async broadcastNotification(
    @Body() dto: { title: string; message: string; tier?: string },
    @GetUser() admin: User,
    @Req() req: any,
  ) {
    const result = await this.adminService.broadcastPush(dto.title, dto.message, dto.tier);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.BROADCAST_NOTIFICATION,
      targetType: 'broadcast',
      metadata: { title: dto.title, tier: dto.tier || 'all', sentCount: result.sent },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('notifications/broadcast-sms')
  async broadcastSms(
    @Body() dto: { message: string; tier?: string },
    @GetUser() admin: User,
    @Req() req: any,
  ) {
    const result = await this.adminService.broadcastSms(dto.message, dto.tier);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.BROADCAST_NOTIFICATION,
      targetType: 'broadcast_sms',
      metadata: { tier: dto.tier || 'all', sentCount: result.sent },
      ipAddress: req.ip,
    });
    return result;
  }

  @Get('audit-logs')
  async getAuditLogs(@Query() query: { page?: number; limit?: number; action?: string }) {
    return this.auditService.getLogs(query);
  }
}
