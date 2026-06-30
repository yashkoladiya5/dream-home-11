import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    adminId?: string;
    userId?: string;
    action: AuditAction;
    targetId?: string;
    targetType?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const log = this.auditLogRepo.create({
      adminId: params.adminId as any,
      userId: params.userId as any,
      action: params.action,
      targetId: params.targetId as any,
      targetType: params.targetType as any,
      metadata: params.metadata as any,
      ipAddress: params.ipAddress as any,
    });
    return this.auditLogRepo.save(log) as Promise<AuditLog>;
  }

  async getLogs(query: { page?: number; limit?: number; action?: string; adminId?: string; userId?: string }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.adminId) where.adminId = query.adminId;
    if (query.userId) where.userId = query.userId;

    const [logs, total] = await this.auditLogRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { admin: true },
    });

    return {
      logs: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        adminId: l.adminId,
        adminName: l.admin?.fullName || l.admin?.phoneNumber || null,
        action: l.action,
        targetId: l.targetId,
        targetType: l.targetType,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
