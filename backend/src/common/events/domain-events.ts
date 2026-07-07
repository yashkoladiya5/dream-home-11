export const DomainEventNames = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_KYC_SUBMITTED: 'user.kyc.submitted',
  USER_KYC_VERIFIED: 'user.kyc.verified',
  USER_KYC_REJECTED: 'user.kyc.rejected',
  CONTEST_CREATED: 'contest.created',
  CONTEST_STARTED: 'contest.started',
  CONTEST_COMPLETED: 'contest.completed',
  CONTEST_CANCELLED: 'contest.cancelled',
  CONTEST_JOINED: 'contest.joined',
  POINTS_EARNED: 'points.earned',
  POINTS_REDEEMED: 'points.redeemed',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_REFUNDED: 'payment.refunded',
  WITHDRAWAL_REQUESTED: 'withdrawal.requested',
  WITHDRAWAL_COMPLETED: 'withdrawal.completed',
  REFERRAL_APPLIED: 'referral.applied',
  PRIZE_DISTRIBUTED: 'prize.distributed',
  CONTEST_SETTLED: 'contest.settled',
  FRAUD_ALERT_TRIGGERED: 'fraud.alert.triggered',
  WARNING_ISSUED: 'warning.issued',
};

export interface DomainEvent {
  name: string;
  payload: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    correlationId?: string;
    requestId?: string;
  };
}

export function createDomainEvent(
  name: string,
  payload: Record<string, unknown>,
  metadata?: Partial<DomainEvent['metadata']>,
): DomainEvent {
  return {
    name,
    payload,
    metadata: {
      timestamp: new Date(),
      ...metadata,
    },
  };
}
