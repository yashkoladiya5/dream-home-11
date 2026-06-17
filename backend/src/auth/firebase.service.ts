import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );
    const enableMockAuth =
      this.configService.get<string>('ENABLE_MOCK_AUTH') === 'true';

    if (serviceAccountPath && serviceAccountPath.trim() !== '') {
      try {
        const absolutePath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.resolve(process.cwd(), serviceAccountPath);

        if (fs.existsSync(absolutePath)) {
          const fileContent = fs.readFileSync(absolutePath, 'utf8');
          const serviceAccount = JSON.parse(fileContent) as Record<
            string,
            string
          >;

          this.firebaseApp = initializeApp({
            credential: cert(serviceAccount),
          });
          console.log('Firebase Admin SDK initialized successfully.');
        } else {
          console.error(
            `Firebase Service Account JSON file not found at: ${absolutePath}`,
          );
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to initialize Firebase Admin SDK:', message);
      }
    } else if (!enableMockAuth) {
      console.warn(
        'Warning: FIREBASE_SERVICE_ACCOUNT_PATH is not set and ENABLE_MOCK_AUTH is false. Firebase Admin SDK was not initialized.',
      );
    }
  }

  async verifyIdToken(
    idToken: string,
  ): Promise<{ phoneNumber: string; uid: string }> {
    const enableMockAuth =
      this.configService.get<string>('ENABLE_MOCK_AUTH') === 'true';

    // Mock Mode verification bypass for testing
    if (enableMockAuth && idToken.startsWith('mock-token-')) {
      const phoneNumber = idToken.substring('mock-token-'.length);
      if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new UnauthorizedException(
          'Invalid mock token format. Must be mock-token-+<phone>',
        );
      }
      return {
        phoneNumber,
        uid: `mock-uid-${phoneNumber}`,
      };
    }

    // Standard Firebase Admin Verification
    if (!this.firebaseApp) {
      throw new UnauthorizedException('Firebase Admin SDK is not initialized.');
    }

    try {
      const decodedToken = await getAuth(this.firebaseApp).verifyIdToken(
        idToken,
      );
      if (!decodedToken.phone_number) {
        throw new UnauthorizedException(
          'Firebase ID token is missing phone number.',
        );
      }
      return {
        phoneNumber: decodedToken.phone_number,
        uid: decodedToken.uid,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new UnauthorizedException(
        `Firebase token verification failed: ${message}`,
      );
    }
  }
}
