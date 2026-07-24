import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { ConsentService } from '../common/consent/consent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyAgeDto } from './dto/verify-age.dto';
import { RecordConsentDto } from './dto/record-consent.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly consentService: ConsentService,
    @InjectRepository(Kyc)
    private readonly kycRepository: Repository<Kyc>,
  ) {}

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

  @Post('consent')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async recordConsent(
    @GetUser() user: User,
    @Body() dto: RecordConsentDto,
    @Req() req: any,
  ) {
    return this.consentService.recordConsent(
      user.id,
      dto.consentType,
      dto.accepted,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Get('consents')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseGuards(JwtAuthGuard)
  async getUserConsents(@GetUser() user: User) {
    return this.consentService.getUserConsents(user.id);
  }

  @Post('verify-age')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async verifyAge(
    @GetUser() user: User,
    @Body() dto: VerifyAgeDto,
  ) {
    let kyc = await this.kycRepository.findOne({ where: { userId: user.id } });
    if (!kyc) {
      kyc = this.kycRepository.create({ userId: user.id });
    }
    kyc.dateOfBirth = dto.dateOfBirth;
    await this.kycRepository.save(kyc);
    return { verified: true };
  }

  @Post('accept-terms')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptTerms(@GetUser() user: User) {
    return this.usersService.acceptTerms(user.id);
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

  @Delete('me')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@GetUser() user: User) {
    await this.usersService.deleteAccount(user.id);
  }

  @Post('self-exclude')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async selfExclude(@GetUser() user: User, @Body() body: { days: number }) {
    if (!body.days || body.days <= 0) {
      throw new BadRequestException('Days must be a positive number');
    }
    await this.usersService.selfExclude(user.id, body.days);
    return { message: 'Self-exclusion activated successfully' };
  }
}
