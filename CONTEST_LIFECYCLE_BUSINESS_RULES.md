# Dream Home 11 — Contest Lifecycle: Complete Business Rules

> **Author:** Principal Product Architect
> **Date:** July 6, 2026
> **Scope:** All contest lifecycle rules covering creation, duration, status transitions, joining, auto-close, compensation, cancellation, early entry, completion, private contests, and prize distribution.
> **Status:** Final — Ready for engineering implementation.

---

## TABLE OF CONTENTS

1. [Contest Duration Enforcement](#1-contest-duration-enforcement)
2. [Contest Status State Machine](#2-contest-status-state-machine)
3. [Contest Auto-Close Rule (Not Filled)](#3-contest-auto-close-rule-not-filled)
4. [No-Refund Compensation Slab](#4-no-refund-compensation-slab)
5. [Contest Cancellation Rules (by Admin)](#5-contest-cancellation-rules-by-admin)
6. [Contest Join Rules](#6-contest-join-rules)
7. [Early Entry Bonus](#7-early-entry-bonus)
8. [Contest Completion Rules](#8-contest-completion-rules)
9. [Private Contest Rules](#9-private-contest-rules)
10. [Contest Prize Distribution Rules](#10-contest-prize-distribution-rules)

---

## 1. Contest Duration Enforcement

### Why Needed
Requirements mandate that all contests run on a fixed schedule of 30–45 days. The current implementation has **zero validation** — contests can be created with any duration, including 0-day or 1-year contests. This breaks the business model (which relies on engagement over a fixed competitive window) and creates legal/compliance risks.

### Business Rule (exact logic)
Every contest must have a duration (calculated as `end_time - start_time`) that falls within the range **30 days (720 hours) inclusive** to **45 days (1080 hours) inclusive**.

**Duration formula:**
```
duration_in_hours = (end_time - start_time) in milliseconds / 3600000
VALID IFF: 720 <= duration_in_hours <= 1080
```

**This validation runs:**
1. At contest **creation** — by admin (platform contests) or by user (private contests)
2. At contest **update** — if start_time or end_time is modified by admin, the new duration must still satisfy the constraint
3. The rule applies to ALL contest types: normal, mega, home, private. No exceptions.

### Conditions
**Pre-conditions:**
- Contest start_time and end_time have been provided as valid ISO 8601 timestamps in UTC
- start_time is in the future (>= current_time + 1 hour minimum buffer for platform contests; >= current_time for private contests)
- end_time > start_time

**Post-conditions:**
- Contest is persisted with the validated duration
- The system returns a clear validation error if duration is out of range

### Validation Rules
| Validation | Rule |
|---|---|
| Minimum duration | end_time - start_time >= 30 days (720 hours) |
| Maximum duration | end_time - start_time <= 45 days (1080 hours) |
| Start time recency | start_time >= current_time + 1 hour (platform); start_time > current_time (private) |
| Temporal ordering | end_time > start_time (by at least 30 days) |
| Timezone | Both must be UTC. If client sends in local time, backend must convert to UTC before validation. |
| Update consistency | If start_time is pushed earlier, the end_time must adjust to maintain 30–45 day window OR end_time also shifts |

### Exceptions / Error Cases
| Error Condition | HTTP Code | Error Message |
|---|---|---|
| Duration < 30 days | 400 | `"Contest must run for at least 30 days (720 hours). Current duration: {X} hours."` |
| Duration > 45 days | 400 | `"Contest cannot exceed 45 days (1080 hours). Current duration: {X} hours."` |
| start_time in the past | 400 | `"Contest start time must be in the future."` |
| end_time <= start_time | 400 | `"Contest end time must be after start time."` |
| start_time too soon (<1h) [platform] | 400 | `"Contest must be created at least 1 hour before start time."` |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Leap year** | All date math uses UTC epoch milliseconds. Feb 28 → Mar 30 is exactly 30 days. No special handling needed. |
| **DST transitions** | UTC is DST-agnostic. No issue. |
| **End time at 23:59:59 vs 00:00:00** | The contest ends at end_time exactly. If end_time = T, the last valid second is T-1. At T, the contest transitions. |
| **Very far future start_time** | Allowed up to 1 year from creation to prevent scheduling abuse. |
| **Admin changes start_time after creation** | Re-validate duration. If the new start_time makes duration invalid, reject the update. |
| **Private contest created by user** | Same 30–45 day rule applies. No exceptions for private contests. |
| **Precision: hours vs days** | Duration is measured in whole hours, floored. 29 days 23 hours = 719 hours = REJECT. 30 days 0 hours = 720 hours = ACCEPT. |

### Examples
| start_time | end_time | Duration | Result |
|---|---|---|---|
| 2026-07-01T00:00:00Z | 2026-08-01T00:00:00Z | 31 days (744h) | ✅ ACCEPT |
| 2026-07-01T00:00:00Z | 2026-07-31T00:00:00Z | 30 days (720h) | ✅ ACCEPT (exactly minimum) |
| 2026-07-01T00:00:00Z | 2026-08-15T00:00:00Z | 45 days (1080h) | ✅ ACCEPT (exactly maximum) |
| 2026-07-01T00:00:00Z | 2026-07-15T00:00:00Z | 14 days (336h) | ❌ REJECT (too short) |
| 2026-07-01T00:00:00Z | 2026-09-01T00:00:00Z | 62 days (1488h) | ❌ REJECT (too long) |
| 2026-07-01T00:00:00Z | 2026-08-16T00:00:00Z | 46 days (1104h) | ❌ REJECT (1 hour over max) |

### Acceptance Criteria
1. ✅ Admin cannot create a platform contest with duration < 30 days or > 45 days
2. ✅ User cannot create a private contest with duration < 30 days or > 45 days
3. ✅ Admin cannot update start_time/end_time such that the resulting duration violates the constraint
4. ✅ Error messages are descriptive and include the current calculated duration
5. ✅ Re-validation works for both creation and update operations

### User Flow
1. Admin creates contest → enters title, type, entry fee, prizes, max slots → picks start and end dates in a date picker → clicks "Create"
2. Backend validates dates → if duration OK, contest created → if not, error returned with message
3. For private contest creation: same flow, date picker enforces 30–45 day range on the client side (but server MUST re-validate)

### Admin Flow
1. Admin navigates to Contest Create page → fills form → date pickers enforce the 30–45 day range
2. Admin can adjust minimum and maximum duration values in system config (though 30/45 is the default)
3. Admin can see contest duration displayed as "X days" on contest detail page
4. Admin audit log records contest creation with duration

---

## 2. Contest Status State Machine

### Why Needed
Requirements define 4 statuses: upcoming, running, completed, cancelled. The current implementation has the enum but lacks explicit transition rules, automated transitions, and guardrails. Multiple transitions happen inconsistently — e.g., private contests start in `RUNNING` status immediately, bypassing `UPCOMING`.

### Business Rule (exact logic)
The contest lifecycle is governed by a **strict state machine** with 4 states and 7 allowed transitions. Every transition is logged with timestamp, actor (system/user_id/admin_id), and reason. Transitions are either **automatic** (time-based CRON) or **manual** (admin action).

```
                    ┌─────────────────────────────┐
                    │         CREATED              │  (implicit — not a persisted status)
                    │  (contest record exists)     │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │         UPCOMING             │◄──── Initial status after creation
                    │  (accepting entries)         │
                    └──┬──────────────┬───────────┘
                       │              │
              ┌────────┘              └────────┐
              ▼                                  ▼
  ┌──────────────────────┐        ┌──────────────────────┐
  │       RUNNING        │        │      CANCELLED        │
  │  (live, earning pts) │        │  (terminated by       │
  │                      │        │   admin, no prizes)   │
  └──────────┬───────────┘        └──────────────────────┘
             │
             ▼
  ┌──────────────────────┐
  │      COMPLETED       │
  │  (final rankings,    │
  │   prizes distributed)│
  └──────────────────────┘
```

#### Allowed Transitions

| # | From | To | Trigger | Actor | Condition |
|---|---|---|---|---|---|
| T1 | UPCOMING | RUNNING | Auto (time) | System | `current_time >= start_time` AND `filled_slots >= min_slots_required` |
| T2 | UPCOMING | RUNNING | Manual (force-start) | Admin (super_admin) | Admin clicks "Force Start" in admin panel. Bypasses slot check. Requires confirmation. |
| T3 | UPCOMING | COMPLETED | Auto (auto-close) | System | `current_time >= start_time` AND `filled_slots < min_slots_required` (contest never had enough participants) |
| T4 | UPCOMING | CANCELLED | Manual (cancel) | Admin (super_admin) | Admin selects cancellation reason from predefined list. Requires reason + notes. |
| T5 | RUNNING | COMPLETED | Auto (time) | System | `current_time >= end_time` |
| T6 | RUNNING | COMPLETED | Manual (force-complete) | Admin (super_admin) | Admin clicks "Complete Now" in admin panel. Rankings frozen immediately. |
| T7 | RUNNING | CANCELLED | Manual (emergency) | Admin (super_admin only) | Emergency cancellation. Requires reason from `EMERGENCY` category. All members compensated. |

#### Disallowed Transitions

| Transition | Why Blocked |
|---|---|
| COMPLETED → anything | Terminal state. Must create a new contest. |
| CANCELLED → anything | Terminal state. Must create a new contest. |
| UPCOMING → UPCOMING modification | start_time, end_time, max_slots, entry_fee can be edited by admin while UPCOMING. After running, these are frozen. |
| COMPLETED → COMPENSATED | Compensation is a flag (`compensation_status`), not a state. Compensation can be processed on COMPLETED or CANCELLED contests. |

#### Transition Post-Conditions

| Transition | Actions on Entry to New State |
|---|---|
| UPCOMING → RUNNING (T1, T2) | • WebSocket broadcast `contest:started` to all members<br>• Push notification: "Contest [title] has started!" to all members<br>• Point earning period begins — all point_logs with created_at between start_time and end_time count toward this contest<br>• Leaderboard initialised in Redis with current member scores<br>• `started_at` timestamp recorded on contest |
| UPCOMING → COMPLETED (T3 auto-close) | • Mark `is_auto_closed = true`<br>• Trigger compensation workflow (see Rule 3)<br>• Push notification + SMS to each member: "Contest [title] did not fill up. You've been awarded [X] compensation points!"<br>• No prizes awarded<br>• `completed_at` timestamp recorded |
| UPCOMING → CANCELLED (T4) | • Trigger compensation workflow (see Rule 5)<br>• Push notification + SMS: "Contest [title] has been cancelled by the platform. You've been awarded [X] compensation points."<br>• Audit log: `contest_cancelled` with admin_id, reason, notes |
| RUNNING → COMPLETED (T5, T6) | • WebSocket broadcast `contest:ended`<br>• Point earning period ends — no further point_logs count toward this contest after end_time<br>• Final scores calculated (see Rule 8)<br>• Rankings frozen + persisted to database<br>• Completion points awarded to each member<br>• Prize distribution triggered (see Rule 10)<br>• Push notification: "Contest [title] has ended! Check your results."<br>• `completed_at` timestamp recorded |
| RUNNING → CANCELLED (T7) | • WebSocket broadcast `contest:cancelled`<br>• Point earning stopped immediately<br>• Double compensation awarded (see Rule 5)<br>• Push notification + SMS: "Contest [title] has been cancelled. You've been awarded [X] compensation points."<br>• Audit log: `contest_emergency_cancel` with admin_id, reason, notes |

### Conditions
**Pre-conditions for T1 (auto upcoming → running):**
- status == UPCOMING
- current_time >= start_time
- filled_slots >= min_slots_required

**Pre-conditions for T3 (auto upcoming → auto-close):**
- status == UPCOMING
- current_time >= start_time
- filled_slots < min_slots_required

**Pre-conditions for T5 (auto running → completed):**
- status == RUNNING
- current_time >= end_time

**Post-conditions for T5:**
- Status = COMPLETED
- `completed_at` = current_time
- All subsequent point_logs created_at > end_time do NOT count toward this contest

### Validation Rules
| Rule | Detail |
|---|---|
| No state skips | Every transition must go from one valid state to another. No skipping. |
| Immutable past states | Once COMPLETED or CANCELLED, cannot be undone. |
| Reason required | All MANUAL transitions (T2, T4, T6, T7) require a `reason` string and `actor_id`. |
| Audit trail | Every transition is logged in `audit_logs` with: contest_id, from_status, to_status, actor, reason, timestamp. |
| CRON frequency | Status CRON runs every 1 minute (not 5). Auto-close and auto-complete must be timely. |
| No concurrent transitions | A contest can only transition one state at a time. Use optimistic locking or status check. |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| CRON tries to transition a contest already being processed | Status check guard: if `status` has already changed since last read, skip. Use `UPDATE ... WHERE status = :oldStatus` pattern. |
| Admin force-completes a contest that is already auto-completing | Idempotent: if status is already COMPLETED, return error "Contest is already completed." |
| Admin cancels a contest that has 0 members | Allow cancellation. No compensation needed. No notifications sent. |
| System clock skew | CRON uses server system time. NTP-synced. If clock jumps backward, no harm — status check uses >= comparison, so the transition simply occurs slightly later. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **start_time == end_time** | Blocked by Duration Enforcement (Rule 1) — can't happen. |
| **start_time already passed at creation** | Validated at creation: start_time must be in future. |
| **Contest created with start_time = now + 30 days, then admin pushes start_time earlier** | Re-validate duration. Also need to ensure enough time for participants to join (min 24h in UPCOMING state). |
| **Private contest — immediate RUNNING?** | NO. Private contests must also go through UPCOMING state. Current implementation incorrectly sets RUNNING immediately. Must be fixed. |
| **Multiple CRON instances (horizontal scaling)** | Use `UPDATE ... WHERE status = :oldStatus AND id = :id` atomic claim pattern to prevent double-transition. |

### Examples
| Scenario | start_time | end_time | filled_slots | min_slots_required | CRON check time | Result |
|---|---|---|---|---|---|---|
| Contest fills before start | T+0 | T+30 | 100/100 | 50 | T+0 | T1: UPCOMING → RUNNING |
| Contest doesn't fill | T+0 | T+30 | 30/100 | 50 | T+0 | T3: UPCOMING → COMPLETED (auto-close) |
| Contest fills, runs full term | T+0 | T+30 | 100/100 | 50 | T+30 | T5: RUNNING → COMPLETED |
| Admin emergency cancels mid-run | T+0 | T+30 | 80/100 | 50 | T+15 | T7: RUNNING → CANCELLED |

### Acceptance Criteria
1. ✅ UPCOMING contests automatically transition to RUNNING at start_time if min_slots is met
2. ✅ UPCOMING contests automatically auto-close at start_time if min_slots is NOT met
3. ✅ RUNNING contests automatically transition to COMPLETED at end_time
4. ✅ Admin can force-start, force-complete, and cancel (with reason)
5. ✅ All transitions are logged with full audit trail
6. ✅ Private contests start in UPCOMING (not RUNNING)
7. ✅ No transitions allowed from COMPLETED or CANCELLED

### User Flow
- **Contest starts (T1):** User receives push notification → opens app → sees "LIVE" badge on contest → enters contest running screen → watches live leaderboard
- **Contest ends (T5):** User receives push notification → opens app → sees results screen → views ranking, points breakdown, prize information
- **Contest auto-closes (T3):** User receives push notification → opens app → sees message "Contest didn't fill up" → sees compensation points added to balance
- **Contest cancelled (T4/T7):** User receives push notification → opens app → sees cancellation notice → sees compensation points

### Admin Flow
1. Admin views contest list → sees status badges with colors
2. Admin clicks contest → sees detail page with status timeline (when transitions happened)
3. Admin sees action buttons based on current status:
   - UPCOMING: "Force Start", "Cancel"
   - RUNNING: "Force Complete", "Emergency Cancel"
   - COMPLETED: "View Results", "Manage Compensation"
   - CANCELLED: "View Audit Trail" (no actions)
4. Admin clicks cancel → reason dropdown appears → selects reason + writes notes → confirms → status changes

---

## 3. Contest Auto-Close Rule (Not Filled)

### Why Needed
Requirements state: "If a contest does not fill up with enough users by the target date, the system automatically closes the contest." The current implementation auto-closes at `end_time` (not `start_time`) and uses `maxSlots` as the threshold (100% fill required). Neither matches the intended business logic.

### Business Rule (exact logic)
Auto-close is evaluated at **start_time** (not end_time). If a contest has not reached its minimum participation threshold by the time it is scheduled to start, it auto-closes immediately — it never transitions to RUNNING.

**Trigger Condition:**
```
At current_time >= start_time:
  IF status == UPCOMING AND filled_slots < min_slots_required:
    → Auto-close (UPCOMING → COMPLETED with is_auto_closed = true)
```

**What min_slots_required means:**
- `min_slots_required` is an integer column on the `contests` table
- Default value for platform contests: `max(2, ceil(max_slots * 0.5))` — 50% of capacity, minimum 2
- Default value for private contests: `2` (creator + at least 1 other)
- Can be overridden by admin at contest creation or in system config
- A contest with `max_slots = 100` and `min_slots_required = 50` needs at least 50 participants to start

**CRON Job Behavior:**
```
Every 1 minute:
  1. Find all contests WHERE status = 'upcoming' AND start_time <= current_time
  2. For each, compute action:
     a. filled_slots >= min_slots_required → RUNNING (T1)
     b. filled_slots < min_slots_required → COMPLETED auto-close (T3)
  3. Atomic UPDATE: UPDATE contests SET status = :newStatus 
     WHERE id = :id AND status = 'upcoming'
  4. If status was changed to COMPLETED, enqueue compensation processing
```

**Compensation on Auto-Close:**
- If contest auto-closes AND has at least 1 member → full compensation (see Rule 4)
- If contest auto-closes AND has 0 members → no compensation needed, simply mark as completed
- All members receive compensation points per the No-Refund Compensation Slab
- Entry fees are NEVER refunded in cash — only converted to points

### Conditions
**Pre-conditions:**
- Contest status = UPCOMING
- current_time >= start_time
- filled_slots < min_slots_required

**Post-conditions:**
- Contest status = COMPLETED
- `is_auto_closed` flag = true (new column)
- `compensation_status` = PENDING (triggers compensation workflow)
- `completed_at` = current_time
- All members have compensation logs created
- All members receive push notification + SMS about compensation

### Validation Rules
| Rule | Detail |
|---|---|
| Only UPCOMING contests | Cannot auto-close a RUNNING, COMPLETED, or CANCELLED contest via this rule |
| min_slots_required must be set | Every contest must have min_slots_required > 0. If not set at creation, use default. |
| Compensate only members | Only users in contest_members receive compensation. Users who never joined get nothing. |
| One auto-close per contest | Atomic guard prevents double-processing. Use `compensation_status` as claim. |
| Zero-member contests | If filled_slots == 0, no compensation. Just mark completed + auto_closed. |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| CRON tries to auto-close contest that just had someone join | Atomic UPDATE with status check prevents race. The join transaction locks the contest row. |
| Contest reaches min_slots at exactly start_time | If join happens before the CRON tick that evaluates this contest, it starts normally. The atomic UPDATE ensures only one outcome. |
| System clock is ahead of real time | Use NTP. Accept small skew (seconds). A few-second delay in auto-close is acceptable. |
| Contest has members but also has zero entry fee | Compensate with minimum slab (0 points for free entry). No cash involved. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Contest with min_slots_required = 100% of max_slots** | If max_slots = 100 and min_slots_required = 100, contest needs to be completely full. This effectively means no slack. Use with caution. Default is 50%. |
| **Contest with max_slots = 200, min_slots_required = 100, filled = 99** | Does NOT start. Auto-closes. One more person would have made it. |
| **Contest where someone joins at T-1 second** | The join transaction completes before auto-close CRON fires at the next 1-minute mark. Now filled_slots = 100 >= 100, so contest starts. |
| **Private contest with max_slots = 5, creator joined, 0 others joined by start_time** | Auto-closes with 1 member. Creator gets compensation. |

### Examples
| Scenario | max_slots | min_slots_required | filled at start_time | Result |
|---|---|---|---|---|
| Well-attended contest | 100 | 50 | 72 | ✅ Contest starts (RUNNING) |
| Barely meets threshold | 100 | 50 | 50 | ✅ Contest starts (exactly at threshold) |
| Just below threshold | 100 | 50 | 49 | ❌ Auto-closes (compensation for 49 members) |
| Almost empty | 100 | 50 | 3 | ❌ Auto-closes (compensation for 3 members) |
| Empty contest | 100 | 50 | 0 | ❌ Auto-closes (no compensation needed) |
| Private contest, only creator | 10 | 2 | 1 | ❌ Auto-closes (creator gets compensation) |

### Acceptance Criteria
1. ✅ Contest auto-closes at start_time if filled_slots < min_slots_required
2. ✅ Contest starts normally at start_time if filled_slots >= min_slots_required
3. ✅ Auto-closed contests award compensation to all members
4. ✅ Auto-closed contests with 0 members are silently marked completed
5. ✅ CRON processes auto-close within 1 minute of start_time
6. ✅ Race condition between last-second join and auto-close is handled atomically
7. ✅ Auto-close uses min_slots_required (not max_slots)

### User Flow
1. A user joins a contest that seems lightly populated
2. Contest reaches start_time with 49/100 slots filled (min_slots = 50)
3. CRON fires → contest auto-closes
4. User receives push notification: "Contest [title] didn't fill up. You've been awarded 250 compensation points!"
5. User opens app → sees compensation points in notification inbox → can use points to join other contests or redeem rewards
6. User's contest history shows this contest as "Completed (Not Filled)"

### Admin Flow
1. Admin views contest list → sees auto-closed contests with special badge "Auto-Closed (Not Filled)"
2. Admin clicks contest → sees: status timeline showing UPCOMING → COMPLETED (auto-close), list of members with compensation amounts
3. Admin can manually trigger compensation retry if any failed

---

## 4. No-Refund Compensation Slab

### Why Needed
The core commercial model: **entries are non-refundable**. When a contest doesn't fill, the entry fee is converted to bonus points per a fixed compensation slab. The current implementation has the correct slab hardcoded but applies the tier multiplier to compensation (which is incorrect), and the notifications lack detail about the conversion.

### Business Rule (exact logic)
When a contest auto-closes or is cancelled, every member receives compensation **points** (NOT cash refund). Points are calculated using the following slab:

#### Compensation Table

| Entry Fee Range (₹) | Compensation Points | Effective Rate |
|---|---|---|
| ₹1 – ₹49 | +120 points | ~2.45 pts/₹ |
| ₹50 – ₹99 | +250 points | ~2.53 pts/₹ |
| ₹100 – ₹199 | +550 points | ~2.76 pts/₹ |
| ₹200 – ₹499 | +1,500 points | ~3.01 pts/₹ |
| ₹500+ | `round(entry_fee × (1500/499))` ≈ `round(entry_fee × 3.006)` | ~3.0 pts/₹ |

#### Point Nature
Compensation points are **flat** (NOT multiplied by tier multiplier):

| Property | Value |
|---|---|
| Awards to | `points_balance` ✅ |
| Awards to | `lifetime_points` ❌ (not earned, so not counted for tier progression) |
| Subject to tier multiplier | ❌ (compensation is flat — fixed slab value regardless of user's tier) |
| Counts for contest rankings | ❌ (compensation happens after contest ends) |
| Withdrawable as cash | ❌ (points are non-withdrawable) |
| Redeemable for rewards | ✅ |
| Usable to join contests | ✅ (if contest allows points_to_join) |
| Expiry | Never (points don't expire) |

**Current implementation bug:** Compensation is multiplied by tier multiplier (`compensation.service.ts:174`). This is WRONG. Compensation is a fixed moral gesture, not a reward. Remove the multiplier from compensation calculation.

#### Algorithm
```
function calculateCompensationPoints(entryFeeInr):
    if entryFeeInr <= 0: return 0
    
    // Slab-based lookup (round DOWN to nearest slab)
    if entryFeeInr <= 49:  return 120
    if entryFeeInr <= 99:  return 250
    if entryFeeInr <= 199: return 550
    if entryFeeInr <= 499: return 1500
    
    // Above highest slab: linear interpolation
    rate = 1500 / 499  // ≈ 3.006
    return round(entryFeeInr * rate)
```

### Conditions
**Pre-conditions:**
- Contest is in COMPLETED (auto-closed) or CANCELLED state
- `compensation_status` is NONE or PENDING
- User is a member of contest_members for this contest

**Post-conditions:**
- `compensation_log` created with: contest_id, user_id, entry_fee, compensation_points (flat), status = PROCESSED
- `compensation_status` on contest = PROCESSED
- User's `points_balance` increased by compensation_points
- User's `lifetime_points` UNCHANGED
- User's wallet_balance_inr UNCHANGED (no refund)
- Push notification sent: "You received [X] points for contest [title]."
- SMS sent: Same message

### Validation Rules
| Rule | Detail |
|---|---|
| One compensation per member per contest | `compensation_log` has unique constraint on (contest_id, user_id). If already processed, skip. |
| Flat points, no multiplier | `compensation_points` is calculated from slab only. `finalPoints = compensation_points` (NOT `* multiplier`). |
| Atomic processing | Compensation must be processed in a DB transaction: create log → update user balance. If either fails, both roll back. |
| Retry policy | Failed compensations (max 3 retries). After 3 failures, mark log as FAILED and alert admin. |
| Zero amount | If entry_fee = ₹0 (free contest), compensation = 0 points. No log needed (but can still be created for audit). |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| Entry fee doesn't match slab (private contest with ₹75) | Round DOWN: ₹75 → ₹49 slab → 120 points |
| Entry fee above max slab (private contest with ₹1000) | Linear formula: round(1000 × 3.006) = 3006 points |
| User deleted account | Compensation skipped. Log marked FAILED with reason "user_deleted". |
| Points balance overflow | MySQL/PostgreSQL integer is big enough (2^31-1 = 2.1B). Unlikely to overflow. |
| Network failure during push/SMS notification | Compensation already processed. Notifications retried by separate notification retry CRON. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Free contest (₹0 entry fee)** | compensation = 0. No point award. Log may be skipped or recorded with 0. |
| **User joined contest with both entry_fee_inr AND points_to_join** | Compensation is based on entry_fee_inr only. points_to_join are not compensated (points were never deducted). |
| **User is in contest twice (bug)** | Prevented by UNIQUE(contest_id, user_id) constraint. Can't happen. |
| **Negative entry fee** | Validated at creation: entry_fee_inr >= 0. Can't happen. |
| **User already received compensation but admin re-triggers** | Idempotency: check `compensation_status != NONE`. If already PROCESSED, skip. |

### Examples
| Entry Fee | Compensation Points | Calculation |
|---|---|---|
| ₹0 (free) | 0 | entry <= 0 → 0 |
| ₹49 | 120 | Slab: ≤49 → 120 |
| ₹75 | 120 | Round down: 75 > 49 but > 50? No, 75 > 49, passes first check. 75 <= 99? Yes → 250. Wait: 75 <= 49? No. 75 <= 99? Yes → 250 points. |
| ₹99 | 250 | Slab: ≤99 → 250 |
| ₹150 | 250 | Round down: 150 <= 99? No. 150 <= 199? Yes → 550. Wait: 150 is > 99, so first check (≤49) fails, second (≤99) fails, third (≤199) passes → 550. So ₹150 → 550 pts. |
| ₹199 | 550 | Slab: ≤199 → 550 |
| ₹250 | 550 | 250 <= 199? No. 250 <= 499? Yes → 1500. So ₹250 → 1500 pts. |
| ₹499 | 1500 | Slab: ≤499 → 1500 |
| ₹1000 | 3006 | Above max slab: round(1000 × 3.006) = 3006 |

Wait, let me re-check with the current code logic:
```
for tier in [{maxFee: 49, points: 120}, {maxFee: 99, points: 250}, {maxFee: 199, points: 550}, {maxFee: 499, points: 1500}]:
    if entryFeeInr <= tier.maxFee:
        return tier.points

// if above 499
rate = 1500/499  // 3.006
return round(entryFeeInr * rate)
```

So for ₹75: 75 <= 49? No. 75 <= 99? Yes → return 250. ✅
For ₹150: 150 <= 49? No. 150 <= 99? No. 150 <= 199? Yes → return 550. ✅
For ₹250: 250 <= 49? No. 250 <= 99? No. 250 <= 199? No. 250 <= 499? Yes → return 1500. ✅
For ₹1000: 1000 <= 499? No → rate = 1500/499 ≈ 3.006, round(1000 * 3.006) = 3006. ✅

So the slab logic already exists and is correct. The issue is the multiplier application at line 174.

### Acceptance Criteria
1. ✅ Compensation is calculated strictly from the slab table (no multiplier)
2. ✅ Points are added to points_balance, NOT to lifetime_points
3. ✅ Entry fees are NOT refunded as cash
4. ✅ Push notification + SMS sent for every compensation
5. ✅ Compensation is idempotent — processing twice doesn't double-award
6. ✅ Failed compensations are logged and retryable
7. ✅ Free contests (₹0) get 0 compensation

### User Flow
1. User joined a contest with ₹99 entry fee
2. Contest auto-closes (not enough participants)
3. User gets push notification: "You've received 250 points!"
4. User opens app → points balance increased by 250 → can use points to join another contest
5. User also gets SMS: "Dream Home 11: You've received 250 points as compensation for contest 'Mega Prize'."

### Admin Flow
1. Admin views compensations page → sees all compensation logs with status
2. Admin can filter: pending, processed, failed
3. Admin can retry failed compensations individually or in bulk
4. Admin can see total compensation points awarded per day/week/month
5. Admin can export compensation report as CSV

---

## 5. Contest Cancellation Rules (by Admin)

### Why Needed
Admin needs the ability to cancel contests for legitimate reasons (technical issues, legal, fraud). The current implementation has no cancellation endpoint, no cancellation flow, no compensation rules for cancellations, and no audit trail. This is a critical admin capability.

### Business Rule (exact logic)

#### Cancellation Reasons (Strict Enum)
| Code | Reason | Applies To | Compensation |
|---|---|---|---|
| `TECHNICAL_ISSUE` | Technical/platform error affecting contest integrity | UPCOMING, RUNNING | Standard slab |
| `INSUFFICIENT_PARTICIPATION` | Contest didn't meet minimum threshold (admin override) | UPCOMING only | Standard slab |
| `LEGAL_COMPLIANCE` | Court order, regulatory restriction, legal notice | UPCOMING, RUNNING | Standard slab |
| `FRAUD_DETECTED` | Mass manipulation, botting, point farming | UPCOMING, RUNNING | Zero compensation (violators). Standard for honest members. |
| `PRIZE_UNAVAILABLE` | Physical prize (home/car/cash) cannot be delivered | UPCOMING, RUNNING | Standard slab × 2 (double compensation) |
| `PLATFORM_DECISION` | Business decision to terminate the contest | UPCOMING only | Standard slab |
| `USER_MISCONDUCT` | Widespread rule violation by participants | UPCOMING, RUNNING | Standard slab for non-violating members. Zero for violators. |

#### Compensation Rules Per Cancellation Reason

| Cancellation Reason | Upcoming Contest | Running Contest |
|---|---|---|
| TECHNICAL_ISSUE | Standard slab | **Double slab** (platform's fault for interrupting an active contest) |
| INSUFFICIENT_PARTICIPATION | Standard slab | N/A (can only cancel UPCOMING for this reason) |
| LEGAL_COMPLIANCE | Standard slab | Standard slab (legal requirement, not platform's fault) |
| FRAUD_DETECTED | Standard slab for clean members. Zero for flagged members. | Standard slab for clean members. Zero for flagged members. |
| PRIZE_UNAVAILABLE | **Double slab** | **Double slab** (platform failed to deliver promised prize) |
| PLATFORM_DECISION | Standard slab | N/A (cannot cancel RUNNING for business decision) |
| USER_MISCONDUCT | Standard slab for clean members. Zero for flagged members. | Same |

#### Double Slab Calculation
Double slab = compensation_points × 2 (from the standard compensation table)
Example: ₹99 entry → standard 250 pts → double = 500 pts

#### Cancellation Flow
```
Admin clicks "Cancel Contest"
  → Reason dropdown (required)
  → Notes field (required, min 20 chars)
  → Confirmation dialog showing:
      - Contest title, type, current status
      - Number of members affected
      - Total compensation to be awarded
      - "This action cannot be undone" warning
  → Admin confirms
  → System:
      1. Updates status to CANCELLED
      2. Records cancellation_reason, cancelled_by (admin_id), cancelled_at
      3. If contest was RUNNING: freeze all point earning immediately
      4. Trigger compensation workflow for all non-flagged members
      5. Send push notification + SMS to all affected members
      6. Create audit log entry
```

### Conditions
**Pre-conditions:**
- Contest exists
- Contest status is UPCOMING or RUNNING
- Admin has `super_admin` or `admin` role
- If contest is RUNNING: reason must be from {TECHNICAL_ISSUE, LEGAL_COMPLIANCE, FRAUD_DETECTED, PRIZE_UNAVAILABLE, USER_MISCONDUCT}
- If contest is UPCOMING: any reason allowed

**Post-conditions:**
- Contest status = CANCELLED
- `cancelled_at` = current_time
- `cancelled_by` = admin_id
- `cancellation_reason` = selected enum value
- `cancellation_notes` = free text
- Compensation records created per member
- Notifications sent to all members
- Audit log created

### Validation Rules
| Rule | Detail |
|---|---|
| Reason required | Admin must select exactly one cancellation reason from the enum. |
| Notes required | Minimum 20 characters. Explain why the contest is being cancelled. |
| Cannot cancel COMPLETED | Contest has already concluded. No undoing. |
| Cannot cancel CANCELLED | Already cancelled. |
| Permission check | Only super_admin can cancel RUNNING contests. Admin role can only cancel UPCOMING contests. |
| Flagged members | If FRAUD_DETECTED or USER_MISCONDUCT reason, admin can specify which member IDs are violating. Those members get 0 compensation. |
| Confirmation | Admin must confirm twice for running contest cancellations (double confirmation). |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| Admin tries to cancel already cancelled contest | "Contest is already cancelled." |
| Admin tries to cancel with no reason | "Cancellation reason is required." |
| Admin tries to cancel RUNNING contest with INSUFFICIENT_PARTICIPATION | "Running contests cannot be cancelled for insufficient participation." |
| Network failure mid-cancellation | Use idempotency. Cancellation is atomic. If it fails, roll back. Start fresh. |
| Member list is very large (10,000+) | Compensation processing is async. Cancellation status applied immediately. Compensation enqueued as background job. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Contest with 0 members** | Cancel freely. No compensation needed. No notifications. |
| **Contest where some members already received prize (rare)** | If prize already dispatched, recovery handled by legal/compliance team. System notes this in cancellation record. |
| **Contest cancelled during end_time transition (CRON also firing)** | Atomic status check prevents race. First one to update status wins. |
| **Admin accidentally cancels wrong contest** | No undo. Admin can create a new contest and manually compensate affected users. |
| **Cancellation due to court order** | Attach legal document reference in notes. May need special audit trail. Add `legal_reference_number` optional field. |

### Examples
| Scenario | Contest State | Reason | Members | Compensation |
|---|---|---|---|---|
| Server crash corrupts leaderboard data | RUNNING | TECHNICAL_ISSUE | 500 | Double slab (e.g., ₹99 → 500 pts) |
| Only 5 people joined a 100-slot contest | UPCOMING | INSUFFICIENT_PARTICIPATION | 5 | Standard slab |
| State government bans the platform | RUNNING | LEGAL_COMPLIANCE | 2000 | Standard slab |
| 50 bot accounts detected | RUNNING | FRAUD_DETECTED | 1000 (50 flagged) | Standard for 950, zero for 50 |
| Builder backs out of home delivery | RUNNING | PRIZE_UNAVAILABLE | 300 | Double slab |
| Business pivots away from this contest type | UPCOMING | PLATFORM_DECISION | 10 | Standard slab |
| Users found colluding | RUNNING | USER_MISCONDUCT | 200 (20 flagged) | Standard for 180, zero for 20 |

### Acceptance Criteria
1. ✅ Admin can cancel UPCOMING contests for any reason
2. ✅ Admin can cancel RUNNING contests only for emergency reasons
3. ✅ Compensation amount varies by cancellation reason (standard vs double)
4. ✅ Flagged members (fraud/misconduct) get 0 compensation
5. ✅ Cancellation requires reason + notes + double confirmation
6. ✅ All members receive appropriate notifications
7. ✅ Audit log records full cancellation details
8. ✅ Cannot cancel COMPLETED or CANCELLED contests

### User Flow
1. User is actively competing in a contest that gets cancelled
2. User receives push notification: "Contest [title] has been cancelled due to [reason]. You've been awarded [X] compensation points."
3. User opens app → sees cancellation notice in notifications → sees compensation added to points balance
4. User can use points to join other contests

### Admin Flow
1. Admin navigates to contest detail page
2. Status shows "RUNNING" with "Emergency Cancel" button
3. Admin clicks "Emergency Cancel" → modal appears
4. Admin selects reason from dropdown → writes detailed notes (min 20 chars)
5. Admin sees summary: "This will affect 342 members. Total compensation: 85,500 points. Are you sure?"
6. Admin confirms → "Are you absolutely sure? This cannot be undone."
7. Admin confirms again → status changes to CANCELLED → compensation processing begins
8. Admin sees success toast → can view audit trail

---

## 6. Contest Join Rules

### Why Needed
Joining a contest is the core transaction of the platform. Currently, joins are only allowed when contest status = RUNNING (incorrect — should be UPCOMING). Missing checks: KYC verification, age verification, state restriction, device-level duplicate prevention, self-exclusion check. No idempotency key to prevent double-submit.

### Business Rule (exact logic)

#### Eligibility Checks (in order, ALL must pass)

| # | Check | Logic | Blocked States/Limits | Failure Message |
|---|---|---|---|---|
| 1 | **Contest Status** | `contest.status == UPCOMING` | — | "This contest is not accepting entries." |
| 2 | **Slot Availability** | `filled_slots < max_slots` | — | "This contest is full." |
| 3 | **Account Active** | `user.isActive == true` | — | "Your account has been suspended." |
| 4 | **Self-Exclusion** | `user.is_self_excluded == false OR (self_excluded_until < now)` | — | "Your account is currently self-excluded." |
| 5 | **Duplicate Join** | No existing `contest_members` row for (contest_id, user_id) | — | "You have already joined this contest." |
| 6 | **Age Check** | User's `date_of_birth` must indicate age >= 18 at time of join | Under 18 | "You must be 18 or older to join contests." |
| 7 | **KYC Check** | Only for PAID contests (entry_fee > 0): user must have KYC status = `approved` | — | "Complete KYC verification to join paid contests." |
| 8 | **State Check** | User's `state` must not be in restricted list | Assam, Odisha, Telangana, Sikkim, Nagaland, Andhra Pradesh | "Contests are not available in [state]." |
| 9 | **Balance Check** | For paid contests: `wallet_balance_inr >= entry_fee_inr` | — | "Insufficient wallet balance. Please add cash." |
| 10 | **Member Limit Per Contest** | User not banned from this specific contest | — | "You are not eligible to join this contest." |
| 11 | **Device/Account Velocity** | Same device_id not used to join > 5 different contests in 24 hours | — | (Silent rate limit — no error shown) |

#### Atomic Join Transaction

```
BEGIN TRANSACTION (SERIALIZABLE isolation level):

  1. SELECT contest FROM contests WHERE id = :contestId FOR UPDATE
  2. Validate contest.status == UPCOMING
  3. Validate contest.filled_slots < contest.max_slots
  
  4. SELECT user FROM users WHERE id = :userId FOR UPDATE
  5. Validate user.isActive == true
  6. Validate user.wallet_balance_inr >= contest.entry_fee_inr (skip if ₹0)
  7. Validate user.is_self_excluded == false (or exclusion expired)
  
  8. SELECT COUNT(*) FROM contest_members WHERE contest_id = :contestId AND user_id = :userId
  9. Validate count == 0 (not already joined)
  
  10. Validate age: user.date_of_birth + 18 years <= current_date
  11. Validate KYC: user.kyc_status == 'approved' (if paid)
  12. Validate state: user.state NOT IN restricted_states
  
  13. INSERT INTO contest_members (contest_id, user_id, joined_at, points_earned)
      VALUES (:contestId, :userId, NOW(), 0)
  
  14. IF entry_fee > 0:
        UPDATE users SET wallet_balance_inr = wallet_balance_inr - entry_fee_inr
        WHERE id = :userId
  
  15. UPDATE contests SET filled_slots = filled_slots + 1 WHERE id = :contestId
  
  16. INSERT INTO transactions (user_id, type, amount, description, ...)
      VALUES (:userId, 'entry_fee', entry_fee_inr, 'Joined contest: [title]', ...)
  
  17. CALL awardJoinPoints(userId, contest.type)  -- +50 normal, +200 mega, +300 home, +150 private
  18. CALL checkEarlyEntryBonus(userId, contestId)  -- +20 if early (see Rule 7)
  
COMMIT
```

If ANY step fails, the entire transaction rolls back. The user's wallet is not debited. The slot is not consumed.

#### Join Points Table

| Contest Type | Join Points |
|---|---|
| Normal | +50 |
| Mega | +200 |
| Home | +300 |
| Private | +150 |

Join points are awarded at join time (not at contest completion). They are subject to tier multiplier and count toward the contest's final score.

#### Free Contests (₹0 entry fee)
- KYC check: SKIPPED (free contest)
- Balance check: SKIPPED (₹0)
- All other checks still apply (age, state, self-exclusion, duplicate, account active)

#### Blocked States (system-configurable)
Default restricted states: Assam, Odisha, Telangana, Sikkim, Nagaland, Andhra Pradesh
These are loaded from `system_config` and can be updated by admin.

#### Idempotency
Every join request MUST include a unique `idempotency_key` (UUID generated by client). The backend checks:
- If a join with this key was already processed → return the existing success response (idempotent)
- If a join with this key exists but failed → retry with same result
- Key expires after 24 hours

### Conditions
**Pre-conditions:**
- User is authenticated
- Contest exists and is UPCOMING
- Invite code (for private contests) is correct

**Post-conditions:**
- User is added to contest_members
- filled_slots incremented by 1
- Wallet balance decremented by entry_fee (if paid)
- Transaction record created
- Join points awarded (+50/200/300/150 based on contest type)
- Early entry bonus awarded if applicable (+20)
- If contest reaches max_slots: No special action (still starts at start_time)

### Validation Rules
| Rule | Detail |
|---|---|
| KYC required for paid | Only if entry_fee > 0. Free contests skip KYC check. |
| Age verified | date_of_birth stored at registration (or first KYC). Age calculated at join time. |
| State restriction | Checked against live config. If user's state is added to restricted list while contest is upcoming, users from that state cannot join NEW contests but can continue in already-joined contests. |
| Self-exclusion | Checked at join time. Does NOT affect already-joined contests. |
| Max slots | Checked with pessimistic lock. Last-slot race handled by atomic update. |
| No device farming | Same device_id on > 5 joins in 24h → rate-limited. |

### Exceptions / Error Cases
| Error | Code | Message |
|---|---|---|
| Contest not found | 404 | "Contest not found." |
| Contest not UPCOMING | 400 | "This contest is not accepting entries." |
| Contest full | 400 | "This contest is full." |
| Already joined | 400 | "You have already joined this contest." |
| Insufficient balance | 400 | "Insufficient wallet balance. Please add cash." |
| Account suspended | 403 | "Your account has been suspended." |
| Self-excluded | 403 | "Your account is currently self-excluded." |
| Under 18 | 403 | "You must be 18 or older to join contests." |
| KYC required | 403 | "Complete KYC verification to join paid contests." |
| State restricted | 403 | "Contests are not available in [state]." |
| Invite code invalid | 404 | "No contest found for this invite code." |
| Duplicate idempotency key | 409 | "This request has already been processed." |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **User joins at exact start_time** | If current_time >= start_time: contest should have transitioned to RUNNING. Join fails with "Contest is no longer accepting entries." Grace period: none. |
| **Two users join last slot simultaneously** | `SELECT FOR UPDATE` on contest row ensures only one gets the slot. The other gets "Contest is full." |
| **User has money in wallet_balance but also has points** | Join only checks wallet_balance_inr for entry fee. Points cannot be used to pay entry fees unless `pointsToJoin` > 0 is specified. |
| **User joined, then gets banned** | Already joined contests are not affected (they already paid). User cannot join new contests. Their existing entries remain and they can still win prizes (subject to KYC/payout checks). |
| **User's state changes between join and contest end** | No impact. State is checked at join time only. Winner verification re-checks state at prize distribution (see Rule 10). |
| **User's KYC expires or gets rejected after joining** | No impact on existing contest participation. KYC re-verification required for new joins and prize payout. |

### Examples
| Scenario | Result |
|---|---|
| User has ₹500, joins ₹99 contest | ✅ Accepted. Wallet → ₹401. Join points awarded. |
| User has ₹50, joins ₹99 contest | ❌ Rejected. "Insufficient wallet balance." |
| User under 18, joins any contest | ❌ Rejected. "Must be 18+." |
| User from Assam joins contest | ❌ Rejected. "Not available in Assam." |
| User already in contest, tries again | ❌ Rejected. "Already joined." |
| Contest full (100/100), user tries to join | ❌ Rejected. "Contest is full." |
| Free contest (₹0), user with incomplete KYC joins | ✅ Accepted. Free contests skip KYC check. |
| User self-excluded yesterday, tries to join today | ❌ Rejected. "Account is self-excluded." |

### Acceptance Criteria
1. ✅ Users can join UPCOMING contests (not RUNNING)
2. ✅ All 11 eligibility checks pass before join is allowed
3. ✅ Atomic transaction prevents race conditions on last slot
4. ✅ Join points are awarded on join
5. ✅ KYC required for paid contests only
6. ✅ Blocked states enforced
7. ✅ Age ≥ 18 enforced
8. ✅ Duplicate join prevented
9. ✅ Idempotency key prevents double-submit
10. ✅ Self-excluded users blocked

### User Flow
1. User browses contest list → taps a contest → sees contest detail page with entry fee, prizes, slot count
2. User taps "Join" button
3. If contest has rules page: user sees rules first, then "I Agree & Join"
4. Backend validates all checks → if any fail, user sees descriptive error
5. If all pass: success → wallet deducted → points awarded → confirmation screen with confetti animation
6. User can tap "View Live" to go to contest screen (once it starts)

### Admin Flow
1. Admin views contest members list → sees all users who joined with join timestamps
2. Admin can see join rate (how fast slots filled) -> analytics
3. Admin can view user details of any member

---

## 7. Early Entry Bonus

### Why Needed
Requirements specify a +20 point bonus for early entry. This is a fully specified point rule in the Points Master Reference Table, but it has never been implemented. It incentivizes users to join contests well before they start, improving planning and reducing last-minute rushes.

### Business Rule (exact logic)

#### "Early" Definition
For **platform-created contests** (normal, mega, home):
- A user qualifies as "early" if they join the contest **at least 7 days before start_time**
- `early_entry_deadline = contest.start_time - 7 days`
- `is_early = (user.joined_at <= early_entry_deadline)`

For **private contests**:
- A user qualifies as "early" if they join within **48 hours of contest creation** OR **at least 3 days before start_time**, whichever is LATER
- `early_entry_deadline = max(contest.created_at + 48 hours, contest.start_time - 3 days)`
- `is_early = (user.joined_at <= early_entry_deadline)`

#### Bonus Amount & Rules
| Property | Value |
|---|---|
| Bonus amount | +20 points (flat) |
| Multiplier | **NOT** multiplied by tier (flat 20 points) |
| Award timing | At join time (instant) |
| Per user per contest | Once (cannot get multiple early bonuses for same contest) |
| Daily cap | None (unlimited early bonuses across contests) |
| Counts for contest score | Yes (part of Base Score) |
| Counts for lifetime_points | Yes |
| Refundable on cancellation | No (points already earned, not deducted) |

#### Algorithm
```
function checkEarlyEntryBonus(userId, contest, joinedAt):
    if contest.type == PRIVATE:
        earlyDeadline = max(contest.createdAt + 48h, contest.startTime - 3 days)
    else:
        earlyDeadline = contest.startTime - 7 days
    
    if joinedAt <= earlyDeadline:
        awardPoints(userId, 'early_entry_bonus', 20, flat=true)
        // flat=true means skip multiplier
        return true
    return false
```

### Conditions
**Pre-conditions:**
- User has successfully joined the contest (join transaction committed)
- User has not previously received early entry bonus for this contest
- Contest is still UPCOMING at time of join

**Post-conditions:**
- Point log created: action_type = 'early_entry_bonus', points = +20
- User's points_balance increased by 20
- User's lifetime_points increased by 20
- User's weekly_points and monthly_points increased by 20

### Validation Rules
| Rule | Detail |
|---|---|
| Once per contest | Check: no existing point_log for this user+contest with action_type = 'early_entry_bonus' |
| Flat points | 20 points. Not multiplied by tier. |
| Time-based cutoff | Joined_at is compared to deadline. If joined_at > deadline, no bonus. |
| No retroactive bonus | If start_time is changed AFTER user joined, already awarded bonuses are NOT revoked. |
| No hourly/daily cap | Users can get early bonus for every contest they join early. |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| User joins exactly at deadline | Considered early (<=, not <). |
| User joins contest 6 days before start | NOT early for platform contests (needs 7 days). |
| Admin extends start_time | Already-awarded bonuses stay. New joiners use the NEW start_time for deadline calculation. |
| Admin shortens start_time | Users who joined before the change but after the new deadline keep their bonus (not revoked). This is fair because they joined early relative to the original schedule. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Contest created with less than 7 days to start** | No one can get early bonus for platform contests (deadline is before the contest was created). This is acceptable. |
| **Private contest created 1 hour before start** | early_deadline = max(creation + 48h, start - 3d). Creation+48h > start-3d, so deadline = creation+48h (which is after start_time). So no one can get early bonus. Acceptable. |
| **DST changes during the 7-day window** | All times are UTC. No issue. |
| **User joins, contest cancelled later** | Early bonus already awarded and stays with the user. Not revoked. |
| **User's join is rolled back (error)** | Early bonus NOT awarded (join never completed). |

### Examples
| Contest Type | Created At | Start Time | Joined At | Early? | Bonus |
|---|---|---|---|---|---|
| Normal | July 1 | Aug 1 (31d later) | July 20 | ✅ (11d before start > 7d) | +20 |
| Normal | July 1 | Aug 1 | July 26 | ✅ (6d before start, 6 < 7) ❌ NO, 26 July to 1 Aug = 6 days. Deadline = Aug 1 - 7 = July 25. Joined July 26 > July 25 → NOT early. | 0 |
| Normal | July 1 | Aug 1 | July 25 | ✅ (exactly 7 days) Deadline = July 25. Joined July 25 <= July 25 → EARLY. | +20 |
| Mega | July 10 | Aug 15 | July 20 | ✅ (26d before start > 7d) | +20 |
| Private | July 15 | Aug 15 | July 16 | Early = max(July 15+48h=July 17, Aug 15-3d=Aug 12) = Aug 12. Joined July 16 <= Aug 12 → EARLY. | +20 |
| Private | July 15 | July 20 | July 16 | Early = max(July 17, July 17) = July 17. Joined July 16 <= July 17 → EARLY. | +20 |
| Private | July 15 | July 18 | July 17 | Early = max(July 17, July 15) = July 17. Joined July 17 <= July 17 → EARLY. | +20 |

### Acceptance Criteria
1. ✅ Early entry bonus of +20 points awarded for joining >= 7 days before start (platform contests)
2. ✅ Private contest early entry uses different deadline
3. ✅ Bonus is flat (not multiplied by tier)
4. ✅ Awarded at join time
5. ✅ Once per user per contest
6. ✅ No cap on number of early bonuses
7. ✅ Already-awarded bonuses are not revoked if contest schedule changes

### User Flow
1. User browses contests → sees a contest starting in 30 days
2. User joins now → sees in confirmation: "+20 Early Bird Bonus!"
3. User's points balance shows instant +20
4. Notification: "Early bird bonus! You earned +20 points for joining [contest] early."

### Admin Flow
1. Admin sees a report column "Early Join %" in contest analytics — what percentage of members joined early
2. Admin can configure early entry window in system config (default 7 days for platform, 48h/3d for private)

---

## 8. Contest Completion Rules

### Why Needed
Requirements specify "Complete Normal Contest: +100" but this has never been implemented. Beyond that, the entire contest completion workflow (when it triggers, how scores are calculated, tie-breaking rules) is undefined. The current implementation simply lists members ordered by `pointsEarned DESC` — there's no formal completion process.

### Business Rule (exact logic)

#### When Completion Triggers
A contest completes when:
1. **Automatic:** `current_time >= end_time` AND contest status = RUNNING (CRON runs every 1 minute)
2. **Manual:** Admin clicks "Force Complete" on a RUNNING contest

At the moment of completion:
1. The contest status transitions to COMPLETED (see Rule 2, T5/T6)
2. The point-earning window closes — only point_logs with `created_at <= end_time` count toward scores
3. Final scores are calculated and rankings frozen
4. Completion points are awarded to all members
5. Prize distribution workflow is triggered (see Rule 10)

#### Final Score Calculation
```
For each contest member:
  BaseScore = SUM of all point_logs.points WHERE:
      user_id = member.user_id
      AND created_at BETWEEN contest.start_time AND contest.end_time
      AND action_type != 'contest_compensation'  (exclude compensation)
      AND action_type != 'contest_completion'    (exclude completion points — awarded after)
      AND (contest_id IS NULL OR contest_id = contest.id)
  
  Note: point_logs with contest_id = NULL (global activities like daily login, 
  poll vote, spin wheel, etc.) STILL count if they fall within the time window.
  This is by design — the contest measures TOTAL engagement.

  Penalties = SUM of active penalty deductions for this user during this contest
  
  FinalScore = BaseScore × tier_multiplier - Penalties
```

**Tier Multipliers:**
| Tier | Multiplier |
|---|---|
| Bronze | 1.0× |
| Silver | 1.1× |
| Gold | 1.25× |
| Platinum | 1.5× |

**Ranking:** Members sorted by FinalScore DESC. Rank 1 = highest score.

#### Tie-Breaking Rules
When two or more members have the same FinalScore:

| Priority | Tie-Breaker | Reason |
|---|---|---|
| 1 | **Higher BaseScore** (before multiplier) | Rewards raw effort. If User A has 1000×1.5=1500 and User B has 1200×1.25=1500, User B wins (higher raw score). |
| 2 | **Earlier joined_at** | Rewards early adopters. Earlier join = more committed. |
| 3 | **Higher lifetime_points** | Rewards platform loyalty. Veteran users get priority. |
| 4 | **Higher number of contests completed** | Rewards experience. |
| 5 | **Random** (crypto secure) | Last resort. Deterministic but unpredictable. |

#### Completion Points (Post-Completion Award)

| Contest Type | Completion Points |
|---|---|
| Normal | +100 |
| Mega | +200 |
| Home | +500 |
| Private | +75 |

**Rules for completion points:**
- Awarded AFTER the contest ends (not during)
- NOT counted in the contest's FinalScore (they're a reward for finishing, not part of competition)
- Subject to tier multiplier (e.g., Platinum user gets 100 × 1.5 = 150 completion points for Normal)
- Added to: points_balance, lifetime_points, weekly_points, monthly_points
- Only awarded if: contest completed normally (NOT auto-closed) AND user was a member at end_time

#### Auto-Closed Contests
If a contest auto-closes (not filled), NO completion points are awarded. Only compensation points are awarded (see Rule 4).

### Conditions
**Pre-conditions (for completion):**
- Contest status = RUNNING
- current_time >= end_time (auto) OR admin triggers force-complete

**Post-conditions:**
- Status = COMPLETED
- `completed_at` = timestamp
- FinalScore calculated for all members
- Rankings frozen and persisted
- Completion points awarded to each member
- Prize distribution initiated
- WebSocket broadcast: `contest:ended` with final rankings
- Push notification to all members

### Validation Rules
| Rule | Detail |
|---|---|
| No double completion | If status is already COMPLETED, skip. Atomic guard. |
| All members scored | Every member gets a FinalScore. Even 0-point members appear in rankings. |
| Points after end_time | Any point_log with created_at > end_time does NOT count. |
| Compensation excluded | `contest_compensation` action_type excluded from FinalScore. |
| Completion points excluded | `contest_completion` action_type excluded from FinalScore (awarded after ranking). |
| Penalties applied after multiplier | `FinalScore = BaseScore × multiplier - Penalties`. Penalties are raw deductions. |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| CRON tries to complete a contest already being force-completed by admin | Atomic UPDATE guard. First one wins. |
| User has penalties exceeding their score | FinalScore can be negative. Ranked below all positive scores. |
| User has 0 lifetime activity during contest | FinalScore = 0. Still eligible for completion points (reward for showing up). |
| User joined but then deleted account | User's member record still exists (CASCADE delete may remove it). If member row is gone, they don't get completion points. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **User in N contests simultaneously** | Points earned during overlapping periods count toward ALL contests they joined. A daily login gets counted for each active contest. |
| **Tie for rank 2 (rank 2 and 3 have same score)** | Tie-breaking: higher raw score wins. If still tied, earlier join wins. |
| **Tie at rank 10 (cash prize boundary)** | The 10th rank uses tie-breaking. Only one person gets rank 10 prize. The next person gets rank 11 (no prize). |
| **User disqualified mid-contest but still a member** | If admin issues warning level 3 (ban), user score = 0 and they appear at bottom. They still get completion points (unless banned before completion). |
| **User has multiple penalty records** | All active penalties for this contest sum up. Sum subtracted after multiplier. |

### Examples
| Scenario | Raw Score | Tier | Multiplier | Penalty | FinalScore | Rank |
|---|---|---|---|---|---|---|
| High activity, no penalties | 2000 | Platinum | 1.5× | 0 | 3000 | 1 |
| Medium activity, no penalties | 1500 | Gold | 1.25× | 0 | 1875 | 2 |
| High activity, penalties | 2000 | Platinum | 1.5× | 200 | 2800 | 3 |
| Low activity, no penalties | 500 | Silver | 1.1× | 0 | 550 | 4 |
| Banned user | 1000 | Gold | 1.25× | 2000 | -750 | 5 |

### Acceptance Criteria
1. ✅ Contest auto-completes at end_time
2. ✅ FinalScore = Base × Multiplier − Penalties
3. ✅ Tie-breakers applied in defined order
4. ✅ Completion points awarded for normal completion
5. ✅ No completion points for auto-closed contests
6. ✅ Rankings frozen and persisted
7. ✅ All members notified of results

### User Flow
1. User is watching live leaderboard on contest running screen
2. Contest reaches end_time → screen shows "Contest Ended!" animation
3. Final rankings appear with podium for top 3
4. User sees their rank, points breakdown, and prize information
5. User receives push notification: "[Contest] has ended! You ranked #X out of Y"
6. User sees completion points added (+100/200/500/75) to total points

### Admin Flow
1. Admin sees contest status = COMPLETED on contests list
2. Admin clicks contest → sees finalized leaderboard, prize distribution status
3. Admin can view per-member point breakdown (raw score, multiplier, penalty, final)
4. Admin can override rankings ONLY if there's a verified bug (audit logged)
5. Admin can trigger prize distribution manually if auto-trigger failed

---

## 9. Private Contest Rules

### Why Needed
Users can create private contests. The current implementation creates private contests with status = RUNNING (bypassing UPCOMING), generates an 8-char hex invite code, and has no creation limits. Missing: creation limits per user, proper invite code format, visibility rules, modification restrictions, and proper state transition.

### Business Rule (exact logic)

#### Who Can Create
- Any user with:
  - KYC status = `approved`
  - Wallet balance >= (entry_fee × max_slots) [to prove they can pay]
  - No active restriction/ban
  - Age >= 18
  - Not from a restricted state

#### Creation Limits

| Limit | Value | Enforcement |
|---|---|---|
| Max active private contests per user | 3 | At creation time. Counts contests where user is creator AND status in {UPCOMING, RUNNING} |
| Max private contests per month | 10 | Rolling 30-day window from creation date |
| Max per day | 1 | 1 private contest per calendar day per user |

#### Invite Code Format
| Property | Value |
|---|---|
| Length | 8 characters |
| Character set | A–Z (uppercase), 0–9 |
| Excluded chars | O, 0, I, 1, L (to avoid confusion) |
| Generation | Crypto-random: `randomBytes(5).toString('base64url').toUpperCase().replace(/[O0I1L]/g, '').slice(0,8)` |
| Uniqueness | Unique across ALL contests (past and present). Check DB before saving. |
| Collision handling | If generated code exists, regenerate (max 5 attempts, then error) |

#### Contest Parameters (Creator-Settable)

| Parameter | Min | Max | Default | Notes |
|---|---|---|---|---|
| Title | 1 char | 50 chars | "My Contest" | No profanity filter applied (but moderation tool available) |
| Entry Fee (₹) | ₹0 (free) | ₹499 | ₹49 | Platform-defined max for private contests |
| Max Slots | 2 | 50 | 10 | Minimum 2 (creator + 1 other) |
| Prize | 0 chars | 200 chars | "Winner Takes All" | Text description only (no actual prize vault) |
| Rules | 0 chars | 500 chars | Default rules | Default: "Entry fee non-refundable. Private contest — invite only. Winners announced after contest ends." |
| Start Time | now + 1 hour | now + 45 days | now + 7 days | Must satisfy 30-45 day duration |
| End Time | start + 30 days | start + 45 days | start + 30 days | Auto-calculated based on start + duration |

#### Auto-Join by Creator
When a private contest is created:
1. Creator is automatically added to contest_members
2. Entry fee is deducted from creator's wallet
3. Creator occupies 1 slot (filled_slots = 1)
4. Creator cannot be removed from their own contest

#### Visibility & Access
| Property | Rule |
|---|---|
| Public contest listing | Private contests do NOT appear in `GET /contests` for other users |
| Dashboard | Visible on the creator's "My Contests" tab |
| Search by code | Accessible via `GET /contests/code/:code` if contest is UPCOMING or RUNNING |
| Leaderboard | Visible only to members |
| Winner history | Named winners visible to all after contest ends (opt-out available) |

#### Modification Restrictions
| Action | Allowed? |
|---|---|
| Change entry fee after creation | ❌ NO — locked at creation |
| Change prize after creation | ❌ NO — locked at creation |
| Change rules after creation | ❌ NO — locked at creation |
| Change max_slots after creation | ❌ NO — locked at creation |
| Change start_time after creation | ❌ NO — locked at creation |
| Cancel contest | ✅ YES — goes through admin cancellation flow (Rule 5). Creator can request cancellation, but admin must approve and execute. |
| View member list | ✅ YES — creator can see who joined |

#### State Transitions
Private contests follow the SAME state machine as platform contests (Rule 2):
1. Created → UPCOMING (not RUNNING as current code does)
2. UPCOMING → RUNNING at start_time (if min_slots_required = 2 is met)
3. UPCOMING → COMPLETED auto-close if not enough participants
4. RUNNING → COMPLETED at end_time
5. UPCOMING/RUNNING → CANCELLED by admin

**Current implementation bug:** Private contests are created with status = RUNNING immediately (`contests.service.ts:226`). This must be changed to UPCOMING.

#### Duration Validation
Private contests must still satisfy 30–45 day duration. No exceptions.

#### Sharing & Joining
- Creator shares invite code with friends (copy code, WhatsApp, SMS, deep link)
- Friends enter code on EnterCodeScreen
- Standard join rules apply (Rule 6): KYC for paid, age 18+, state check, balance check
- The invite code lookup shows: title, creator name, entry fee, slots, prize

### Conditions
**Pre-conditions (for creation):**
- User is authenticated, KYC approved, 18+, not restricted
- Within creation limits (3 active, 10/month, 1/day)
- Wallet balance >= entry_fee × max_slots

**Post-conditions:**
- Contest created with type = PRIVATE, status = UPCOMING
- Invite code generated and returned
- Creator auto-joined as member
- Creator's wallet debited entry_fee

### Validation Rules
| Rule | Detail |
|---|---|
| Entry fee max | Private contests: max ₹499 entry fee |
| Slot min | Minimum 2 slots (creator + 1) |
| Slot max | Maximum 50 slots |
| Creation limit 1/day | Based on calendar date (UTC). If user creates at 11:30 PM UTC, next creation at 12:01 AM UTC (next day) is allowed. |
| Active limit 3 | Counts only contests where user.role == CREATOR and status in {UPCOMING, RUNNING}. COMPLETED and CANCELLED do NOT count. |
| Invite code unique | Checked on generation. Collision probability is extremely low (34^8 ≈ 1.7 × 10^12 combinations). |

### Exceptions / Error Cases
| Error | Message |
|---|---|
| KYC not approved | "Complete KYC to create private contests." |
| Under 18 | "You must be 18+ to create contests." |
| Restricted state | "Contest creation is not available in [state]." |
| Too many active | "You already have 3 active private contests. Complete or cancel one first." |
| Monthly limit reached | "You've created 10 private contests this month." |
| Daily limit reached | "You can create 1 private contest per day." |
| Entry fee > ₹499 | "Private contest entry fee cannot exceed ₹499." |
| Insufficient balance | "Insufficient wallet balance to create this contest." |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Creator's wallet has exactly ₹499, creates ₹499 contest** | Debit succeeds. Wallet = ₹0. Creator is a member. |
| **Creator's wallet has ₹500, creates ₹499 contest with max_slots=50** | Wallet must have ₹499 × 50 = ₹24,950. Rejected with insufficient balance. Wait — this doesn't make sense. The creator only pays for their OWN entry, not everyone's. |

Actually, re-reading: the creator pays their own entry fee only (₹499 × 1 = ₹499), not for all 50 slots. The other 49 joiners pay their own entry fees. So the wallet balance check should be: `wallet_balance_inr >= entry_fee_inr` (just for their own slot). Let me fix this.

**Correction:** The creator only pays for their OWN entry fee. Not for all slots. The pre-condition check is `wallet_balance_inr >= entry_fee_inr`, same as any regular join.

```
Pre-condition: wallet_balance_inr >= entry_fee_inr (not entry_fee × max_slots)
```

This makes more business sense — the creator sponsors their own participation, not everyone else's.

| Edge Case | Handling |
|---|---|
| **Creator's wallet has exactly entry fee** | Debit succeeds. Wallet = 0. Creator is a member. |
| **Creator deletes account after creation** | Contest continues. Creator's membership remains. If creator is banned, they stay as member but are ineligible for prizes. |
| **A user enters invite code wrong 5 times** | Rate limit: 10 attempts per minute per IP per code. After 10 failures, block for 5 minutes. |
| **Private contest with 0 joiners (only creator)** | Auto-closes at start_time (min_slots=2, only 1 member). Creator gets compensation. |

### Examples
| Scenario | Result |
|---|---|
| User A (KYC'd, 25yo, ₹500 wallet) creates ₹99 contest, 10 slots | ✅ Created. Wallet → ₹401. Code generated. |
| User A tries to create 2 more contests same day | ✅ Allowed (up to 1/day... wait). Day limit is 1. So 2nd creation same day ❌ REJECTED. |
| User A tries to create 4th active contest | ❌ REJECTED (max 3 active) |
| User B enters User A's invite code | ✅ Joins if all checks pass |
| User C enters fake code "ABCD1234" | ❌ "No contest found for this invite code" |

### Acceptance Criteria
1. ✅ Private contests created with UPCOMING status (not RUNNING)
2. ✅ 8-char alphanumeric invite code (no ambiguous chars)
3. ✅ KYC required for creator
4. ✅ Creation limits enforced (3 active, 10/month, 1/day)
5. ✅ Creator auto-joined and entry fee deducted
6. ✅ Invite code lookup works for joiners
7. ✅ Standard join rules apply to invitees
8. ✅ Private contests NOT visible in public listings
9. ✅ Modification locked after creation
10. ✅ Same state machine as platform contests

### User Flow
1. User A taps "Create Private Contest" → fills form (title, fee, slots, prize, rules, dates)
2. User A taps "Create" → system validates checks → wallet debited → contest created
3. User A sees success screen with invite code "X7KM9P2B"
4. User A shares code with friends via WhatsApp
5. Friend B opens app → taps "Enter Code" → types "X7KM9P2B"
6. Friend B sees contest details → taps "Join" → eligibility checks pass → joined
7. Both see contest in their "My Contests" tab with status UPCOMING

### Admin Flow
1. Admin can see private contests in contest list (filterable by type = PRIVATE)
2. Admin can view contest details, member list
3. Admin can cancel private contests (same flow as Rule 5)
4. Admin can monitor private contest creation rate (analytics)
5. Admin can block a user from creating private contests (penalty)

---

## 10. Contest Prize Distribution Rules

### Why Needed
Requirements specify: Rank 1 = Home, Rank 2 = Car, Ranks 3–10 = Cash for Home Contests. The current implementation has no prize distribution workflow whatsoever — no winner verification, no prize delivery timeline, no tax handling, no ineligibility fallback. Cash prizes are listed but never disbursed. Physical prizes have no delivery pipeline.

### Business Rule (exact logic)

#### Prize Structure by Contest Type

**Home Contests:**
| Rank | Prize | Est. Value (₹) | Type |
|---|---|---|---|
| 1 | Dream Home (physical property) | 50L – 1Cr+ | Physical |
| 2 | Car | 10L – 20L | Physical |
| 3 | ₹5,00,000 | 5L | Cash |
| 4 | ₹2,50,000 | 2.5L | Cash |
| 5 | ₹1,00,000 | 1L | Cash |
| 6 | ₹50,000 | 50K | Cash |
| 7 | ₹25,000 | 25K | Cash |
| 8 | ₹15,000 | 15K | Cash |
| 9 | ₹10,000 | 10K | Cash |
| 10 | ₹5,000 | 5K | Cash |

**Mega Contests:**
Configurable prize structure. Set at contest creation by admin. Default example:
| Rank | Prize |
|---|---|
| 1 | ₹10,00,000 |
| 2 | ₹5,00,000 |
| 3 | ₹2,00,000 |
| 4-10 | Lower cash tiers |

**Normal Contests:**
Configurable. Typically smaller cash or reward prizes.

**Private Contests:**
No platform-guaranteed prizes. Prize is whatever the creator specified (text only). The platform does NOT distribute prizes for private contests — it's between the creator and participants.

#### Prize Distribution Workflow

```
1. Contest completes (RUNNING → COMPLETED)
2. Final rankings calculated and frozen
   ↓
3. TOP 10 WINNERS IDENTIFIED (based on FinalScore)
   ↓
4. WINNER VERIFICATION (performed in rank order, top-down):
   For each winner in ranks 1-10:
     a. Check KYC status = approved
     b. Check age >= 18
     c. Check state not restricted
     d. Check account is active, not banned, not self-excluded
     e. Check no fraud flags
     If ANY check fails: mark as INELIGIBLE
   ↓
5. RE-RANK (if any ineligible winners):
   a. Remove ineligible winners from the top-10 list
   b. Shift lower-ranked eligible users UP to fill vacancies
   c. Rank 11 moves into top 10 if a previous rank is vacated
   d. Repeat eligibility checks for newly included ranks
   e. Continue until top 10 are all eligible OR no more members exist
   ↓
6. FINALIZE WINNER LIST (publish to all members)
   ↓
7. DISBURSE PRIZES:
   For CASH prizes (ranks 3-10, and any cash prizes):
     a. Calculate TDS at 30% under Section 194B (Indian Income Tax Act)
     b. Deduct TDS at source
     c. Credit net amount to winner's wallet_balance_inr
     d. Generate TDS certificate (Form 16A / TDS certificate)
     e. Mark prize as DISBURSED
   
   For PHYSICAL prizes (home, car):
     a. Winner contacted via in-app notification + SMS + email (within 48h)
     b. Winner must respond within 30 days to claim
     c. Winner must:
        - Complete/additional KYC verification
        - Sign prize acceptance agreement
        - Pay applicable TDS (30% of prize value) to the platform
        - Provide delivery address / property registration details
     d. Platform coordinates with builders/dealers for delivery
     e. Home transfer: within 90 days of winner acceptance
     f. Car delivery: within 45 days of winner acceptance
```

#### TDS Rules (Indian Context)
| Prize Type | TDS Section | Rate | Deduction Point |
|---|---|---|---|
| Cash (any amount) | 194B | 30% | At time of disbursement. Net amount credited to wallet. |
| Physical (home, car) | 194B | 30% of market value | Winner pays to platform; platform deposits to IT dept. |

**TDS Calculation Examples:**
- Cash prize ₹5,00,000: TDS = ₹1,50,000. Net disbursed = ₹3,50,000.
- Home worth ₹80,00,000: TDS = ₹24,00,000. Winner must pay this to platform.
- Car worth ₹15,00,000: TDS = ₹4,50,000. Winner must pay this to platform.

**TDS for winnings under ₹10,000 in a single contest:**
- Technically, Section 194B applies regardless of amount for game show winnings. But practically, below ₹10,000, many platforms don't deduct TDS. Business decision: Deduct TDS for ALL prize winnings to be compliant.

If the winner accepts TDS liability: Platform provides TDS certificate.
If the winner cannot pay TDS within 90 days (for physical prizes): Prize forfeited → passes to next eligible winner.

#### Winner Ineligibility Cascade

```
Initial Top 10: [U1, U2, U3, U4, U5, U6, U7, U8, U9, U10]

If U3 is ineligible:
  → Remove U3
  → Shift: [U1, U2, U4, U5, U6, U7, U8, U9, U10, U11]
  → Verify U11 (member at original rank 11)
  → If U11 also ineligible, continue to U12...
  → New Top 10: [U1, U2, U4, U5, U6, U7, U8, U9, U10, U11]

If Rank 1 (Home winner) is ineligible:
  → U2 gets offered the Home
  → U3 gets offered the Car
  → U4 gets rank 3 cash, U5 gets rank 4 cash, etc.
  → New joiners shift: U11 gets rank 10 cash
```

#### Prize Claim Timeline
| Event | Deadline (from contest completion) |
|---|---|
| Winners announced | T+0 (immediate) |
| Cash prize credited to wallet | T+1 (within 24 hours) |
| Physical prize winner contacted | T+2 (within 48 hours) |
| Winner response deadline | T+30 (30 days to claim) |
| Reminder 1 | T+7 (7 days after contact) |
| Reminder 2 | T+14 |
| Final notice | T+25 |
| Prize forfeiture if unclaimed | T+30 |
| Car delivery | T+45 after winner acceptance |
| Home transfer | T+90 after winner acceptance |
| TDS payment for physical prize | Before prize delivery (must be paid first) |

#### Prize Forfeiture & Abandonment
If a winner:
- Does not respond within 30 days → prize forfeited
- Refuses the prize → prize forfeited
- Cannot pay TDS within 90 days → prize forfeited
- Is found ineligible after verification → prize forfeited

Forfeited prizes cascade down to the next eligible rank following the same verification process.

Forfeiting winners receive NO compensation (they had a chance to claim and declined or failed).

### Conditions
**Pre-conditions:**
- Contest status = COMPLETED
- Rankings have been finalized
- Winner verification has been performed

**Post-conditions:**
- Cash prizes disbursed to winner wallets
- Physical prize winners identified, contacted, and in pipeline
- TDS deducted and recorded
- Prize distribution log created for each winner
- Contest marked as `is_prize_distributed = true`

### Validation Rules
| Rule | Detail |
|---|---|
| Contest must be COMPLETED | Cannot distribute prizes for RUNNING, UPCOMING, or CANCELLED contests |
| One-time distribution | Once `is_prize_distributed = true`, cannot redistribute (except for admin override) |
| Winner must be eligible | KYC approved, 18+, not restricted, not banned, not self-excluded |
| TDS mandatory | Cannot disburse without TDS deduction/calculation |
| Physical prize TDS | Winner must pay before delivery |
| Cash prize TDS | Deducted at source; net amount credited |

### Exceptions / Error Cases
| Scenario | Handling |
|---|---|
| Winner's KYC was approved at join time but REJECTED at prize time | Winner is ineligible. Prize cascades. |
| Winner moves to restricted state between join and prize | Still eligible (state checked at join). But for physical delivery: they may need to accept delivery in a non-restricted state. |
| Winner is banned after contest ends but before prize disbursal | Ineligible. Prize cascades. |
| Cash prize disbursal fails (API error) | Retry 3 times. If all fail, mark as FAILED and alert admin. |
| Physical prize builder backs out | Contest cancellation (PRIZE_UNAVAILABLE reason) with double compensation (Rule 5). |
| TDS payment for physical prize not received within 90 days | Prize forfeited. Next eligible winner offered the prize. |

### Edge Cases
| Edge Case | Handling |
|---|---|
| **Only 3 members in contest (minimum viable)** | Ranks 1-3 get their prizes. Ranks 4-10 are empty (no one to claim). |
| **Only 1 member in a contest that somehow ran** | They get rank 1 prize. Ranks 2-10 empty. |
| **Top 10 are all ineligible** | Cascade until an eligible member is found. If no eligible members exist, no prizes awarded. All entry fees converted to compensation. Prize pool returned to platform. |
| **Winner is a foreign national (not Indian resident)** | Higher TDS rate (30% + surcharge + cess). Consult legal. For MVP: Same TDS rules apply. |
| **Winner wants cash instead of home** | Not allowed. Prize is specifically the home. Winner can sell the home after transfer. |
| **Multiple winners share same name** | Identified by user_id (UUID). No ambiguity. |
| **Winner is under 18 but joined before age verification was implemented** | Ineligible. Prize cascades. This is a legal requirement. |

### Examples
| Scenario | Prize | TDS | Net to Winner | Timeline |
|---|---|---|---|---|
| Rank 1 wins Home (₹80L) + Cash (₹5L for rank 3? No, rank 3 is different.) | Let me clarify: Each rank gets exactly their prize. Rank 1 gets the home. They don't also get cash. | Home TDS = 30% of ₹80L = ₹24L (winner pays) | Home worth ₹80L (after TDS payment) | 90 days for transfer |
| Rank 3 wins ₹5L cash | ₹5L | ₹1.5L (30%) | ₹3.5L credited to wallet | 24 hours |
| Rank 10 wins ₹5,000 cash | ₹5,000 | ₹1,500 (30%) | ₹3,500 credited to wallet | 24 hours |
| Rank 1 ineligible, Rank 2 moves up | Rank 2 gets offered home (originally was car) | Same TDS rules | — | Extended by verification time |
| Winner doesn't respond for 30 days | Forfeited | — | — | Prize goes to next rank |

### Acceptance Criteria
1. ✅ Top 10 winners identified based on FinalScore
2. ✅ All winners verified for eligibility (KYC, age, state, active)
3. ✅ Ineligible winners removed and rankings cascaded
4. ✅ Cash prizes credited to wallet within 24 hours
5. ✅ TDS deducted at 30% for all prizes
6. ✅ Physical prize winners contacted within 48 hours
7. ✅ 30-day claim deadline for physical prizes
8. ✅ Forfeited prizes cascade to next eligible rank
9. ✅ TDS certificates generated for all winners
10. ✅ Prize distribution logged and auditable

### User Flow (Winner)
1. User ranks in top 10 → sees "Congratulations!" screen with prize details
2. User receives push notification: "You won [prize] in [contest]!"
3. **Cash winner:** Opens app → sees wallet credited with net amount (after TDS) → can withdraw
4. **Home/Car winner:** Opens app → sees prize claim form → fills personal details, address → agrees to TDS payment → platform contacts within 48h
5. User must complete any remaining KYC → pays TDS → waits for delivery

### User Flow (Non-Winner)
1. User sees their rank and points summary
2. Message: "Better luck next time! You ranked #X. Keep earning points for the next contest."
3. User can share their score/rank on social media

### Admin Flow
1. Admin sees contest status = COMPLETED with "Prize Distribution Pending" badge
2. Admin clicks "Distribute Prizes" button → system runs winner verification auto
3. Admin sees the verified winner list with eligibility status for each
4. Any ineligible winners are flagged with reason (e.g., "KYC Rejected", "Under 18")
5. Admin confirms distribution → cash disbursed, physical winners contacted
6. Admin can track physical prize delivery status:
   - Contacted (T+2)
   - Accepted (T+<30)
   - TDS Paid (T+<90)
   - Delivered
   - Forfeited
7. Admin can manually override eligibility ONLY with legal team approval (audit logged)

---

## APPENDIX: CRON Job Schedule Summary

| CRON Job | Frequency | What It Does | File |
|---|---|---|---|
| Status Transitions | Every 1 minute | upcoming → running, upcoming → auto-close, running → completed | New: `contest-status.cron.service.ts` |
| Compensation Processing | Every 5 minutes | Compensation for auto-closed and cancelled contests | Existing: `compensation.cron.service.ts` |
| Prize Distribution | Every 5 minutes | Auto-disburse cash prizes for just-completed contests | New: `prize-distribution.cron.service.ts` |
| Account Age Bonus | Daily (00:00 UTC) | Award +200/+500 for 30/90 day account milestones | Missing (GAP item) — new |
| Penalty Expiry | Daily (00:00 UTC) | Auto-expire warnings past expires_at | Missing (GAP item) — new |

## APPENDIX: Required New / Modified Columns on `contests` Table

| Column | Type | Default | Purpose |
|---|---|---|---|
| `min_slots_required` | integer | `ceil(max_slots * 0.5)` | Minimum participants for contest to start |
| `is_auto_closed` | boolean | false | Whether contest auto-closed due to not filling |
| `cancellation_reason` | varchar(50) | null | Enum reason for cancellation |
| `cancellation_notes` | text | null | Free-text notes on cancellation |
| `cancelled_by` | uuid | null | admin_id who cancelled |
| `cancelled_at` | timestamptz | null | When cancellation happened |
| `completed_at` | timestamptz | null | When contest completed |
| `early_entry_deadline` | timestamptz | null | Computed early entry deadline |
| `is_prize_distributed` | boolean | false | Whether prizes have been distributed |
| `compensation_status` | enum | 'none' | Already exists as `CompensationStatus` |

## APPENDIX: Required New / Modified Columns on `contest_members` Table

| Column | Type | Default | Purpose |
|---|---|---|---|
| `final_score` | decimal(12,2) | 0 | Calculated FinalScore at contest end |
| `raw_score` | integer | 0 | BaseScore before multiplier |
| `penalty_deduction` | integer | 0 | Total penalty points deducted |
| `rank` | integer | null | Final rank in contest |
| `is_disqualified` | boolean | false | Manually disqualified by admin |
| `is_prize_eligible` | boolean | true | Eligibility check result for prizes |

## APPENDIX: Key Bug Fixes Required in Current Code

1. **Join only checks RUNNING status** (`contests.service.ts:331`): Should allow join in UPCOMING status. Fix: `contest.status !== ContestStatus.UPCOMING`.

2. **Private contests created as RUNNING** (`contests.service.ts:226`): Should be UPCOMING. Fix: `status: ContestStatus.UPCOMING`.

3. **Compensation multiplied by tier** (`compensation.service.ts:174`): Compensation should be flat. Fix: Remove multiplier from compensation calculation. `finalPoints = points` (not `Math.round(points * multiplier)`).

4. **Auto-close uses maxSlots as threshold** (`compensation.service.ts:82`): Should use min_slots_required. Fix: `if (contest.filledSlots >= (contest.min_slots_required || Math.ceil(contest.maxSlots * 0.5)))`.

5. **Auto-close checks at end_time** (`compensation.service.ts:68-74`): Should check at start_time for upcoming contests. Fix: Split into two CRON checks — status transitions (every 1 min) and compensation processing (every 5 min).

6. **Leaderboard exposes phone numbers** (`contests.service.ts:254`): Remove phoneNumber from leaderboard response.

---

*End of Contest Lifecycle Business Rules Document*
