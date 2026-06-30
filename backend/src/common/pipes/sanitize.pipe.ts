import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        value[key] = this.transform(value[key]);
      }
    }
    return value;
  }
}
