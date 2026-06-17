import { Controller, Get, Post, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@GetUser() user: User): User {
    return user;
  }

  @Post('deposit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deposit(@GetUser() user: User, @Body('amount') amount: number): Promise<User> {
    return this.usersService.addCash(user.id, amount);
  }

  @Post('join-contest')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async joinContest(
    @GetUser() user: User,
    @Body('entryFee') entryFee: number,
    @Body('pointsEarned') pointsEarned: number,
  ): Promise<User> {
    return this.usersService.joinContest(user.id, entryFee, pointsEarned);
  }

  @Post('redeem-reward')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async redeemReward(@GetUser() user: User, @Body('pointsCost') pointsCost: number): Promise<User> {
    return this.usersService.redeemReward(user.id, pointsCost);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @GetUser() user: User,
    @Body('fullName') fullName?: string,
    @Body('email') email?: string,
    @Body('avatarUrl') avatarUrl?: string,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, { fullName, email, avatarUrl });
  }
}

