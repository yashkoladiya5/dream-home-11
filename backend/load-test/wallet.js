import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAuthToken } from './config.js';

export const options = {
  stages: [
    { duration: '20s', target: 30 },
    { duration: '40s', target: 100 },
    { duration: '20s', target: 200 },
    { duration: '30s', target: 200 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.02'],
  },
};

export default function () {
  const token = getAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const endpoints = [
    `${BASE_URL}${API_PREFIX}/transactions?page=1&limit=10`,
    `${BASE_URL}${API_PREFIX}/transactions/balance`,
  ];

  for (const url of endpoints) {
    const res = http.get(url, { headers });
    check(res, { 'wallet endpoint status 200': (r) => r.status === 200 });
  }

  sleep(2);
}
