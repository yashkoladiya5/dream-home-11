import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuditService } from '../../audit/audit.service';

class BatchRequestItem {
  method: string;
  path: string;
  body?: Record<string, any>;
}

class BatchRequestDto {
  requests: BatchRequestItem[];
}

class BatchResponseItem {
  status: number;
  body: any;
}

@ApiTags('Batch')
@Controller('api/v1/batch')
export class BatchController {
  private readonly maxBatchSize = 10;

  constructor(private readonly auditService: AuditService) {}

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async handleBatch(
    @Body() dto: BatchRequestDto,
    @Req() req: Request,
  ): Promise<BatchResponseItem[]> {
    if (!dto.requests || !Array.isArray(dto.requests)) {
      throw new BadRequestException('requests must be an array');
    }

    if (dto.requests.length === 0) {
      throw new BadRequestException('requests array must not be empty');
    }

    const batch = dto.requests.slice(0, this.maxBatchSize);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const results = await Promise.allSettled(
      batch.map((item) => this.executeSubRequest(item, baseUrl, req)),
    );

    const response: BatchResponseItem[] = results.map((r) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        status: 500,
        body: { message: r.reason?.message || 'Internal error' },
      };
    });

    await this.auditService.log({
      userId: (req as any).user?.id,
      action: 'BATCH_REQUEST' as any,
      targetType: 'batch',
      metadata: {
        count: batch.length,
        paths: batch.map((b) => `${b.method} ${b.path}`),
      },
      ipAddress: req.ip,
    });

    return response;
  }

  private async executeSubRequest(
    item: BatchRequestItem,
    baseUrl: string,
    originalReq: Request,
  ): Promise<BatchResponseItem> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (originalReq.headers.authorization) {
      headers['authorization'] = originalReq.headers.authorization;
    }
    if (originalReq.headers['x-request-id']) {
      headers['x-request-id'] = originalReq.headers['x-request-id'] as string;
    }
    if (originalReq.headers['x-correlation-id']) {
      headers['x-correlation-id'] = originalReq.headers[
        'x-correlation-id'
      ] as string;
    }

    const response = await fetch(`${baseUrl}${item.path}`, {
      method: item.method.toUpperCase(),
      headers,
      body: item.body ? JSON.stringify(item.body) : undefined,
    });

    const body = await response.json();
    return { status: response.status, body };
  }
}
