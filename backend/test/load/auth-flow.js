import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { BASE_URL_CONFIG as BASE_URL, API_PREFIX } from './k6-config.js';
import { SharedArray } from 'k6/data';

const phoneNumbers = new SharedArray('phones', function () {
  return Array.from({ length: 100 }, (_, i) =>
    `+919000000${String(i).padStart(3, '0')}`
  );
});

export const options = {
  vus: 30,
  duration: '60s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
    'auth_request_otp_duration': ['p(95)<2000'],
    'auth_verify_otp_duration': ['p(95)<2000'],
    'auth_refresh_duration': ['p(95)<2000'],
  },
  tags: {
    test: 'auth-flow',
    project: 'dreamhome11',
  },
};

const RATE_LIMIT_THRESHOLD = 5;

export default function () {
  const phone = phoneNumbers[__VU % phoneNumbers.length];
  const headers = { 'Content-Type': 'application/json' };

  group('Request OTP', function () {
    let rateLimitHit = false;
    for (let i = 0; i < RATE_LIMIT_THRESHOLD + 2; i++) {
      const res = http.post(
        `${BASE_URL}${API_PREFIX}/auth/request-otp`,
        JSON.stringify({ phoneNumber: phone }),
        { headers }
      );

      if (i < RATE_LIMIT_THRESHOLD) {
        const ok = check(res, {
          'request-otp success (2xx)': (r) => r.status >= 200 && r.status < 300,
        });
        if (!ok) {
          rateLimitHit = true;
        }
      } else {
        const rateLimited = check(res, {
          'request-otp rate-limited (429)': (r) => r.status === 429,
        });
        if (rateLimited) {
          rateLimitHit = true;
        }
      }
    }
  });

  group('Verify OTP (mock)', function () {
    const res = http.post(
      `${BASE_URL}${API_PREFIX}/auth/mock-login`,
      JSON.stringify({ phoneNumber: phone }),
      { headers }
    );

    const ok = check(res, {
      'mock-login status 201': (r) => r.status === 201,
    });

    if (ok) {
      try {
        const body = JSON.parse(res.body);
        check(res, {
          'mock-login has token': () => body.accessToken !== undefined || body.token !== undefined,
          'mock-login has user': () => body.user !== undefined,
        });
      } catch (e) {
        console.error(`Failed to parse mock-login response for ${phone}: ${e}`);
      }
    }
  });

  group('JWT Refresh simulation', function () {
    const loginRes = http.post(
      `${BASE_URL}${API_PREFIX}/auth/mock-login`,
      JSON.stringify({ phoneNumber: phone }),
      { headers }
    );

    if (loginRes.status === 201) {
      try {
        const body = JSON.parse(loginRes.body);
        const token = body.accessToken || body.token;
        if (token) {
          const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          };

          const profileRes = http.get(
            `${BASE_URL}${API_PREFIX}/users/me`,
            { headers: authHeaders }
          );

          check(profileRes, {
            'profile with JWT returns 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        console.error(`JWT flow error for ${phone}: ${e}`);
      }
    }
  });

  sleep(1);
}
