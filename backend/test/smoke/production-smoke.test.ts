import request from 'supertest';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const api = () => request(BASE_URL);

const TIMEOUT = 10000;
const MAX_RESPONSE_TIME = 2000;

async function measureResponseTime(method: 'get' | 'post' | 'options', url: string, body?: any): Promise<number> {
  const start = Date.now();
  if (method === 'post') {
    await api()[method](url).send(body);
  } else {
    await api()[method](url);
  }
  return Date.now() - start;
}

describe('Production Smoke Tests', () => {
  describe('Health Endpoints', () => {
    test.skip('GET /health returns 200 with status ok', async () => {
      const res = await api().get('/health').timeout(TIMEOUT);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    }, TIMEOUT);

    test.skip('GET /health/ready returns 200 (DB + Redis up)', async () => {
      const res = await api().get('/health/ready').timeout(TIMEOUT);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(['ok', 'degraded']).toContain(res.body.status);
    }, TIMEOUT);
  });

  describe('API Endpoints', () => {
    test.skip('GET /api/v1/contests returns 200 with paginated response', async () => {
      const res = await api().get('/api/v1/contests').timeout(TIMEOUT);
      expect(res.status).toBe(200);
      const body = res.body;
      expect(body).toHaveProperty('data') || expect(body).toHaveProperty('entries') || expect(Array.isArray(body)).toBe(true);
    }, TIMEOUT);

    test.skip('GET /api/v1/users/dashboard returns 401 without auth', async () => {
      const res = await api().get('/api/v1/users/dashboard').timeout(TIMEOUT);
      expect(res.status).toBe(401);
    }, TIMEOUT);

    test.skip('OPTIONS /api/v1/contests returns 200 with CORS headers', async () => {
      const res = await api().options('/api/v1/contests').timeout(TIMEOUT);
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('access-control-allow-origin');
      expect(res.headers).toHaveProperty('access-control-allow-methods');
    }, TIMEOUT);

    test.skip('POST /api/v1/auth/verify-otp returns 400 for invalid body', async () => {
      const res = await api().post('/api/v1/auth/verify-otp').send({}).timeout(TIMEOUT);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message') || expect(Array.isArray(res.body.message)).toBe(true);
    }, TIMEOUT);
  });

  describe('Edge Cases', () => {
    test.skip('GET /nonexistent-route returns 404', async () => {
      const res = await api().get('/nonexistent-route').timeout(TIMEOUT);
      expect(res.status).toBe(404);
    }, TIMEOUT);

    test.skip('GET /metrics returns 200 with prometheus content type', async () => {
      const res = await api().get('/metrics').timeout(TIMEOUT);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/plain/);
    }, TIMEOUT);
  });

  describe('Response Time Compliance', () => {
    const endpoints = [
      { method: 'get' as const, url: '/health' },
      { method: 'get' as const, url: '/health/ready' },
      { method: 'get' as const, url: '/api/v1/contests' },
      { method: 'get' as const, url: '/metrics' },
      { method: 'options' as const, url: '/api/v1/contests' },
    ];

    test.skip.each(endpoints)('$method $url responds within ${MAX_RESPONSE_TIME}ms', async ({ method, url }) => {
      const duration = await measureResponseTime(method, url);
      expect(duration).toBeLessThan(MAX_RESPONSE_TIME);
    }, TIMEOUT);
  });
});
