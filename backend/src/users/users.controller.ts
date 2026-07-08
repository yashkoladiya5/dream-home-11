import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('me/multiplier')
  @UseGuards(JwtAuthGuard)
  async getMultiplier(@GetUser() user: User) {
    return this.usersService.getMultiplierInfo(user.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getUserStats(@GetUser() user: User) {
    return this.usersService.getUserStats(user.id);
  }

  @Get('me/contests')
  @UseGuards(JwtAuthGuard)
  async getMyContests(@GetUser() user: User) {
    return this.usersService.getMyContests(user.id);
  }

  @Get('me/compensations')
  @UseGuards(JwtAuthGuard)
  async getMyCompensations(
    @GetUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.usersService.getUserCompensations(user.id, {
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('contests/home')
  @UseGuards(JwtAuthGuard)
  async getMyHomeContests(@GetUser() user: User) {
    return this.usersService.getMyHomeContests(user.id);
  }

  @Patch('profile')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }),
  )
  async updateProfile(
    @GetUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('bank-details')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateBankDetails(
    @GetUser() user: User,
    @Body('bankAccountNumber') bankAccountNumber?: string,
    @Body('bankIfsc') bankIfsc?: string,
    @Body('bankName') bankName?: string,
    @Body('upiId') upiId?: string,
  ) {
    return this.usersService.updateBankDetails(user.id, {
      bankAccountNumber,
      bankIfsc,
      bankName,
      upiId,
    });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@GetUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const limitNum = Math.min(
      50,
      Math.max(1, parseInt(limit || '20', 10) || 20),
    );
    return this.usersService.searchUsers(query || '', pageNum, limitNum);
  }
}
