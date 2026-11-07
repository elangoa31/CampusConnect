/**
 * URL and Environment Configuration Utilities for CampusConnect
 * Handles environment-aware OAuth and authentication redirect URLs.
 */

import { isNativePlatform } from './platform';

/**
 * Resolves the application base URL in an environment-aware manner:
 * 1. Explicit environment variable: VITE_SITE_URL, VITE_APP_URL, or VITE_PUBLIC_SITE_URL
 * 2. Vercel deployment URL from env: VITE_VERCEL_URL
 * 3. Client runtime: window.location.origin (dynamically resolves to localhost:5173 or deployed Vercel domain)
 * 4. Safe fallback: http://localhost:5173 (standard Vite development port, never localhost:3000)
 */
export const getAppBaseUrl = (): string => {
  // 1. Explicit site URL override from environment (e.g. set in Vercel project settings)
  const envSiteUrl =
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_APP_URL ||
    import.meta.env.VITE_PUBLIC_SITE_URL;

  if (envSiteUrl && typeof envSiteUrl === 'string' && envSiteUrl.trim() !== '') {
    const trimmed = envSiteUrl.trim().replace(/\/+$/, '');
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  // 2. Vercel deployment URL (if exposed via VITE_VERCEL_URL)
  const vercelUrl = import.meta.env.VITE_VERCEL_URL;
  if (vercelUrl && typeof vercelUrl === 'string' && vercelUrl.trim() !== '') {
    const trimmed = vercelUrl.trim().replace(/\/+$/, '');
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  // 3. Browser runtime environment (client-side)
  // window.location.origin dynamically matches the exact origin (localhost:5173, Vercel preview, or production)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin.trim().replace(/\/+$/, '');
    // Ensure no stale localhost:3000 origin is ever used
    if (origin.includes('localhost:3000')) {
      return 'http://localhost:5173';
    }
    if (origin.length > 0 && origin !== 'null') {
      return origin;
    }
  }

  // 4. Default Vite development port fallback (never localhost:3000)
  return 'http://localhost:5173';
};

/**
 * Builds a fully qualified, environment-aware OAuth or Auth redirect URL.
 *
 * @param path - Destination path, e.g. '/auth/callback' or '/login'
 * @returns Fully qualified URL, e.g. 'https://campusconnect.vercel.app/auth/callback'
 */
export const getAuthRedirectUrl = (path: string = '/auth/callback'): string => {
  if (isNativePlatform()) {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const basePath = cleanPath.split('?')[0];
    return `campusconnect://${basePath}`;
  }
  const baseUrl = getAppBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
