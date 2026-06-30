import http from 'k6/http';
import { check, fail } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = '/api/v1';

export const ADMIN_PHONE = '+919999999998';
export const USER_PHONE = '+919999999999';

function login(phone) {
  const payload = JSON.stringify({ phoneNumber: phone });
  const response = http.post(`${BASE_URL}${API_PREFIX}/auth/mock-login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status !== 200 && response.status !== 201) {
    console.error(`[ERROR] mock-login failed for ${phone}: status=${response.status}, body=${response.body}`);
    fail(`mock-login returned ${response.status}`);
    return null;
  }

  try {
    const body = JSON.parse(response.body);
    const token = body.accessToken || body.token;
    if (!token) {
      console.error(`[ERROR] No accessToken in response body: ${response.body}`);
      fail('Missing accessToken in mock-login response');
      return null;
    }
    return token;
  } catch (e) {
    console.error(`[ERROR] Failed to parse mock-login response: ${e}, body=${response.body}`);
    fail(`JSON parse error: ${e}`);
    return null;
  }
}

export function getAuthToken() {
  return login(USER_PHONE);
}

export function getAdminAuthToken() {
  return login(ADMIN_PHONE);
}
