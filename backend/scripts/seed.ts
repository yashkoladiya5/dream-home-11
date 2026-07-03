import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const dataSource = app.get('DataSource');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    console.log('[Seed] Starting database seed...');

    const existing = await queryRunner.query(`SELECT COUNT(*) as count FROM "users"`);
    if (parseInt(existing[0]?.count || '0') > 10) {
      console.log('[Seed] Database already seeded, skipping');
      return;
    }

    await queryRunner.query(`
      INSERT INTO "users" ("id", "phone_number", "full_name", "current_tier", "points_balance", "wallet_balance_inr", "device_id", "role", "is_active", "created_at")
      VALUES
        (gen_random_uuid(), '+919999999991', 'Test Platinum', 'platinum', 50000, 10000, 'seed-device', 'user', true, NOW()),
        (gen_random_uuid(), '+919999999992', 'Test Gold', 'gold', 25000, 5000, 'seed-device', 'user', true, NOW()),
        (gen_random_uuid(), '+919999999993', 'Test Silver', 'silver', 10000, 2000, 'seed-device', 'user', true, NOW()),
        (gen_random_uuid(), '+919999999994', 'Test Bronze', 'bronze', 5000, 1000, 'seed-device', 'user', true, NOW()),
        (gen_random_uuid(), '+919999999995', 'New Player', 'bronze', 500, 0, 'seed-device', 'user', true, NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('[Seed] Users seeded');

    const contests = [
      { title: 'Daily Challenge', type: 'normal', entry_fee_inr: 10, max_slots: 100, prize: '500', status: 'upcoming' },
      { title: 'Weekly Tournament', type: 'normal', entry_fee_inr: 50, max_slots: 500, prize: '5000', status: 'upcoming' },
      { title: 'Mega Contest', type: 'mega', entry_fee_inr: 100, max_slots: 1000, prize: '20000', status: 'upcoming' },
      { title: 'Free Entry', type: 'normal', entry_fee_inr: 0, max_slots: 50, prize: '200', status: 'upcoming' },
      { title: 'Premium League', type: 'normal', entry_fee_inr: 500, max_slots: 100, prize: '25000', status: 'upcoming' },
    ];

    for (const c of contests) {
      await queryRunner.query(`
        INSERT INTO "contests" ("id", "title", "type", "entry_fee_inr", "max_slots", "prize", "status", "start_time", "end_time", "created_at")
        VALUES (gen_random_uuid(), '${c.title}', '${c.type}', ${c.entry_fee_inr}, ${c.max_slots}, '${c.prize}', '${c.status}', NOW() + INTERVAL '1 day', NOW() + INTERVAL '2 days', NOW())
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('[Seed] Contests seeded');

    const rewards = [
      { title: '₹100 Cash Bonus', points_required: 1000, category: 'cash', description: 'Redeem 1000 points for ₹100 cash' },
      { title: '₹500 Cash Bonus', points_required: 4500, category: 'cash', description: 'Redeem 4500 points for ₹500 cash' },
      { title: 'Amazon Gift Card ₹250', points_required: 2500, category: 'gift_card', description: 'Amazon shopping voucher' },
      { title: 'Flipkart Gift Card ₹500', points_required: 4500, category: 'gift_card', description: 'Flipkart shopping voucher' },
      { title: 'Mobile Recharge ₹100', points_required: 800, category: 'recharge', description: 'Prepaid mobile recharge' },
      { title: 'Exclusive Badge', points_required: 500, category: 'badge', description: 'Profile badge' },
    ];

    for (const reward of rewards) {
      await queryRunner.query(`
        INSERT INTO "rewards" ("id", "title", "points_required", "category", "description", "is_active", "stock", "created_at")
        VALUES (gen_random_uuid(), '${reward.title}', ${reward.points_required}, '${reward.category}', '${reward.description}', true, 100, NOW())
        ON CONFLICT DO NOTHING
      `);
    }
    console.log('[Seed] Rewards seeded');

    await queryRunner.query(`
      INSERT INTO "system_config" ("id", "appName", "appVersion", "apiVersion", "environment", "maintenanceMode", "minAppVersionAndroid", "minAppVersionIos", "maxWithdrawalAmount", "minWithdrawalAmount", "dailySpinEnabled", "pollsEnabled", "feedEnabled", "chatEnabled", "referralEnabled", "maxDailyPosts", "maxDailySpins", "supportEmail", "restrictedStates", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Dream Home 11', '1.0.0', 'v1', 'production', false, '1.0.0', '1.0.0', 50000, 100, true, true, true, true, true, 5, 1, 'support@dreamhome11.com', 'Assam,Odisha,Telangana', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    console.log('[Seed] System config seeded');

    console.log('[Seed] Database seed complete');
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
