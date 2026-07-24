import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddMissingSchemaFix implements MigrationInterface {
  name = 'AddMissingSchemaFix';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'token_hash',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          {
            name: 'device_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'revoked', type: 'boolean', default: false },
          { name: 'revoked_at', type: 'timestamp', isNullable: true },
          { name: 'family', type: 'varchar', length: '36', isNullable: true },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_token_hash',
        columnNames: ['token_hash'],
      }),
    );
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'idx_refresh_tokens_expires_at',
        columnNames: ['expires_at'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'warnings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'level', type: 'integer', default: 1 },
          { name: 'reason', type: 'varchar', length: '100', isNullable: false },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'points_deducted', type: 'integer', default: 0 },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          { name: 'issued_by', type: 'uuid', isNullable: true },
          {
            name: 'expires_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'resolved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'warnings',
      new TableIndex({
        name: 'idx_warnings_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'warnings',
      new TableIndex({ name: 'idx_warnings_status', columnNames: ['status'] }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'fraud_alerts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'rule', type: 'varchar', length: '100', isNullable: false },
          {
            name: 'severity',
            type: 'varchar',
            length: '20',
            default: "'medium'",
          },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'evidence', type: 'text', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', default: "'open'" },
          { name: 'fraud_score', type: 'integer', default: 0 },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'device_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'flagged_field',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'resolved_by', type: 'uuid', isNullable: true },
          {
            name: 'resolved_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'fraud_alerts',
      new TableIndex({
        name: 'idx_fraud_alerts_user_id',
        columnNames: ['user_id'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_alerts',
      new TableIndex({
        name: 'idx_fraud_alerts_status',
        columnNames: ['status'],
      }),
    );
    await queryRunner.createIndex(
      'fraud_alerts',
      new TableIndex({
        name: 'idx_fraud_alerts_severity',
        columnNames: ['severity'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'leaderboard_archives',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'cycle', type: 'varchar', length: '20', isNullable: false },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'points', type: 'integer', isNullable: false },
          { name: 'rank', type: 'integer', isNullable: false },
          {
            name: 'previous_tier',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          { name: 'snapshot_date', type: 'timestamptz', isNullable: false },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'leaderboard_archives',
      new TableIndex({
        name: 'idx_leaderboard_cycle_snapshot',
        columnNames: ['cycle', 'snapshot_date'],
      }),
    );
    await queryRunner.createIndex(
      'leaderboard_archives',
      new TableIndex({
        name: 'idx_leaderboard_cycle_rank',
        columnNames: ['cycle', 'rank'],
      }),
    );

    // Foreign key constraints for the new tables
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ADD CONSTRAINT "fk_refresh_tokens_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "warnings"
      ADD CONSTRAINT "fk_warnings_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "fraud_alerts"
      ADD CONSTRAINT "fk_fraud_alerts_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Foreign key constraints for existing tables (defined in entities but missing from schema)
    await queryRunner.query(`
      ALTER TABLE "contest_members"
      ADD CONSTRAINT "fk_contest_members_contest_id"
      FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "contest_members"
      ADD CONSTRAINT "fk_contest_members_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "point_logs"
      ADD CONSTRAINT "fk_point_logs_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "fcm_tokens"
      ADD CONSTRAINT "fk_fcm_tokens_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_logs"
      ADD CONSTRAINT "fk_notification_logs_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "fk_transactions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "withdrawals"
      ADD CONSTRAINT "fk_withdrawals_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "fk_payments_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "posts"
      ADD CONSTRAINT "fk_posts_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD CONSTRAINT "fk_comments_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD CONSTRAINT "fk_comments_post_id"
      FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD CONSTRAINT "fk_likes_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "likes"
      ADD CONSTRAINT "fk_likes_post_id"
      FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "referrals"
      ADD CONSTRAINT "fk_referrals_referrer_id"
      FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "referrals"
      ADD CONSTRAINT "fk_referrals_referee_id"
      FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reward_redemptions"
      ADD CONSTRAINT "fk_reward_redemptions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "support_tickets"
      ADD CONSTRAINT "fk_support_tickets_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "fk_audit_logs_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "compensation_logs"
      ADD CONSTRAINT "fk_compensation_logs_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "compensation_logs"
      ADD CONSTRAINT "fk_compensation_logs_contest_id"
      FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD CONSTRAINT "fk_chat_messages_sender_id"
      FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD CONSTRAINT "fk_chat_participants_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_achievements"
      ADD CONSTRAINT "fk_user_achievements_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "kyc"
      ADD CONSTRAINT "fk_kyc_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "fk_reminders_contest_id"
      FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "poll_votes"
      ADD CONSTRAINT "fk_poll_votes_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reward_redemptions"
      ADD CONSTRAINT "fk_reward_redemptions_reward_id"
      FOREIGN KEY ("reward_id") REFERENCES "rewards"("id") ON DELETE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "reward_redemptions" DROP CONSTRAINT IF EXISTS "fk_reward_redemptions_reward_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "poll_votes" DROP CONSTRAINT IF EXISTS "fk_poll_votes_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "fk_reminders_contest_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "kyc" DROP CONSTRAINT IF EXISTS "fk_kyc_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "user_achievements" DROP CONSTRAINT IF EXISTS "fk_user_achievements_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_participants" DROP CONSTRAINT IF EXISTS "fk_chat_participants_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "fk_chat_messages_sender_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "compensation_logs" DROP CONSTRAINT IF EXISTS "fk_compensation_logs_contest_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "compensation_logs" DROP CONSTRAINT IF EXISTS "fk_compensation_logs_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "fk_audit_logs_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "support_tickets" DROP CONSTRAINT IF EXISTS "fk_support_tickets_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "reward_redemptions" DROP CONSTRAINT IF EXISTS "fk_reward_redemptions_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "fk_referrals_referee_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "fk_referrals_referrer_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "fk_likes_post_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "likes" DROP CONSTRAINT IF EXISTS "fk_likes_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "fk_comments_post_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "fk_comments_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "fk_posts_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "fk_payments_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "withdrawals" DROP CONSTRAINT IF EXISTS "fk_withdrawals_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "fk_transactions_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "notification_logs" DROP CONSTRAINT IF EXISTS "fk_notification_logs_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "fk_reminders_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "fcm_tokens" DROP CONSTRAINT IF EXISTS "fk_fcm_tokens_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "point_logs" DROP CONSTRAINT IF EXISTS "fk_point_logs_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "contest_members" DROP CONSTRAINT IF EXISTS "fk_contest_members_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "contest_members" DROP CONSTRAINT IF EXISTS "fk_contest_members_contest_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "fraud_alerts" DROP CONSTRAINT IF EXISTS "fk_fraud_alerts_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "warnings" DROP CONSTRAINT IF EXISTS "fk_warnings_user_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "fk_refresh_tokens_user_id"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "leaderboard_archives"');
    await queryRunner.query('DROP TABLE IF EXISTS "fraud_alerts"');
    await queryRunner.query('DROP TABLE IF EXISTS "warnings"');
    await queryRunner.query('DROP TABLE IF EXISTS "refresh_tokens"');
  }
}
