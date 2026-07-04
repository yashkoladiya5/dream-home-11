# Dream Home 11 API Endpoints

Base URL: `https://api.dreamhome11.com` (production) or `http://localhost:3000` (development)

All API endpoints are prefixed with `/api/v1/` for version 1.

---

## Authentication

### `POST /api/v1/auth/request-otp`
Request an OTP for phone number verification.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint |
| Body | `{ phoneNumber: string }` | Phone number with country code |
| Rate limit | 5 requests per 60s per IP |
| Response | `{ success: boolean, message: string }` |

### `POST /api/v1/auth/verify-otp`
Verify OTP and receive JWT token.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint |
| Body | `{ idToken: string, deviceId: string, otpCode: string, referralCode?: string }` | Firebase ID token, device ID, OTP, optional referral |
| Response | `{ token: string, user: User }` | JWT token + user object |

### `POST /api/v1/auth/mock-login`
Mock login for development/testing only. Not available in production.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint (dev only) |
| Body | `{ phoneNumber: string, role?: string }` | Mock phone number and optional role |
| Response | `{ token: string, user: User }` | JWT token + user object |

---

## Users

### `GET /api/v1/users/me`
Get current authenticated user details.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `User` | Full user object |

### `GET /api/v1/users/me/multiplier`
Get user's current points multiplier info.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ tier: string, multiplier: number, nextTier: string, pointsToNext: number }` |

### `GET /api/v1/users/me/stats`
Get user statistics (contests played, win rate, etc.).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | User stats object |

### `GET /api/v1/users/me/contests`
Get contests the current user has joined.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of contest memberships |

### `GET /api/v1/users/me/compensations`
Get compensation history for the user.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit` | Pagination |
| Response | Paginated compensation logs |

### `GET /api/v1/users/contests/home`
Get home contests the user is participating in.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of active home contests |

### `GET /api/v1/users/profile`
Get detailed user profile.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | User profile with wallet, KYC status, etc. |

### `PATCH /api/v1/users/profile`
Update user profile.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `UpdateProfileDto` | Fields to update |
| Rate limit | 10 requests per 60s |
| Response | Updated user object |

### `PATCH /api/v1/users/bank-details`
Update user bank account / UPI details.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ bankAccountNumber?, bankIfsc?, bankName?, upiId? }` | At least one of bank or UPI required |
| Response | Updated bank details |

### `GET /api/v1/users/search`
Search users by name.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `q` (search query), `page`, `limit` | |
| Response | Paginated user search results |

---

## Contests

### `GET /api/v1/contests`
List all contests with filtering.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `status`, `type`, `page`, `limit`, `sortBy`, `sortOrder` | Filtering and pagination |
| Response | Paginated contest list |

### `GET /api/v1/contests/winners`
Get winners history across all contests.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of past winners |

### `GET /api/v1/contests/winners/:contestId`
Get detailed winners for a specific contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `contestId` | UUID of the contest |
| Response | Contest winner details |

### `GET /api/v1/contests/code/:code`
Look up a private contest by invite code.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `code` | 8-character invite code |
| Response | Contest metadata |
| Error | `404` if code not found |

### `GET /api/v1/contests/:id`
Get contest by ID.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the contest |
| Response | Full contest object |

### `GET /api/v1/contests/:id/members`
Get members of a specific contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the contest |
| Response | Array of contest members |

### `GET /api/v1/contests/:id/completed`
Get completed contest summary data.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the contest |
| Response | Completed contest data with rankings |

### `GET /api/v1/contests/:id/leaderboard`
Get leaderboard for a specific contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the contest |
| Response | Contest leaderboard entries |

### `POST /api/v1/contests/private`
Create a private contest with invite code.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `CreatePrivateContestDto` | Contest configuration (slots, fee, rules) |
| Rate limit | 10 requests per 60s |
| Response | Created contest with invite code |

