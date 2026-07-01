import http from 'k6/http';
import { sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = '/api/v1';

export const ADMIN_PHONE = '+919999999998';
export const USER_PHONE = '+919999999999';

const tokenCache = {};
const adminTokenCache = {};

function loginWithRetry(phone, maxRetries = 3) {
  const payload = JSON.stringify({ phoneNumber: phone });
  for (let i = 0; i < maxRetries; i++) {
    const response = http.post(`${BASE_URL}${API_PREFIX}/auth/mock-login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 200 || response.status === 201) {
      try {
        const body = JSON.parse(response.body);
        return body.accessToken || body.token;
      } catch (e) {
        console.error(`[ERROR] Failed to parse mock-login response: ${e}, body=${response.body}`);
      }
    } else if (response.status === 429) {
      if (i < maxRetries - 1) {
        sleep(1);
        continue;
      }
    }
    console.error(`[ERROR] mock-login failed for ${phone}: status=${response.status}, body=${response.body}`);
  }
  return null;
}

export function getAuthToken() {
  if (!tokenCache[__VU]) {
    tokenCache[__VU] = loginWithRetry(USER_PHONE);
  }
  return tokenCache[__VU];
}

export function getAdminAuthToken() {
  if (!adminTokenCache[__VU]) {
    adminTokenCache[__VU] = loginWithRetry(ADMIN_PHONE);
  }
  return adminTokenCache[__VU];
}
