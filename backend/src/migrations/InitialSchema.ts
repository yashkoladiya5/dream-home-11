import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const tables: { name: string; columns: { name: string; type: string; isPrimary?: boolean; isGenerated?: boolean; generationStrategy?: 'uuid'; isNullable?: boolean; default?: string; length?: string; precision?: number; scale?: number; enum?: string[] }[]; indices?: { name: string; columnNames: string[] }[] }[] = [
  {
    name: 'users',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'phone_number', type: 'varchar', length: '15', isNullable: false },
      { name: 'email', type: 'varchar', length: '100', isNullable: true },
      { name: 'full_name', type: 'varchar', length: '100', isNullable: true },
      { name: 'avatar_url', type: 'text', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'current_tier', type: 'varchar', length: '20', default: "'bronze'" },
      { name: 'lifetime_points', type: 'integer', default: '0' },
      { name: 'weekly_points', type: 'integer', default: '0' },
      { name: 'monthly_points', type: 'integer', default: '0' },
      { name: 'wallet_balance_inr', type: 'numeric', precision: 10, scale: 2, default: '0' },
      { name: 'points_balance', type: 'integer', default: '0' },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'state', type: 'varchar', length: '50', isNullable: true },
      { name: 'bank_account_number', type: 'varchar', length: '30', isNullable: true },
      { name: 'bank_ifsc', type: 'varchar', length: '20', isNullable: true },
      { name: 'bank_name', type: 'varchar', length: '100', isNullable: true },
      { name: 'upi_id', type: 'varchar', length: '100', isNullable: true },
      { name: 'referral_code', type: 'varchar', length: '20', isNullable: true },
      { name: 'referred_by', type: 'uuid', isNullable: true },
      { name: 'device_id', type: 'varchar', length: '255', isNullable: false },
      { name: 'role', type: 'varchar', length: '20', default: "'user'" },
      { name: 'current_streak', type: 'integer', default: '0' },
      { name: 'longest_streak', type: 'integer', default: '0' },
      { name: 'last_streak_date', type: 'date', isNullable: true },
    ],
    indices: [
      { name: 'idx_users_phone_number', columnNames: ['phone_number'] },
      { name: 'idx_users_referral_code', columnNames: ['referral_code'] },
      { name: 'idx_users_lifetime_points', columnNames: ['lifetime_points'] },
      { name: 'idx_users_is_active', columnNames: ['is_active'] },
      { name: 'idx_users_created_at', columnNames: ['created_at'] },
    ],
  },
  {
    name: 'kyc',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'aadhaar_number', type: 'varchar', length: '12', isNullable: false },
      { name: 'pan_number', type: 'varchar', length: '10', isNullable: false },
      { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
      { name: 'verified_at', type: 'timestamp with time zone', isNullable: true },
      { name: 'rejection_reason', type: 'text', isNullable: true },
      { name: 'aadhaar_front_url', type: 'varchar', isNullable: true },
      { name: 'aadhaar_back_url', type: 'varchar', isNullable: true },
      { name: 'pan_card_url', type: 'varchar', isNullable: true },
      { name: 'selfie_url', type: 'varchar', isNullable: true },
    ],
    indices: [
      { name: 'idx_kyc_user_id', columnNames: ['user_id'] },
    ],
  },
  {
    name: 'contests',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'title', type: 'varchar', length: '150', isNullable: false },
      { name: 'type', type: 'varchar', length: '20', default: "'normal'" },
      { name: 'entry_fee_inr', type: 'numeric', precision: 10, scale: 2, default: '0' },
      { name: 'points_to_join', type: 'integer', default: '0' },
      { name: 'max_slots', type: 'integer', isNullable: false },
      { name: 'filled_slots', type: 'integer', default: '0' },
      { name: 'prize', type: 'text', isNullable: true },
      { name: 'badge_text', type: 'varchar', length: '50', isNullable: true },
      { name: 'badge_color', type: 'varchar', length: '20', isNullable: true },
      { name: 'rules', type: 'text', isNullable: true },
      { name: 'invite_code', type: 'varchar', length: '8', isNullable: true },
      { name: 'start_time', type: 'timestamp with time zone', isNullable: false },
      { name: 'end_time', type: 'timestamp with time zone', isNullable: false },
      { name: 'status', type: 'varchar', length: '20', default: "'upcoming'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'compensation_status', type: 'varchar', length: '20', default: "'none'" },
    ],
    indices: [
      { name: 'idx_contests_created_at', columnNames: ['created_at'] },
      { name: 'idx_contests_status', columnNames: ['status'] },
    ],
  },
  {
    name: 'contest_members',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'contest_id', type: 'uuid', isNullable: false },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'joined_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'points_earned', type: 'integer', default: '0' },
    ],
    indices: [
      { name: 'idx_contest_members_contest_id', columnNames: ['contest_id'] },
      { name: 'idx_contest_members_user_id', columnNames: ['user_id'] },
    ],
  },
  {
    name: 'point_logs',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'action', type: 'varchar', length: '50', isNullable: false },
      { name: 'base_points', type: 'integer', default: '0' },
      { name: 'multiplier', type: 'numeric', precision: 3, scale: 2, default: '1.0' },
      { name: 'final_points', type: 'integer', default: '0' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_point_logs_user_id', columnNames: ['user_id'] },
      { name: 'idx_point_logs_action', columnNames: ['action'] },
      { name: 'idx_point_logs_created_at', columnNames: ['created_at'] },
    ],
  },
  {
    name: 'fcm_tokens',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'token', type: 'text', isNullable: false },
      { name: 'device_type', type: 'varchar', length: '20', default: "'ios'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'reminders',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'contest_id', type: 'uuid', isNullable: false },
      { name: 'remind_at', type: 'timestamp with time zone', isNullable: false },
      { name: 'status', type: 'varchar', length: '50', default: "'pending'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'notification_logs',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'title', type: 'varchar', length: '150', isNullable: false },
      { name: 'body', type: 'text', isNullable: false },
      { name: 'type', type: 'varchar', length: '30', default: "'general'" },
      { name: 'is_read', type: 'boolean', default: 'false' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_notification_logs_user_read', columnNames: ['user_id', 'is_read'] },
      { name: 'idx_notification_logs_created_at', columnNames: ['created_at'] },
    ],
  },
  {
    name: 'shares',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'contest_id', type: 'uuid', isNullable: true },
      { name: 'share_channel', type: 'varchar', length: '50', isNullable: false },
      { name: 'status', type: 'varchar', length: '20', default: "'sent'" },
      { name: 'points_awarded', type: 'integer', default: '0' },
      { name: 'invite_code', type: 'varchar', length: '20', isNullable: true },
      { name: 'shared_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'rewards',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'title', type: 'varchar', length: '200', isNullable: false },
      { name: 'description', type: 'text', isNullable: true },
      { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
      { name: 'points_required', type: 'integer', isNullable: false },
      { name: 'stock', type: 'integer', isNullable: true },
      { name: 'category', type: 'varchar', length: '50', default: "'gift_card'" },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'sort_order', type: 'integer', default: '0' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'reward_redemptions',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'reward_id', type: 'uuid', isNullable: false },
      { name: 'points_spent', type: 'integer', isNullable: false },
      { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
      { name: 'redeemed_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'fulfilled_at', type: 'timestamp with time zone', isNullable: true },
      { name: 'notes', type: 'text', isNullable: true },
    ],
  },
  {
    name: 'banners',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'title', type: 'varchar', length: '200', isNullable: false },
      { name: 'subtitle', type: 'text', isNullable: true },
      { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
      { name: 'link', type: 'varchar', length: '500', isNullable: true },
      { name: 'link_label', type: 'varchar', length: '100', isNullable: true },
      { name: 'background_color', type: 'varchar', length: '50', isNullable: true },
      { name: 'sort_order', type: 'integer', default: '0' },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'achievements',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'key', type: 'varchar', length: '50', isNullable: false },
      { name: 'title', type: 'varchar', length: '200', isNullable: false },
      { name: 'description', type: 'text', isNullable: true },
      { name: 'icon', type: 'varchar', length: '50', isNullable: true },
      { name: 'bonus_points', type: 'integer', default: '0' },
      { name: 'sort_order', type: 'integer', default: '0' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'user_achievements',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'achievement_id', type: 'uuid', isNullable: false },
      { name: 'earned_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'prize_homes',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'title', type: 'varchar', length: '200', isNullable: false },
      { name: 'description', type: 'text', isNullable: true },
      { name: 'image_url', type: 'text', isNullable: true },
      { name: 'city', type: 'varchar', length: '100', isNullable: false },
      { name: 'state', type: 'varchar', length: '100', isNullable: true },
      { name: 'location', type: 'text', isNullable: true },
      { name: 'value_inr', type: 'numeric', precision: 15, scale: 2, isNullable: false },
      { name: 'bedrooms', type: 'integer', isNullable: true },
      { name: 'bathrooms', type: 'integer', isNullable: true },
      { name: 'area', type: 'varchar', length: '50', isNullable: true },
      { name: 'features', type: 'json', isNullable: true },
      { name: 'type', type: 'varchar', length: '50', isNullable: true },
      { name: 'emoji', type: 'varchar', length: '10', isNullable: true },
      { name: 'sort_order', type: 'integer', default: '0' },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'transactions',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'type', type: 'varchar', length: '30', isNullable: false },
      { name: 'cash_amount', type: 'numeric', precision: 10, scale: 2, default: '0' },
      { name: 'points_amount', type: 'integer', default: '0' },
      { name: 'cash_balance_before', type: 'numeric', precision: 10, scale: 2, isNullable: true },
      { name: 'cash_balance_after', type: 'numeric', precision: 10, scale: 2, isNullable: true },
      { name: 'points_balance_before', type: 'integer', isNullable: true },
      { name: 'points_balance_after', type: 'integer', isNullable: true },
      { name: 'description', type: 'text', isNullable: true },
      { name: 'reference_type', type: 'varchar', length: '50', isNullable: true },
      { name: 'reference_id', type: 'uuid', isNullable: true },
      { name: 'status', type: 'varchar', length: '20', default: "'completed'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_transactions_user_id', columnNames: ['user_id'] },
      { name: 'idx_transactions_type', columnNames: ['type'] },
      { name: 'idx_transactions_created_at', columnNames: ['created_at'] },
    ],
  },
  {
    name: 'payments',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'order_id', type: 'varchar', isNullable: false },
      { name: 'payment_id', type: 'varchar', isNullable: true },
      { name: 'amount', type: 'numeric', precision: 10, scale: 2, isNullable: false },
      { name: 'status', type: 'varchar', length: '30', default: "'pending'" },
      { name: 'payment_method', type: 'varchar', length: '50', isNullable: true },
      { name: 'bonus_points', type: 'numeric', precision: 10, scale: 2, default: '0' },
      { name: 'signature', type: 'varchar', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'saved_payment_methods',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'category', type: 'varchar', length: '30', isNullable: false },
      { name: 'label', type: 'varchar', length: '100', isNullable: false },
      { name: 'display_value', type: 'varchar', length: '255', isNullable: false },
      { name: 'provider_name', type: 'varchar', length: '50', isNullable: true },
      { name: 'icon_url', type: 'varchar', length: '255', isNullable: true },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'withdrawals',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'amount', type: 'numeric', precision: 10, scale: 2, default: '0' },
      { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
      { name: 'bank_account_number', type: 'varchar', length: '30', isNullable: true },
      { name: 'bank_ifsc', type: 'varchar', length: '20', isNullable: true },
      { name: 'bank_name', type: 'varchar', length: '100', isNullable: true },
      { name: 'upi_id', type: 'varchar', length: '100', isNullable: true },
      { name: 'utr_number', type: 'varchar', length: '50', isNullable: true },
      { name: 'rejection_reason', type: 'text', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'posts',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'content', type: 'text', isNullable: false },
      { name: 'image_url', type: 'varchar', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'is_active', type: 'boolean', default: 'true' },
    ],
  },
  {
    name: 'likes',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'post_id', type: 'uuid', isNullable: false },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'comments',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'post_id', type: 'uuid', isNullable: false },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'content', type: 'text', isNullable: false },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'polls',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'question', type: 'varchar', length: '500', isNullable: false },
      { name: 'options', type: 'jsonb', isNullable: false },
      { name: 'total_votes', type: 'integer', default: '0' },
      { name: 'active_from', type: 'timestamp with time zone', isNullable: false },
      { name: 'active_to', type: 'timestamp with time zone', isNullable: false },
      { name: 'is_active', type: 'boolean', default: 'true' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'poll_votes',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'poll_id', type: 'uuid', isNullable: false },
      { name: 'selected_option', type: 'integer', isNullable: false },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'referrals',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'referrer_id', type: 'uuid', isNullable: false },
      { name: 'referee_id', type: 'uuid', isNullable: false },
      { name: 'signup_reward', type: 'integer', default: '30' },
      { name: 'kyc_reward', type: 'integer', default: '0' },
      { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'settled_at', type: 'timestamp with time zone', isNullable: true },
    ],
  },
  {
    name: 'support_tickets',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'subject', type: 'varchar', length: '200', isNullable: false },
      { name: 'message', type: 'text', isNullable: false },
      { name: 'category', type: 'varchar', length: '50', default: "'general'" },
      { name: 'status', type: 'varchar', length: '20', default: "'open'" },
      { name: 'attachment_url', type: 'text', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'chats',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'name', type: 'varchar', length: '100', isNullable: true },
      { name: 'type', type: 'varchar', length: '20', default: "'direct'" },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'chat_messages',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'chat_id', type: 'uuid', isNullable: false },
      { name: 'sender_id', type: 'uuid', isNullable: false },
      { name: 'content', type: 'text', isNullable: false },
      { name: 'type', type: 'varchar', length: '20', default: "'text'" },
      { name: 'is_read', type: 'boolean', default: 'false' },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_chat_messages_chat_created', columnNames: ['chat_id', 'created_at'] },
    ],
  },
  {
    name: 'chat_participants',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'chat_id', type: 'uuid', isNullable: false },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'joined_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'system_config',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'appName', type: 'varchar', default: "'Dream Home 11'" },
      { name: 'appVersion', type: 'varchar', default: "'1.0.0'" },
      { name: 'apiVersion', type: 'varchar', default: "'v1'" },
      { name: 'environment', type: 'varchar', default: "'development'" },
      { name: 'maintenanceMode', type: 'boolean', default: 'false' },
      { name: 'minAppVersionAndroid', type: 'varchar', default: "'1.0.0'" },
      { name: 'minAppVersionIos', type: 'varchar', default: "'1.0.0'" },
      { name: 'maxWithdrawalAmount', type: 'numeric', precision: 10, scale: 2, default: '50000' },
      { name: 'minWithdrawalAmount', type: 'numeric', precision: 10, scale: 2, default: '100' },
      { name: 'dailySpinEnabled', type: 'boolean', default: 'true' },
      { name: 'pollsEnabled', type: 'boolean', default: 'true' },
      { name: 'feedEnabled', type: 'boolean', default: 'true' },
      { name: 'chatEnabled', type: 'boolean', default: 'true' },
      { name: 'referralEnabled', type: 'boolean', default: 'true' },
      { name: 'maxDailyPosts', type: 'integer', default: '5' },
      { name: 'maxDailySpins', type: 'integer', default: '1' },
      { name: 'supportEmail', type: 'varchar', default: "'support@dreamhome11.com'" },
      { name: 'restrictedStates', type: 'text', isNullable: true },
      { name: 'createdAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
      { name: 'updatedAt', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
  },
  {
    name: 'compensation_logs',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'contest_id', type: 'uuid', isNullable: false },
      { name: 'user_id', type: 'uuid', isNullable: false },
      { name: 'entry_fee_inr', type: 'numeric', precision: 10, scale: 2, isNullable: false },
      { name: 'compensation_points', type: 'integer', isNullable: false },
      { name: 'status', type: 'varchar', length: '20', default: "'pending'" },
      { name: 'processed_at', type: 'timestamp with time zone', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_compensation_logs_user_id', columnNames: ['user_id'] },
      { name: 'idx_compensation_logs_status', columnNames: ['status'] },
    ],
  },
  {
    name: 'audit_logs',
    columns: [
      { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
      { name: 'user_id', type: 'uuid', isNullable: true },
      { name: 'admin_id', type: 'uuid', isNullable: true },
      { name: 'action', type: 'varchar', length: '50', isNullable: false },
      { name: 'target_id', type: 'varchar', length: '50', isNullable: true },
      { name: 'target_type', type: 'varchar', length: '50', isNullable: true },
      { name: 'metadata', type: 'jsonb', isNullable: true },
      { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
      { name: 'created_at', type: 'timestamp with time zone', default: 'CURRENT_TIMESTAMP' },
    ],
    indices: [
      { name: 'idx_audit_logs_admin_id', columnNames: ['admin_id'] },
      { name: 'idx_audit_logs_created_at', columnNames: ['created_at'] },
    ],
  },
];

export class InitialSchema implements MigrationInterface {
  name = 'InitialSchema';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of tables) {
      const columns = table.columns.map((col) => ({
        name: col.name,
        type: col.type,
        isPrimary: col.isPrimary || false,
        isGenerated: col.isGenerated || false,
        generationStrategy: col.generationStrategy as 'uuid' | undefined,
        isNullable: col.isNullable !== undefined ? col.isNullable : true,
        default: col.default,
        length: col.length,
        precision: col.precision,
        scale: col.scale,
      }));

      await queryRunner.createTable(
        new Table({ name: table.name, columns }),
        true,
      );

      if (table.indices) {
        for (const idx of table.indices) {
          await queryRunner.createIndex(
            table.name,
            new TableIndex({ name: idx.name, columnNames: idx.columnNames }),
          );
        }
      }
    }

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_phone_number_unique" ON "users" ("phone_number")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_unique" ON "users" ("email") WHERE email IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_referral_code_unique" ON "users" ("referral_code") WHERE referral_code IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_kyc_aadhaar_unique" ON "kyc" ("aadhaar_number")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_kyc_pan_unique" ON "kyc" ("pan_number")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_contests_invite_code_unique" ON "contests" ("invite_code") WHERE invite_code IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_achievements_key_unique" ON "achievements" ("key")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_contest_members_unique" ON "contest_members" ("contest_id", "user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_likes_unique" ON "likes" ("post_id", "user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_poll_votes_unique" ON "poll_votes" ("user_id", "poll_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_chat_participants_unique" ON "chat_participants" ("chat_id", "user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_referrals_referee_unique" ON "referrals" ("referee_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_compensation_logs_unique" ON "compensation_logs" ("contest_id", "user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_payments_order_id_unique" ON "payments" ("order_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const reversed = [...tables].reverse();
    for (const table of reversed) {
      await queryRunner.dropTable(table.name, true);
    }
  }
}