### `POST /api/v1/contests/:id/join`
Join a contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the contest |
| Rate limit | 20 requests per 60s |
| Response | Join confirmation with wallet deduction |
| Error | `400` if insufficient balance or contest full |

---

## Payments

### `POST /api/v1/payments/order`
Create a Razorpay payment order.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ amount: number, paymentMethod?: string }` | Amount in INR, optional payment method |
| Rate limit | 10 requests per 60s |
| Response | `{ orderId, amount, status }` |

### `POST /api/v1/payments/verify`
Verify a completed Razorpay payment.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ orderId: string, paymentId: string }` | Razorpay order and payment IDs |
| Rate limit | 10 requests per 60s |
| Response | `{ success, orderId, paymentId, amount, bonusPoints, walletBalance, pointsBalance }` |

### `GET /api/v1/payments/history`
Get the current user's payment history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of payment records |

---

## Wallet / Withdrawals

### `POST /api/v1/payments/withdraw`
Request a withdrawal from wallet.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ amount, bankAccountNumber?, bankIfsc?, bankName?, upiId? }` | Amount and payment destination |
| Rate limit | 5 requests per 60s |
| Response | `{ id, amount, status, createdAt }` |
| Constraints | Must have verified KYC, sufficient balance |

### `GET /api/v1/payments/withdraw/history`
Get withdrawal request history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit` | Pagination |
| Response | Paginated withdrawal history |

### `GET /api/v1/payments/withdraw/stats`
Get withdrawal statistics (total withdrawn, pending, etc.).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Withdrawal stats object |

### `GET /api/v1/payments/withdraw/:id`
Get withdrawal request by ID.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of withdrawal request |
| Response | Withdrawal details |

---

## KYC

### `GET /api/v1/kyc/status`
Get KYC verification status.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ status: 'pending' | 'verified' | 'rejected', verifiedAt?, rejectionReason? }` |

### `GET /api/v1/kyc/details`
Get full KYC details.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Full KYC record |

### `POST /api/v1/kyc/submit`
Submit KYC details (Aadhaar & PAN).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ aadhaarNumber: string, panNumber: string, fullName: string }` | Required KYC fields |
| Rate limit | 5 requests per 60s |
| Response | `{ id, status, verifiedAt }` |

### `POST /api/v1/kyc/upload-document`
Upload KYC document (aadhaar_front, aadhaar_back, pan_card, selfie).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Multipart | `file` (image), `documentType` (string) | Max 5MB, jpg/jpeg/png only |
| Rate limit | 5 requests per 60s |
| Response | Upload confirmation |

---

## Rewards

### `GET /api/v1/rewards`
Get rewards catalog.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of available rewards |

### `GET /api/v1/rewards/redemptions`
Get user's redemption history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of past redemptions |

### `GET /api/v1/rewards/:id`
Get reward details by ID.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of reward |
| Response | Reward object |

### `POST /api/v1/rewards/:id/redeem`
Redeem a reward.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of reward |
| Response | Redemption confirmation |
| Error | `400` if insufficient points |

---

## Feed

### `GET /api/v1/feed`
Get community feed posts.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit` | Pagination (max 50 per page) |
| Response | Paginated feed posts with like/comment counts |

### `POST /api/v1/feed`
Create a new feed post.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ content: string, imageUrl?: string }` | Post content and optional image |
| Response | `{ message, post }` |

### `POST /api/v1/feed/:id/like`
Toggle like on a feed post.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the post |
| Response | Updated like status |

### `POST /api/v1/feed/:id/comment`
Add a comment to a feed post.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the post |
| Body | `{ content: string }` | Comment text |
| Response | `{ message, comment }` |

### `GET /api/v1/feed/:id/comments`
Get comments for a feed post.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of the post |
| Query | `page`, `limit` | Pagination |
| Response | Paginated comments |

---

## Leaderboard

