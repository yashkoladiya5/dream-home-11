import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAdminAuthToken } from './config.js';

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
  const token = getAdminAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const endpoints = [
    `${BASE_URL}${API_PREFIX}/admin/compensations/stats`,
    `${BASE_URL}${API_PREFIX}/admin/compensations/requests?page=1&limit=10`,
  ];

  for (const url of endpoints) {
    const res = http.get(url, { headers });
    check(res, { 'compensation admin endpoint 200': (r) => r.status === 200 });
  }

  sleep(2);
}
