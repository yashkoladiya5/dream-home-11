import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../lib/api';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    length: 0,
    key: vi.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

let locationHref = '';
Object.defineProperty(window, 'location', {
  value: { set href(v: string) { locationHref = v; }, get href() { return locationHref; } },
  writable: true,
});

describe('api client', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    locationHref = '';
  });

  it('sets base URL from env or default', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('sets Content-Type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  describe('request interceptor', () => {
    it('adds Authorization header when token exists', async () => {
      localStorageMock.setItem('admin_token', 'my-test-token');
      const handlers = (api.interceptors.request as any).handlers;
      const requestHandler = handlers.find((h: any) => h.fulfilled);
      if (requestHandler) {
        const config = { headers: {} };
        const result = await requestHandler.fulfilled(config);
        expect(result.headers.Authorization).toBe('Bearer my-test-token');
      }
    });

    it('does not add Authorization header when no token', async () => {
      const handlers = (api.interceptors.request as any).handlers;
      const requestHandler = handlers.find((h: any) => h.fulfilled);
      if (requestHandler) {
        const config = { headers: {} };
        const result = await requestHandler.fulfilled(config);
        expect(result.headers.Authorization).toBeUndefined();
      }
    });
  });

  describe('response interceptor - success', () => {
    it('wraps non-standard response in ApiResponse format', () => {
      const response = { data: { message: 'hello' }, status: 200, statusText: 'OK', headers: {}, config: {} };
      const handlers = (api.interceptors.response as any).handlers;
      const successHandler = handlers.find((h: any) => h.fulfilled);
      if (successHandler) {
        const result = successHandler.fulfilled(response);
        expect(result.data).toEqual({ success: true, data: { message: 'hello' } });
      }
    });

    it('passes through standard ApiResponse format mapping id to _id', () => {
      const response = {
        data: { success: true, data: { id: 1 } },
        status: 200, statusText: 'OK', headers: {}, config: {},
      };
      const handlers = (api.interceptors.response as any).handlers;
      const successHandler = handlers.find((h: any) => h.fulfilled);
      if (successHandler) {
        const result = successHandler.fulfilled(response);
        expect(result.data).toEqual({ success: true, data: { id: 1, _id: 1 } });
      }
    });

    it('handles paginated NestJS-style responses', () => {
      const response = {
        data: { contests: [{ _id: '1' }], total: 10, page: 1, limit: 20 },
        status: 200, statusText: 'OK', headers: {}, config: {},
      };
      const handlers = (api.interceptors.response as any).handlers;
      const successHandler = handlers.find((h: any) => h.fulfilled);
      if (successHandler) {
        const result = successHandler.fulfilled(response);
        expect(result.data.success).toBe(true);
        expect(result.data.data).toEqual([{ _id: '1' }]);
        expect(result.data.pagination).toBeDefined();
        expect(result.data.pagination?.totalPages).toBe(1);
      }
    });

    it('maps id to _id in response data', () => {
      const response = {
        data: { id: 'abc', name: 'test' },
        status: 200, statusText: 'OK', headers: {}, config: {},
      };
      const handlers = (api.interceptors.response as any).handlers;
      const successHandler = handlers.find((h: any) => h.fulfilled);
      if (successHandler) {
        const result = successHandler.fulfilled(response);
        expect(result.data.data._id).toBe('abc');
      }
    });

    it('handles array data responses', () => {
      const response = {
        data: [{ _id: '1' }, { _id: '2' }],
        status: 200, statusText: 'OK', headers: {}, config: {},
      };
      const handlers = (api.interceptors.response as any).handlers;
      const successHandler = handlers.find((h: any) => h.fulfilled);
      if (successHandler) {
        const result = successHandler.fulfilled(response);
        expect(result.data.success).toBe(true);
        expect(Array.isArray(result.data.data)).toBe(true);
      }
    });
  });

  describe('response interceptor - error', () => {
    it('removes token and redirects on 401', async () => {
      const error = {
        response: { status: 401 },
        config: {},
      };
      localStorageMock.setItem('admin_token', 'expired-token');
      localStorageMock.setItem('admin_user', JSON.stringify({ name: 'Test' }));

      const handlers = (api.interceptors.response as any).handlers;
      const errorHandler = handlers.find((h: any) => h.rejected);
      if (errorHandler) {
        await expect(() => errorHandler.rejected(error)).rejects.toThrow();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('admin_user');
      }
    });

    it('rethrows non-401 errors', async () => {
      const error = {
        response: { status: 500 },
        config: {},
      };
      const handlers = (api.interceptors.response as any).handlers;
      const errorHandler = handlers.find((h: any) => h.rejected);
      if (errorHandler) {
        await expect(() => errorHandler.rejected(error)).rejects.toEqual(error);
      }
    });
  });
});
