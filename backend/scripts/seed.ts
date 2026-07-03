import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const args = process.argv.slice(2);
  const userCount = parseInt(args.find((a) => a.startsWith('--users='))?.split('=')[1] || '10', 10);
  const contestCount = parseInt(args.find((a) => a.startsWith('--contests='))?.split('=')[1] || '5', 10);
  const pointLogCount = parseInt(args.find((a) => a.startsWith('--point-logs='))?.split('=')[1] || '50', 10);
  const transactionCount = parseInt(args.find((a) => a.startsWith('--transactions='))?.split('=')[1] || '10', 10);

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get('DataSource');
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('[Seed] Starting database seed...');

    const existing = await queryRunner.query(`SELECT COUNT(*) as count FROM "users"`);
    if (parseInt(existing[0]?.count || '0') > 0) {
      console.log('[Seed] Database already has data, skipping');
      await queryRunner.rollbackTransaction();
      return;
    }

    const userIds: string[] = [];
    const tierNames = ['bronze', 'silver', 'gold', 'platinum'];
    const tierPoints = [500, 5000, 25000, 50000];
    const tierWallet = [0, 1000, 5000, 10000];

    for (let i = 1; i <= userCount; i++) {
      const tierIdx = Math.min(Math.floor((i - 1) / Math.ceil(userCount / tierNames.length)), tierNames.length - 1);
      const phone = `+9199999999${String(i).padStart(2, '0')}`;
      const name = `Test User ${i}`;
      const result = await queryRunner.query(
        `INSERT INTO "users" ("id", "phone_number", "full_name", "current_tier", "points_balance", "wallet_balance_inr", "device_id", "role", "is_active", "referral_code", "created_at")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'seed-device', 'user', true, $6, NOW())
         RETURNING "id"`,
        [
          phone,
          name,
          tierNames[tierIdx],
          tierPoints[tierIdx],
          tierWallet[tierIdx],
          `REF${String(i).padStart(4, '0')}`,
        ],
      );
      userIds.push(result[0]?.id);
      if (i % 10 === 0 || i === userCount) {
        console.log(`[Seed] ${i}/${userCount} users seeded`);
      }
    }
    console.log(`[Seed] ${userCount} users seeded`);

    const contestIds: string[] = [];
    const contestTypes = [
      { title: 'Daily Challenge', entryFee: 10, maxSlots: 100, prize: '500' },
      { title: 'Weekly Tournament', entryFee: 50, maxSlots: 500, prize: '5000' },
      { title: 'Mega Contest', entryFee: 100, maxSlots: 1000, prize: '20000' },
      { title: 'Free Entry', entryFee: 0, maxSlots: 50, prize: '200' },
      { title: 'Premium League', entryFee: 500, maxSlots: 100, prize: '25000' },
      { title: 'Weekend Special', entryFee: 25, maxSlots: 200, prize: '3000' },
      { title: 'Grand Slam', entryFee: 200, maxSlots: 500, prize: '50000' },
      { title: 'Pro Challenge', entryFee: 150, maxSlots: 300, prize: '15000' },
      { title: 'Beginner Friendly', entryFee: 5, maxSlots: 100, prize: '1000' },
      { title: 'Exclusive Elite', entryFee: 1000, maxSlots: 50, prize: '100000' },
    ];

    for (let i = 0; i < contestCount && i < contestTypes.length; i++) {
      const c = contestTypes[i];
      const type = i === 2 ? 'mega' : 'normal';
      const startTime = new Date(Date.now() + 86400000 * (i + 1));
      const endTime = new Date(startTime.getTime() + 86400000 * 2);
      const result = await queryRunner.query(
        `INSERT INTO "contests" ("id", "title", "type", "entry_fee_inr", "max_slots", "prize", "status", "start_time", "end_time", "created_at")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'upcoming', $6, $7, NOW())
         RETURNING "id"`,
        [c.title, type, c.entryFee, c.maxSlots, c.prize, startTime.toISOString(), endTime.toISOString()],
      );
      contestIds.push(result[0]?.id);
    }
    console.log(`[Seed] ${contestCount} contests seeded`);

    const rewards = [
      { title: '₹100 Cash Bonus', points_required: 1000, category: 'cash', description: 'Redeem 1000 points for ₹100 cash' },
      { title: '₹500 Cash Bonus', points_required: 4500, category: 'cash', description: 'Redeem 4500 points for ₹500 cash' },
      { title: 'Amazon Gift Card ₹250', points_required: 2500, category: 'gift_card', description: 'Amazon shopping voucher' },
      { title: 'Flipkart Gift Card ₹500', points_required: 4500, category: 'gift_card', description: 'Flipkart shopping voucher' },
      { title: 'Mobile Recharge ₹100', points_required: 800, category: 'recharge', description: 'Prepaid mobile recharge' },
      { title: 'Exclusive Badge', points_required: 500, category: 'badge', description: 'Profile badge' },
      { title: '₹1000 Cash Bonus', points_required: 8000, category: 'cash', description: 'Redeem 8000 points for ₹1000 cash' },
      { title: 'Zomato Gift Card ₹200', points_required: 1800, category: 'gift_card', description: 'Zomato food voucher' },
    ];

    for (const reward of rewards) {
      await queryRunner.query(
        `INSERT INTO "rewards" ("id", "title", "points_required", "category", "description", "is_active", "stock", "created_at")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, true, 100, NOW())
         ON CONFLICT DO NOTHING`,
        [reward.title, reward.points_required, reward.category, reward.description],
      );
    }
    console.log('[Seed] Rewards seeded');

    const pointActions = ['daily_login', 'contest_entry', 'contest_win', 'referral_bonus', 'achievement_bonus', 'spin_reward', 'streak_bonus'];
    for (let i = 0; i < pointLogCount; i++) {
      const userId = userIds[i % userIds.length];
      const action = pointActions[i % pointActions.length];
      const basePoints = Math.floor(Math.random() * 100) + 10;
      const multiplier = parseFloat((Math.random() * 2 + 0.5).toFixed(2));
      const finalPoints = Math.round(basePoints * multiplier);
      await queryRunner.query(
        `INSERT INTO "point_logs" ("id", "user_id", "action", "base_points", "multiplier", "final_points", "created_at")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW() - INTERVAL '1 day' * $6)`,
        [userId, action, basePoints, multiplier, finalPoints, Math.floor(Math.random() * 30)],
      );
      if ((i + 1) % 20 === 0 || i === pointLogCount - 1) {
        console.log(`[Seed] ${i + 1}/${pointLogCount} point logs seeded`);
      }
    }

    const txTypes = ['deposit', 'entry_fee', 'withdrawal', 'redemption', 'points_earned', 'referral'];
    for (let i = 0; i < transactionCount; i++) {
      const userId = userIds[i % userIds.length];
      const txType = txTypes[i % txTypes.length];
      const cashAmount = txType === 'deposit' ? Math.floor(Math.random() * 5000 + 100) : 0;
      const pointsAmount = txType === 'points_earned' ? Math.floor(Math.random() * 500 + 50) : 0;
      await queryRunner.query(
        `INSERT INTO "transactions" ("id", "user_id", "type", "cash_amount", "points_amount", "description", "status", "created_at")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'completed', NOW() - INTERVAL '1 day' * $6)`,
        [userId, txType, cashAmount, pointsAmount, `Auto-generated ${txType}`, Math.floor(Math.random() * 30)],
      );
      if ((i + 1) % 10 === 0 || i === transactionCount - 1) {
        console.log(`[Seed] ${i + 1}/${transactionCount} transactions seeded`);
      }
    }

    await queryRunner.query(
      `INSERT INTO "system_config" ("id", "appName", "appVersion", "apiVersion", "environment", "maintenanceMode", "minAppVersionAndroid", "minAppVersionIos", "maxWithdrawalAmount", "minWithdrawalAmount", "dailySpinEnabled", "pollsEnabled", "feedEnabled", "chatEnabled", "referralEnabled", "maxDailyPosts", "maxDailySpins", "supportEmail", "restrictedStates", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'Dream Home 11', '1.0.0', 'v1', 'production', false, '1.0.0', '1.0.0', 50000, 100, true, true, true, true, true, 5, 1, 'support@dreamhome11.com', 'Assam,Odisha,Telangana', NOW(), NOW())
       ON CONFLICT DO NOTHING`,
    );
    console.log('[Seed] System config seeded');

    await queryRunner.commitTransaction();
    console.log('[Seed] Database seed complete');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('[Seed] Error seeding database:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npx ts-node scripts/seed.ts [options]

Options:
  --users=N           Number of users to seed (default: 10)
  --contests=N        Number of contests to seed (default: 5)
  --point-logs=N      Number of point logs to seed (default: 50)
  --transactions=N    Number of transactions to seed (default: 10)
  --help, -h          Show this help message
`);
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
