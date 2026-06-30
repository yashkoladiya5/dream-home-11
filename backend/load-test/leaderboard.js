import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAuthToken } from './config.js';

export const options = {
  stages: [
    { duration: '20s', target: 50 },
    { duration: '40s', target: 150 },
    { duration: '20s', target: 300 },
    { duration: '30s', target: 300 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = getAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = http.get(`${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=20`, { headers });
  check(res, {
    'leaderboard status 200': (r) => r.status === 200,
  });

  sleep(1);
}
