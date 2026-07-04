import http from 'k6/http';
import { check, sleep, group, Trend, Rate, Counter } from 'k6';
import { BASE_URL_CONFIG as BASE_URL, API_PREFIX } from './k6-config.js';
import { SharedArray } from 'k6/data';

const userPhones = new SharedArray('mixed-users', function () {
  return Array.from({ length: 100 }, (_, i) =>
    `+919400000${String(i).padStart(3, '0')}`
  );
});

const contestIds = new SharedArray('contest-ids', function () {
  return ['contest-1', 'contest-2', 'contest-3'];
});

export const options = {
  stages: [
    { duration: '60s', target: 10 },
    { duration: '60s', target: 100 },
    { duration: '180s', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
  },
  tags: {
    test: 'mixed-workload',
    project: 'dreamhome11',
  },
};

const endpointTrends = {
  leaderboard: new Trend('endpoint_leaderboard_duration'),
  contests: new Trend('endpoint_contests_duration'),
  profile: new Trend('endpoint_profile_duration'),
  joinContest: new Trend('endpoint_join_contest_duration'),
  share: new Trend('endpoint_share_duration'),
  auth: new Trend('endpoint_auth_duration'),
};

const endpointErrors = {
  leaderboard: new Rate('endpoint_leaderboard_errors'),
  contests: new Rate('endpoint_contests_errors'),
  profile: new Rate('endpoint_profile_errors'),
  joinContest: new Rate('endpoint_join_contest_errors'),
  share: new Rate('endpoint_share_errors'),
  auth: new Rate('endpoint_auth_errors'),
};

const endpointCounters = {
  leaderboard: new Counter('endpoint_leaderboard_calls'),
  contests: new Counter('endpoint_contests_calls'),
  profile: new Counter('endpoint_profile_calls'),
  joinContest: new Counter('endpoint_join_contest_calls'),
  share: new Counter('endpoint_share_calls'),
  auth: new Counter('endpoint_auth_calls'),
};

function getAuthToken(phone) {
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

function trackEndpoint(trend, errorRate, counter, res) {
  counter.add(1);
  trend.add(res.timings.duration);
  if (res.status >= 400) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

export default function () {
  const phone = userPhones[__VU % userPhones.length];
  const token = getAuthToken(phone);
  if (!token) return;

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const rand = Math.random();

  if (rand < 0.60) {
    group('Read Operations', function () {
      const subRand = Math.random();

      if (subRand < 0.33) {
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/leaderboard?page=1&limit=20`,
          { headers: authHeaders }
        );
        trackEndpoint(
          endpointTrends.leaderboard,
          endpointErrors.leaderboard,
          endpointCounters.leaderboard,
          res
        );
        check(res, { 'leaderboard read 200': (r) => r.status === 200 });
      } else if (subRand < 0.66) {
        const statuses = ['running', 'upcoming', 'completed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/contests?status=${status}&page=1&limit=10`,
          { headers: authHeaders }
        );
        trackEndpoint(
          endpointTrends.contests,
          endpointErrors.contests,
          endpointCounters.contests,
          res
        );
        check(res, { 'contest read 200': (r) => r.status === 200 });
      } else {
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/users/me`,
          { headers: authHeaders }
        );
        trackEndpoint(
          endpointTrends.profile,
          endpointErrors.profile,
          endpointCounters.profile,
          res
        );
        check(res, { 'profile read 200': (r) => r.status === 200 });
      }
    });
  } else if (rand < 0.90) {
    group('Write Operations', function () {
      const subRand = Math.random();

      if (subRand < 0.70) {
        const contestId = contestIds[Math.floor(Math.random() * contestIds.length)];
        const res = http.post(
          `${BASE_URL}${API_PREFIX}/contests/${contestId}/join`,
          JSON.stringify({}),
          { headers: authHeaders }
        );
        trackEndpoint(
          endpointTrends.joinContest,
          endpointErrors.joinContest,
          endpointCounters.joinContest,
          res
        );
        check(res, {
          'join contest not error': (r) => r.status < 500,
        });
      } else {
        const res = http.get(
          `${BASE_URL}${API_PREFIX}/users/me`,
          { headers: authHeaders }
        );
        trackEndpoint(
          endpointTrends.share,
          endpointErrors.share,
          endpointCounters.share,
          res
        );
        check(res, { 'share action 200': (r) => r.status === 200 });
      }
    });
  } else {
    group('Auth Operations', function () {
      const res = http.post(
        `${BASE_URL}${API_PREFIX}/auth/mock-login`,
        JSON.stringify({ phoneNumber: phone }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      trackEndpoint(
        endpointTrends.auth,
        endpointErrors.auth,
        endpointCounters.auth,
        res
      );
      check(res, { 'auth operation ok': (r) => r.status >= 200 && r.status < 300 });
    });
  }

  sleep(0.5 + Math.random());
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const lines = [
    '=== Mixed Workload Summary ===',
    '',
    '--- Endpoint-Level Breakdown ---',
  ];

  const endpoints = ['leaderboard', 'contests', 'profile', 'joinContest', 'share', 'auth'];

  for (const ep of endpoints) {
    const trendKey = `endpoint_${ep}_duration`;
    const rateKey = `endpoint_${ep}_errors`;
    const counterKey = `endpoint_${ep}_calls`;

    const trend = metrics[trendKey];
    const rate = metrics[rateKey];
    const counter = metrics[counterKey];

    if (trend) {
      lines.push(`${ep.padEnd(16)} calls: ${(counter && counter.values.count) || 0}`);
      lines.push(`${' '.repeat(16)} avg: ${(trend.values.avg || 0).toFixed(1)}ms`);
      lines.push(`${' '.repeat(16)} p95: ${(trend.values['p(95)'] || 0).toFixed(1)}ms`);
      lines.push(`${' '.repeat(16)} error rate: ${((rate && rate.values.rate || 0) * 100).toFixed(2)}%`);
      lines.push('');
    }
  }

  lines.push('--- Overall ---');
  lines.push(`total requests: ${metrics.http_reqs ? metrics.http_reqs.values.count : 0}`);
  lines.push(`overall p95: ${metrics.http_req_duration ? metrics.http_req_duration.values['p(95)'].toFixed(1) : 0}ms`);
  lines.push(`overall error rate: ${metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%`);

  return {
    stdout: lines.join('\n'),
  };
}
