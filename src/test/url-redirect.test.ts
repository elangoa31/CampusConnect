import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAppBaseUrl, getAuthRedirectUrl } from '../utils/url';

describe('OAuth URL Redirect Helper', () => {
  const originalEnv = { ...process.env };
  const originalWindow = global.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (originalWindow) {
      global.window = originalWindow;
    }
  });

  it('generates fully qualified auth redirect URLs', () => {
    const url = getAuthRedirectUrl('/auth/callback?role=student');
    expect(url).toContain('/auth/callback?role=student');
    expect(url).not.toContain('localhost:3000');
  });

  it('correctly handles paths with or without leading slash', () => {
    const withSlash = getAuthRedirectUrl('/login');
    const withoutSlash = getAuthRedirectUrl('login');
    expect(withSlash).toBe(withoutSlash);
    expect(withSlash.endsWith('/login')).toBe(true);
  });

  it('never outputs localhost:3000 even if window.location was somehow localhost:3000', () => {
    // Mock window.location.origin as localhost:3000
    const mockWindow = {
      ...window,
      location: {
        ...window.location,
        origin: 'http://localhost:3000',
      },
    };
    // @ts-expect-error test override
    global.window = mockWindow;

    const resolved = getAppBaseUrl();
    expect(resolved).not.toContain('3000');
    expect(resolved).toBe('http://localhost:5173');
  });

  it('resolves the current browser origin when on a deployed domain', () => {
    const mockWindow = {
      ...window,
      location: {
        ...window.location,
        origin: 'https://campus-connect-production.vercel.app',
      },
    };
    // @ts-expect-error test override
    global.window = mockWindow;

    const resolved = getAppBaseUrl();
    expect(resolved).toBe('https://campus-connect-production.vercel.app');

    const redirect = getAuthRedirectUrl('/auth/callback?role=staff');
    expect(redirect).toBe('https://campus-connect-production.vercel.app/auth/callback?role=staff');
  });
});
