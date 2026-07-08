import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddSchemaConstraints implements MigrationInterface {
  name = 'AddSchemaConstraints';

  async up(queryRunner: QueryRunner): Promise<void> {
    // === Add missing kyc columns (created_at, updated_at) ===
    await queryRunner.query(`
      ALTER TABLE "kyc"
      ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "kyc"
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
    `);

    // === Missing FK constraints ===
    await queryRunner.query(`
      ALTER TABLE "shares"
      ADD CONSTRAINT "fk_shares_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "shares"
      ADD CONSTRAINT "fk_shares_contest_id"
      FOREIGN KEY ("contest_id") REFERENCES "contests"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD CONSTRAINT "fk_chat_messages_chat_id"
      FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "chat_participants"
      ADD CONSTRAINT "fk_chat_participants_chat_id"
      FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "poll_votes"
      ADD CONSTRAINT "fk_poll_votes_poll_id"
      FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "user_achievements"
      ADD CONSTRAINT "fk_user_achievements_achievement_id"
      FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "audit_logs"
      ADD CONSTRAINT "fk_audit_logs_admin_id"
      FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "saved_payment_methods"
      ADD CONSTRAINT "fk_saved_payment_methods_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "warnings"
      ADD CONSTRAINT "fk_warnings_issued_by"
      FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "fraud_alerts"
      ADD CONSTRAINT "fk_fraud_alerts_resolved_by"
      FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // === CHECK constraints ===
    // Financial constraints on users
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_wallet_balance_non_negative" CHECK (wallet_balance_inr >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_points_balance_non_negative" CHECK (points_balance >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_lifetime_points_non_negative" CHECK (lifetime_points >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_weekly_points_non_negative" CHECK (weekly_points >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_monthly_points_non_negative" CHECK (monthly_points >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_current_streak_non_negative" CHECK (current_streak >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "chk_users_longest_streak_non_negative" CHECK (longest_streak >= 0)
    `);

    // Contest constraints
    await queryRunner.query(`
      ALTER TABLE "contests"
      ADD CONSTRAINT "chk_contests_entry_fee_non_negative" CHECK (entry_fee_inr >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "contests"
      ADD CONSTRAINT "chk_contests_max_slots_positive" CHECK (max_slots > 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "contests"
      ADD CONSTRAINT "chk_contests_filled_slots_valid" CHECK (filled_slots >= 0 AND filled_slots <= max_slots)
    `);
    await queryRunner.query(`
      ALTER TABLE "contests"
      ADD CONSTRAINT "chk_contests_points_to_join_non_negative" CHECK (points_to_join >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "contest_members"
      ADD CONSTRAINT "chk_contest_members_points_non_negative" CHECK (points_earned >= 0)
    `);

    // Payment & Withdrawal constraints
    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "chk_payments_amount_positive" CHECK (amount > 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "withdrawals"
      ADD CONSTRAINT "chk_withdrawals_amount_positive" CHECK (amount > 0)
    `);

    // Points constraints
    await queryRunner.query(`
      ALTER TABLE "point_logs"
      ADD CONSTRAINT "chk_point_logs_base_points_non_negative" CHECK (base_points >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "point_logs"
      ADD CONSTRAINT "chk_point_logs_final_points_non_negative" CHECK (final_points >= 0)
    `);

    // Fraud alerts score range
    await queryRunner.query(`
      ALTER TABLE "fraud_alerts"
      ADD CONSTRAINT "chk_fraud_alerts_score_range" CHECK (fraud_score >= 0 AND fraud_score <= 100)
    `);

    // Compensation constraints
    await queryRunner.query(`
      ALTER TABLE "compensation_logs"
      ADD CONSTRAINT "chk_compensation_entry_fee_non_negative" CHECK (entry_fee_inr >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "compensation_logs"
      ADD CONSTRAINT "chk_compensation_points_non_negative" CHECK (compensation_points >= 0)
    `);

    // Rewards constraints
    await queryRunner.query(`
      ALTER TABLE "rewards"
      ADD CONSTRAINT "chk_rewards_points_required_positive" CHECK (points_required > 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "rewards"
      ADD CONSTRAINT "chk_rewards_stock_non_negative" CHECK (stock IS NULL OR stock >= 0)
    `);
    await queryRunner.query(`
      ALTER TABLE "reward_redemptions"
      ADD CONSTRAINT "chk_reward_redemptions_points_spent_positive" CHECK (points_spent > 0)
    `);

    // === Missing indexes ===
    await queryRunner.createIndex(
      'shares',
      new TableIndex({ name: 'idx_shares_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'shares',
      new TableIndex({ name: 'idx_shares_contest_id', columnNames: ['contest_id'] }),
    );

    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({ name: 'idx_support_tickets_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'support_tickets',
      new TableIndex({ name: 'idx_support_tickets_status', columnNames: ['status'] }),
    );

    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({ name: 'idx_withdrawals_status', columnNames: ['status'] }),
    );

    await queryRunner.createIndex(
      'payments',
      new TableIndex({ name: 'idx_payments_status', columnNames: ['status'] }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({ name: 'idx_refresh_tokens_user_id', columnNames: ['user_id'] }),
    );
    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({ name: 'idx_refresh_tokens_revoked', columnNames: ['revoked'] }),
    );

    await queryRunner.createIndex(
      'kyc',
      new TableIndex({ name: 'idx_kyc_status', columnNames: ['status'] }),
    );

    await queryRunner.createIndex(
      'polls',
      new TableIndex({ name: 'idx_polls_is_active', columnNames: ['is_active'] }),
    );

    await queryRunner.createIndex(
      'rewards',
      new TableIndex({ name: 'idx_rewards_is_active', columnNames: ['is_active'] }),
    );

    await queryRunner.createIndex(
      'banners',
      new TableIndex({ name: 'idx_banners_is_active', columnNames: ['is_active'] }),
    );

    await queryRunner.createIndex(
      'prize_homes',
      new TableIndex({ name: 'idx_prize_homes_is_active', columnNames: ['is_active'] }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'idx_users_role', columnNames: ['role'] }),
    );

    // Composite index with DESC for leaderboard queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_contest_members_contest_points"
      ON "contest_members" ("contest_id", "points_earned" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // === Drop composite index ===
    await queryRunner.query('DROP INDEX IF EXISTS "idx_contest_members_contest_points"');

    // === Drop simple indexes ===
    await queryRunner.dropIndex('users', 'idx_users_role');
    await queryRunner.dropIndex('prize_homes', 'idx_prize_homes_is_active');
    await queryRunner.dropIndex('banners', 'idx_banners_is_active');
    await queryRunner.dropIndex('rewards', 'idx_rewards_is_active');
    await queryRunner.dropIndex('polls', 'idx_polls_is_active');
    await queryRunner.dropIndex('kyc', 'idx_kyc_status');
    await queryRunner.dropIndex('refresh_tokens', 'idx_refresh_tokens_revoked');
    await queryRunner.dropIndex('refresh_tokens', 'idx_refresh_tokens_user_id');
    await queryRunner.dropIndex('payments', 'idx_payments_status');
    await queryRunner.dropIndex('withdrawals', 'idx_withdrawals_status');
    await queryRunner.dropIndex('support_tickets', 'idx_support_tickets_status');
    await queryRunner.dropIndex('support_tickets', 'idx_support_tickets_user_id');
    await queryRunner.dropIndex('shares', 'idx_shares_contest_id');
    await queryRunner.dropIndex('shares', 'idx_shares_user_id');

    // === Drop CHECK constraints ===
    await queryRunner.query('ALTER TABLE "reward_redemptions" DROP CONSTRAINT IF EXISTS "chk_reward_redemptions_points_spent_positive"');
    await queryRunner.query('ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "chk_rewards_stock_non_negative"');
    await queryRunner.query('ALTER TABLE "rewards" DROP CONSTRAINT IF EXISTS "chk_rewards_points_required_positive"');
    await queryRunner.query('ALTER TABLE "compensation_logs" DROP CONSTRAINT IF EXISTS "chk_compensation_points_non_negative"');
    await queryRunner.query('ALTER TABLE "compensation_logs" DROP CONSTRAINT IF EXISTS "chk_compensation_entry_fee_non_negative"');
    await queryRunner.query('ALTER TABLE "fraud_alerts" DROP CONSTRAINT IF EXISTS "chk_fraud_alerts_score_range"');
    await queryRunner.query('ALTER TABLE "point_logs" DROP CONSTRAINT IF EXISTS "chk_point_logs_final_points_non_negative"');
    await queryRunner.query('ALTER TABLE "point_logs" DROP CONSTRAINT IF EXISTS "chk_point_logs_base_points_non_negative"');
    await queryRunner.query('ALTER TABLE "withdrawals" DROP CONSTRAINT IF EXISTS "chk_withdrawals_amount_positive"');
    await queryRunner.query('ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "chk_payments_amount_positive"');
    await queryRunner.query('ALTER TABLE "contest_members" DROP CONSTRAINT IF EXISTS "chk_contest_members_points_non_negative"');
    await queryRunner.query('ALTER TABLE "contests" DROP CONSTRAINT IF EXISTS "chk_contests_points_to_join_non_negative"');
    await queryRunner.query('ALTER TABLE "contests" DROP CONSTRAINT IF EXISTS "chk_contests_filled_slots_valid"');
    await queryRunner.query('ALTER TABLE "contests" DROP CONSTRAINT IF EXISTS "chk_contests_max_slots_positive"');
    await queryRunner.query('ALTER TABLE "contests" DROP CONSTRAINT IF EXISTS "chk_contests_entry_fee_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_longest_streak_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_current_streak_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_monthly_points_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_weekly_points_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_lifetime_points_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_points_balance_non_negative"');
    await queryRunner.query('ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_wallet_balance_non_negative"');

    // === Drop FK constraints ===
    await queryRunner.query('ALTER TABLE "fraud_alerts" DROP CONSTRAINT IF EXISTS "fk_fraud_alerts_resolved_by"');
    await queryRunner.query('ALTER TABLE "warnings" DROP CONSTRAINT IF EXISTS "fk_warnings_issued_by"');
    await queryRunner.query('ALTER TABLE "saved_payment_methods" DROP CONSTRAINT IF EXISTS "fk_saved_payment_methods_user_id"');
    await queryRunner.query('ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "fk_audit_logs_admin_id"');
    await queryRunner.query('ALTER TABLE "user_achievements" DROP CONSTRAINT IF EXISTS "fk_user_achievements_achievement_id"');
    await queryRunner.query('ALTER TABLE "poll_votes" DROP CONSTRAINT IF EXISTS "fk_poll_votes_poll_id"');
    await queryRunner.query('ALTER TABLE "chat_participants" DROP CONSTRAINT IF EXISTS "fk_chat_participants_chat_id"');
    await queryRunner.query('ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "fk_chat_messages_chat_id"');
    await queryRunner.query('ALTER TABLE "shares" DROP CONSTRAINT IF EXISTS "fk_shares_contest_id"');
    await queryRunner.query('ALTER TABLE "shares" DROP CONSTRAINT IF EXISTS "fk_shares_user_id"');

    // === Drop kyc columns ===
    await queryRunner.query('ALTER TABLE "kyc" DROP COLUMN IF EXISTS "updated_at"');
    await queryRunner.query('ALTER TABLE "kyc" DROP COLUMN IF EXISTS "created_at"');
  }
}