### `GET /api/v1/leaderboard`
Get global leaderboard.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit`, `cycle` | `cycle`: `all_time`, `weekly`, `monthly` |
| Response | `{ entries[], userRank, totalCount, cycle }` |

### `GET /api/v1/leaderboard/search`
Search leaderboard by username.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `q`, `page`, `limit`, `cycle` | Search query |
| Response | Filtered leaderboard entries |

### `GET /api/v1/leaderboard/contest/:contestId`
Get leaderboard for a specific contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `contestId` | UUID of contest |
| Query | `page`, `limit`, `cycle` | |
| Response | Contest leaderboard entries |

### `GET /api/v1/leaderboard/series/:contestId`
Get series leaderboard for a contest.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `contestId` | UUID of contest |
| Query | `page`, `limit` | |
| Response | Series leaderboard entries |

### `GET /api/v1/leaderboard/me`
Get current user's rank.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `contestId?`, `cycle?` | Scoped to contest or global cycle |
| Response | `{ userId, rank, score, totalCount, leaderboardType }` |

### `GET /api/v1/leaderboard/archive`
Get historical leaderboard snapshots.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `cycle`, `page`, `limit`, `snapshotDate?` | |
| Response | Archived leaderboard data |

### `POST /api/v1/leaderboard/sync`
Manually trigger full leaderboard sync (Admin only).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT + Admin role | Bearer token + ADMIN role |
| Response | Sync result summary |

### `POST /api/v1/leaderboard/sync/contest/:contestId`
Sync leaderboard for a specific contest (Admin only).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT + Admin role | Bearer token + ADMIN role |
| Param | `contestId` | UUID of contest |

### `POST /api/v1/leaderboard/reset/weekly`
Reset weekly leaderboard (Admin only).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT + Admin role | Bearer token + ADMIN role |
| Response | Reset confirmation |

### `POST /api/v1/leaderboard/reset/monthly`
Reset monthly leaderboard (Admin only).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT + Admin role | Bearer token + ADMIN role |
| Response | Reset confirmation |

---

## Chat

### `GET /api/v1/chats`
Get user's chat list with last message preview.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of chats with details |

### `GET /api/v1/chats/:id`
Get chat details (participants, metadata).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of chat |
| Response | Chat detail object |

### `GET /api/v1/chats/:id/messages`
Get paginated messages for a chat.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of chat |
| Query | `page`, `limit` | Pagination |
| Response | `{ data: Message[], meta: { total, page, limit, hasMore } }` |

---

## Gamification

### `POST /api/v1/gamification/spin`
Spin the daily reward wheel.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Rate limit | 3 spins per 60s |
| Response | Spin result with points awarded |

### `GET /api/v1/gamification/spin/status`
Check spin wheel availability.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ spinsRemaining: number, nextResetAt: string }` |

---

## Polls

### `GET /api/v1/polls/active`
Get the currently active daily poll.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ poll, userVote }` |

### `GET /api/v1/polls/:id/results`
Get poll results.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of poll |
| Response | Poll results with user's vote |

### `POST /api/v1/polls/vote`
Cast a vote in the daily poll.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ pollId: string, selectedOption: number }` | |
| Rate limit | 3 votes per 60s |
| Response | Vote confirmation |

---

## Points

### `GET /api/v1/points/actions/today`
Get today's completed actions and remaining caps.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Daily actions status with limits |

### `GET /api/v1/points/streak`
Get current streak information.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ currentStreak, longestStreak, lastLoginDate }` |

### `POST /api/v1/points/action`
Perform a daily action to earn points.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ action: string }` | Action type (e.g., `daily_login`, `feed_like`, `feed_comment`) |
| Response | `{ success, pointsAwarded, finalPoints, reason? }` |

---

## Notifications

### `POST /api/v1/notifications/fcm-token`
Register FCM token for push notifications.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ token: string, deviceType: 'ios' | 'android' }` | |
| Response | `{ success }` |

### `GET /api/v1/notifications`
Get user's notification history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit` | Pagination |
| Response | Paginated notifications |

