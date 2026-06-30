import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAuthToken } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 40 },
    { duration: '10s', target: 80 },
    { duration: '20s', target: 80 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const token = getAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const res = http.get(`${BASE_URL}${API_PREFIX}/admin/compensations/stats`, { headers });
  check(res, { 'compensation stats 200': (r) => r.status === 200 });

  sleep(2);
}
