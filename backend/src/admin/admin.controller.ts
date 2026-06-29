import {
  Controller, Get, Patch, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
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
  constructor(private readonly adminService: AdminService) {}

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
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto as any);
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
  async approveKyc(@Param('id') id: string) {
    return this.adminService.approveKyc(id);
  }

  @Patch('kyc/:id/reject')
  async rejectKyc(@Param('id') id: string, @Body() dto: RejectKycDto) {
    return this.adminService.rejectKyc(id, dto.reason);
  }

  @Patch('config')
  async updateConfig(@Body() dto: Record<string, any>) {
    return this.adminService.updateSystemConfig(dto);
  }

  @Get('support-tickets')
  async getSupportTickets(
    @Query() query: { page?: number; limit?: number; status?: string; category?: string },
  ) {
    return this.adminService.getSupportTickets(query);
  }

  @Post('contests/:id/compensate')
  async compensateContest(@Param('id') id: string) {
    return this.adminService.compensateContest(id);
  }

  @Post('compensations/process-pending')
  async processPendingCompensations() {
    return this.adminService.processPendingCompensations();
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
}
