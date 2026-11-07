import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativePlatform, isAndroid } from '../../utils/platform';

/**
 * Handles Android native integrations:
 * - Status bar background & style
 * - Splash screen auto-hide on React mount
 * - Android hardware back-button navigation & exit handling
 */
export const NativeAppIntegrations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastBackPressTime = useRef<number>(0);

  // 1. Configure Status Bar and hide Splash Screen on native mount
  useEffect(() => {
    if (!isNativePlatform()) return;

    // Configure Status Bar
    const configureStatusBar = async () => {
      try {
        if (isAndroid()) {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#020617' });
        }
      } catch (err) {
        console.warn('Status bar configuration error:', err);
      }
    };

    configureStatusBar();

    // Hide Splash Screen once React tree has mounted
    SplashScreen.hide().catch(() => {});
  }, []);

  // 2. Hardware Back Button Listener for Android
  useEffect(() => {
    if (!isNativePlatform()) return;

    const backButtonSub = CapApp.addListener('backButton', ({ canGoBack }) => {
      const currentPath = location.pathname;

      // Identify root landing / main dashboard routes where back button should exit
      const isRootRoute =
        currentPath === '/' ||
        currentPath === '/student/dashboard' ||
        currentPath === '/staff/dashboard';

      if (isRootRoute) {
        const now = Date.now();
        // If pressed twice within 2000ms, exit app
        if (now - lastBackPressTime.current < 2000) {
          CapApp.exitApp();
        } else {
          lastBackPressTime.current = now;
        }
      } else {
        // Non-root routes: navigate back through React Router stack
        if (canGoBack || window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      backButtonSub.then((sub) => sub.remove()).catch(() => {});
    };
  }, [location.pathname, navigate]);

  return null;
};
