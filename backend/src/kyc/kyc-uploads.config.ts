import { existsSync, mkdirSync } from 'fs';

export const KYC_UPLOAD_DIR = './uploads/kyc';

export function ensureUploadDir(): void {
  if (!existsSync(KYC_UPLOAD_DIR)) {
    mkdirSync(KYC_UPLOAD_DIR, { recursive: true });
  }
}
