import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { exec } from 'child_process';

@Injectable()
export class AuthService {
  // In-memory cache for OTP codes. Key: phone number, Value: OTP and expiration date.
  private otpStore = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  requestOtp(phoneNumber: string): { success: boolean; message: string } {
    // Generate a 6-digit random number
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    this.otpStore.set(phoneNumber, { code: otpCode, expiresAt });

    // Print OTP code to console
    console.log(
      `[Nest] ✉️ [Mock SMS] Verification code for ${phoneNumber} is: ${otpCode}`,
    );

    // If running on macOS, try sending it to the user's real device via AppleScript Messages app
    if (process.platform === 'darwin' && process.env.NODE_ENV !== 'test') {
      const appleScript = `tell application "Messages" to send "Dream Home 11 verification code: ${otpCode}" to buddy "${phoneNumber}"`;
      exec(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`, (err) => {
        if (err) {
          console.warn(
            '[Nest] ⚠️ [Mock SMS] Failed to forward code via macOS Messages app:',
            err.message,
          );
        } else {
          console.log(
            `[Nest] ✉️ [Mock SMS] Forwarded verification code to ${phoneNumber} via macOS Messages app.`,
          );
        }
      });
    }

    return {
      success: true,
      message: 'OTP requested successfully',
    };
  }

  async verifyOtp(
    idToken: string,
    deviceId: string,
    otpCode?: string,
  ): Promise<{ token: string; user: User }> {
    const { phoneNumber } = await this.firebaseService.verifyIdToken(idToken);

    if (idToken.startsWith('mock-token-')) {
      const cachedOtp = this.otpStore.get(phoneNumber);

      if (!cachedOtp) {
        throw new UnauthorizedException('Invalid OTP verification code');
      }

      if (new Date() > cachedOtp.expiresAt) {
        this.otpStore.delete(phoneNumber);
        throw new UnauthorizedException('Invalid OTP verification code');
      }

      if (cachedOtp.code !== otpCode) {
        throw new UnauthorizedException('Invalid OTP verification code');
      }

      // Clear the code on success
      this.otpStore.delete(phoneNumber);
    }

    const user = await this.usersService.upsertUser(phoneNumber, deviceId);

    const payload = { sub: user.id, phoneNumber: user.phoneNumber };
    const token = this.jwtService.sign(payload);

    return { token, user };
  }
}
