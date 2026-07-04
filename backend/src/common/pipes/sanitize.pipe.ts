import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

const MAX_STRING_LENGTH = parseInt(
  process.env.MAX_STRING_LENGTH || '10000',
  10,
);
const MONGODB_OPERATORS = /^\$/;

function isObject(value: any): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeString(value: string, key?: string): string {
  let result = value;

  // Strip null bytes
  result = result.replace(/\0/g, '');

  // Remove control characters except \n, \t, \r
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Unicode (NFC) to prevent homograph attacks
  result = result.normalize('NFC');

  // Strip dangerous HTML tags
  result = result
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript\s*:/gi, '');

  // Remove remaining HTML tags
  result = result.replace(/<[^>]*>/g, '');

  // Enforce max length
  if (result.length > MAX_STRING_LENGTH) {
    result = result.substring(0, MAX_STRING_LENGTH);
  }

  // Email normalization
  if (key === 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    result = result.toLowerCase().trim();
  }

  // Phone number normalization (strip spaces, dashes, parens)
  if (
    key === 'phoneNumber' ||
    key === 'phone' ||
    /^\+?\d{7,15}$/.test(result.replace(/[\s\-\(\)]/g, ''))
  ) {
    result = result.replace(/[\s\-\(\)]/g, '');
  }

  return result.trim();
}

function sanitizeValue(value: any, key?: string): any {
  if (typeof value === 'string') {
    return sanitizeString(value, key);
  }
  if (Array.isArray(value)) {
    return value.map((item, i) => sanitizeValue(item, String(i)));
  }
  if (isObject(value)) {
    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (MONGODB_OPERATORS.test(k)) {
        throw new BadRequestException(`Invalid parameter name: ${k}`);
      }
      sanitized[k] = sanitizeValue(v, k);
    }
    return sanitized;
  }
  return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    return sanitizeValue(value);
  }
}
