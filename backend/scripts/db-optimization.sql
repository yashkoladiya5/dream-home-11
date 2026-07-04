-- ============================================================================
-- Dream Home 11 — Database Performance Optimization Script
-- ============================================================================
-- This script reviews existing indexes, recommends new composite/partial
-- indexes for slow query patterns, and includes ANALYZE/VACUUM commands.
-- All statements use IF NOT EXISTS/IF EXISTS guards for idempotent execution.
-- ============================================================================

-- ============================================================================
-- SECTION 1: Review Existing Indexes
-- ============================================================================
-- Run this query to see current index usage statistics:
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check for unused indexes (low scan count suggests they may not be used):
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Check for missing indexes via pg_stat_user_tables (sequential scans):
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 1000
ORDER BY seq_scan DESC;

-- ============================================================================
-- SECTION 2: Recommended Indexes for Slow Query Patterns
-- ============================================================================

-- 2a. contest_members: Composite indexes for user/contest lookups and status
--     filtering. The unique index (contest_id, user_id) already exists via
--     InitialSchema; we add (user_id, contest_id) for user-centric queries
--     and (contest_id, status) if a status column is added later.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contest_members_user_contest
  ON contest_members (user_id, contest_id);

CREATE INDEX IF NOT EXISTS idx_contest_members_contest_status
  ON contest_members (contest_id, status)
  WHERE status IS NOT NULL;

-- 2b. transactions: Composite index for user transaction history queries
--     filtered by type and sorted by created_at.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_created
  ON transactions (user_id, type, created_at DESC);

-- Partial index for deposit-type queries (a common pattern):
CREATE INDEX IF NOT EXISTS idx_transactions_user_deposits
  ON transactions (user_id, created_at DESC)
  WHERE type = 'deposit';

-- Partial index for withdrawal-type queries:
CREATE INDEX IF NOT EXISTS idx_transactions_user_withdrawals
  ON transactions (user_id, created_at DESC)
  WHERE type = 'withdrawal';

-- Partial index for contest join fee transactions:
CREATE INDEX IF NOT EXISTS idx_transactions_user_contest_joins
  ON transactions (user_id, created_at DESC)
  WHERE type = 'contest_join';

-- 2c. point_logs: Composite indexes for user point history and contest
--     leaderboard queries.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_point_logs_user_created
  ON point_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_point_logs_contest_user
  ON point_logs (contest_id, user_id)
  WHERE contest_id IS NOT NULL;

