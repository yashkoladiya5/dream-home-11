import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async verifyOtp(
    idToken: string,
    deviceId: string,
  ): Promise<{ token: string; user: User }> {
    const { phoneNumber } = await this.firebaseService.verifyIdToken(idToken);

    const user = await this.usersService.upsertUser(phoneNumber, deviceId);

    const payload = { sub: user.id, phoneNumber: user.phoneNumber };
    const token = this.jwtService.sign(payload);

    return { token, user };
  }
}
