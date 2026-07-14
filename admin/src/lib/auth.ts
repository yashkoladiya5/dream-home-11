import api from './api';

export interface StoredUser {
  _id: string;
  name: string;
  phoneNumber: string;
  role: string;
}

export async function login(phoneNumber: string, password?: string) {
  const { data } = await api.post('/auth/admin-login', { phoneNumber, password });
  const { accessToken: token, user } = data.data;
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  window.location.href = '/login';
}

export function getToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem('admin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
