import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddPerformanceIndexes implements MigrationInterface {
  name = 'AddPerformanceIndexes';

  async up(queryRunner: QueryRunner): Promise<void> {
    // contest_members composite indexes
    await queryRunner.createIndex(
      'contest_members',
      new TableIndex({
        name: 'idx_contest_members_user_contest',
        columnNames: ['user_id', 'contest_id'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contest_members_contest_status"
      ON "contest_members" ("contest_id", "status")
      WHERE "status" IS NOT NULL
    `);

    // transactions composite and partial indexes
    await queryRunner.createIndex(
      'transactions',
      new TableIndex({
        name: 'idx_transactions_user_type_created',
        columnNames: ['user_id', 'type', 'created_at'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_user_deposits"
      ON "transactions" ("user_id", "created_at" DESC)
      WHERE "type" = 'deposit'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_user_withdrawals"
      ON "transactions" ("user_id", "created_at" DESC)
      WHERE "type" = 'withdrawal'
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_transactions_user_contest_joins"
      ON "transactions" ("user_id", "created_at" DESC)
      WHERE "type" = 'contest_join'
    `);

    // point_logs composite indexes
    await queryRunner.createIndex(
      'point_logs',
      new TableIndex({
        name: 'idx_point_logs_user_created',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_point_logs_contest_user"
      ON "point_logs" ("contest_id", "user_id")
      WHERE "contest_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_point_logs_weekly"
      ON "point_logs" ("user_id", "created_at" DESC)
      WHERE "created_at" >= NOW() - INTERVAL '7 days'
    `);

    // audit_logs composite index
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        name: 'idx_audit_logs_user_action_created',
        columnNames: ['user_id', 'action', 'created_at'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_admin_action_created"
      ON "audit_logs" ("admin_id", "action", "created_at" DESC)
      WHERE "admin_id" IS NOT NULL
    `);

    // chat_messages composite indexes
    await queryRunner.createIndex(
      'chat_messages',
      new TableIndex({
        name: 'idx_chat_messages_chat_created_desc',
        columnNames: ['chat_id', 'created_at'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chat_messages_sender_receiver"
      ON "chat_messages" ("sender_id", "receiver_id", "created_at" DESC)
      WHERE "receiver_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_chat_messages_unread"
      ON "chat_messages" ("receiver_id", "created_at" DESC)
      WHERE NOT "is_read"
    `);

    // posts composite indexes
    await queryRunner.createIndex(
      'posts',
      new TableIndex({
        name: 'idx_posts_user_created',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_posts_active_created"
      ON "posts" ("user_id", "created_at" DESC)
      WHERE "is_active" = true
    `);

    // withdrawals composite index
    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({
        name: 'idx_withdrawals_user_status_created',
        columnNames: ['user_id', 'status', 'created_at'],
      }),
    );

    // payments composite index
    await queryRunner.createIndex(
      'payments',
      new TableIndex({
        name: 'idx_payments_user_created',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // referrals composite index
    await queryRunner.createIndex(
      'referrals',
      new TableIndex({
        name: 'idx_referrals_referrer_status',
        columnNames: ['referrer_id', 'status', 'created_at'],
      }),
    );

    // notification_logs composite index
    await queryRunner.createIndex(
      'notification_logs',
      new TableIndex({
        name: 'idx_notification_logs_user_inbox',
        columnNames: ['user_id', 'created_at'],
      }),
    );

    // reward_redemptions composite index
    await queryRunner.createIndex(
      'reward_redemptions',
      new TableIndex({
        name: 'idx_reward_redemptions_user_status',
        columnNames: ['user_id', 'status', 'redeemed_at'],
      }),
    );

    // Run ANALYZE to update query planner statistics
    await queryRunner.query('ANALYZE contest_members');
    await queryRunner.query('ANALYZE transactions');
    await queryRunner.query('ANALYZE point_logs');
    await queryRunner.query('ANALYZE audit_logs');
    await queryRunner.query('ANALYZE chat_messages');
    await queryRunner.query('ANALYZE posts');
    await queryRunner.query('ANALYZE withdrawals');
    await queryRunner.query('ANALYZE payments');
    await queryRunner.query('ANALYZE referrals');
    await queryRunner.query('ANALYZE notification_logs');
    await queryRunner.query('ANALYZE reward_redemptions');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('contest_members', 'idx_contest_members_user_contest');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_contest_members_contest_status"');
    await queryRunner.dropIndex('transactions', 'idx_transactions_user_type_created');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_transactions_user_deposits"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_transactions_user_withdrawals"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_transactions_user_contest_joins"');
    await queryRunner.dropIndex('point_logs', 'idx_point_logs_user_created');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_point_logs_contest_user"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_point_logs_weekly"');
    await queryRunner.dropIndex('audit_logs', 'idx_audit_logs_user_action_created');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_audit_logs_admin_action_created"');
    await queryRunner.dropIndex('chat_messages', 'idx_chat_messages_chat_created_desc');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_messages_sender_receiver"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_chat_messages_unread"');
    await queryRunner.dropIndex('posts', 'idx_posts_user_created');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_posts_active_created"');
    await queryRunner.dropIndex('withdrawals', 'idx_withdrawals_user_status_created');
    await queryRunner.dropIndex('payments', 'idx_payments_user_created');
    await queryRunner.dropIndex('referrals', 'idx_referrals_referrer_status');
    await queryRunner.dropIndex('notification_logs', 'idx_notification_logs_user_inbox');
    await queryRunner.dropIndex('reward_redemptions', 'idx_reward_redemptions_user_status');
  }
}
