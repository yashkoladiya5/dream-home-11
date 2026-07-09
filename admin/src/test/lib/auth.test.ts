import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, logout, getToken, isAuthenticated, getStoredUser } from '../../lib/auth';

vi.mock('../../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

import api from '../../lib/api';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockLocation = { href: '' };
delete (window as any).location;
Object.defineProperty(window, 'location', { value: mockLocation, writable: true });

describe('auth', () => {
  beforeEach(() => {
    localStorageMock.clear();
    window.location.href = '';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('calls api.post with correct args', async () => {
      const mockPost = vi.mocked(api.post);
      mockPost.mockResolvedValue({
        data: { data: { accessToken: 'test-token', user: { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' } } },
      });
      await login('9999999999', 'admin');
      expect(mockPost).toHaveBeenCalledWith('/auth/mock-login', { phoneNumber: '9999999999', role: 'admin' });
    });

    it('stores token in localStorage', async () => {
      const mockPost = vi.mocked(api.post);
      mockPost.mockResolvedValue({
        data: { data: { accessToken: 'my-token', user: { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' } } },
      });
      await login('9999999999');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('admin_token', 'my-token');
    });

    it('stores user in localStorage', async () => {
      const mockPost = vi.mocked(api.post);
      const user = { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' };
      mockPost.mockResolvedValue({
        data: { data: { accessToken: 'token', user } },
      });
      await login('9999999999');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('admin_user', JSON.stringify(user));
    });

    it('returns user data', async () => {
      const mockPost = vi.mocked(api.post);
      const user = { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' };
      mockPost.mockResolvedValue({
        data: { data: { accessToken: 'token', user } },
      });
      const result = await login('9999999999');
      expect(result).toEqual(user);
    });

    it('uses default admin role when not specified', async () => {
      const mockPost = vi.mocked(api.post);
      mockPost.mockResolvedValue({
        data: { data: { accessToken: 'token', user: { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' } } },
      });
      await login('9999999999');
      expect(mockPost).toHaveBeenCalledWith('/auth/mock-login', { phoneNumber: '9999999999', role: 'admin' });
    });
  });

  describe('logout', () => {
    it('removes admin_token from localStorage', () => {
      localStorageMock.setItem('admin_token', 'some-token');
      logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_token');
    });

    it('removes admin_user from localStorage', () => {
      localStorageMock.setItem('admin_user', JSON.stringify({ name: 'Admin' }));
      logout();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_user');
    });

    it('redirects to /login', () => {
      logout();
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('getToken', () => {
    it('returns token when exists', () => {
      localStorageMock.setItem('admin_token', 'my-token');
      expect(getToken()).toBe('my-token');
    });

    it('returns null when no token', () => {
      expect(getToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorageMock.setItem('admin_token', 'some-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when no token', () => {
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('returns parsed user from localStorage', () => {
      const user = { _id: '1', name: 'Admin', phoneNumber: '9999999999', role: 'admin' };
      localStorageMock.setItem('admin_user', JSON.stringify(user));
      expect(getStoredUser()).toEqual(user);
    });

    it('returns null when no stored user', () => {
      expect(getStoredUser()).toBeNull();
    });

    it('returns null when JSON is malformed', () => {
      localStorageMock.setItem('admin_user', 'not-json');
      expect(getStoredUser()).toBeNull();
    });
  });
});
