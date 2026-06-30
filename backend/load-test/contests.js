import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAuthToken } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '30s', target: 200 },
    { duration: '15s', target: 400 },
    { duration: '30s', target: 400 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<400'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = getAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const statuses = ['running', 'upcoming', 'completed'];
  for (const status of statuses) {
    const res = http.get(`${BASE_URL}${API_PREFIX}/contests?status=${status}&page=1&limit=10`, { headers });
    check(res, { [`contest ${status} status 200`]: (r) => r.status === 200 });
  }

  sleep(1);
}
