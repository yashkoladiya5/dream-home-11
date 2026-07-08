import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.production') });

import { User } from '../users/entities/user.entity';
import { Kyc } from '../kyc/entities/kyc.entity';
import { Contest } from '../contests/entities/contest.entity';
import { ContestMember } from '../contests/entities/contest-member.entity';
import { PointLog } from '../points/entities/point-log.entity';
import { FcmToken } from '../notifications/entities/fcm-token.entity';
import { Reminder } from '../notifications/entities/reminder.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Share } from '../share-tracker/entities/share.entity';
import { Reward } from '../rewards/entities/reward.entity';
import { RewardRedemption } from '../rewards/entities/reward-redemption.entity';
import { Banner } from '../banners/entities/banner.entity';
import { Achievement } from '../achievements/entities/achievement.entity';
import { UserAchievement } from '../achievements/entities/user-achievement.entity';
import { PrizeHome } from '../prize-homes/entities/prize-home.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SavedPaymentMethod } from '../payment-methods/entities/saved-payment-method.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { Post } from '../feed/entities/post.entity';
import { Like } from '../feed/entities/like.entity';
import { Comment } from '../feed/entities/comment.entity';
import { Poll } from '../polls/entities/poll.entity';
import { PollVote } from '../polls/entities/poll-vote.entity';
import { Referral } from '../referral/entities/referral.entity';
import { Chat } from '../chat/entities/chat.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { ChatParticipant } from '../chat/entities/chat-participant.entity';
import { SupportTicket } from '../support/entities/support-ticket.entity';
import { CompensationLog } from '../compensation/entities/compensation.entity';
import { SystemConfig } from '../config/entities/system-config.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Warning } from '../admin/entities/warning.entity';
import { FraudAlert } from '../admin/entities/fraud-alert.entity';
import { LeaderboardArchive } from '../leaderboard/entities/leaderboard-archive.entity';
import { Wallet } from '../wallet/entities/wallet.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'dream_home_11',
  entities: [
    User,
    Kyc,
    Contest,
    ContestMember,
    PointLog,
    FcmToken,
    Reminder,
    NotificationLog,
    Share,
    Reward,
    RewardRedemption,
    Banner,
    Achievement,
    UserAchievement,
    PrizeHome,
    Transaction,
    Payment,
    SavedPaymentMethod,
    Withdrawal,
    Post,
    Like,
    Comment,
    Poll,
    PollVote,
    Referral,
    Chat,
    ChatMessage,
    ChatParticipant,
    SupportTicket,
    CompensationLog,
    SystemConfig,
    AuditLog,
    RefreshToken,
    Warning,
    FraudAlert,
    LeaderboardArchive,
    Wallet,
  ],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: ['error', 'warn'],
  extra: {
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});
