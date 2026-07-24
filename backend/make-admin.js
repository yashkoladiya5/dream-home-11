const { Client } = require('pg');

async function makeAdmin() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'dream_home_11',
    password: 'postgres',
    port: 5432,
  });

  await client.connect();
  console.log('Connected to DB');

  // Insert or update an admin user
  const phone = '9999999999';
  const role = 'admin';
  const passwordRaw = 'password123';
  const password = require('crypto').createHash('sha256').update(passwordRaw).digest('hex');

  // Check if exists
  const res = await client.query('SELECT id FROM "users" WHERE phone_number = $1', [phone]);
  if (res.rows.length > 0) {
    await client.query('UPDATE "users" SET role = $1, password = $2 WHERE phone_number = $3', [role, password, phone]);
    console.log('User updated to admin');
  } else {
    // Generate UUID
    const uuid = require('crypto').randomUUID();
    await client.query(
      'INSERT INTO "users" (id, phone_number, role, password, full_name, wallet_balance, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [uuid, phone, role, password, 'Admin User', 1000]
    );
    console.log('Admin user created');
  }

  await client.end();
}

makeAdmin().catch(console.error);
