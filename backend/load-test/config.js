import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = '/api/v1';

// Get auth token via mock login
export function getAuthToken(phone = '+919999999998') {
  const payload = JSON.stringify({ phoneNumber: phone });
  const response = http.post(`${BASE_URL}${API_PREFIX}/auth/mock-login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (response.status !== 201) {
    console.error(`Auth failed: ${response.status} ${response.body}`);
    return null;
  }
  
  try {
    return JSON.parse(response.body).accessToken;
  } catch (e) {
    return null;
  }
}