### `GET /api/v1/notifications/unread-count`
Get unread notification count.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ unreadCount: number }` |

### `PATCH /api/v1/notifications/:id/read`
Mark a notification as read.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of notification |
| Response | `{ success, notification }` |

### `POST /api/v1/notifications/read-all`
Mark all notifications as read.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ success }` |

### `GET /api/v1/notifications/reminders`
Get user's contest reminders.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of reminders |

### `POST /api/v1/notifications/reminders`
Create a contest reminder.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ contestId: string, remindAt: string (ISO date) }` | |
| Response | `{ success, reminder }` |

### `DELETE /api/v1/notifications/reminders/:id`
Delete a reminder.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of reminder |
| Response | `{ success }` |

---

## Referral

### `POST /api/v1/referral/apply`
Apply a referral code.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | `{ code: string }` | Referral code |
| Response | Referral application result |

### `GET /api/v1/referral/stats`
Get referral statistics.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Referral stats (total referred, points earned) |

### `GET /api/v1/referral/history`
Get referral history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of referred users |

---

## Support

### `POST /api/v1/support/tickets`
Create a support ticket.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Body | Multipart: `category`, `subject`, `message`, `attachment?` (file) | Max 5MB |
| Response | Created ticket |

### `GET /api/v1/support/tickets`
Get user's support tickets.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit` | |
| Response | Paginated tickets |

### `GET /api/v1/support/tickets/:id`
Get ticket details.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of ticket |
| Response | Ticket with messages |

---

## Prize Homes

### `GET /api/v1/prize-homes`
Get prize home catalog.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of prize homes |

### `GET /api/v1/prize-homes/cities`
Get available cities for prize homes.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of city names |

### `GET /api/v1/prize-homes/featured`
Get featured prize homes.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `limit` | Number of featured items (default 5) |
| Response | Array of featured homes |

### `GET /api/v1/prize-homes/:id`
Get prize home details.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Param | `id` | UUID of prize home |
| Response | Full prize home details |

---

## Achievements

### `GET /api/v1/achievements`
Get all achievements with user's progress.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of achievements with completion % |

### `POST /api/v1/achievements/check`
Check and award any newly earned achievements.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | List of newly awarded achievements |

---

## Banners

### `GET /api/v1/banners`
Get active banners for the dashboard.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | Array of active banners |

---

## Transactions

### `GET /api/v1/transactions`
Get user's transaction history.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Query | `page`, `limit`, `type?` | Filter by type |
| Response | Paginated transaction history |

### `GET /api/v1/transactions/balance`
Get balance summary.

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT required | Bearer token |
| Response | `{ walletBalance, pointsBalance, lifetimePoints }` |

---

## Config

### `GET /api/v1/config`
Get public system configuration.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint |
| Response | System config key-value pairs |

### `GET /api/v1/config/maintenance`
Check if maintenance mode is active.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint |
| Response | `{ maintenanceMode: boolean }` |

### `GET /api/v1/config/feature/:key`
Check if a feature flag is enabled.

| Field | Type | Description |
|-------|------|-------------|
| Auth | No | Public endpoint |
| Param | `key` | Feature flag key |
| Response | `{ feature, enabled }` |

### `PATCH /api/v1/config`
Update system configuration (Admin only).

| Field | Type | Description |
|-------|------|-------------|
| Auth | JWT + Admin role | Bearer token + ADMIN role |
| Body | Key-value config updates | |
| Response | Updated configuration |

---

## Admin

All admin endpoints require `JWT` + `ADMIN` role.

### `GET /api/v1/admin/dashboard`
Get admin dashboard statistics.

| Response | System-wide stats (users, contests, payments, KYC) |

### `GET /api/v1/admin/users`
List all users with filtering.

| Query | `page`, `limit`, `isActive?`, `tier?`, `search?` | |
| Response | Paginated user list |

### `GET /api/v1/admin/users/:id`
Get user details by ID.

| Response | Full user details |

### `PATCH /api/v1/admin/users/:id`
Update user details.

