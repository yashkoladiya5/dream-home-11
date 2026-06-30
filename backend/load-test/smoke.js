import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, API_PREFIX, getAuthToken } from './config.js';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const token = getAuthToken();
  if (!token) return;

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const checks = [
    { name: 'leaderboard', url: `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=5` },
    { name: 'my profile', url: `${BASE_URL}${API_PREFIX}/users/me` },
    { name: 'running contests', url: `${BASE_URL}${API_PREFIX}/contests?status=running&page=1&limit=5` },
    { name: 'transactions', url: `${BASE_URL}${API_PREFIX}/transactions?page=1&limit=5` },
  ];

  for (const { name, url } of checks) {
    const res = http.get(url, { headers });
    check(res, { [`smoke ${name} 200`]: (r) => r.status === 200 });
  }

  sleep(1);
}
