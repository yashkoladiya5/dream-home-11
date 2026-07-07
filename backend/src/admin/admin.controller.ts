import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getUsers({
      ...query,
      isActive:
        query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @Get('users/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @GetUser() admin: User,
    @Req() req: any,
  ) {
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
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getContests(@Query() query: QueryContestsDto) {
    return this.adminService.getContests(query);
  }

  @Get('contests/:id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getContest(@Param('id') id: string) {
    return this.adminService.getContestById(id);
  }

  @Get('kyc')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getKycSubmissions(@Query() query: QueryKycDto) {
    return this.adminService.getKycSubmissions(query);
  }

  @Patch('kyc/:id/approve')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async approveKyc(
    @Param('id') id: string,
    @GetUser() admin: User,
    @Req() req: any,
  ) {
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
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async rejectKyc(
    @Param('id') id: string,
    @Body() dto: RejectKycDto,
    @GetUser() admin: User,
    @Req() req: any,
  ) {
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
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updateConfig(
    @Body() dto: Record<string, any>,
    @GetUser() admin: User,
    @Req() req: any,
  ) {
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
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getSupportTickets(
    @Query()
    query: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    },
  ) {
    return this.adminService.getSupportTickets(query);
  }

  @Patch('support-tickets/:id/status')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body() dto: { status: string },
    @GetUser() admin: User,
    @Req() req: any,
  ) {
    const result = await this.adminService.updateTicketStatus(id, dto.status);
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.UPDATE_TICKET_STATUS,
      targetId: id,
      targetType: 'ticket',
      metadata: { status: dto.status },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('contests/:id/compensate')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async compensateContest(
    @Param('id') id: string,
    @GetUser() admin: User,
    @Req() req: any,
  ) {
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
  @Throttle({ default: { ttl: 60000, limit: 5 } })
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
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getCompensationLogs(
    @Query() query: { page?: number; limit?: number; status?: string },
  ) {
    return this.adminService.getCompensationLogs(query);
  }

  @Get('compensations/stats')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getCompensationStats() {
    return this.adminService.getDetailedCompensationStats();
  }

  @Get('compensations/export')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async exportCompensations(@Query() query: { status?: string }) {
    return this.adminService.exportCompensations(query);
  }

  @Post('notifications/broadcast')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async broadcastNotification(
    @Body() dto: { title: string; message: string; tier?: string },
    @GetUser() admin: User,
    @Req() req: any,
  ) {
    const result = await this.adminService.broadcastPush(
      dto.title,
      dto.message,
      dto.tier,
    );
    await this.auditService.log({
      adminId: admin.id,
      action: AuditAction.BROADCAST_NOTIFICATION,
      targetType: 'broadcast',
      metadata: {
        title: dto.title,
        tier: dto.tier || 'all',
        sentCount: result.sent,
      },
      ipAddress: req.ip,
    });
    return result;
  }

  @Post('notifications/broadcast-sms')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
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
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getAuditLogs(
    @Query() query: { page?: number; limit?: number; action?: string },
  ) {
    return this.auditService.getLogs(query);
  }

  @Post('contests')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createContest(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.createContest(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.CREATE_CONTEST,
      targetId: result.id, targetType: 'contest', metadata: { title: dto.title }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('contests/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updateContest(@Param('id') id: string, @Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateContest(id, dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONTEST,
      targetId: id, targetType: 'contest', metadata: dto, ipAddress: req.ip,
    });
    return result;
  }

  @Delete('contests/:id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async deleteContest(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.deleteContest(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.DELETE_CONTEST,
      targetId: id, targetType: 'contest', ipAddress: req.ip,
    });
    return { success: true };
  }

  @Get('banners')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getBanners() {
    return this.adminService.getBanners();
  }

  @Post('banners')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createBanner(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.createBanner(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: result.id, targetType: 'banner', metadata: { title: dto.title }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('banners/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updateBanner(@Param('id') id: string, @Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateBanner(id, dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'banner', metadata: dto, ipAddress: req.ip,
    });
    return result;
  }

  @Delete('banners/:id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async deleteBanner(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.deleteBanner(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'banner', ipAddress: req.ip,
    });
    return { success: true };
  }

  @Post('banners/reorder')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async reorderBanners(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.reorderBanners(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetType: 'banner', metadata: { reorder: true }, ipAddress: req.ip,
    });
    return { success: true };
  }

  @Get('prize-homes')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getPrizeHomes() {
    return this.adminService.getPrizeHomes();
  }

  @Post('prize-homes')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createPrizeHome(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.createPrizeHome(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: result.id, targetType: 'prize_home', metadata: { title: result.title }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('prize-homes/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updatePrizeHome(@Param('id') id: string, @Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updatePrizeHome(id, dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'prize_home', metadata: dto, ipAddress: req.ip,
    });
    return result;
  }

  @Delete('prize-homes/:id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async deletePrizeHome(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.deletePrizeHome(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'prize_home', ipAddress: req.ip,
    });
    return { success: true };
  }

  @Get('warnings')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getWarnings(@Query() query: { page?: number; limit?: number; status?: string; userId?: string }) {
    return this.adminService.getWarnings(query);
  }

  @Post('warnings')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async issueWarning(@Body() dto: { userId: string; level: number; reason: string; notes?: string }, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.issueWarning(dto, admin.id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_USER,
      targetId: dto.userId, targetType: 'warning', metadata: { level: dto.level, reason: dto.reason }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('warnings/:id/resolve')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async resolveWarning(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.resolveWarning(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_USER,
      targetId: id, targetType: 'warning', metadata: { resolved: true }, ipAddress: req.ip,
    });
    return result;
  }

  @Get('fraud/alerts')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getFraudAlerts(@Query() query: { page?: number; limit?: number; severity?: string; status?: string; search?: string }) {
    return this.adminService.getFraudAlerts(query);
  }

  @Get('fraud/stats')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getFraudStats() {
    return this.adminService.getFraudStats();
  }

  @Patch('fraud/alerts/:id/resolve')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updateFraudAlert(@Param('id') id: string, @Body() dto: { status: string }, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateFraudAlert(id, dto.status, admin.id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_USER,
      targetId: id, targetType: 'fraud_alert', metadata: { status: dto.status }, ipAddress: req.ip,
    });
    return result;
  }

  @Get('transactions')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getTransactions(@Query() query: { page?: number; limit?: number; type?: string; userId?: string }) {
    return this.adminService.getTransactions(query);
  }

  @Get('withdrawals')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getWithdrawals(@Query() query: { page?: number; limit?: number; status?: string }) {
    return this.adminService.getWithdrawals(query);
  }

  @Patch('withdrawals/:id/approve')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async approveWithdrawal(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.approveWithdrawal(id, admin.id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_USER,
      targetId: id, targetType: 'withdrawal', metadata: { status: 'approved' }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('withdrawals/:id/reject')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async rejectWithdrawal(@Param('id') id: string, @Body() dto: { reason: string }, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.rejectWithdrawal(id, dto.reason, admin.id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_USER,
      targetId: id, targetType: 'withdrawal', metadata: { status: 'rejected', reason: dto.reason }, ipAddress: req.ip,
    });
    return result;
  }

  @Get('rewards')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getRewards() {
    return this.adminService.getRewards();
  }

  @Post('rewards')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createReward(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.createReward(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: result.id, targetType: 'reward', metadata: { title: dto.title }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('rewards/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updateReward(@Param('id') id: string, @Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updateReward(id, dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'reward', metadata: dto, ipAddress: req.ip,
    });
    return result;
  }

  @Delete('rewards/:id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async deleteReward(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.deleteReward(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'reward', ipAddress: req.ip,
    });
    return { success: true };
  }

  @Get('referrals')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getReferrals(@Query() query: { page?: number; limit?: number }) {
    return this.adminService.getReferrals(query);
  }

  @Get('polls')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async getPolls() {
    return this.adminService.getPolls();
  }

  @Post('polls')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createPoll(@Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.createPoll(dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: result.id, targetType: 'poll', metadata: { question: dto.question }, ipAddress: req.ip,
    });
    return result;
  }

  @Patch('polls/:id')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async updatePoll(@Param('id') id: string, @Body() dto: any, @GetUser() admin: User, @Req() req: any) {
    const result = await this.adminService.updatePoll(id, dto);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'poll', metadata: dto, ipAddress: req.ip,
    });
    return result;
  }

  @Delete('polls/:id')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async deletePoll(@Param('id') id: string, @GetUser() admin: User, @Req() req: any) {
    await this.adminService.deletePoll(id);
    await this.auditService.log({
      adminId: admin.id, action: AuditAction.UPDATE_CONFIG,
      targetId: id, targetType: 'poll', ipAddress: req.ip,
    });
    return { success: true };
  }

  @Post('reports/export')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async exportReport(@Body() dto: { type: string }, @Query() query: any) {
    return this.adminService.exportReport(dto.type, query);
  }
}
