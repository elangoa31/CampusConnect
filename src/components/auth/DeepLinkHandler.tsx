import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { isNativePlatform } from '../../utils/platform';
import { supabase } from '../../lib/supabase';

/**
 * Handles Capacitor native deep links (campusconnect://...)
 * Closes in-app browser on return, establishes Supabase auth session,
 * and routes to the appropriate internal path.
 */
export const DeepLinkHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNativePlatform()) {
      return;
    }

    const processDeepLink = async (rawUrl: string) => {
      try {
        if (!rawUrl) return;

        const isAuthCallback =
          rawUrl.startsWith('campusconnect://') ||
          rawUrl.startsWith('com.campusconnect.app://') ||
          rawUrl.includes('/auth/callback');

        if (!isAuthCallback) {
          return;
        }

        // Close in-app browser immediately upon returning to native app
        await Browser.close().catch(() => {});

        // Normalize custom scheme into standard URL for RFC parsing
        let normalized = rawUrl;
        if (rawUrl.startsWith('campusconnect://')) {
          normalized = rawUrl.replace(/^campusconnect:\/\/?\/?/, 'https://campusconnect.app/');
        } else if (rawUrl.startsWith('com.campusconnect.app://')) {
          normalized = rawUrl.replace(/^com\.campusconnect\.app:\/\/?\/?/, 'https://campusconnect.app/');
        }

        const parsed = new URL(normalized);

        // 1. Check for access_token and refresh_token in hash fragment or query params
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        if (parsed.hash) {
          const hashClean = parsed.hash.startsWith('#') ? parsed.hash.substring(1) : parsed.hash;
          const hashParams = new URLSearchParams(hashClean);
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        if (!accessToken && parsed.search) {
          const searchParams = new URLSearchParams(parsed.search);
          accessToken = searchParams.get('access_token');
          refreshToken = searchParams.get('refresh_token');
        }

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else {
          // 2. Check for PKCE authorization code in query params
          const code = parsed.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }

        // 3. Navigate inside react-router using the deep link path and parameters
        const cleanPath = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
        const target = `${cleanPath}${parsed.search}${parsed.hash}`;
        navigate(target, { replace: true });
      } catch (err) {
        console.error('Deep link handling error:', err);
      }
    };

    // Check if app was cold-launched via deep link
    CapApp.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) {
        processDeepLink(launchUrl.url);
      }
    }).catch(() => {});

    // Listen for deep link events when app is running/backgrounded
    const subPromise = CapApp.addListener('appUrlOpen', (event) => {
      if (event?.url) {
        processDeepLink(event.url);
      }
    });

    return () => {
      subPromise.then((sub) => sub.remove()).catch(() => {});
    };
  }, [navigate]);

  return null;
};
