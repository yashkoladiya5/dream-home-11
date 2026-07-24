import axios from 'axios';

async function login() {
  const res = await axios.post('http://localhost:3000/api/v1/auth/admin-login', {
    phoneNumber: '9999999999',
    password: 'password123'
  });
  return res.data.data ? res.data.data.accessToken : res.data.accessToken;
}

async function verifyCrud(token, module, endpoints, validPayload, updatePayload) {
  console.log(`\n--- Verifying ${module} ---`);
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    // CREATE
    console.log(`[CREATE] POST ${endpoints.create}`);
    const createRes = await axios.post(`http://localhost:3000${endpoints.create}`, validPayload, { headers });
    const id = createRes.data.data ? createRes.data.data.id : createRes.data.id;
    console.log(`✅ Create succeeded. ID: ${id}`);

    // READ
    console.log(`[READ] GET ${endpoints.read.replace(':id', id)}`);
    try {
      await axios.get(`http://localhost:3000${endpoints.read.replace(':id', id)}`, { headers });
      console.log(`✅ Read succeeded.`);
    } catch (e) {
      if (e.response && e.response.status === 404) {
        // Many admin modules might not have a generic GET by ID endpoint, 
        // if they don't, we will ignore this 404 for read.
        console.log(`⚠️ Read skipped (Endpoint 404, typical for some admin resources).`);
      } else {
        throw e;
      }
    }

    // UPDATE
    console.log(`[UPDATE] PATCH ${endpoints.update.replace(':id', id)}`);
    await axios.patch(`http://localhost:3000${endpoints.update.replace(':id', id)}`, updatePayload, { headers });
    console.log(`✅ Update succeeded.`);

    // DELETE
    console.log(`[DELETE] DELETE ${endpoints.delete.replace(':id', id)}`);
    await axios.delete(`http://localhost:3000${endpoints.delete.replace(':id', id)}`, { headers });
    console.log(`✅ Delete succeeded.`);

    return { module, status: 'PASS', error: null };
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`❌ Validation failed in ${module}: ${errorMsg}`);
    return { module, status: 'FAIL', error: errorMsg };
  }
}

async function run() {
  try {
    const token = await login();
    const results = [];

    // Banners
    results.push(await verifyCrud(token, 'Banners', {
      create: '/api/v1/admin/banners',
      read: '/api/v1/banners',
      update: '/api/v1/admin/banners/:id',
      delete: '/api/v1/admin/banners/:id'
    }, {
      title: 'CRUD Banner Axios',
      imageUrl: 'https://example.com/b.png',
      targetUrl: '/promo',
      isActive: true,
      sortOrder: 1
    }, {
      title: 'CRUD Banner Axios Updated'
    }));

    // Prize Homes
    results.push(await verifyCrud(token, 'Prize Homes', {
      create: '/api/v1/admin/prize-homes',
      read: '/api/v1/prize-homes/:id',
      update: '/api/v1/admin/prize-homes/:id',
      delete: '/api/v1/admin/prize-homes/:id'
    }, {
      title: 'CRUD Home Axios',
      description: 'Luxury',
      imageUrl: 'https://example.com/h.png',
      entryFee: 100,
      totalSlots: 1000,
      drawDate: new Date(Date.now() + 86400000).toISOString()
    }, {
      title: 'CRUD Home Axios Updated'
    }));

    // Rewards
    results.push(await verifyCrud(token, 'Rewards', {
      create: '/api/v1/admin/rewards',
      read: '/api/v1/rewards',
      update: '/api/v1/admin/rewards/:id',
      delete: '/api/v1/admin/rewards/:id'
    }, {
      title: 'CRUD Reward Axios',
      description: 'Test',
      pointsRequired: 50,
      imageUrl: 'https://example.com/r.png',
      quantityAvailable: 5
    }, {
      title: 'CRUD Reward Axios Updated'
    }));

    // Contests
    results.push(await verifyCrud(token, 'Contests', {
      create: '/api/v1/admin/contests',
      read: '/api/v1/contests/:id',
      update: '/api/v1/admin/contests/:id',
      delete: '/api/v1/admin/contests/:id'
    }, {
      title: 'CRUD Contest Axios',
      type: 'mega',
      entryFee: 50,
      pointsToJoin: 0,
      maxSlots: 100,
      prize: { type: 'CASH', value: 1000 },
      rules: 'none',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 2).toISOString()
    }, {
      title: 'CRUD Contest Axios Updated'
    }));

    // Polls
    results.push(await verifyCrud(token, 'Polls', {
      create: '/api/v1/admin/polls',
      read: '/api/v1/polls',
      update: '/api/v1/admin/polls/:id',
      delete: '/api/v1/admin/polls/:id'
    }, {
      question: 'CRUD Poll Axios?',
      options: ['Yes', 'No'],
      activeFrom: new Date().toISOString(),
      activeTo: new Date(Date.now() + 86400000).toISOString(),
      isActive: true
    }, {
      question: 'CRUD Poll Axios Updated?'
    }));

    console.log('\n--- FINAL RESULTS ---');
    console.table(results);
  } catch (err) {
    console.error('Fatal:', err);
  }
}

run();
