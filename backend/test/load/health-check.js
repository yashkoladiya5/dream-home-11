import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL_CONFIG as BASE_URL } from './k6-config.js';

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: {
    test: 'health-check',
    project: 'dreamhome11',
  },
};

export default function () {
  const endpoints = [
    { name: 'health', url: `${BASE_URL}/health` },
    { name: 'health-ready', url: `${BASE_URL}/health/ready` },
    { name: 'health-live', url: `${BASE_URL}/health/live` },
  ];

  for (const { name, url } of endpoints) {
    const res = http.get(url);
    check(res, {
      [`${name} status 200`]: (r) => r.status === 200,
      [`${name} body has status`]: (r) => {
        try {
          return JSON.parse(r.body).status !== undefined;
        } catch {
          return false;
        }
      },
    });
  }

  sleep(0.5);
}
