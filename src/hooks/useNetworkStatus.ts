import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { isNativePlatform } from '../utils/platform';

export interface NetworkState {
  isConnected: boolean;
  connectionType?: string;
}

export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    let isMounted = true;

    if (isNativePlatform()) {
      // 1. Initial status query via Capacitor Network plugin
      Network.getStatus().then((status) => {
        if (isMounted) {
          setNetworkState({
            isConnected: status.connected,
            connectionType: status.connectionType,
          });
        }
      }).catch(() => {});

      // 2. Listen to native network state transitions
      const handle = Network.addListener('networkStatusChange', (status) => {
        if (isMounted) {
          setNetworkState({
            isConnected: status.connected,
            connectionType: status.connectionType,
          });
        }
      });

      return () => {
        isMounted = false;
        handle.then((sub) => sub.remove()).catch(() => {});
      };
    } else {
      // Browser fallback using standard DOM events
      const handleOnline = () => {
        if (isMounted) setNetworkState({ isConnected: true, connectionType: 'web' });
      };
      const handleOffline = () => {
        if (isMounted) setNetworkState({ isConnected: false, connectionType: 'none' });
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        isMounted = false;
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return networkState;
};
