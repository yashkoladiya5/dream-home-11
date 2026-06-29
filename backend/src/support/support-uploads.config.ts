import { existsSync, mkdirSync } from 'fs';

export const SUPPORT_UPLOAD_DIR = './uploads/support';

export function ensureSupportUploadDir(): void {
  if (!existsSync(SUPPORT_UPLOAD_DIR)) {
    mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });
  }
}