-- Partial index for weekly leaderboard point aggregation:
CREATE INDEX IF NOT EXISTS idx_point_logs_weekly
  ON point_logs (user_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '7 days';

-- 2d. audit_logs: Composite indexes for admin audit trail queries.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_created
  ON audit_logs (user_id, action, created_at DESC);

-- Partial index for admin action queries (when admin_id is set):
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_action_created
  ON audit_logs (admin_id, action, created_at DESC)
  WHERE admin_id IS NOT NULL;

-- 2e. chat_messages: Composite indexes for chat history and user inbox.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created_desc
  ON chat_messages (chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver
  ON chat_messages (sender_id, receiver_id, created_at DESC)
  WHERE receiver_id IS NOT NULL;

-- Partial index for unread message queries:
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
  ON chat_messages (receiver_id, created_at DESC)
  WHERE NOT is_read;

-- 2f. posts: Composite index for user feed queries sorted by creation time.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_posts_user_created
  ON posts (user_id, created_at DESC);

-- Partial index for active feed posts:
CREATE INDEX IF NOT EXISTS idx_posts_active_created
  ON posts (user_id, created_at DESC)
  WHERE is_active = true;

-- 2g. Additional indexes for other common query patterns:
-- ============================================================================

-- Withdrawals: user history sorted by status and creation date:
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status_created
  ON withdrawals (user_id, status, created_at DESC);

-- Payments: user payment history:
CREATE INDEX IF NOT EXISTS idx_payments_user_created
  ON payments (user_id, created_at DESC);

-- Referrals: referrer's referral list:
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status
  ON referrals (referrer_id, status, created_at DESC);

-- Notifications: user notification inbox sorted by read status:
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_inbox
  ON notification_logs (user_id, created_at DESC);

-- Reward redemptions: user redemption history:
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_status
  ON reward_redemptions (user_id, status, redeemed_at DESC);

-- ============================================================================
-- SECTION 3: ANALYZE Commands
-- ============================================================================
-- Update table statistics for the query planner after adding indexes.
-- Run ANALYZE on all tables that received new indexes:
ANALYZE contest_members;
ANALYZE transactions;
ANALYZE point_logs;
ANALYZE audit_logs;
ANALYZE chat_messages;
ANALYZE posts;
ANALYZE withdrawals;
ANALYZE payments;
ANALYZE referrals;
ANALYZE notification_logs;
ANALYZE reward_redemptions;

-- Or ANALYZE the entire database (more thorough, takes longer):
-- ANALYZE;

-- ============================================================================
-- SECTION 4: VACUUM Recommendations
-- ============================================================================
-- VACUUM reclaims storage and updates visibility maps. Use VACUUM ANALYZE
-- for tables with heavy write activity to combine both operations.
--
-- For tables with frequent UPDATE/DELETE (transactions, point_logs,
-- audit_logs), schedule regular VACUUM during low-traffic periods.
--
-- Production recommendation (add to cron or pg_cron):
--   VACUUM (ANALYZE, INDEX_CLEANUP) transactions;
--   VACUUM (ANALYZE, INDEX_CLEANUP) point_logs;
--   VACUUM (ANALYZE, INDEX_CLEANUP) audit_logs;
--   VACUUM (ANALYZE, INDEX_CLEANUP) chat_messages;
--   VACUUM (ANALYZE, INDEX_CLEANUP) posts;
--
-- For aggressive maintenance (requires VACUUM FULL, takes locks):
--   VACUUM FULL VERBOSE transactions;
--   VACUUM FULL VERBOSE point_logs;

-- Check dead tuple ratio to prioritize VACUUM targets:
SELECT
  schemaname,
  relname,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup * 100.0 / GREATEST(n_live_tup + n_dead_tup, 1), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 0
ORDER BY dead_pct DESC;

-- ============================================================================
-- SECTION 5: Performance Monitoring Queries
-- ============================================================================

-- Top 10 slowest queries (requires pg_stat_statements extension):
-- SELECT
--   queryid,
--   LEFT(query, 100) AS query_preview,
--   calls,
--   ROUND(total_exec_time / 1000, 2) AS total_sec,
--   ROUND(mean_exec_time, 2) AS avg_ms,
--   ROUND(max_exec_time, 2) AS max_ms,
--   ROUND(shared_blks_hit * 100.0 / GREATEST(shared_blks_hit + shared_blks_read, 1), 2) AS cache_hit_pct
-- FROM pg_stat_statements
-- WHERE query NOT LIKE '%pg_stat%'
-- ORDER BY total_exec_time DESC
-- LIMIT 10;

-- Cache hit ratio by table:
SELECT
  schemaname,
  relname,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  ROUND(heap_blks_hit * 100.0 / GREATEST(heap_blks_hit + heap_blks_read, 1), 2) AS cache_hit_pct
FROM pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY cache_hit_pct ASC;

-- Current active queries:
-- SELECT pid, state, query_start, LEFT(query, 100) AS query, wait_event, pg_blocking_pids(pid) AS blocking_pids
-- FROM pg_stat_activity
-- WHERE state != 'idle'
-- ORDER BY query_start DESC;

-- ============================================================================
-- SECTION 6: Index Maintenance Queries
-- ============================================================================

-- List all indexes with their sizes:
SELECT
  i.schemaname,
  i.tablename,
  i.indexname,
  i.indexdef,
  pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS index_size,
  s.idx_scan,
  s.idx_tup_read,
  s.idx_tup_fetch
FROM pg_indexes i
LEFT JOIN pg_stat_user_indexes s ON s.indexname = i.indexname AND s.schemaname = i.schemaname
WHERE i.schemaname = 'public'
ORDER BY pg_relation_size(i.indexname::regclass) DESC;

-- Recommended VACUUM schedule (add to crontab - adjust times):
-- # Daily VACUUM ANALYZE for high-write tables
-- 0 3 * * * psql -d dream_home_11 -c "VACUUM (ANALYZE, INDEX_CLEANUP) transactions;"
-- 0 3 * * * psql -d dream_home_11 -c "VACUUM (ANALYZE, INDEX_CLEANUP) point_logs;"
-- 0 4 * * * psql -d dream_home_11 -c "VACUUM (ANALYZE, INDEX_CLEANUP) audit_logs;"
-- 0 4 * * * psql -d dream_home_11 -c "VACUUM (ANALYZE, INDEX_CLEANUP) chat_messages;"
-- 0 5 * * * psql -d dream_home_11 -c "VACUUM (ANALYZE, INDEX_CLEANUP) posts;"
--
-- # Weekly full ANALYZE on remaining tables
-- 0 6 * * 0 psql -d dream_home_11 -c "ANALYZE;"
