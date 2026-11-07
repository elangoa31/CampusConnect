import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService, INTENDED_ROLE_STORAGE_KEY } from '../services/auth.service';
import { getAuthRedirectUrl } from '../utils/url';
import * as platformModule from '../utils/platform';
import { supabase } from '../lib/supabase';
import { Browser } from '@capacitor/browser';

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Android Native OAuth & Deep Link Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('1. Generates campusconnect:// deep-link URL on native platform', () => {
    vi.spyOn(platformModule, 'isNativePlatform').mockReturnValue(true);

    const redirectUrl = getAuthRedirectUrl('/auth/callback?role=student');
    expect(redirectUrl).toBe('campusconnect://auth/callback');

    const cleanRedirect = getAuthRedirectUrl('auth/callback');
    expect(cleanRedirect).toBe('campusconnect://auth/callback');
  });

  it('2. Preserves standard web URL when not on native platform', () => {
    vi.spyOn(platformModule, 'isNativePlatform').mockReturnValue(false);

    const redirectUrl = getAuthRedirectUrl('/auth/callback?role=staff');
    expect(redirectUrl).toContain('/auth/callback?role=staff');
    expect(redirectUrl).not.toContain('campusconnect://');
  });

  it('3. On native platform, signInWithGoogle uses skipBrowserRedirect and opens in-app browser', async () => {
    vi.spyOn(platformModule, 'isNativePlatform').mockReturnValue(true);

    const mockAuthUrl = 'https://supabase.co/auth/v1/authorize?provider=google&redirect_to=campusconnect%3A%2F%2Fauth%2Fcallback%3Frole%3Dstudent';

    const signInOAuthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
      data: { provider: 'google', url: mockAuthUrl },
      error: null,
    } as any);

    await AuthService.signInWithGoogle('student');

    // Verifies role is saved to storage
    expect(localStorage.getItem(INTENDED_ROLE_STORAGE_KEY)).toBe('student');

    // Verifies native options are passed
    expect(signInOAuthSpy).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'campusconnect://auth/callback',
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    // Verifies Capacitor in-app browser was opened with the OAuth URL and brand toolbar color
    expect(Browser.open).toHaveBeenCalledWith({
      url: mockAuthUrl,
      toolbarColor: '#020617',
      windowName: '_self',
    });
  });

  it('4. On native platform, throws error if Supabase fails to provide an OAuth authorization URL', async () => {
    vi.spyOn(platformModule, 'isNativePlatform').mockReturnValue(true);

    vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValue({
      data: { provider: 'google', url: null },
      error: null,
    } as any);

    await expect(AuthService.signInWithGoogle('student')).rejects.toThrow(
      'Failed to obtain Google authentication URL.'
    );
  });
});
