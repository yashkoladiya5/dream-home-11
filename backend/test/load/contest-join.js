import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { BASE_URL_CONFIG as BASE_URL, API_PREFIX } from './k6-config.js';
import { SharedArray } from 'k6/data';

const userPhones = new SharedArray('users', function () {
  return Array.from({ length: 50 }, (_, i) =>
    `+919100000${String(i).padStart(3, '0')}`
  );
});

const CONTEST_ID = __ENV.CONTEST_ID || 'test-contest-id';

export const options = {
  vus: 50,
  duration: '90s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
    'contest_list_duration': ['p(95)<2000'],
    'contest_join_duration': ['p(95)<3000'],
  },
  tags: {
    test: 'contest-join',
    project: 'dreamhome11',
  },
};

function getAuthToken(phone) {
  const res = http.post(
    `${BASE_URL}${API_PREFIX}/auth/mock-login`,
    JSON.stringify({ phoneNumber: phone }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status !== 201) {
    console.error(`Failed to get token for ${phone}: ${res.status}`);
    return null;
  }

  try {
    const body = JSON.parse(res.body);
    return body.accessToken || body.token;
  } catch {
    return null;
  }
}

export default function () {
  const phone = userPhones[__VU % userPhones.length];
  const token = getAuthToken(phone);
  if (!token) {
    fail(`Could not authenticate VU ${__VU}`);
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('List Contests', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/contests?status=running&page=1&limit=10`,
      { headers: authHeaders }
    );

    check(res, {
      'contest list status 200': (r) => r.status === 200,
    });
  });

  group('Join Contest', function () {
    const res = http.post(
      `${BASE_URL}${API_PREFIX}/contests/${CONTEST_ID}/join`,
      JSON.stringify({}),
      { headers: authHeaders }
    );

    const passed = check(res, {
      'join contest 2xx': (r) => r.status >= 200 && r.status < 300,
      'join contest not 409 (no double-join)': (r) => r.status !== 409,
    });

    if (!passed && res.status === 409) {
      console.warn(`VU ${__VU} (${phone}) attempted double-join on contest ${CONTEST_ID}`);
    }

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        check(res, {
          'join response has contest data': () => body.contest !== undefined || body.success === true,
        });
      } catch (e) {
        console.error(`Failed to parse join response: ${e}`);
      }
    }
  });

  group('Contest Members', function () {
    const res = http.get(
      `${BASE_URL}${API_PREFIX}/contests/${CONTEST_ID}/members`,
      { headers: authHeaders }
    );

    check(res, {
      'contest members status 200': (r) => r.status === 200,
    });
  });

  sleep(1.5);
}
