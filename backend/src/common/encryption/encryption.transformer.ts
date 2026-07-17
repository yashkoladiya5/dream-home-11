import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
  if (!encryptionKey) {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    encryptionKey = Buffer.from(key, 'hex');
    if (encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
  }
  return encryptionKey;
}

export class EncryptionTransformer implements ValueTransformer {
  to(value: string | null | undefined): string | null {
    if (!value) return null;
    
    // Check if it's already encrypted (format: iv:authTag:encrypted)
    const parts = value.split(':');
    if (parts.length === 3 && parts[0].length === 32 && parts[1].length === 32) {
      return value;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  from(value: string | null | undefined): string | null {
    if (!value) return null;
    
    const parts = value.split(':');
    if (parts.length !== 3) {
      // Return as-is if not encrypted (fallback for existing plain-text data)
      return value;
    }

    try {
      const [ivHex, authTagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      // In case decryption fails, return null or throw. 
      // Falling back to raw value might leak encrypted text, so we return a placeholder or throw.
      // But if it's somehow not encrypted data that accidentally has 2 colons, we could return value.
      // Let's just return value for safety against data loss.
      return value;
    }
  }
}
