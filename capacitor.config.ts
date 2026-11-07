import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusconnect.app',
  appName: 'CampusConnect',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#020617',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    CapacitorUpdater: {
      version: '0.0.0',
      appId: 'com.campusconnect.app',
      autoUpdate: 'atBackground'
    }
  },
  android: {
    allowMixedContent: false,
    appendUrlHash: true
  }
};

export default config;