| Body | Fields to update | |
| Response | Updated user |

### `GET /api/v1/admin/contests`
List all contests.

| Response | Paginated contest list |

### `GET /api/v1/admin/contests/:id`
Get contest details.

| Response | Full contest with members |

### `GET /api/v1/admin/kyc`
List KYC submissions.

| Query | `status?`, `page`, `limit` | Filter by pending/verified/rejected |
| Response | Paginated KYC submissions |

### `PATCH /api/v1/admin/kyc/:id/approve`
Approve a KYC submission.

| Response | KYC approved confirmation |

### `PATCH /api/v1/admin/kyc/:id/reject`
Reject a KYC submission with reason.

| Body | `{ reason: string }` | |
| Response | KYC rejected confirmation |

### `PATCH /api/v1/admin/config`
Update system configuration.

| Body | Key-value config map | |
| Response | Updated config |

### `GET /api/v1/admin/support-tickets`
List all support tickets.

| Query | `page`, `limit`, `status?`, `category?` | |
| Response | Paginated tickets |

### `POST /api/v1/admin/contests/:id/compensate`
Trigger compensation for an unfilled contest.

| Response | Compensation result |

### `POST /api/v1/admin/compensations/process-pending`
Process all pending compensations.

| Response | Processing summary |

### `GET /api/v1/admin/compensations`
List compensation logs.

| Query | `page`, `limit`, `status?` | |
| Response | Paginated compensation logs |

### `GET /api/v1/admin/compensations/stats`
Get compensation statistics.

| Response | Detailed compensation stats |

### `GET /api/v1/admin/compensations/export`
Export compensation data.

| Query | `status?` | |
| Response | Exported data |

### `POST /api/v1/admin/notifications/broadcast`
Send push notification broadcast.

| Body | `{ title, message, tier? }` | Optional tier filter |
| Response | `{ sent: number }` |

### `POST /api/v1/admin/notifications/broadcast-sms`
Send SMS broadcast.

| Body | `{ message, tier? }` | Optional tier filter |
| Response | `{ sent: number }` |

### `GET /api/v1/admin/audit-logs`
Get audit log entries.

| Query | `page`, `limit`, `action?` | |
| Response | Paginated audit logs |

---

## Health

### `GET /health`
Simple health check.

| Auth | No | Public |
| Response | `{ status: 'ok', timestamp, uptime }` |

### `GET /health/ready`
Readiness check — verifies DB and Redis connectivity.

| Auth | No | Public |
| Response | `{ status: 'ok' | 'degraded', timestamp, duration_ms, checks[] }` |

### `GET /health/live`
Liveness check.

| Auth | No | Public |
| Response | `{ status: 'ok', timestamp, duration_ms: 0 }` |

### `GET /health/detailed`
Detailed health check with memory, CPU, uptime.

| Auth | `X-Health-Key` header (optional, if configured) | Protected |
| Response | Full system health report |

---

## Metrics

### `GET /metrics`
Prometheus metrics endpoint.

| Auth | No | Public (or network-restricted) |
| Response | Prometheus-formatted metrics (text/plain) |

---

## Common Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "requestId": "req-abc123",
  "timestamp": "2026-07-03T12:00:00.000Z",
  "path": "/api/v1/contests/:id/join"
}
```

## Common Success Response Format

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Rate Limiting

- **Global**: 30 requests per 60s (production) / 100,000 (development)
- **Per-endpoint**: Individual rate limits noted above
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **429 Response**: `{ statusCode: 429, message: 'ThrottlerException: Too Many Requests' }`

## Standard Headers

| Header | Description |
|--------|-------------|
| `Authorization: Bearer <token>` | JWT token for authenticated endpoints |
| `X-Request-Id` | Request ID for tracing (auto-generated if not provided) |
| `X-API-Version` | API version number in response |
| `X-Response-Time` | Response time in milliseconds |
| `Content-Type: application/json` | Request/response format |
