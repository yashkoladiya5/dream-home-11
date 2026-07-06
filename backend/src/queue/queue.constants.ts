export const QUEUES = {
  OTP_SMS: 'otp-sms',
  PUSH_NOTIFICATIONS: 'push-notifications',
  EMAIL: 'email',
  PRIZE_DISTRIBUTION: 'prize-distribution',
  SETTLEMENT: 'settlement',
  REMINDERS: 'reminders',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const DEFAULT_QUEUE_OPTS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600,
      count: 100,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
} as const;
