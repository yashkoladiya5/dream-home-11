import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL_CONFIG as BASE_URL, API_PREFIX } from './k6-config.js';

export const options = {
  vus: 100,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.02'],
    'wallet_balance_duration': ['p(95)<1000'],
    'wallet_history_duration': ['p(95)<1500'],
  },
  tags: {
    test: 'wallet-transactions',
    project: 'dreamhome11',
  },
};

function getAuthToken() {
  const phone = `+919300000${String(__VU).padStart(3, '0')}`;
  const res = http.post(
    `${BASE_URL}${API_PREFIX}/auth/mock-login`,
    JSON.stringify({ phoneNumber: phone }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 201) return null;
  try {
    const body = JSON.parse(res.body);
    return body.accessToken || body.token;
  } catch {
    return null;
  }
}

export default function () {
  const token = getAuthToken();
  if (!token) {
    console.error(`VU ${__VU}: Failed to authenticate`);
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('Wallet Balance', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/transactions/balance`,
      { headers: authHeaders }
    );

    check(res, {
      'balance status 200': (r) => r.status === 200,
      'balance has correct format': (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.balance !== undefined ||
            body.totalBalance !== undefined ||
            body.walletBalance !== undefined
          );
        } catch {
          return false;
        }
      },
    });
  });

  group('Transaction History', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/transactions?page=1&limit=20`,
      { headers: authHeaders }
    );

    check(res, {
      'tx history status 200': (r) => r.status === 200,
      'tx history is paginated': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined || Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
  });

  group('Filtered Transactions', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/transactions?page=1&limit=10&type=deposit`,
      { headers: authHeaders }
    );

    check(res, {
      'filtered tx status 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}
