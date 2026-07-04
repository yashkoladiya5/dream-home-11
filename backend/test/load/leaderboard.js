import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL_CONFIG as BASE_URL, API_PREFIX } from './k6-config.js';

export const options = {
  vus: 200,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
    'leaderboard_cold_duration': ['p(95)<1500'],
    'leaderboard_cached_duration': ['p(95)<500'],
  },
  tags: {
    test: 'leaderboard',
    project: 'dreamhome11',
  },
};

let coldTestDone = false;

function getAuthToken() {
  const phone = `+919200000${String(__VU).padStart(3, '0')}`;
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
  if (!token) return;

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('Global Leaderboard', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=20`,
      { headers: authHeaders }
    );

    check(res, {
      'global leaderboard 200': (r) => r.status === 200,
      'leaderboard has entries array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.entries);
        } catch {
          return false;
        }
      },
      'leaderboard has pagination': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.totalCount !== undefined && body.cycle !== undefined;
        } catch {
          return false;
        }
      },
    });
  });

  group('Weekly Leaderboard', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=20&cycle=weekly`,
      { headers: authHeaders }
    );

    check(res, {
      'weekly leaderboard 200': (r) => r.status === 200,
    });
  });

  group('Monthly Leaderboard', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=20&cycle=monthly`,
      { headers: authHeaders }
    );

    check(res, {
      'monthly leaderboard 200': (r) => r.status === 200,
    });
  });

  group('My Leaderboard Rank', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard/me`,
      { headers: authHeaders }
    );

    check(res, {
      'my rank 200': (r) => r.status === 200,
      'my rank has userId': (r) => {
        try {
          return JSON.parse(r.body).userId !== undefined;
        } catch {
          return false;
        }
      },
    });
  });

  if (!coldTestDone && __VU === 1) {
    coldTestDone = true;
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=5`,
      { headers: authHeaders }
    );
    const coldDuration = Date.now() - start;

    http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=5`,
      { headers: authHeaders }
    );
    const cachedStart = Date.now();
    http.get(
      `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=5`,
      { headers: authHeaders }
    );
    const cachedDuration = Date.now() - cachedStart;

    console.log(`[METRIC] Cold leaderboard: ${coldDuration}ms, Cached: ${cachedDuration}ms`);
  }

  sleep(0.3);
}
