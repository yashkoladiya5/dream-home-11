import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from '../../audit/entities/audit-log.entity';
import { CorrelationIdMiddleware } from '../middleware/correlation-id.middleware';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  private getCorrelationId(): string {
    return CorrelationIdMiddleware.getCorrelationId();
  }

  async log(
    action: string,
    resource: string,
    resourceId: string,
    userId: string,
    metadata?: Record<string, any>,
    ip?: string,
  ): Promise<AuditLog> {
    const entry = this.auditLogRepo.create({
      action,
      targetType: resource,
      targetId: resourceId,
      userId: userId as any,
      ipAddress: ip,
      metadata: {
        ...metadata,
        correlationId: this.getCorrelationId(),
        timestamp: new Date().toISOString(),
      },
    } as any);
    return this.auditLogRepo.save(entry) as unknown as Promise<AuditLog>;
  }

  async logLogin(
    userId: string,
    success: boolean,
    ip: string,
  ): Promise<AuditLog> {
    return this.log(
      success ? 'login_success' : 'login_failure',
      'auth',
      userId,
      userId,
      { success },
      ip,
    );
  }

  async logPayment(
    userId: string,
    amount: number,
    type: string,
    status: string,
  ): Promise<AuditLog> {
    return this.log(`payment_${status}`, 'payment', userId, userId, {
      amount,
      paymentType: type,
      status,
    });
  }

  async logKyc(
    userId: string,
    action: string,
    status: string,
  ): Promise<AuditLog> {
    return this.log(`kyc_${action}`, 'kyc', userId, userId, { action, status });
  }

  async logAdminAction(
    adminId: string,
    action: string,
    targetUserId: string,
    changes: Record<string, any>,
  ): Promise<AuditLog> {
    return this.log(`admin_${action}`, 'admin', targetUserId, adminId, {
      changes,
      targetUserId,
    });
  }

  async logWithdrawal(
    userId: string,
    amount: number,
    status: string,
  ): Promise<AuditLog> {
    return this.log(`withdrawal_${status}`, 'withdrawal', userId, userId, {
      amount,
      status,
    });
  }

  async cleanupOldLogs(): Promise<void> {
    const retentionDays = parseInt(
      process.env.AUDIT_LOG_RETENTION_DAYS || '90',
      10,
    );
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    await this.auditLogRepo.delete({ createdAt: LessThan(cutoff) });
  }
}
